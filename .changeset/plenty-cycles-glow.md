---
"@manifold-studio/configurator": patch
"@manifold-studio/create-app": patch
"@manifold-studio/wrapper": patch
"@manifold-studio/typeface": patch
---

Fix critical template-server bug and update dependency structure

- Fix missing findPackagePath function in configurator CLI that caused Vite server errors
- Move @manifold-studio/configurator and @manifold-studio/wrapper to dependencies in generated projects
- Improve package path resolution logic to prioritize node_modules over relative paths
- Update all tests to match new dependency structure
- Rebuild configurator CLI with fixes
- Keep all package versions in sync
