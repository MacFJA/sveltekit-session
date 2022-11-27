import { Session } from "./Session";
import {
  SvelteKitExchanger,
  type SessionExchangerInterface,
  type SvelteKitExchangerMode,
} from "./SessionExchanger";
import {
  type ExpirableSessionStorageInterface,
  serverMemoryStorage,
  type SessionStorageInterface,
} from "./SessionStorage";
import {
  devalueSerializer,
  type SessionSerializerInterface,
} from "./SessionSerializer";
import { eventDispatcher, type EventSource } from "./utils";
import type { Handle, Load } from "@sveltejs/kit";
import type { CookieSerializeOptions } from "cookie";

export type SessionLocals = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  session: Record<string, any>;
  sessionId: string;
};

export type SessionOptions = {
  storage?: SessionStorageInterface;
  serializer?: SessionSerializerInterface;
  exchanger?: SessionExchangerInterface;
};
type DefinedSessionOptions = {
  storage: SessionStorageInterface;
  serializer: SessionSerializerInterface;
  exchanger: SessionExchangerInterface;
};

export class SessionManager {
  private readonly defaultStorage: SessionStorageInterface;
  private readonly defaultSerializer: SessionSerializerInterface;
  private readonly defaultExchanger: SessionExchangerInterface;

  constructor(
    defaultStorage?: SessionStorageInterface,
    defaultSerializer?: SessionSerializerInterface,
    defaultExchanger?: SessionExchangerInterface
  ) {
    this.defaultStorage = defaultStorage ?? serverMemoryStorage;
    this.defaultSerializer = defaultSerializer ?? devalueSerializer;
    this.defaultExchanger = defaultExchanger ?? new SvelteKitExchanger();
  }

  get(options: SessionOptions = {}): Session {
    const finalOptions = this.getOptions(options);
    eventDispatcher.addEventForward("setCookie", finalOptions.storage, this);
    eventDispatcher.addEventForward("setHeader", finalOptions.storage, this);
    eventDispatcher.addEventForward("setCookie", finalOptions.exchanger, this);
    eventDispatcher.addEventForward("setHeader", finalOptions.exchanger, this);
    eventDispatcher.addEventListener(
      "destroy",
      finalOptions.storage,
      (name, target, detail) => {
        finalOptions.exchanger.destroyIdentifier(detail.identifier ?? "");
      }
    );
    const identifier =
      finalOptions.exchanger.getIdentifier() ??
      finalOptions.exchanger.createIdentifier();

    if (
      (finalOptions.storage as ExpirableSessionStorageInterface).gc !==
      undefined
    ) {
      (finalOptions.storage as ExpirableSessionStorageInterface).gc();
    }

    return new Session(
      identifier,
      finalOptions.storage,
      finalOptions.serializer
    );
  }

  private getOptions(providedOptions: SessionOptions): DefinedSessionOptions {
    return {
      exchanger: providedOptions.exchanger ?? this.defaultExchanger,
      serializer: providedOptions.serializer ?? this.defaultSerializer,
      storage: providedOptions.storage ?? this.defaultStorage,
    };
  }
}

export async function configuredServerHook(
  input: Parameters<Handle>[0],
  sessionManager: SessionManager
): Promise<Response> {
  const { event, resolve } = input;
  const headers: Array<{ identifier: string; data: string }> = [];
  const cookies: Array<{
    identifier: string;
    data: string;
    options?: CookieSerializeOptions;
  }> = [];

  function setCookies(
    name: string,
    target: EventSource,
    detail: {
      identifier: string;
      data: string;
      options?: CookieSerializeOptions;
    }
  ) {
    cookies.push(detail);
  }
  function setHeaders(
    name: string,
    target: EventSource,
    detail: { identifier: string; data: string }
  ) {
    headers.push(detail);
  }

  const session: Session = await eventDispatcher.listenFor(
    [
      { event: "setCookie", of: sessionManager, runner: setCookies },
      { event: "setHeader", of: sessionManager, runner: setHeaders },
    ],
    async () => {
      const session = sessionManager.get();
      await session.start();
      return session;
    }
  );
  (event.locals as SessionLocals).session = session.all();
  (event.locals as SessionLocals).sessionId = session.getIdentifier();
  return Promise.resolve(resolve(event)).then(async (response) => {
    session.replace((event.locals as SessionLocals).session);
    await eventDispatcher.listenFor(
      [
        { event: "setCookie", of: session, runner: setCookies },
        { event: "setHeader", of: session, runner: setHeaders },
      ],
      async () => await session.save()
    );

    cookies.forEach((cookie) =>
      response.headers.append(
        "set-cookie",
        event.cookies.serialize(
          cookie.identifier,
          cookie.data,
          cookie.options ?? {}
        )
      )
    );
    headers.forEach((header) =>
      response.headers.append(header.identifier, header.data)
    );
    if (headers.length > 0 || cookies.length > 0) {
      // The response contains personal, need to flag the response as private for the cache
      // Also add a custom header to help cache service.

      let cacheControl = (response.headers.get("cache-control") ?? "").split(
        ",s+"
      );
      cacheControl = Array.from(new Set([...cacheControl, "private"])).filter(
        (i) => i !== null && i.trim() !== ""
      );
      response.headers.set("cache-control", cacheControl.join(", "));
      response.headers.set("x-sveltekit-session", "true");
    }

    return response;
  }) as ReturnType<Handle>;
}

export function serverHook(
  input: Parameters<Handle>[0],
  exchanger: SvelteKitExchangerMode = "cookie",
  storage: SessionStorageInterface = serverMemoryStorage,
  serializer: SessionSerializerInterface = devalueSerializer
): ReturnType<Handle> {
  const sessionManager = new SessionManager(
    storage,
    serializer,
    new SvelteKitExchanger("SKSESSID", exchanger, input.event)
  );

  return configuredServerHook(input, sessionManager);
}

export const serverLoad = ({
  locals,
}: {
  locals: App.Locals;
}): ReturnType<Load> => {
  return {
    session: (locals as SessionLocals).session,
    sessionId: (locals as SessionLocals).sessionId,
  };
};
