/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import randomToken from "random-token";
import type { RequestEvent } from "@sveltejs/kit";
import { eventDispatcher } from "./utils";

export interface SessionExchangerInterface {
  getIdentifier(): string | null;
  createIdentifier(): string;
  destroyIdentifier(identifier: string): void;
}

abstract class AbstractSessionExchanger implements SessionExchangerInterface {
  abstract getIdentifier(): string | null;

  createIdentifier(): string {
    return randomToken(32);
  }
  abstract destroyIdentifier(identifier: string): void;
}

export type SvelteKitExchangerMode = "cookie" | "header" | "query";

export class SvelteKitExchanger extends AbstractSessionExchanger {
  private readonly dataName: string;
  private readonly mode: SvelteKitExchangerMode = "cookie";
  private requestEvent: RequestEvent | undefined;

  constructor(
    dataName = "SKSESSID",
    mode: SvelteKitExchangerMode = "cookie",
    requestEvent?: RequestEvent
  ) {
    super();
    this.dataName = dataName;
    this.mode = mode;
    this.requestEvent = requestEvent;
  }

  setRequestEvent(requestEvent: RequestEvent): void {
    this.requestEvent = requestEvent;
  }

  getIdentifier(): string | null {
    if (!this.requestEvent) {
      return null;
    }
    if (this.mode === "cookie") {
      return this.requestEvent.cookies.get(this.dataName) ?? null;
    } else if (this.mode === "header") {
      return this.requestEvent.request.headers.get(this.dataName) ?? null;
    }
    return this.requestEvent.url.searchParams.has(this.dataName)
      ? this.requestEvent.url.searchParams.get(this.dataName)
      : null;
  }

  createIdentifier(): string {
    const identifier = super.createIdentifier();
    if (this.mode === "cookie") {
      eventDispatcher.dispatchEvent("setCookie", this, {
        identifier: this.dataName,
        data: identifier,
      });
    } else {
      eventDispatcher.dispatchEvent("setHeader", this, {
        identifier: this.dataName,
        data: identifier,
      });
    }
    return identifier;
  }

  destroyIdentifier(identifier: string): void {
    if (this.mode === "cookie") {
      eventDispatcher.dispatchEvent("setCookie", this, {
        identifier,
        data: "",
        options: {
          expires: new Date("1970-01-01"),
        },
      });
    }
  }
}
