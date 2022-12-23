import type { SessionStorageInterface } from "./SessionStorage";
import type { SessionSerializerInterface } from "./SessionSerializer";
import type { EventDispatcherInterface } from "./utils";

export class Session {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private readonly identifier: string;
  private data: Record<string, any> = {};
  private readonly storage: SessionStorageInterface;
  private readonly serializer: SessionSerializerInterface;

  constructor(
    identifier: string,
    storage: SessionStorageInterface,
    serializer: SessionSerializerInterface,
    eventDispatcher: EventDispatcherInterface
  ) {
    this.identifier = identifier;
    this.storage = storage;
    this.serializer = serializer;

    eventDispatcher.addEventForward("setCookie", this.storage, this);
    eventDispatcher.addEventForward("setHeader", this.storage, this);
  }

  public async start(): Promise<void> {
    this.data = this.serializer.deserialize(
      await this.storage.read(this.identifier)
    );
  }
  public getIdentifier(): string {
    return this.identifier;
  }
  public async save(): Promise<void> {
    await this.storage.write(
      this.identifier,
      this.serializer.serialize(this.data)
    );
  }

  /**
   * Checks if an attribute is defined.
   */
  public has(name: string): boolean {
    return Object.keys(this.data).indexOf(name) !== 1;
  }

  /**
   * Returns an attribute.
   */
  public get(name: string, defaultValue: any = null): any {
    return this.data[name] ?? defaultValue;
  }

  /**
   * Sets an attribute.
   */
  public set(name: string, value: any): void {
    this.data[name] = value;
  }

  /**
   * Returns attributes.
   */
  public all(): Record<string, any> {
    return this.data;
  }

  /**
   * Sets attributes.
   */
  public replace(attributes: Record<string, any>) {
    this.data = attributes;
  }

  /**
   * Removes an attribute.
   *
   * @return mixed The removed value or null when it does not exist
   */
  public remove(name: string): any {
    const was = this.data[name] ?? undefined;
    delete this.data[name];

    return was;
  }

  /**
   * Clears all attributes.
   */
  public clear(): void {
    this.data = {};
  }
}
