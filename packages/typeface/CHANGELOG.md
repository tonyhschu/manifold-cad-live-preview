# @manifold-studio/typeface

## 0.3.4

### Patch Changes

- [`6757d59`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/6757d59ee848f107262e1fb0cb5a27786d303603) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Fix pipeline-runtime TypeScript compilation and import paths

  - Fix missing .js extension in pipeline compiler import
  - Fix build:pipeline-runtime to compile TypeScript to JavaScript instead of copying .ts files
  - Ensures generated pipeline files can properly import from @manifold-studio/configurator/pipeline-runtime/types.js
  - Bump all packages to 0.3.4 to maintain version synchronization

- Updated dependencies [[`6757d59`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/6757d59ee848f107262e1fb0cb5a27786d303603)]:
  - @manifold-studio/wrapper@0.3.4

## 0.3.3

### Patch Changes

- [`6637cb5`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/6637cb565f47201702e8045a447097f9d1d51384) Thanks [@tonyhschu](https://github.com/tonyhschu)! - Sync package versions to 0.3.3 to fix dependency resolution

  - Bump configurator, wrapper, and typeface to match create-app@0.3.3
  - Ensures create-app can find matching versions of all dependencies
  - Fixes "No matching version found for @manifold-studio/configurator@^0.3.3" error

- Updated dependencies [[`6637cb5`](https://github.com/tonyhschu/manifold-cad-live-preview/commit/6637cb565f47201702e8045a447097f9d1d51384)]:
  - @manifold-studio/wrapper@0.3.3

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
