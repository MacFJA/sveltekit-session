# Examples

## Simple Login

### `src/hooks.server.ts`

Add the server hook to load the session from its storage.

Here the default configuration is used:

- Session storage is the Node server memory (session are keep until the node server restart)
- The user is identified by a cookie
- The same serializer as SvelteKit is used

```ts
import type { Handle } from "@sveltejs/kit";
import { serverHook } from "@macfja/sveltekit-session";

export const handle: Handle = serverHook;
```

### `src/routes/my-profile/+page.server.ts`

Add the server page load function, to make the session available.

You can also add/update/remove data from the session here

```ts
import type { PageServerLoad } from "./$types";
import { serverLoad } from "@macfja/sveltekit-session";

export const load: PageServerLoad = serverLoad;
```

### `src/routes/my-profile/+page.ts`

Read the session data and populate the page (`+page.svelte`) data
_(You can also add/update/remove data of the session)_

Here we check if the user is connected with `session.isConnected`,
if not we return a 403 error.

```ts
import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageLoad = ({ data }) => {
  const session = data?.session;

  if (!session?.isConnected) {
    throw error(403);
  }

  return {
    session,
  };
};
```

### `src/routes/my-profile/+page.svelte`

Use the data populated in the `+page.ts` load function.

Here we display the user's name from the session.

```html
<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<h1>Welcome {data.session.name}</h1>
```

### `src/routes/login/+page.server.ts`

Add the server page load function, to make the session available.

Here we also handle the connection and logout of the user with usage of `Form` actions.

```ts
import type { Actions, PageServerLoad } from "./$types";
import type { SessionLocals } from "@macfja/sveltekit-session";
import { serverLoad } from "@macfja/sveltekit-session";

export const load: PageServerLoad = serverLoad;

export const actions: Actions = {
  login: (event) => {
    (event.locals as SessionLocals).session.isConnected = true;
    (event.locals as SessionLocals).session.name = "John";
  },
  logout: (event) => {
    (event.locals as SessionLocals).session.isConnected = false;
    delete (event.locals as SessionLocals).session.name;
  },
};
```

### `src/routes/login/+page.ts`

Populate the page with data from session.

Here we transfer information if the user is connected or not (to display login or logout form)

```ts
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ data }) => {
  return {
    isConnected: data?.session?.isConnected ?? false,
  };
};
```

### `src/routes/login/+page.svelte`

Use the populated data.

Here we display a login or a logout form depending on the status of `isConnected`

```html
<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

{#if data.isConnected}
<form method="POST" action="?/logout">
  <button type="submit">Logout</button>
</form>
{:else}
<form method="POST" action="?/login">
  <button type="submit">Login</button>
</form>
{/if}
```

## Use Redis as session storage

**!! You need to install `redis` (`npm install @redis/client`) !!**

If you want your sessions to be kept even if the NodeJS server restart, you can use Redis to store data instead of using the NodeJS internal memory.

_(This storage also enable the automatic session purge)_

### `src/hooks.server.ts`

```ts
import type { Handle } from "@sveltejs/kit";
import { sessionHook } from "@macfja/sveltekit-session";
import { RedisStorage } from "@macfja/sveltekit-session/redis";

export const handle: Handle = sessionHook(
  "cookie",
  new RedisStorage({ url: "redis://localhost:6379" }, "sess_", 7200)
);
```

## Chaining Server hooks

If you need to use several server hooks, you can use `sequence` (from `import {sequence} from "@sveltejs/kit/hooks"`) like this:

```ts
// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { sessionHook } from "@macfja/sveltekit-session";

export const handle: Handle = sequence(
  sessionHook("cookie") /* another server hook */
);
```
