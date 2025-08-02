# @manifold-studio/create-app

## 0.3.2

### Patch Changes

- Fix published package dependencies and auto-detection

  - Add @manifold-studio/wrapper to dependencies in generated projects
  - Move @manifold-studio/configurator from devDependencies to dependencies
  - Auto-detect when running from published package vs local development
  - Update version numbers to match published packages (0.3.1)
  - Ensure published create-app defaults to using published dependencies

  This fixes the "Failed to resolve module specifier '@manifold-studio/wrapper'" error when using `npm create @manifold-studio/app`.

## 0.3.1

### Patch Changes

- [`92c6d12`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/92c6d129953b771185ffe5207e480cabcfc2ee4c) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Bump all packages to 0.3.1.

  - configurator: include pipeline runtime types and build fixes
  - create-app: ensure published deps are used when local workspaces are unavailable (e.g., npx)
  - wrapper: coordinated patch bump
  - typeface: coordinated patch bump

## 0.3.1-beta.0

### Patch Changes

- [`92c6d12`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/92c6d129953b771185ffe5207e480cabcfc2ee4c) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Bump all packages to 0.3.1.

  - configurator: include pipeline runtime types and build fixes
  - create-app: ensure published deps are used when local workspaces are unavailable (e.g., npx)
  - wrapper: coordinated patch bump
  - typeface: coordinated patch bump
