import { Session } from "./Session";
import {
  SvelteKitExchanger,
  type SessionExchangerInterface,
  type SvelteKitExchangerMode,
} from "./SessionExchanger";
import {
  type ExpirableSessionStorageInterface,
  type SessionStorageInterface,
  ServerMemoryStorage,
} from "./SessionStorage";
import {
  devalueSerializer,
  type SessionSerializerInterface,
} from "./SessionSerializer";
import {
  type EventSource,
  type CookieEvent,
  type EventDispatcherInterface,
  EventDispatcher,
  type EventDispatcherAware,
  EventDispatcherChainer,
} from "./utils";
import type { Handle, Load } from "@sveltejs/kit";
import type { CookieSerializeOptions } from "cookie";

export const serverMemoryStorage = new ServerMemoryStorage(
  EventDispatcher.main()
);

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
  private readonly eventDispatcher: EventDispatcherInterface;

  constructor(
    defaultStorage?: SessionStorageInterface,
    defaultSerializer?: SessionSerializerInterface,
    defaultExchanger?: SessionExchangerInterface,
    eventDispatcher?: EventDispatcherInterface
  ) {
    this.eventDispatcher = eventDispatcher ?? EventDispatcher.main();
    this.defaultStorage = defaultStorage ?? serverMemoryStorage;
    this.defaultSerializer = defaultSerializer ?? devalueSerializer;
    this.defaultExchanger = defaultExchanger ?? new SvelteKitExchanger();
  }

  get(options: SessionOptions = {}): Session {
    const finalOptions = this.getOptions(options);

    this.wrapDispatcher(finalOptions.storage);
    this.wrapDispatcher(finalOptions.exchanger);
    this.wrapDispatcher(finalOptions.serializer);

    this.eventDispatcher.addEventForward(
      "setCookie",
      finalOptions.storage,
      this
    );
    this.eventDispatcher.addEventForward(
      "setHeader",
      finalOptions.storage,
      this
    );
    this.eventDispatcher.addEventForward(
      "setCookie",
      finalOptions.exchanger,
      this
    );
    this.eventDispatcher.addEventForward(
      "setHeader",
      finalOptions.exchanger,
      this
    );
    this.eventDispatcher.addEventListener(
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
      finalOptions.serializer,
      this.eventDispatcher
    );
  }

  private getOptions(providedOptions: SessionOptions): DefinedSessionOptions {
    return {
      exchanger: providedOptions.exchanger ?? this.defaultExchanger,
      serializer: providedOptions.serializer ?? this.defaultSerializer,
      storage: providedOptions.storage ?? this.defaultStorage,
    };
  }

  private wrapDispatcher(object: unknown) {
    if (
      (object as EventDispatcherAware).getDispatcher !== undefined &&
      (object as EventDispatcherAware).setDispatcher !== undefined
    ) {
      (object as EventDispatcherAware).setDispatcher(
        new EventDispatcherChainer([
          this.eventDispatcher,
          (object as EventDispatcherAware).getDispatcher(),
        ])
      );
    }
  }

  dispatcher(): EventDispatcherInterface {
    return this.eventDispatcher;
  }
}

export async function configuredServerHook(
  input: Parameters<Handle>[0],
  sessionManager: SessionManager
): Promise<Response> {
  const { event, resolve } = input;
  const headers: Array<{ identifier: string; data: string }> = [];
  const cookies: Array<CookieEvent> = [];

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

  const session: Session = await sessionManager.dispatcher().listenFor(
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
    await sessionManager.dispatcher().listenFor(
      [
        { event: "setCookie", of: session, runner: setCookies },
        { event: "setHeader", of: session, runner: setHeaders },
      ],
      async () => await session.save()
    );

    cookies.forEach((cookie) =>
      response.headers.append(
        "set-cookie",
        event.cookies.serialize(cookie.identifier, cookie.data, {
          path: "/",
          ...cookie.options,
        })
      )
    );
    headers.forEach((header) =>
      response.headers.append(header.identifier, header.data)
    );
    if (headers.length > 0 || cookies.length > 0) {
      // The response contains personal data, need to flag the response as private for the cache
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

export function sessionHook(
  exchanger: SvelteKitExchangerMode = "cookie",
  storage: SessionStorageInterface = serverMemoryStorage,
  serializer: SessionSerializerInterface = devalueSerializer
): Handle {
  return function (input: Parameters<Handle>[0]): ReturnType<Handle> {
    return serverHook(input, exchanger, storage, serializer);
  };
}

export function configuredSessionHook(sessionManager: SessionManager): Handle {
  return function (input: Parameters<Handle>[0]): ReturnType<Handle> {
    return configuredServerHook(input, sessionManager);
  };
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
