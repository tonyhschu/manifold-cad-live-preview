# V3 Development Test Environment

This directory provides a development environment for implementing and testing the V3 pipeline-based architecture without needing to run `create-app` for every change.

## Structure

```
test-v3-development/
├── main.ts                    # Main parametric model for testing
├── components/                # Component models
│   └── simple-cube.ts        # Static model for testing
├── src/                      # UI harness source
│   └── main.ts              # Entry point (placeholder)
├── package.json             # Dependencies and scripts
├── vite.config.ts           # UI harness Vite config
├── tsconfig.json            # TypeScript configuration
└── README.md               # This file
```

## Development Workflow

### Phase 1: Foundation (✅ Complete)
- Types extracted to `packages/configurator/src/types/`
- Utilities extracted to `packages/configurator/src/utils/`
- Development environment set up

### Phase 2: Pipeline Compiler (⏳ Next)
- Create pipeline build server
- Implement file discovery for compilation
- Handle parametric models in pipeline
- Test pipeline compilation

### Phase 3: UI Harness (⏳ Later)
- Simple pipeline reload
- State preservation
- Selective re-rendering

## Usage

```bash
# Install dependencies
npm install

# Start development (UI only for now)
npm run dev:ui

# Run tests (when implemented)
npm test
```

## Test Models

- **main.ts**: Parametric hook model with height, width, thickness parameters
- **components/simple-cube.ts**: Static cube model for basic testing

## Next Steps

1. Implement pipeline compiler in Phase 2
2. Test compilation with these models
3. Implement UI harness to load compiled pipeline
4. Test full V3 workflow
