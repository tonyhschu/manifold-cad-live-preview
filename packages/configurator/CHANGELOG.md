# @manifold-studio/configurator

## 0.3.2

### Patch Changes

- [`bb6156b`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/bb6156b7c50354a501a4d06fe41e5dc8a0a5b897) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Fix critical template-server bug and update dependency structure

  - Fix missing findPackagePath function in configurator CLI that caused Vite server errors
  - Move @manifold-studio/configurator and @manifold-studio/wrapper to dependencies in generated projects
  - Improve package path resolution logic to prioritize node_modules over relative paths
  - Update all tests to match new dependency structure
  - Rebuild configurator CLI with fixes
  - Keep all package versions in sync

- Updated dependencies [[`bb6156b`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/bb6156b7c50354a501a4d06fe41e5dc8a0a5b897)]:
  - @manifold-studio/wrapper@0.3.2

## 0.3.1

### Patch Changes

- [`92c6d12`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/92c6d129953b771185ffe5207e480cabcfc2ee4c) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Bump all packages to 0.3.1.

  - configurator: include pipeline runtime types and build fixes
  - create-app: ensure published deps are used when local workspaces are unavailable (e.g., npx)
  - wrapper: coordinated patch bump
  - typeface: coordinated patch bump

- Updated dependencies [[`92c6d12`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/92c6d129953b771185ffe5207e480cabcfc2ee4c)]:
  - @manifold-studio/wrapper@0.3.1

## 0.3.1-beta.0

### Patch Changes

- [`92c6d12`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/92c6d129953b771185ffe5207e480cabcfc2ee4c) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Bump all packages to 0.3.1.

  - configurator: include pipeline runtime types and build fixes
  - create-app: ensure published deps are used when local workspaces are unavailable (e.g., npx)
  - wrapper: coordinated patch bump
  - typeface: coordinated patch bump

- Updated dependencies [[`92c6d12`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/92c6d129953b771185ffe5207e480cabcfc2ee4c)]:
  - @manifold-studio/wrapper@0.3.1-beta.0
