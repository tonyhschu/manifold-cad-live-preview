# Manifold Create Tool - Architecture & Implementation Plan

## Project Vision

Create a scaffolding tool (`@manifold-studio/create-app`) that makes it easy for developers to build 3D models using Manifold, with the ability to import any NPM packages they need. The original motivation was enabling developers to use libraries like D3 with Manifold to create things like printable 3D histograms - something not possible in the ManifoldCAD.org web editor due to import restrictions.

## Core Goals

**Immediate Goal:** Enable rapid development of Manifold modules with live preview
**Stretch Goal 1:** Provide foundation for hosted model configuration UIs
**Stretch Goal 2:** Enable developers to easily publish composable Manifold modules to NPM

## Architecture Decision: Configurator Package Approach

### Rationale

After considering embedding the Vite server setup directly in templates vs. creating a shared package, we chose the **shared package approach** because:

1. **Ecosystem Foundation**: The stretch goals require a consistent runtime across all projects
2. **Hosted Deployment**: Users who want to host model configurators need the same reliable setup that worked in development
3. **NPM Publishing**: A standard configurator package creates consistency across published modules
4. **Developer Experience**: Most developers want the full configurator experience, not individual components

## Package Naming Strategy

We'll use the **@manifold-studio** scope to clearly position these packages as a creative workspace layer built on top of the core Manifold engine. This naming:

- References the underlying Manifold technology
- Makes clear we're not directly affiliated with the core Manifold project
- Emphasizes the "studio" concept - a complete development environment
- Provides room for ecosystem growth

### Package Structure

**`@manifold-studio/configurator`** - Single cohesive package containing:

- Web components for 3D visualization
- Tweakpane adapter for parameter controls
- Model execution services
- OBJ blob generation
- Development server integration

**`@manifold-studio/create-app`** - Scaffolding tool that:

- Generates basic project structure
- Sets up dependency on configurator package
- Provides working example model
- Creates standard NPM project (not a custom framework)

**`@manifold-studio/wrapper`** - (Existing) Enhanced API layer for easier Manifold usage

**Future packages:**

- `@manifold-studio/templates` - Additional project templates
- `@manifold-studio/deploy` - Deployment utilities for hosted configurators

## Developer Experience Flow

1. `npx @manifold-studio/create-app my-cool-model`
2. Template includes simple working example (cube/sphere with parameters)
3. `npm run dev` immediately shows configurator UI with live preview
4. Developer can tweak parameters and see instant changes
5. Developer replaces example code with their model logic
6. Full NPM ecosystem available: `npm install d3`, `npm install clipper`, etc.
7. Standard deployment: project can be committed to git, hosted, shared

## Template Structure

### Generated Files

#### Basic Template

```
my-cool-model/
├── package.json          # Regular NPM package with @manifold-studio/configurator dependency
├── index.html           # Minimal HTML bootstrap for configurator
├── main.js              # Starter model with clear example and comments
├── vite.config.js       # Basic Vite configuration
└── README.md            # Getting started instructions
```

#### Advanced Template (Optional)

```
my-cool-model/
├── package.json          # Same as basic
├── index.html           # Same as basic
├── main.js              # Assembly that imports from components
├── components/          # Auto-discovered component models
│   ├── base.js          # Example base component
│   ├── arm.js           # Example arm component
│   └── joint.js         # Example joint component
├── vite.config.js       # Same as basic
└── README.md            # Instructions including component workflow
```

### Key Characteristics

- **Just a regular NPM project** - no magic, no hidden complexity
- **Immediate gratification** - working UI visible within seconds of creation
- **Clear extension points** - obvious where to add custom logic
- **Standard tooling** - familiar npm scripts, git workflow, deployment options

## Implementation Plan

### Phase 0: Configurator Preparation (Required First)

Before implementing the create tool, we need to update the configurator package to support flexible model loading patterns that work well for generated projects.

#### Current State

The configurator currently uses a hard-coded model registry in `model-loader.ts` that points to specific files in `/src/models/`. This works for our development but won't work for generated projects.

#### Required Changes

1. **Replace hard-coded registry with convention-based auto-discovery**:

   - `main.js` is always the primary entry point
   - `models/` or `components/` directories trigger auto-discovery of additional models
   - No directories = single model mode (simplest case)

