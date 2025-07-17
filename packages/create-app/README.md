# @manifold-studio/create-app

CLI tool for scaffolding new Manifold Studio projects. Get started with 3D modeling in TypeScript with hot reloading, parametric controls, and export functionality in seconds.

## 🚀 Quick Start

Create a new 3D modeling project instantly:

```bash
# Create a new project
npx @manifold-studio/create-app my-3d-project

# Set up for local development (until packages are published)
cd my-3d-project
npm install
npm link @manifold-studio/wrapper @manifold-studio/configurator

# Start developing
npm run dev
```

This single command automatically:

- **Discovers your models** (main.ts + components/)
- **Starts dual servers** (UI server + pipeline compiler)
- **Watches for changes** and regenerates pipeline entries
- **Opens browser** with live 3D preview and parameter controls

**What you get:**

- **3D Canvas**: Real-time model preview with camera controls
- **Parameter Panel**: Sliders and controls for your model parameters
- **Export Tools**: Download STL, OBJ, GLB files instantly
- **Hot Reloading**: Edit code and see changes immediately
- **Automatic Model Discovery**: Add new .ts files and they appear instantly

## 🔧 CLI-Powered Development

Generated projects use the **Manifold Studio CLI** for development, which provides:

### Unified Development Experience

The `npm run dev` command in generated projects runs the Manifold Studio CLI, which:

1. **Automatically discovers models** in your project (main.ts + components/)
2. **Generates pipeline entries** dynamically without manual management
3. **Starts coordinated dual servers**:
   - **UI Server** (port 3000): Configurator interface with HMR
   - **Pipeline Compiler** (port 3001): Model compilation and manifest generation
4. **Watches for file changes** and regenerates pipeline automatically
5. **Provides source-based configurator imports** for immediate feedback

### Configurator Development Integration

For configurator library development, use the CLI in test projects:

```bash
# Navigate to test project (not create-app package)
cd test-v3-development
npm run dev  # CLI automatically detects configurator development mode
```

**Benefits of CLI approach**:

- **No manual pipeline management**: CLI handles everything automatically
- **Automatic model discovery**: New .ts files appear in UI instantly
- **Unified configuration**: Consistent Vite aliases across both servers
- **Better import resolution**: Package imports work in generated pipeline files
- **Reduced generated code**: Shared types/functions moved to library

## ✨ What You Get

Every scaffolded project includes:

- **TypeScript by default** with full type safety and IDE support
- **Parametric box example** with width, height, depth controls to get you started
- **Component system** for modular model development and organization
- **Hot module reloading** for instant feedback during development
- **Export functionality** built-in for STL, OBJ, and GLB formats
- **Modern tooling** with Vite, TypeScript, and ESM support
- **Model discovery** that automatically finds and lists your 3D models

### Generated Project Structure

```
my-3d-project/
├── main.ts              # Your main 3D model with parametric controls
├── components/          # Additional model components
│   └── example.ts       # Example component showing best practices
├── package.json         # Dependencies and scripts (includes CLI integration)
├── tsconfig.json        # TypeScript configuration
├── index.html           # HTML bootstrap for the browser interface
└── README.md            # Project-specific documentation
```

## 📦 CLI Options

### Basic Usage

```bash
npx @manifold-studio/create-app <project-name>
```

### Available Options

```bash
npx @manifold-studio/create-app my-project [options]

Options:
  -t, --template <template>  Template to use (default: "basic")
  --no-install              Skip automatic dependency installation
  -h, --help                Display help information
  -V, --version             Display version number
```

### Usage Examples

```bash
# Create project with default settings
npx @manifold-studio/create-app my-models

# Create project without installing dependencies
npx @manifold-studio/create-app my-models --no-install

# Specify template explicitly (currently only "basic" available)
npx @manifold-studio/create-app my-models --template basic
```

## 🏗️ Generated Project Structure

### Core Files

