---
"@manifold-studio/configurator": patch
"@manifold-studio/create-app": patch
"@manifold-studio/wrapper": patch
"@manifold-studio/typeface": patch
---

Fix pipeline-runtime TypeScript compilation and import paths

- Fix missing .js extension in pipeline compiler import
- Fix build:pipeline-runtime to compile TypeScript to JavaScript instead of copying .ts files
- Ensures generated pipeline files can properly import from @manifold-studio/configurator/pipeline-runtime/types.js
- Bump all packages to 0.3.4 to maintain version synchronization
