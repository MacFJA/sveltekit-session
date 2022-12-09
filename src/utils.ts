import { CookieSerializeOptions } from "cookie";

export type EventSource = unknown;

export type EventRunner = (
  name: string,
  target: EventSource,
  detail: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => void;

export type ListenerFor = {
  event: string;
  of: EventSource;
  runner: EventRunner;
};

export interface EventDispatcherInterface {
  addEventListener(
    eventName: string,
    target: EventSource,
    runner: EventRunner
  ): void;
  removeEventListener(
    eventName: string,
    target: EventSource,
    runner: EventRunner
  ): void;

  dispatchEvent(name: string, source: EventSource, detail?: unknown): void;

  addEventForward(
    eventName: string,
    target: EventSource,
    forwarder: EventSource
  ): void;
  removeEventForward(
    eventName: string,
    target: EventSource,
    forwarder: EventSource
  ): void;

  listenFor<T>(
    listeners: ListenerFor | Array<ListenerFor>,
    forCode: () => T
  ): T;
}

type ListenerData = {
  eventName: string;
  target: EventSource;
  runner: EventRunner;
};

export class EventDispatcher implements EventDispatcherInterface {
  private listeners: Array<ListenerData> = [];

  addEventListener(
    eventName: string,
    target: EventSource,
    runner: EventRunner
  ): void {
    this.listeners.push({ eventName, target, runner });
    this.removeDuplicate();
  }

  removeEventListener(
    eventName: string,
    target: EventSource,
    runner: EventRunner
  ): void {
    this.listeners = this.listeners.filter(
      (item) =>
        item.eventName === eventName &&
        item.target === target &&
        item.runner === runner
    );
  }

  dispatchEvent(name: string, source: EventSource, detail?: unknown): void {
    this.listeners
      .filter(
        ({ eventName, target }) => eventName === name && target === source
      )
      .forEach(({ runner, target }) => runner(name, target, detail));
  }

  addEventForward(
    eventName: string,
    target: EventSource,
    forwarder: EventSource
  ): void {
    this.addEventListener(eventName, target, (name, target, detail) => {
      this.dispatchEvent(eventName, forwarder, detail);
    });
  }

  removeEventForward(
    eventName: string,
    target: EventSource,
    forwarder: EventSource
  ): void {
    this.removeEventListener(eventName, target, (name, target, detail) => {
      this.dispatchEvent(eventName, forwarder, detail);
    });
  }

  listenFor<T>(
    listeners: ListenerFor | Array<ListenerFor>,
    forCode: () => T
  ): T {
    if (!Array.isArray(listeners)) {
      listeners = [listeners];
    }
    listeners.forEach((listener) => {
      this.addEventListener(listener.event, listener.of, listener.runner);
    });

    const result = forCode();

    listeners.forEach((listener) => {
      this.removeEventListener(listener.event, listener.of, listener.runner);
    });
    return result;
  }

  private removeDuplicate(): void {
    this.listeners = this.listeners.filter((listener, index, listeners) => {
      return (
        index ===
        listeners.findIndex(
          (found: ListenerData) =>
            found.eventName === listener.eventName &&
            listener.target === found.target &&
            listener.runner.toString() === found.runner.toString()
        )
      );
    });
  }
}

export const eventDispatcher: EventDispatcherInterface = new EventDispatcher();

export type CookieEvent = {
  identifier: string;
  data: string;
  options?: CookieSerializeOptions;
};
