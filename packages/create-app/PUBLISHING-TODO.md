# Create-App Publishing TODO

## Changes needed when packages are published to npm:

### 1. Template Dependencies (`templates/basic/package.json.hbs`)

**Current (source-based development):**

```json
"dependencies": {
  "manifold-3d": "^3.1.1"
}
```

**After publishing:**

```json
"dependencies": {
  "@manifold-studio/wrapper": "^1.0.0",
  "@manifold-studio/configurator": "^1.0.0",
  "manifold-3d": "^3.1.1"
}
```

### 2. Vite Configuration (`templates/basic/vite.config.ts.hbs`)

**Current (source-based development):**

```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
    '@manifold-studio/configurator': '{{packagesPath}}/configurator/src/index.ts',
    '@manifold-studio/wrapper': '{{packagesPath}}/wrapper/src/index.ts'
  }
}
```

**After publishing:**

```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, './src')
    // Remove aliases - packages will be resolved from node_modules
  }
}
```

### 3. Test Validation (`tests/utils/project-creator.ts`)

**Current (source-based development):**

```typescript
const requiredDeps = ["@manifold-studio/wrapper", "manifold-3d"];
```

**After publishing:**

```typescript
const requiredDeps = [
  "@manifold-studio/wrapper",
  "@manifold-studio/configurator",
  "manifold-3d",
];
```

### 4. Alternative: Remove aliases entirely after publishing

Once packages are published, the aliases might not be needed if the packages export their modules correctly.

## Files to update:

- [ ] `packages/create-app/templates/basic/package.json.hbs` - Add wrapper and configurator dependencies
- [ ] `packages/create-app/templates/basic/vite.config.ts` - Update alias paths
- [ ] `packages/create-app/tests/utils/project-creator.ts` - Add back dependency validation
- [ ] Test that published packages work correctly with the template
- [ ] Update this TODO file or remove it after publishing
