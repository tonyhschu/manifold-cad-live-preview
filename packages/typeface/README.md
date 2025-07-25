# @manifold-studio/typeface

Font loading and text-to-3D conversion for Manifold Studio components.

## Features

- **Lazy Font Loading**: Fonts are loaded only when needed, preserving fast startup
- **Universal Compatibility**: Works in both browser and Node.js environments
- **Curated Font Set**: Includes high-quality web fonts (Inter, Roboto, Open Sans, Source Code Pro)
- **Custom Font Support**: Register and use your own fonts
- **Clean API**: Simple async/await pattern for components that need fonts

## Installation

```bash
npm install @manifold-studio/typeface
```

## Quick Start

```typescript
import { fontLoader, fonts } from '@manifold-studio/typeface';
import { createConfig, P } from '@manifold-studio/wrapper';

export default createConfig(
  { 
    text: P.string('Hello World'),
    font: P.select(['Inter', 'Roboto', 'Open Sans'])
  },
  async (params) => {
    // Ensure fonts are loaded (only initializes once)
    await fonts.ensureReady();
    
    // Create text renderer for the selected font
    const renderText = fontLoader(params.font);
    
    // Convert text to 3D shape
    return renderText(params.text).extrude(10);
  }
);
```

## API Reference

### Core Functions

#### `fontLoader(fontName: string)`

Creates a text rendering function for the specified font.

```typescript
const renderText = fontLoader('Inter');
const crossSection = renderText('Hello', { fontSize: 24 });
```

#### `fonts.ensureReady()`

Ensures all fonts are loaded. This is idempotent - safe to call multiple times.

```typescript
await fonts.ensureReady();
```

#### `registerFont(name, url, options?)`

Register a custom font before initialization.

```typescript
registerFont('My Font', 'https://example.com/font.ttf', {
  family: 'My Font Family',
  weight: '400'
});
```

### Font Management

```typescript
// Check if fonts are ready
fonts.isReady(); // boolean

// List available fonts
fonts.list(); // string[]

// Check specific font
fonts.isFontLoaded('Inter'); // boolean

// Get debug status
fonts.getStatus(); // detailed status object
```

## Default Fonts

The package includes these curated fonts:

- **Inter** - Modern, highly legible sans-serif
- **Roboto** - Google's signature font
- **Open Sans** - Friendly, readable sans-serif  
- **Source Code Pro** - Monospace font for code

## Text Rendering Options

```typescript
const renderText = fontLoader('Inter');
const crossSection = renderText('Hello', {
  fontSize: 24,           // Font size in units
  letterSpacing: 1.2,     // Letter spacing multiplier
  align: 'center',        // 'left' | 'center' | 'right'
  subdivisionSteps: 10    // Bezier curve quality
});
```

## Custom Fonts

Register custom fonts before calling `fonts.ensureReady()`:

```typescript
import { registerFont, fontLoader, fonts } from '@manifold-studio/typeface';

// Register before initialization
registerFont('Fancy Font', 'https://example.com/fancy.ttf');

export default createConfig(
  { text: P.string('Hello') },
  async (params) => {
    await fonts.ensureReady(); // Loads both default and custom fonts
    const renderText = fontLoader('Fancy Font');
    return renderText(params.text).extrude(5);
  }
);
```

## Error Handling

The package provides helpful error messages:

```typescript
try {
  await fonts.ensureReady();
  const renderText = fontLoader('NonExistent Font');
} catch (error) {
  // Error: Font 'NonExistent Font' not available. 
  // Available fonts: Inter, Roboto, Open Sans, Source Code Pro
}
```

## Architecture

This package uses lazy initialization to minimize impact on application startup:

1. **No wrapper changes**: The `@manifold-studio/wrapper` package requires no modifications
2. **Opt-in async**: Only components that use fonts need to be async
3. **Existing components unchanged**: Non-font components remain synchronous
4. **Leverages existing infrastructure**: Uses the configurator's existing async support

## Migration from Reference Implementation

If you have existing typeface components, update them to use the new API:

```typescript
// Before (reference implementation)
import { createExtrudedText } from '../lib/typeface-utils';

export default createConfig(params => {
  return createExtrudedText(params.text, params.height);
});

// After (new package)
import { fontLoader, fonts } from '@manifold-studio/typeface';

export default createConfig(params => async {
  await fonts.ensureReady();
  const renderText = fontLoader('Inter');
  return renderText(params.text).extrude(params.height);
});
```

## License

MIT