- **`main.ts`**: Your primary 3D model file with parametric configuration
- **`components/`**: Directory for additional model components and utilities
- **`components/example.ts`**: Example component demonstrating best practices

### Configuration Files

- **`package.json`**: Configured with Manifold Studio dependencies and CLI integration
- **`tsconfig.json`**: TypeScript configuration optimized for 3D modeling
- **`index.html`**: Bootstrap HTML that loads the Manifold Studio configurator

### Component Discovery System

The generated project automatically discovers models using a convention-based approach:

1. **Main Model**: `main.ts` is always available as the primary model
2. **Component Models**: Any `.ts` files in `components/` that export a default function or parametric config
3. **Automatic Registration**: Models appear in the UI dropdown without manual registration
4. **Hot Reloading**: Changes to any model file trigger immediate browser updates

## 🔧 How the Package Works

### Template System

The create-app tool uses **Handlebars** for template processing:

- **Template Location**: `templates/basic/` contains the base project template
- **Variable Substitution**: Project name and other variables are injected into template files
- **File Processing**: `.hbs` files are processed and renamed (e.g., `package.json.hbs` → `package.json`)
- **Static Files**: Non-template files are copied directly to the target directory

### Dependency Management

Generated projects are configured with:

```json
{
  "dependencies": {
    "@manifold-studio/wrapper": "^1.0.0",
    "@manifold-studio/configurator": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vite": "^5.0.0"
  }
}
```

### Local Development Workflow

For development with unpublished packages, the tool supports **npm link**:

1. **Build packages**: `npm run build` in the monorepo root
2. **Create links**: `npm link` in each package directory
3. **Link in project**: `npm link @manifold-studio/wrapper @manifold-studio/configurator`
4. **Development**: Changes in wrapper/configurator packages propagate to your project

## 🛠️ Development Workflow

### Working with Generated Projects

1. **Start CLI Development Server**:

   ```bash
   npm run dev  # Runs Manifold Studio CLI automatically
   ```

2. **Edit Models**: Modify `main.ts` or add files to `components/`

   - **Automatic Discovery**: New .ts files appear in UI dropdown instantly
   - **Pipeline Regeneration**: CLI detects changes and updates pipeline automatically

3. **See Changes Instantly**:

   - **Model Changes**: Pipeline rebuilds and GLB updates automatically
   - **Configurator Changes**: HMR provides immediate feedback (if developing configurator)

4. **Export Models**: Use the built-in export tools to download STL, OBJ, or GLB files

### Component Development Patterns

**Simple Component**:

```typescript
// components/wheel.ts
import { Manifold } from "@manifold-studio/wrapper";

export default function createWheel(radius = 10, width = 5) {
  return Manifold.cylinder(width, radius);
}
```

**Parametric Component**:

```typescript
// components/bracket.ts
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

export default createConfig(
  {
    width: P.number(20, 10, 50, 1),
    height: P.number(15, 10, 40, 1),
    thickness: P.number(3, 1, 10, 0.5),
  },
  (params) => {
    // Your bracket logic here
    return Manifold.cube([params.width, params.height, params.thickness]);
  },
  {
    name: "Parametric Bracket",
    description: "Adjustable mounting bracket",
  }
);
```

### Model Discovery Conventions

- **Entry Point**: `main.ts` serves as the primary model
- **Components**: Files in `components/` are automatically discovered
- **Export Requirements**: Models must export either:
  - A default function that returns a `Manifold`
  - A default parametric config created with `createConfig()`
- **File Extensions**: Only `.ts` files are processed
- **Naming**: File names become model names in the UI dropdown

## 📋 Requirements

### System Requirements

- **Node.js**: Version 16.0.0 or higher
- **NPM**: Version 7.0.0 or higher (for workspace support)
- **Operating System**: Windows, macOS, or Linux

### Browser Compatibility

Generated projects work in modern browsers that support:

- **ES Modules**: Chrome 61+, Firefox 60+, Safari 10.1+
- **WebAssembly**: Chrome 57+, Firefox 52+, Safari 11+
- **Top-level await**: Chrome 89+, Firefox 89+, Safari 15+

