---
"@manifold-studio/configurator": patch
"@manifold-studio/typeface": patch
"@manifold-studio/wrapper": patch
---

Sync package versions to 0.3.3 to fix dependency resolution

- Bump configurator, wrapper, and typeface to match create-app@0.3.3
- Ensures create-app can find matching versions of all dependencies
- Fixes "No matching version found for @manifold-studio/configurator@^0.3.3" error
