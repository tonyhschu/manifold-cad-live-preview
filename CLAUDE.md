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
- `npm run test`: Run tests

## Important Files

- `src/state/store.ts`: Central state store
- `src/components/index.ts`: Component registration
- `src/main.ts`: Application entry point