### Development Environment

- **TypeScript**: Full IDE support with IntelliSense
- **Vite**: Fast development server with HMR
- **Modern JavaScript**: ES2022+ features supported

## 🔗 Integration with Manifold Studio

### Package Ecosystem

The create-app tool generates projects that depend on:

- **[@manifold-studio/wrapper](../wrapper)**: Core ManifoldCAD API with operation tracking
- **[@manifold-studio/configurator](../configurator)**: UI components and development environment

### Cross-Package Development

When developing Manifold Studio itself:

1. **Wrapper Changes**: TypeScript watch rebuilds automatically (~1-2 seconds)
2. **Configurator Updates**: Vite HMR propagates changes to generated projects
3. **Total Latency**: ~2-3 seconds for cross-package changes to appear in browser

### Development Commands in Generated Projects

```bash
# Start CLI development server (recommended)
npm run dev  # Runs Manifold Studio CLI with automatic model discovery

# Legacy commands (if available in project)
npm run build:pipeline  # Manual pipeline compilation
npm run dev:ui          # UI server only
npm run dev:pipeline    # Pipeline compiler only

# Utility commands
npm run type-check      # TypeScript type checking
```

## 🚨 Troubleshooting

### Common Issues

#### "Module not found" errors

```bash
Error: Cannot resolve module '@manifold-studio/wrapper'
```

**Solution**: For local development, ensure packages are linked:

```bash
# In the manifold-studio monorepo root
npm run build
cd packages/wrapper && npm link
cd ../configurator && npm link

# In your generated project
npm link @manifold-studio/wrapper @manifold-studio/configurator
```

#### TypeScript compilation errors

```bash
Error: Cannot find type definitions
```

**Solution**: Ensure TypeScript configuration is correct:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

#### Development server won't start

```bash
Error: Port 3000 is already in use
```

**Solution**: The CLI uses ports 3000 (UI) and 3001 (pipeline). Stop other servers or check for conflicts:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

### NPM Link Workflow Issues

#### Links not working after package updates

**Solution**: Re-create the links:

```bash
# Remove old links
npm unlink @manifold-studio/wrapper @manifold-studio/configurator

# Rebuild and re-link
cd /path/to/manifold-studio
npm run build
cd packages/wrapper && npm link
cd ../configurator && npm link

# Re-link in your project
npm link @manifold-studio/wrapper @manifold-studio/configurator
```

#### Dependency version conflicts

**Solution**: Ensure consistent versions across packages:

```bash
# Check linked package versions
npm ls @manifold-studio/wrapper
npm ls @manifold-studio/configurator

# If versions don't match, rebuild the monorepo
cd /path/to/manifold-studio
npm run build
```

### Browser Issues

#### WASM loading failures

```bash
Error: WebAssembly module failed to load
```

**Solution**: Ensure you're serving the project over HTTP (not file://):

```bash
# Use the development server
npm run dev

# Don't open index.html directly in browser
```

#### Hot reloading not working

**Solution**: Check that the development server is running and accessible:

1. Verify `npm run dev` is running without errors
2. Check browser console for connection errors
3. Ensure firewall isn't blocking the development server

## 📄 License & Links

### License

MIT License - see the [LICENSE](../../LICENSE) file for details.

### Related Packages

- **[@manifold-studio/wrapper](../wrapper)** - Core ManifoldCAD API wrapper with operation tracking
- **[@manifold-studio/configurator](../configurator)** - Browser-based development environment
- **[ManifoldCAD](https://github.com/elalish/manifold)** - The underlying 3D modeling library

### Repository

- **GitHub**: [manifold-cad-live-preview](https://github.com/tonyhschu/manifold-cad-live-preview)
- **Package Directory**: `packages/create-app`
- **Issues**: [GitHub Issues](https://github.com/tonyhschu/manifold-cad-live-preview/issues)

---

**Built with ❤️ for the 3D modeling community**