2. **Update model loading system**:

   - Remove `availableModels` array from `model-loader.ts`
   - Implement directory scanning for auto-discovery
   - Maintain backward compatibility for our development models

3. **Preserve development workflow**:
   - Keep existing `/src/models/` for our testing and development
   - Exclude development models from published package
   - Ensure our monorepo development continues to work

#### User Experience Patterns

```javascript
// Simple case - single model
my-project/
└── main.js                    // Auto-loaded as primary model

// Complex case - auto-discovery
my-project/
├── main.js                    // Primary assembly
└── components/                // Auto-discovered components
    ├── gear.js               // Component: Gear
    ├── shaft.js              // Component: Shaft
    └── housing.js            // Component: Housing
```

#### Benefits

- **Zero configuration** for simple projects
- **Natural progression** from single file to complex assemblies
- **Development-friendly** for complex models with sub-assemblies
- **No registry complexity** exposed to end users
- **Familiar patterns** using standard directory conventions

### Phase 1: Core Infrastructure

1. **Setup NPM package structure**: Create `@manifold-studio/create-app` package with proper bin configuration
2. **Implement CLI with Commander.js**: Argument parsing, help text, project name validation
3. **Create template system**: Use Handlebars for template processing with Node.js built-in fs operations
4. **Build scaffolding logic**: Copy and process template files, handle package manager detection and dependency installation
5. **Create working example template**: Basic Vite + configurator setup that works immediately

### Phase 2: Developer Experience Polish

1. **Improve template content**: More interesting example model with clear documentation
2. **Add interactive features**: Better error handling, progress indicators, success messaging
3. **Package manager detection**: Support npm, yarn, pnpm, bun with graceful fallbacks
4. **Testing and validation**: Cross-platform compatibility, edge case handling

### Phase 3: Ecosystem Enablement (Stretch Goals)

1. **Production builds**: Ensure configurator works for hosted deployments
2. **Publishing workflow**: Tools/docs for publishing modules to NPM
3. **Module discovery**: Registry or catalog of published modules
4. **Advanced options**: Optional features, multiple template variants

## Technical Implementation Details

### NPX Integration

The tool works through NPM's "bin" field mechanism:

```json
{
  "name": "@manifold-studio/create-app",
  "bin": {
    "create-app": "./bin/index.js"
  }
}
```

When users run `npx @manifold-studio/create-app my-project`, NPX:

1. Downloads/locates the package
2. Executes `./bin/index.js` as a Node.js script
3. Passes command line arguments to the script

### Core Technology Stack

- **Commander.js**: CLI argument parsing, help generation, command structure
- **Handlebars**: Template variable substitution for dynamic files (package.json, etc.)
- **Node.js built-ins**: File operations using fs.readFileSync, fs.writeFileSync, fs.mkdirSync
- **Child process**: Package manager detection and dependency installation

### Template Processing Flow

1. Parse command line arguments with Commander.js
2. Create project directory using Node's fs.mkdirSync
3. Copy static template files directly
4. Process dynamic templates (package.json, etc.) with Handlebars
5. Detect user's package manager (npm/yarn/pnpm/bun)
6. Run dependency installation automatically
7. Display success message with next steps

## Success Metrics

**Immediate:**

- Developers can go from `npx @manifold-studio/create-app` to working 3D UI in under 2 minutes
- Projects can import and use external NPM packages without issues
- Generated projects can be deployed to standard hosting platforms

**Stretch Goals:**

- Community starts publishing configurable 3D models
- Examples emerge of creative combinations (D3 + Manifold, etc.)
- Hosted model configurators become common way to share parametric designs

## Technical Considerations

**Configurator Package Design:**

- Single cohesive package rather than multiple smaller packages
- Tree-shakeable for optimization but designed for full usage
- Compatible with both development and production environments

**Template Philosophy:**

- Minimal but complete - no missing pieces
- Standard tooling - familiar to any JavaScript developer
- Extensible - clear paths to add complexity as needed
- Educational - example code teaches Manifold concepts

**Ecosystem Integration:**

- Node.js pipeline remains available for headless use cases
- Published modules share consistent configurator interface
- Hosting story works for both development and production
