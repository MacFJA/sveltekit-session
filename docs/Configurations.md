# Configurations

## `serverHook` function

```ts
export declare function serverHook(
  input: Parameters<Handle>[0],
  exchanger?: SvelteKitExchangerMode,
  storage?: SessionStorageInterface,
  serializer?: SessionSerializerInterface
): ReturnType<Handle>;
```

### Parameters

| Name         | Type                                                                                                                                  | Default                                                                                                         | Description                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `input`      | `Parameters<Handle>[0]` (<=> `{ event: RequestEvent; resolve(event: RequestEvent, opts?: ResolveOptions): MaybePromise<Response>; }`) |                                                                                                                 | The first parameter of the `handle` function of `src/hooks.server.ts`/`src/hooks.server.js`             |
| `exchanger`  | `SvelteKitExchangerMode` (<=> `'cookie'` or `'header'` or `'query'`)                                                                  | `'cookie'`                                                                                                      | The name of the method used to exchange the identifier of the session between the server and the front. |
| `storage`    | `SessionStorageInterface`                                                                                                             | `serverMemoryStorage`, a shared instance of `ServerMemoryStorage` class (sessions are saved into NodeJS memory) | The class instance responsible to store the session data.                                               |
| `serializer` | `SessionSerializerInterface`                                                                                                          | `devalueSerializer`, a serializer based on `devalue` used in SvelteKit                                          | The class instance responsible to transform from and to storage.                                        |

### Return

The `serverHook` function return the same type as the `handle` function of `src/hooks.server.ts`/`src/hooks.server.js`.

## `configuredServerHook` function

```ts
export declare function configuredServerHook(
  input: Parameters<Handle>[0],
  sessionManager: SessionManager
): Promise<Response>;
```

### Parameters

| Name             | Type                                                                                                                                  | Description                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `input`          | `Parameters<Handle>[0]` (<=> `{ event: RequestEvent; resolve(event: RequestEvent, opts?: ResolveOptions): MaybePromise<Response>; }`) | The first parameter of the `handle` function of `src/hooks.server.ts`/`src/hooks.server.js` |
| `sessionManager` | `SessionManager`                                                                                                                      | The instance of `SessionManager` to use.                                                    |

### Return

The `configuredServerHook` function return the same type as the `handle` function of `src/hooks.server.ts`/`src/hooks.server.js`.

## `SessionOptions` type

```ts
export declare type SessionOptions = {
  storage?: SessionStorageInterface;
  serializer?: SessionSerializerInterface;
  exchanger?: SessionExchangerInterface;
};
```

## `SessionManager` class

```ts
export declare class SessionManager {
  constructor(
    defaultStorage?: SessionStorageInterface,
    defaultSerializer?: SessionSerializerInterface,
    defaultExchanger?: SessionExchangerInterface
  );
  get(options?: SessionOptions): Session;
}
```

### Methods

#### `constructor` method parameters

| Name               | Type                         | Default                                                                                                         | Description                                                                                                |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `defaultStorage`   | `SessionStorageInterface`    | `serverMemoryStorage`, a shared instance of `ServerMemoryStorage` class (sessions are saved into NodeJS memory) | The class instance responsible to store the session data.                                                  |
| `defaultExchanger` | `SessionExchangerInterface`  | a new instance of `SvelteKitExchanger`                                                                          | The class instance responsible to exchange the identifier of the session between the server and the front. |
| `serializer`       | `SessionSerializerInterface` | `devalueSerializer`, a serializer based on `devalue` used in SvelteKit                                          | The class instance responsible to transform from and to storage.                                           |

#### `get` method

The function retrieve the session of current user according to its `options` parameter (or to the class instance default)

## `Session` class

```ts
export declare class Session {
  constructor(
    identifier: string,
    storage: SessionStorageInterface,
    serializer: SessionSerializerInterface
  );
  start(): Promise<void>;
  getIdentifier(): string;
  save(): void;
  has(name: string): boolean;
  get(name: string, defaultValue?: any): any;
  set(name: string, value: any): void;
  all(): Record<string, any>;
  replace(attributes: Record<string, any>): void;
  remove(name: string): any;
  clear(): void;
}
```

## `serverLoad` function

```ts
export declare const serverLoad: ({
  locals,
}: {
  locals: App.Locals;
}) => ReturnType<Load>;
```

### Parameters

| Name         | Type                                  | Default | Description                                                                  |
| ------------ | ------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `{ locals }` | `{ App.Locals }` (<=> `RequestEvent`) |         | At least the `locals` of the `ServerLoadEvent` parameter of the `ServerLoad` |

### Return

The `serverLoad` function return the same type as the `load` function of `src/routes/**/+page.server.ts`/`src/routes/**/+page.server.js`.
