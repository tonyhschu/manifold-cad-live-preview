# Font Loader Package Plan

## Overview

Create `@manifold-studio/typeface` package to provide clean font loading and text-to-3D conversion for Manifold Studio components.

## Goals

1. **Clean Component API**: Component authors can use fonts with minimal ceremony
2. **Universal Compatibility**: Works in browser and Node.js environments
3. **Curated Font Set**: Provide high-quality web fonts with consistent rendering
4. **Clear Error Handling**: Fail with helpful messages when fonts can't load
5. **Future Extensibility**: Interface allows for system fonts, custom fonts later

## Architectural Decision: Lazy Initialization

**Key Decision**: Use lazy font initialization instead of modifying wrapper package initialization. This approach:

- **Preserves fast startup**: No changes to `@manifold-studio/wrapper` initialization
- **Zero breaking changes**: Existing sync components continue to work unchanged
- **Optional async**: Only components that need fonts become async
- **Leverages existing infrastructure**: Configurator already supports async `generateModel` functions

## Package Structure

```
@manifold-studio/typeface/
├── src/
│   ├── index.ts              # Public API
│   ├── font-loader.ts        # Core font loading logic
│   ├── font-registry.ts      # Font storage and lookup
│   ├── text-renderer.ts      # Text-to-CrossSection conversion
│   ├── font-resolver.ts      # Move existing font loading logic
│   └── font-classifier.ts    # Move existing polygon classification
├── fonts/                    # Bundled fallback fonts (optional)
├── package.json
└── README.md
```

## Public API Design

### Core Functions

```typescript
// Lazy initialization - called by components when needed
export const fonts: {
  initialize(): Promise<void>; // Load default fonts
  ensureReady(): Promise<void>; // Initialize if not already done
  isReady(): boolean; // Check if fonts are loaded
  list(): string[]; // List available fonts
};

// Component author API
export function fontLoader(fontName: string): (text: string) => CrossSection;
export function registerFont(name: string, url: string): void;
```

### Component Integration Approach

**Lazy Loading with Async Components**

Components that need fonts become async and ensure fonts are ready before use:

```typescript
// Components using fonts are async and ensure fonts are ready
import { fontLoader, fonts } from "@manifold-studio/typeface";

export const typefaceConfig = createConfig(
  { text: P.string("Hello"), font: P.select(["Inter", "Roboto"]) },
  async (params) => {
    // ← Now async
    await fonts.ensureReady(); // ← Ensure fonts are loaded (only initializes once)
    const renderText = fontLoader(params.font);
    return renderText(params.text).extrude(10);
  }
);
```

```typescript
// Components not using fonts remain sync (no changes needed)
import { Manifold } from "@manifold-studio/wrapper";

export const cubeConfig = createConfig({ size: P.number(10) }, (params) => {
  // ← Still sync
  return Manifold.cube([params.size, params.size, params.size]);
});
```

```typescript
// Custom fonts can be registered before initialization
import { fontLoader, fonts, registerFont } from "@manifold-studio/typeface";

registerFont("Fancy Font", "https://example.com/fancy-font.ttf");

export const customTextConfig = createConfig(
  { text: P.string("Hello"), font: P.select(["Inter", "Fancy Font"]) },
  async (params) => {
    await fonts.ensureReady(); // Loads both default and custom fonts
    const renderText = fontLoader(params.font);
    return renderText(params.text).extrude(10);
  }
);
```

## Curated Font Set

Start with high-quality, versatile web fonts:

```typescript
const MANIFOLD_FONTS = {
  Inter:
    "https://cdn.jsdelivr.net/npm/inter-font@3.19.0/Inter-VariableFont_slnt,wght.ttf",
  Roboto: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2",
  "Open Sans":
    "https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.woff2",
  "Source Code Pro":
    "https://fonts.gstatic.com/s/sourcecodepro/v22/HI_XiYsKILxRpg3hIP6sJ7fM7PqlPevWnsUnxlC9.woff2",
};
```

## Implementation Strategy

### Phase 1: Core Package Structure (1-2 days)

