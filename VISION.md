# Manifold Live Dev Vision

## The Complete 3D Parametric Modeling Development Environment

Manifold CAD aims to be like **VS Code + Fusion 360 had a baby that speaks TypeScript** - a complete development environment for parametric 3D modeling with a code-first approach.

## Development Workflow (Inspired by Create-React-App)

### Development Phase (`npm run dev`)

- **Live 3D UI** with hot-reloading TypeScript model files
- **Interactive parameter controls** via Tweakpane
- **Real-time 3D preview** with instant feedback
- **Developer-friendly environment** for iterating on designs

### Production Phase (`npm run pipeline`)

- **Export production-ready files** for 3D printing (OBJ, GLB, STL)
- **Batch processing** for generating multiple parameter combinations
- **TypeScript compilation** handled automatically
- **"Deploy to printer" workflow** for physical manufacturing

## The Create-React-App Parallel

| Create-React-App              | Manifold CAD                             |
| ----------------------------- | ---------------------------------------- |
| `npx create-react-app my-app` | `npx create-manifold-app my-models`      |
| `npm run dev`                 | `npm run dev` (live 3D UI)               |
| `npm run build`               | `npm run pipeline` (export for printing) |
| Edit `.jsx` files             | Edit `.ts` model files                   |
| Browser hot reload            | 3D viewer hot reload                     |
| Deploy to web                 | Send to 3D printer                       |

## Target Developer Experience

### Project Structure

```
my-3d-project/
├── src/
│   ├── models/
│   │   ├── hook.ts           # Parametric wall hook
│   │   ├── bracket.ts        # Custom bracket design
│   │   └── gear.ts          # Mechanical gear
│   └── lib/                 # Shared utilities
├── exports/                 # Generated 3D files
│   ├── hook-thick.obj
│   ├── bracket-large.stl
│   └── gear-24tooth.glb
├── package.json            # Project dependencies
└── tsconfig.json          # TypeScript configuration
```

### Development Commands

```bash
# Start live development environment
npm run dev

# Export single model
npm run pipeline src/models/hook.ts --params thickness=5,width=20

# Batch export multiple configurations
npm run pipeline src/models/gear.ts --batch configs/gear-sizes.json

# Export all models
npm run build
```

## Core Design Principles

### 1. **Code-First Approach**

- Models defined in TypeScript with full type safety
- Rich parameter validation and constraints
- Version control friendly (no binary files)
- Composable and reusable model components

### 2. **TypeScript Integration**

- Automatic compilation within project context
- Access to project's `node_modules` dependencies
- Can import D3, Clipper, or any NPM library
- Leverages existing TypeScript toolchain

### 3. **Live Development Experience**

- Hot-reload on file changes
- Interactive parameter tweaking
- Real-time 3D visualization
- Fast iteration cycles

### 4. **Production Pipeline**

- Multiple export formats (OBJ, GLB, STL)
- Batch processing capabilities
- Parameter validation and bounds checking
- Integration with 3D printing workflows

## Technical Architecture

### Model Interface

```typescript
export const hookConfig: ParametricConfig = {
  parameters: {
    thickness: P.number(3, 1, 10),
    width: P.number(13, 5, 50),
    mountingType: P.select("screw", ["screw", "adhesive", "magnetic"]),
  },
  generateModel: (params) => createHook(params),
  name: "Parametric Hook",
  description: "A customizable wall hook",
};
```

### Development Server

- Web Components + Preact Signals architecture
- Vite-based hot module replacement
- Manifold-3d WebAssembly integration
- Real-time model compilation and rendering

### Export Pipeline

- Node.js-based headless rendering
- TypeScript compilation on-demand
- Multiple output format support
- Batch processing with progress reporting

## Future Roadmap

### Phase 1: Core Pipeline ✅

- [x] Headless model generation
- [x] OBJ export support
- [x] Parameter validation
- [ ] TypeScript-aware compilation

### Phase 2: Enhanced Pipeline

- [ ] Multiple export formats (GLB, STL)
- [ ] Batch processing capabilities
- [ ] Performance optimizations
- [ ] Integration testing framework

### Phase 3: Complete Environment

- [ ] Project scaffolding (`create-manifold-app`)
- [ ] Enhanced development UI
- [ ] Plugin ecosystem
- [ ] Cloud rendering services

## Success Metrics

### Developer Experience

- **Time to first model**: < 5 minutes from scaffold to rendered 3D
- **Iteration speed**: < 1 second from code change to visual update
- **Learning curve**: Familiar to TypeScript/React developers

### Production Workflow

- **Export reliability**: 99%+ successful exports
- **Format compatibility**: Works with major slicing software
- **Performance**: Handle complex models with 100k+ polygons

## Use Cases

### **Educational**

- Teaching parametric design principles
- Computational geometry learning
- 3D printing in engineering curricula

### **Professional**

- Rapid prototyping workflows
- Custom tooling and fixtures
- Architectural model generation

### **Personal/Hobbyist**

- Custom replacement parts
- Personalized organizers and accessories
- Artistic and decorative objects

---

_This vision document will evolve as the project develops and community feedback is incorporated._
