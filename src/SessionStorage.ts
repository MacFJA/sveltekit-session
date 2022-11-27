import fs from "node:fs";
import path from "node:path";
import cookie from "cookie";
import { eventDispatcher } from "./utils";
import type {
  RedisClientOptions,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "@redis/client";

export interface SessionStorageInterface {
  write(identifier: string, data: string): Promise<void>;
  read(identifier: string): Promise<string | null>;
  destroy(identifier: string): void;
}

export interface ExpirableSessionStorageInterface
  extends SessionStorageInterface {
  gc(): void;
}

abstract class AbstractSessionStorage implements SessionStorageInterface {
  abstract read(identifier: string): Promise<string | null>;

  abstract write(identifier: string, data: string): Promise<void>;

  abstract doDestroy(identifier: string): void;

  destroy(identifier: string) {
    this.doDestroy(identifier);
    eventDispatcher.dispatchEvent("destroy", this, { identifier });
  }
}

export class FileSessionStorage
  extends AbstractSessionStorage
  implements ExpirableSessionStorageInterface
{
  private readonly sessionPath: string;
  private readonly ttl: number;

  constructor(sessionPath: string, ttl = 3600) {
    super();
    this.sessionPath = sessionPath;
    this.ttl = ttl;
  }

  gc(): void {
    const files = fs.readdirSync(this.sessionPath);
    files
      .filter((file: string) => {
        const stat = fs.statSync(file);
        return stat.mtime.getTime() > new Date().getTime() + this.ttl;
      })
      .forEach((file: string) => {
        fs.unlinkSync(file);
      });
  }

  private path(identifier: string): string {
    return path.join(this.sessionPath, identifier);
  }
  doDestroy(identifier: string): void {
    fs.rm(this.path(identifier), () => {
      // Do nothing
    });
  }

  async read(identifier: string): Promise<string | null> {
    if (!fs.existsSync(this.path(identifier))) return null;
    return fs.readFileSync(this.path(identifier)).toString();
  }

  async write(identifier: string, data: string): Promise<void> {
    fs.writeFile(this.path(identifier), data, () => {
      // Do nothing
    });
  }
}

export class ServerMemoryStorage extends AbstractSessionStorage {
  private storage: Record<string, string> = {};
  doDestroy(identifier: string): void {
    delete this.storage[identifier];
  }

  async read(identifier: string): Promise<string | null> {
    return this.storage[identifier] ?? null;
  }

  async write(identifier: string, data: string): Promise<void> {
    this.storage[identifier] = data;
  }
}

export class ServerCookieStorage extends AbstractSessionStorage {
  private requestCookieHeader = "";

  constructor(requestCookieHeader?: string) {
    super();
    this.requestCookieHeader = requestCookieHeader ?? "";
  }

  setRequestCookieHeader(requestCookieHeader: string): void {
    this.requestCookieHeader = requestCookieHeader;
  }

  doDestroy(identifier: string): void {
    eventDispatcher.dispatchEvent("setCookie", this, {
      identifier,
      data: "",
      options: {
        expires: new Date("1970-01-01"),
      },
    });
  }

  async read(identifier: string): Promise<string | null> {
    const cookies = cookie.parse(this.requestCookieHeader);
    return cookies[identifier] ?? null;
  }

  async write(identifier: string, data: string): Promise<void> {
    eventDispatcher.dispatchEvent("setCookie", this, { identifier, data });
  }
}

export class RedisStorage
  extends AbstractSessionStorage
  implements ExpirableSessionStorageInterface
{
  private client:
    | RedisClientType<RedisModules, RedisFunctions, RedisScripts>
    | undefined;
  private readonly clientOptions: RedisClientOptions | undefined;
  private readonly keyPrefix: string;
  private readonly ttl: number;
  constructor(
    redisOptions?: RedisClientOptions,
    keyPrefix = "sess_",
    ttl = 3600
  ) {
    super();
    this.keyPrefix = keyPrefix;
    this.ttl = ttl;
    this.clientOptions = redisOptions;
  }
  private async getClient(): Promise<
    RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  > {
    if (this.client === undefined) {
      this.client = (await import("@redis/client")).createClient(
        this.clientOptions
      );
      await this.client.connect();
    }
    return this.client;
  }
  doDestroy(identifier: string): void {
    this.getClient().then((client) =>
      client.sendCommand(["DEL", `${this.keyPrefix}${identifier}`])
    );
  }

  gc(): void {
    // Do nothing
  }

  async read(identifier: string): Promise<string | null> {
    return await (
      await this.getClient()
    ).sendCommand(["GET", `${this.keyPrefix}${identifier}`]);
  }

  async write(identifier: string, data: string): Promise<void> {
    await this.getClient().then((client) =>
      client.sendCommand([
        "SET",
        `${this.keyPrefix}${identifier}`,
        data,
        "EX",
        String(this.ttl),
      ])
    );
  }
}

export const serverMemoryStorage = new ServerMemoryStorage();
