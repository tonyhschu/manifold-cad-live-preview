# test-combined-dev

A Manifold Studio project

This project was created with [Manifold Studio](https://github.com/tonyhschu/manifold-cad-live-preview), a modern TypeScript framework for 3D CAD model development.

## Getting Started

### Development Mode

Start the complete development environment:

```bash
npm run dev
```

This starts both the model watcher and UI server, giving you:
- **Model Watcher**: Automatically compiles your `components/` directory changes to GLB files
- **Live Preview**: Opens your browser to `http://localhost:5173` with real-time 3D rendering
- **Parameter Controls**: Adjust model parameters using the control panel
- **Export Options**: Download your models as OBJ or GLB files
- **Hot Reloading**: See changes instantly without page refreshes

### Model Development Mode (Advanced)

For running just the model compilation without the UI:

```bash
npm run dev:models
```

This starts only the Model Watcher which:
- Watches your `components/` directory for changes
- Automatically compiles TypeScript models to GLB files
- Provides real-time feedback on compilation status
- Generates a `temp/` folder with compiled model artifacts

### Customizing Your Models

Create and edit models in the `components/` directory:

1. **Create new models**: Add `.ts` files in `components/` (e.g., `components/my-part.ts`)
2. **Adjust parameters**: Change default values or add new parameters using `P.number()`, `P.boolean()`, etc.
3. **Modify geometry**: Update your model functions using Manifold operations
4. **Add features**: Import additional Manifold operations or external libraries

Example model structure:
```typescript
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

function createMyPart(width: number = 10): Manifold {
  return Manifold.cube([width, width, width]);
}

export default createMyPart;

export const myPartConfig = createConfig(
  { width: P.number(10, 1, 50, 1) },
  (params) => createMyPart(params.width),
  { name: "My Part", description: "A customizable part" }
);
```

### Project Structure

```
test-combined-dev/
├── main.ts              # Your main 3D model for UI
├── components/          # Model components (auto-discovered by model watcher)
│   ├── example.ts       # Example sphere component
│   └── wheel.ts         # Example wheel component
├── scripts/             # Development tools
│   └── model-watcher.ts # Automatic model compilation script
├── temp/                # Generated model artifacts (gitignored)
│   ├── blobs/           # Compiled GLB files
│   ├── core/            # Compiled JavaScript
│   └── manifest.json    # Model compilation status
├── package.json         # Project dependencies
├── vite.config.ts       # Development server configuration
└── index.html           # HTML bootstrap
```

## Available Scripts

- `npm run dev` - Start complete development environment (model watcher + UI server)
- `npm run dev:models` - Start model watcher only for automatic compilation
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Learn More

- [Manifold Studio Documentation](https://github.com/tonyhschu/manifold-cad-live-preview)
- [ManifoldCAD API Reference](https://elalish.github.io/manifold/docs/html/index.html)
- [Vite Documentation](https://vitejs.dev/)

## Adding Dependencies

You can install any NPM package to enhance your models:

```bash
# Example: Add D3 for data visualization
npm install d3

# Example: Add math utilities
npm install mathjs
```

Then import and use them in your model:

```javascript
import * as d3 from 'd3';
import { evaluate } from 'mathjs';
```

Happy modeling! 🎨
