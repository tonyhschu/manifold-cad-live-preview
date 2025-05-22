# Manifold CAD Live Preview Project

## Project Architecture

This project uses a Web Components architecture with Preact Signals for state management. Key points:

1. Light DOM Web Components (no Shadow DOM) for maximum styling flexibility
2. Preact Signals for state management
3. Centralized store pattern

## Web Components + Preact Signals Integration

Refer to `WEB_COMPONENTS_ARCHITECTURE.md` for the full documentation, but here's the key integration pattern:

- Components subscribe to signals in `connectedCallback()`
- Components unsubscribe in `disconnectedCallback()`
- Components render based on signal values
- The store contains all state signals and actions

Example:
```typescript
import { status } from '../../state/store';

export class StatusBar extends HTMLElement {
  private unsubscribe: (() => void) | null = null;
  
  connectedCallback() {
    this.unsubscribe = status.subscribe(value => { 
      // Update UI based on value 
    });
  }
  
  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
```

## Directory Structure

```
src/
  components/       # Web Components
    canvas/         # Canvas-related components
    context/        # Context panel components
    config/         # Configuration panel components
  state/            # State management
    store.ts        # Central store with Preact Signals
    types.ts        # TypeScript types for state
  core/             # Core functionality
  lib/              # Libraries and utilities
```

## Common Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run all tests
- `npm run test:lib`: Test pure library functions (for NPM extraction)
- `npm run test:services`: Test service layer with mocks
- `npm run test:ui`: Test UI components with service mocks
- `npm run test:watch`: Run tests in watch mode

## Important Files

- `src/state/store.ts`: Central state store
- `src/components/index.ts`: Component registration
- `src/main.ts`: Application entry point

## Architecture Goals & Future Plans

### Library Extraction (Issue #8)
We are working toward extracting the core ManifoldCAD library code into a separate NPM package. This drives current architectural decisions:

**Current Strategy:**
- Keep `src/lib/` pure and extractable (no UI dependencies, browser APIs, or console logs)
- Create service layer (`src/services/`) to bridge library and UI concerns
- Separate library functionality from UI integration
- Design export systems to support multiple formats (OBJ, GLB, future 3MF)

**Key Principles:**
- Library code should be environment-agnostic (Node.js compatible)
- UI services handle browser-specific functionality (blob URLs, progress callbacks)
- Clean separation enables easier testing and future extraction