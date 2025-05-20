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

## Phase 3: Hot Reload Integration ✅

1. **Research Vite HMR Integration** ✅
   - [x] Understand Vite's HMR API
   - [x] Identify how to hook into file changes

2. **Implement Basic Hot Reload** ✅
   - [x] Create HMR handlers for model files
   - [x] Test reloading with simple model changes
   - [x] Ensure renderer updates appropriately

3. **Enhance Hot Reload Experience** ✅
   - [x] Preserve camera position on reload (handled by model-viewer)
   - [x] Track current model between reloads
   - [x] Handle errors gracefully

## Documentation ✅

1. **Create Documentation** ✅
   - [x] Architecture plan (ARCHITECTURE_PLAN.md)
   - [x] User guide for creating models (MODEL_GUIDE.md)
   - [x] Component system documentation (COMPONENT_GUIDE.md)
   - [x] Add comprehensive comments to core files

## Completed Features

- ✅ Separation of modeling code from preview code
- ✅ Model selection dropdown
- ✅ Reusable component library with documentation
- ✅ Multiple example models
- ✅ Support for metadata
- ✅ Clean synchronous API using top-level await
- ✅ Hot Module Replacement for development
- ✅ Comprehensive documentation

## Future Enhancements

1. **Enhanced Component Library**
   - [ ] Add more component types
   - [ ] Create parametric component examples
   - [ ] Support for more complex geometries

2. **User Interface Improvements**
   - [ ] Add parameter controls for models
   - [ ] Live preview of parameter changes
   - [ ] Better error visualization

3. **Performance Optimization**
   - [ ] Optimize model generation for complex geometries
   - [ ] Implement mesh simplification for large models
   - [ ] Add caching for repeated operations