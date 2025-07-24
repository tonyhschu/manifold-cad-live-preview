# Font Loader Package Plan

## Overview

Create `@manifold-studio/typeface` package to provide clean, synchronous font loading and text-to-3D conversion for Manifold Studio components.

## Goals

1. **Synchronous Component API**: Component authors write clean, sync code without async/await
2. **Universal Compatibility**: Works in browser and Node.js environments
3. **Curated Font Set**: Provide high-quality web fonts with consistent rendering
4. **Clear Error Handling**: Fail with helpful messages when fonts can't load
5. **Future Extensibility**: Interface allows for system fonts, custom fonts later

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
// Initialization (called by configurator/CLI)
export async function initialize(): Promise<void>;

// Component author API
export function fontLoader(fontName: string): (text: string) => CrossSection;
export function registerFont(name: string, url: string): void;

// Font management
export const fonts: {
  list(): string[];
  isLoaded(name: string): boolean;
  getDefault(): string;
};
```

### Component Integration Approach

**Default Fonts + Optional Registration**

Components use a simple import-based approach with default fonts always available, plus optional registration for custom fonts:

```typescript
// Most components just use default fonts (no registration needed)
import { fontLoader } from "@manifold-studio/typeface";

export const typefaceConfig = createConfig(
  { text: P.string("Hello"), font: P.select(["Inter", "Roboto"]) },
  (params) => {
    const renderText = fontLoader(params.font); // Default fonts work immediately
    return renderText(params.text).extrude(10);
  }
);
```

```typescript
// Components needing custom fonts register them
import { fontLoader, registerFont } from "@manifold-studio/typeface";

// Register custom font before use
registerFont("Fancy Font", "https://example.com/fancy-font.ttf");

export const customTextConfig = createConfig(
  { text: P.string("Hello"), font: P.select(["Inter", "Fancy Font"]) },
  (params) => {
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

### Phase 1: Core Package Structure

- [ ] Create package with basic structure
- [ ] Move existing font-resolver.ts and font-classifier.ts
- [ ] Implement font registry system with default fonts
- [ ] Create synchronous fontLoader() function
- [ ] Implement registerFont() for custom fonts

### Phase 2: Universal Loading

- [ ] Implement CDN loading for browser
- [ ] Implement CDN loading for Node.js (with clear error messages)
- [ ] Add environment detection and appropriate loading strategies
- [ ] Load default fonts automatically during initialize()
- [ ] Test in both browser and Node.js CLI scenarios

### Phase 3: Integration

- [ ] Update existing typeface component to use new package
- [ ] Update configurator to call initialize() on startup
- [ ] Test with reference-project
- [ ] Update documentation

### Phase 4: Polish

- [ ] Add helpful error messages for missing fonts
- [ ] Improve font loading progress indicators
- [ ] Performance optimizations
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

### Default Font Strategy

```typescript
// @manifold-studio/typeface
const DEFAULT_FONTS = ["Inter", "Roboto", "Open Sans", "Source Code Pro"];
const customFonts = new Map<string, string>();

export function registerFont(name: string, url: string) {
  customFonts.set(name, url);
}

export async function initialize() {
  // Always load default fonts
  for (const fontName of DEFAULT_FONTS) {
    await loadFont(fontName, FONT_URLS[fontName]);
  }

  // Load any registered custom fonts
  for (const [name, url] of customFonts) {
    await loadFont(name, url);
  }
}

export function fontLoader(fontName: string): (text: string) => CrossSection {
  return (text: string) => {
    const font = getFontFromRegistry(fontName);
    if (!font) {
      throw new Error(
        `Font '${fontName}' not available. ` +
          `Available fonts: ${getAvailableFonts().join(", ")}`
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

- [ ] Component authors can write synchronous text rendering code
- [ ] Same component works in browser and Node.js CLI
- [ ] Clear error messages when fonts fail to load
- [ ] No top-level await in component code
- [ ] Existing typeface component functionality preserved
- [ ] Performance is acceptable (fonts load once, render many times)

## Future Extensions

- System font detection and loading
- Custom font registration
- Font subsetting for performance
- Advanced typography features (kerning, ligatures)
- Font fallback chains
- Local font caching for offline use