- [ ] Create `@manifold-studio/typeface` package with basic structure
- [ ] Move existing `font-resolver.ts` and `font-polygon-classifier.ts` from reference-project
- [ ] Implement lazy font registry system with default fonts
- [ ] Create `fontLoader()` function that checks font availability
- [ ] Implement `fonts.ensureReady()` for lazy initialization
- [ ] Add `registerFont()` for custom fonts

### Phase 2: Wrapper Integration (30 minutes)

- [ ] Add re-exports to `@manifold-studio/wrapper/src/index.ts`
- [ ] No other wrapper changes needed (preserves fast startup)
- [ ] Test that font utilities are accessible from wrapper package

### Phase 3: Component Migration (1 day)

- [ ] Update existing typeface component to use new async pattern
- [ ] Test with reference-project in both browser and Node.js
- [ ] Verify existing non-font components remain unchanged
- [ ] Update documentation with async component examples

### Phase 4: Polish (2-3 days)

- [ ] Add comprehensive error messages for missing fonts
- [ ] Implement font loading progress indicators
- [ ] Performance optimizations (caching, deduplication)
- [ ] Add font validation and fallback mechanisms

## Environment Handling

### Browser

```typescript
async function loadFontInBrowser(url: string): Promise<opentype.Font> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch font: ${response.status} ${response.statusText}`
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return opentype.parse(arrayBuffer);
}
```

### Node.js

```typescript
async function loadFontInNode(url: string): Promise<opentype.Font> {
  try {
    // Use same CDN URLs as browser
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch font: ${response.status} ${response.statusText}`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return opentype.parse(arrayBuffer);
  } catch (error) {
    throw new Error(
      `Font loading failed in Node.js environment: ${error.message}\n` +
        `This usually means no internet access. Consider:\n` +
        `1. Check your network connection\n` +
        `2. Use a local font file instead\n` +
        `3. Pre-download fonts for offline use`
    );
  }
}
```

## Migration Path

1. **Create Package**: Set up @manifold-studio/typeface with existing logic
2. **Update Typeface Component**: Simplify to use new package API
3. **Update Configurator**: Add font initialization to startup sequence
4. **Test Integration**: Verify browser and Node.js CLI work correctly
5. **Documentation**: Update component authoring guides

## Font Loading Implementation

### Lazy Loading Strategy

```typescript
// @manifold-studio/typeface
const DEFAULT_FONTS = ["Inter", "Roboto", "Open Sans", "Source Code Pro"];
const customFonts = new Map<string, string>();
let initializationPromise: Promise<void> | null = null;

export function registerFont(name: string, url: string) {
  customFonts.set(name, url);
}

async function initializeFonts(): Promise<void> {
  // Load default fonts
  for (const fontName of DEFAULT_FONTS) {
    await loadFont(fontName, FONT_URLS[fontName]);
  }

  // Load any registered custom fonts
  for (const [name, url] of customFonts) {
    await loadFont(name, url);
  }
}

export const fonts = {
  async initialize(): Promise<void> {
    if (!initializationPromise) {
      initializationPromise = initializeFonts();
    }
    return initializationPromise;
  },

  async ensureReady(): Promise<void> {
    return this.initialize(); // Same as initialize - idempotent
  },

  isReady(): boolean {
    return initializationPromise !== null && getFontRegistry().size > 0;
  },

  list(): string[] {
    return getAvailableFonts();
  },
};

export function fontLoader(fontName: string): (text: string) => CrossSection {
  return (text: string) => {
    if (!fonts.isReady()) {
      throw new Error(
        `Fonts not initialized. Call 'await fonts.ensureReady()' before using fontLoader.`
      );
    }

    const font = getFontFromRegistry(fontName);
    if (!font) {
      throw new Error(
        `Font '${fontName}' not available. ` +
          `Available fonts: ${fonts.list().join(", ")}`
      );
    }
    return textToCrossSection(text, font);
  };
}
```

## Open Questions

1. **Error Handling**: Should missing fonts throw immediately or return placeholder geometry?
2. **Performance**: Should we lazy-load fonts only when first requested?
3. **Caching**: Should fonts be cached locally in Node.js environments for offline use?
4. **Font Validation**: Should we validate font files before parsing?

## Success Criteria

- [ ] Component authors can use fonts with minimal async ceremony
- [ ] Same component works in browser and Node.js CLI
- [ ] Clear error messages when fonts fail to load
- [ ] Zero breaking changes for existing non-font components
- [ ] Zero changes needed to `@manifold-studio/wrapper` initialization
- [ ] Existing typeface component functionality preserved
- [ ] Performance is acceptable (fonts load once, render many times)

## Future Extensions

- System font detection and loading
- Font subsetting for performance
- Advanced typography features (kerning, ligatures)
- Font fallback chains
- Local font caching for offline use

---

## Appendix: Architectural Investigation

### Investigation Summary

This appendix documents the investigation that validated the lazy initialization approach and confirmed that minimal changes are needed to the existing architecture.

### Key Findings

#### 1. Configurator Already Supports Async Model Generation

**Discovery**: The V3 configurator pipeline already generates async `generateModel` functions and handles them correctly.

**Evidence**:

```typescript
// packages/configurator/src/pipeline-compiler/function-generator.ts:88
async generateModel(modelId, params = {}) {
  switch (modelId) {
    case "main":
      return await generate_main(params);  // ← Already awaits!
  }
}

// packages/configurator/src/services/V3ModelService.ts:85
const model = await pipeline.generateModel(modelId, params);
```

**Implication**: User components can be async without any configurator changes.

#### 2. Wrapper Package Requires Zero Changes

**Discovery**: The `@manifold-studio/wrapper` package uses top-level await for WASM initialization, but this doesn't need to be modified for font loading.

**Evidence**:

```typescript
// packages/wrapper/src/lib/manifold.ts:48
const manifoldModule = await ManifoldModule();
manifoldModule.setup();
```

**Implication**: Font loading can be handled separately through lazy initialization, preserving the wrapper's fast startup time.

#### 3. Pipeline Compiler Handles Both Sync and Async Functions

**Discovery**: The generated pipeline functions already wrap user functions in async contexts, making both sync and async user functions work seamlessly.

**Evidence**:

```typescript
// Generated pipeline function (current)
async function generate_main(params = {}) {
  const module = await import("./compiled-main.js");
  const config = module.default;

  // This works for both sync and async generateModel functions
  return config.generateModel(finalParams);
}
```

**Implication**: No changes needed to the pipeline compiler - it already handles both cases.

#### 4. Existing Components Continue to Work

**Discovery**: Components that don't use fonts can remain completely unchanged.

**Evidence**: Current sync components like:

```typescript
export default createConfig({ size: P.number(10) }, (params) =>
  Manifold.cube([params.size, params.size, params.size])
);
```

Will continue to work exactly as before because the pipeline compiler wraps them in async functions that resolve immediately.

### Alternative Approaches Considered

#### Approach 1: Plugin/Extension System

- **Pros**: Clean separation, extensible
- **Cons**: Adds complexity to wrapper initialization
- **Verdict**: Unnecessary given lazy loading works

#### Approach 2: Conditional Initialization Hook

- **Pros**: Minimal wrapper changes
- **Cons**: Still modifies wrapper initialization
- **Verdict**: Lazy loading is cleaner

#### Approach 3: Environment Variable Detection

- **Pros**: Automatic detection
- **Cons**: Magic behavior, harder to debug
- **Verdict**: Explicit is better than implicit

#### Approach 4: Lazy Initialization (Selected)

- **Pros**: Zero wrapper changes, zero breaking changes, clear user control
- **Cons**: Components using fonts must be async
- **Verdict**: Best balance of simplicity and functionality

### Validation Tests Performed

1. **Traced configurator pipeline**: Confirmed async model generation is already supported
2. **Analyzed wrapper initialization**: Confirmed no changes needed to preserve fast startup
3. **Examined pipeline compiler**: Confirmed both sync and async user functions work
4. **Reviewed existing components**: Confirmed they continue to work unchanged

### Risk Assessment

- **Technical Risk**: Low - leverages existing async infrastructure
- **Breaking Changes**: None - existing components unchanged
- **Performance Impact**: Minimal - only affects components that use fonts
- **Maintenance Burden**: Low - follows existing patterns

This investigation confirms that the lazy initialization approach is the optimal solution for adding font loading to Manifold Studio.
