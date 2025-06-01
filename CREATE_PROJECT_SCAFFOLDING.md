# Project Scaffolding: Create-Manifold-App Equivalent

## Problem Statement

Currently, developers need to manually set up the entire Manifold CAD development environment. This creates a high barrier to entry and inconsistent project structures across different users.

## Proposed Solution

Create a scaffolding tool similar to `create-react-app` that generates a complete Manifold CAD project with:

- Pre-configured development environment
- Example parametric models
- Proper TypeScript configuration
- Development and build scripts
- Documentation and examples

## Vision Alignment

This implements the **Project Scaffolding** component from our [VISION.md](./VISION.md) - enabling the `npx create-manifold-app my-models` experience.

## Technical Requirements

### Core Scaffolding
- [ ] NPM package: `create-manifold-app`
- [ ] Interactive project setup (project name, template selection)
- [ ] Template system for different project types
- [ ] Dependency installation and setup

### Generated Project Structure
```
my-3d-project/
├── src/
│   ├── models/
│   │   ├── examples/
│   │   │   ├── cube.ts          # Simple example
│   │   │   ├── hook.ts          # Complex example
│   │   │   └── gear.ts          # Advanced example
│   │   └── index.ts             # Model registry
│   └── lib/                     # Shared utilities
├── exports/                     # Output directory
├── package.json                 # With correct dependencies
├── tsconfig.json               # Manifold-optimized config
├── vite.config.js              # Development server config
├── README.md                   # Project-specific docs
└── .gitignore                  # Appropriate ignores
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run pipeline:all",
    "pipeline": "manifold-pipeline",
    "pipeline:all": "manifold-pipeline src/models/**/*.ts"
  }
}
```

### Templates
- **Basic**: Simple cube and sphere examples
- **Intermediate**: Hook, bracket, and gear examples  
- **Advanced**: Complex mechanical assemblies

## Implementation Plan

### Phase 1: Basic Scaffolding
1. Create `create-manifold-app` NPM package
2. Implement basic template generation
3. Add example models with documentation
4. Test installation and setup process

### Phase 2: Enhanced Templates
1. Multiple template options
2. Interactive configuration
3. Git repository initialization
4. VS Code workspace configuration

### Phase 3: Ecosystem Integration
1. Plugin system foundation
2. Community template registry
3. Update mechanisms
4. Analytics and feedback

## Success Criteria

- [ ] **Time to first model**: < 5 minutes from `npx create-manifold-app` to seeing rendered 3D
- [ ] **Documentation**: Complete README with examples and next steps
- [ ] **Dependencies**: All required packages installed and configured
- [ ] **Development ready**: `npm run dev` works immediately after scaffolding
- [ ] **Export ready**: `npm run pipeline` works with example models

## Examples

### Basic Usage
```bash
# Create new project
npx create-manifold-app my-models

# Choose template (interactive)
? Select a template: › Basic (cube and sphere examples)

# Auto-setup
✓ Created project at ./my-models
✓ Installed dependencies
✓ Generated example models
✓ Configured development environment

# Start developing
cd my-models
npm run dev
```

### Advanced Usage
```bash
# Non-interactive with template
npx create-manifold-app my-models --template advanced

# With specific options
npx create-manifold-app my-models --template intermediate --typescript --git
```

## Dependencies

- **Issue #1**: Headless Pipeline (prerequisite) ✅
- **Issue #16**: TypeScript-aware Pipeline (parallel development)
- Current parametric system and UI (✅ completed)

## Technical Notes

### Template System
- Use template engine (Handlebars/Mustache) for dynamic content
- Separate templates for different complexity levels
- Configurable through CLI arguments or interactive prompts

### Package Distribution
- Published to NPM as `create-manifold-app`
- Follows NPM create-* package conventions
- Includes proper CLI tooling and help system

### Integration Testing
- Automated testing of generated projects
- Verify all scripts work in generated environment
- Test across different Node.js versions and platforms

---

**Priority**: Medium (after TypeScript-aware Pipeline)
**Complexity**: Medium-High
**Impact**: High (developer onboarding)