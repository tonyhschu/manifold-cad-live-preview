# ManifoldCAD Module Publishing Plan

This document outlines the plan for packaging the ManifoldCAD preview UI environment as both an NPM module and a templating system. The goal is to enable downstream users to easily create model scripts using our singleton pattern and to bootstrap new projects with all the preview UI components.

## Overview

We will create two separate packages:

1. **Core Library (`manifold-wrapper`)**: A lightweight synchronous API wrapper for ManifoldCAD
2. **Project Template (`create-manifold-script`)**: A templating system for bootstrapping projects with the preview UI

This separation of concerns will allow users to:

- Use just the core modeling functionality without the UI components
- Quickly set up new projects with the full preview UI
- Extend and customize both components independently

## 1. NPM Module (`manifold-wrapper`)

### 1.1 Package Structure

```
manifold-wrapper/
├── dist/               # Compiled TypeScript output
├── src/
│   ├── index.ts        # Main export file
│   ├── lib/
│   │   ├── manifold.ts  # Singleton implementation
│   │   ├── export.ts    # Export utilities
│   │   └── gltf-export.ts # GLB export functionality
│   └── types/          # Type definitions
├── package.json
├── tsconfig.json
└── README.md
```

### 1.2 Key Features

- **Synchronous API**: Maintains the top-level await pattern for WASM initialization
- **Clean API Surface**: Exports core functions (cube, sphere, etc.) and factory pattern
- **Type Safety**: Complete TypeScript definitions
- **Export Utilities**: OBJ and GLB export functionality
- **Minimal Dependencies**: Only the essential dependencies

### 1.3 Implementation Steps

1. **Extract Core Functionality**:

   - Copy the essential files from the current project (`manifold.ts`, `export.ts`, etc.)
   - Remove UI-specific code
   - Create a clean index.ts that exports the public API

2. **Configure Build System**:

   - Set up TypeScript configuration
   - Configure build scripts for ES modules
   - Set up declaration file generation

3. **Create Documentation**:

   - Add JSDoc comments to all exported functions
   - Create a comprehensive README
   - Include basic usage examples

4. **Prepare for Publishing**:
   - Set up package.json with appropriate metadata
   - Configure npm scripts for build, test, and publish
   - Set up CI/CD for testing and publishing

### 1.4 Package.json Configuration

```json
{
  "name": "manifold-wrapper",
  "version": "0.1.0",
  "description": "A synchronous wrapper for ManifoldCAD with a clean API",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "manifold-3d": "^3.1.0"
  },
  "peerDependencies": {
    "@gltf-transform/core": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^0.34.0"
  }
}
```

## 2. Templating System (`create-manifold-script`)

### 2.1 Package Structure

```
create-manifold-script/
├── bin/
│   └── index.js        # CLI entry point
├── template/
│   ├── base/           # Base template files
│   │   ├── src/
│   │   │   ├── core/   # Core UI components
│   │   │   ├── models/ # Example models
│   │   │   └── main.ts # Main entry point
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   └── variants/       # Template variants (minimal, full)
├── src/
│   └── index.ts        # Template generation logic
├── package.json
└── README.md
```

### 2.2 Key Features

- **Interactive CLI**: Prompts for project name, description, template options
- **Multiple Templates**: Minimal and full-featured variants
- **Developer Experience**: Preconfigured HMR, TypeScript, and Vite
- **Documentation**: Getting started guides and examples
- **Customization**: Clear points of extension

### 2.3 Implementation Steps

1. **Create Template Files**:

   - Extract UI components from the current project
   - Organize into base and variant templates
   - Create example models

2. **Build CLI Tool**:

   - Implement interactive CLI with commander and inquirer
   - Create template generation logic
   - Add options for customization

3. **Configure Template Settings**:

   - Set up package.json templates with correct dependencies
   - Configure TypeScript and Vite for optimal experience
   - Set up HMR for development

4. **Create Documentation**:
   - Write getting started guide
   - Document customization options
   - Include examples of extending the template

### 2.4 CLI Implementation

The CLI will provide an interactive experience for creating new projects:

```javascript
#!/usr/bin/env node
const { program } = require("commander");
const inquirer = require("inquirer");
const { createProject } = require("../dist/index.js");

program
  .name("create-manifold-script")
  .description("Create a new ManifoldCAD script project with UI preview")
  .version("0.1.0");

program
  .argument("[project-dir]", "Directory to create the project in")
  .option("--template <template>", "Template to use (minimal, full)", "full")
  .option("--skip-install", "Skip npm install after project creation")
  .action(async (projectDir, options) => {
    // Interactive prompt logic
    // ...

    // Project creation
    await createProject(projectDir, projectOptions);
  });

program.parse();
```

### 2.5 Template Variants

1. **Minimal Template**:

   - Basic Vite configuration
   - Essential UI components
   - Single example model
   - Minimal dependencies

2. **Full Template**:
   - Complete UI preview system
   - Model selection UI
   - Multiple example models
   - Export functionality
   - HMR configuration

## 3. Publishing Strategy

### 3.1 NPM Module Publishing

1. **Initial Release**:

   - Publish version 0.1.0 to npm
   - Create detailed release notes
   - Set up semantic versioning strategy

2. **Documentation**:

   - Create API documentation
   - Publish examples and tutorials
   - Set up GitHub repository with contribution guidelines

3. **Versioning Strategy**:
   - Align with manifold-3d version for major releases
   - Use semantic versioning for API changes
   - Maintain a changelog

### 3.2 Template Project Publishing

1. **Initial Release**:

   - Publish CLI tool to npm
   - Create demo videos or GIFs for README
   - Set up GitHub repository with examples

2. **Maintenance Strategy**:

   - Regular updates for template dependencies
   - Add new template variants based on feedback
   - Improve developer experience based on user feedback

3. **Versioning Strategy**:
   - Independent versioning from core library
   - Track compatibility with core library versions
   - Provide migration guides for major updates

## 4. Ecosystem Growth

### 4.1 Model Sharing Standard

Define a standard format for shared models:

```
manifold-model-[name]/
├── src/
│   └── index.ts        # Exports the model creation function
├── package.json        # Lists manifold-wrapper as peer dependency
└── README.md           # Documents parameters, usage
```

### 4.2 Component Libraries

Encourage the development of component libraries:

```
manifold-components-[domain]/
├── src/
│   ├── index.ts        # Exports all components
│   └── components/     # Individual components
├── package.json
└── README.md
```
