# SvelteKit Session

Session management for SvelteKit

![Github CI](https://github.com/macfja/sveltekit-session/workflows/Quality%20checks/badge.svg)
![GitHub Repo stars](https://img.shields.io/github/stars/macfja/sveltekit-session?style=social)
![NPM bundle size](https://img.shields.io/bundlephobia/minzip/@macfja/sveltekit-session)
![Download per week](https://img.shields.io/npm/dw/@macfja/sveltekit-session)
![License](https://img.shields.io/npm/l/@macfja/sveltekit-session)
![NPM version](https://img.shields.io/npm/v/@macfja/sveltekit-session)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/@macfja/sveltekit-session)

## Installation

```
npm install @macfja/sveltekit-session
```

## Usage

```ts
// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { serverHook } from "@macfja/sveltekit-session";

export const handle: Handle = serverHook;
```

```ts
// src/routes/.../+page.server.ts
import type { PageServerLoad } from "./$types";
import { serverLoad } from "@macfja/sveltekit-session";

export const load: PageServerLoad = serverLoad;
```

```ts
// src/routes/.../+page.ts
import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageLoad = ({ data }) => {
  const session = data?.session;
  return {
    session,
  };
};
```

## Features

- Multiple session storages (Server memory, server file system, cookies, Redis)
- Multiple session identifier exchanger (cookie, header)
- Automatically save the session upon changes

## Limitations

### Changes on the session can only be done at server side

If you want changes made in `+page.svelte` to be saved, you need to send the data to the server (`+page.server.js`/`+page.server.ts`)

## Documentation

Documentations and examples can be found in the [docs](docs/README.md) directory.

## Contributing

Contributions are welcome. Please open up an issue or create PR if you would like to help out.

Read more in the [Contributing file](CONTRIBUTING.md)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
