# ManifoldCAD Preview Environment - Implementation To-Do List

## Phase 1: Basic Separation of Concerns ✅

1. **Create Basic Structure** ✅
   - [x] Create architecture plan
   - [x] Create models directory
   - [x] Create core directory for preview functionality

2. **Move Modeling Logic** ✅
   - [x] Extract core modeling logic from `main.ts` to `models/index.ts`
   - [x] Ensure it returns a Manifold object (or Promise<Manifold>)
   - [x] Test that the extracted module works independently

3. **Refactor Main.ts** ✅
   - [x] Update `main.ts` to import the model from `models/index.ts`
   - [x] Create basic preview handlers in `main.ts`
   - [x] Ensure existing functionality still works

4. **Create Preview Framework** ✅
   - [x] Extract UI code from `main.ts` to `core/preview.ts`
   - [x] Create a simple model loader function
   - [x] Setup viewer initialization in separate file

## Phase 2: Enhance Model System ✅

1. **Improve Model Module Contract** ✅
   - [x] Define clear interface for model modules
   - [x] Add metadata support (name, description)
   - [x] Support for reusable components

2. **Add Multiple Model Examples** ✅
   - [x] Convert existing demo to new format
   - [x] Create a few additional example models
   - [x] Test importing between model files

## Phase 3: Hot Reload Integration (Future)

1. **Research Vite HMR Integration**
   - [ ] Understand Vite's HMR API
   - [ ] Identify how to hook into file changes

2. **Implement Basic Hot Reload**
   - [ ] Create HMR handlers for model files
   - [ ] Test reloading with simple model changes
   - [ ] Ensure renderer updates appropriately

3. **Enhance Hot Reload Experience**
   - [ ] Preserve camera position on reload
   - [ ] Add status indicators for reload
   - [ ] Handle errors gracefully

## Completed Features

- ✅ Separation of modeling code from preview code
- ✅ Model selection dropdown
- ✅ Reusable component library
- ✅ Multiple example models
- ✅ Support for metadata

## Next Steps

1. **Documentation**
   - [ ] Create a user guide for creating models
   - [ ] Document the component system
   - [ ] Add comments to core files

2. **Implement Vite HMR Integration**
   - [ ] Research and implement basic hot reloading
   - [ ] Enhance the developer experience