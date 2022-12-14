# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0]

### Fixed

- Error "Cannot find module './utils'" ([sveltekit-cas#1])

### Changed

- Make the event dispatcher configurable for every class that need it
- (dev) Update test to use SvelteKit 1.0.0
- (dev) Tweak Rollup configuration to remove unnecessary code

### Removed

- Delete the `./utils` import

## [1.0.6]

### Fixed

- (dev) Allow `vite` version `4.0.0` as dev dependency.

## [1.0.5]

### Fixed

- Default cookie path to `/`

### Added

- Add parameter to configure all cookies everywhere

### Changed

- Make `ServerCookieStorage` expirable

## [1.0.4]

### Fixed

- Don't use `next` as version requirement of `@sveltejs/kit` (make the lib compatible with more version of SvelteKit)

### Removed

- (dev) Unused dependencies
- (dev) Flag generated file as ignore for Prettier

## [1.0.3]

### Fixed

- Cookie path not fixed

### Added

- New curried hook to help configuring session parameters

## [1.0.2]

### Fixed

- (dev) CI job fail with `npm ci`
- Package publishing

## [1.0.0]

First version

[unreleased]: https://github.com/MacFJA/sveltekit-session/compare/1.1.0...HEAD
[1.1.0]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.1.0
[1.0.6]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.0.6
[1.0.5]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.0.5
[1.0.4]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.0.4
[1.0.3]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.0.3
[1.0.2]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.0.2
[1.0.0]: https://github.com/MacFJA/sveltekit-session/releases/tag/1.0.0
[sveltekit-cas#1]: https://github.com/MacFJA/sveltekit-cas/issues/1
