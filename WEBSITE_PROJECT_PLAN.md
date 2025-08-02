# ManifoldCAD Website Project Plan

## Overview

Building a unified website with documentation and gallery using Astro/Starlight for the ManifoldCAD project. The site will feature:

- Homepage and documentation (Astro/Starlight)
- User-submitted project gallery with security controls
- Search functionality across docs and gallery (Pagefind)
- Single deployment to CloudFlare Pages

## Phase 1: Foundation - Astro/Starlight Setup

### 1.1 Initialize Project Structure

```bash
# Create new Astro project with Starlight
npm create astro@latest manifold-cad-website -- --template starlight

# Project structure
manifold-cad-website/
├── src/
│   ├── content/
│   │   ├── docs/              # Documentation markdown files
│   │   └── config.ts          # Content collections config
│   ├── pages/
│   │   ├── index.astro        # Custom homepage
│   │   └── gallery/           # Gallery routes (Phase 4)
│   ├── components/
│   └── layouts/
├── public/                    # Static assets
├── gallery-projects/          # User project submissions
├── gallery-output/           # Built gallery projects
├── build-scripts/            # Gallery build tools
├── astro.config.mjs
├── package.json
└── README.md
```

### 1.2 Configure Astro/Starlight

**File: `astro.config.mjs`**

```javascript
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "ManifoldCAD",
      logo: {
        src: "./src/assets/logo.svg",
      },
      social: {
        github: "https://github.com/tonyhschu/manifold-cad-live-preview",
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Installation", link: "/docs/installation/" },
            { label: "Quick Start", link: "/docs/quick-start/" },
            { label: "Basic Concepts", link: "/docs/concepts/" },
          ],
        },
        {
          label: "API Reference",
          autogenerate: { directory: "api" },
        },
        {
          label: "Gallery",
          link: "/gallery/",
        },
      ],
    }),
  ],
});
```

### 1.3 Create Initial Content Structure

**Documentation pages to create:**

- `/src/content/docs/installation.md`
- `/src/content/docs/quick-start.md`
- `/src/content/docs/concepts.md`
- `/src/content/docs/api/` (auto-generated from TypeScript)

### 1.4 Custom Homepage

**File: `src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="ManifoldCAD - Guaranteed Manifold Meshes">
  <main>
    <section class="hero">
      <h1>ManifoldCAD</h1>
      <p>The geometry library for reliable manifold triangle meshes</p>
      <div class="cta-group">
        <a href="/docs/installation/" class="cta-primary">Get Started</a>
        <a href="/gallery/" class="cta-secondary">View Gallery</a>
      </div>
    </section>

    <section class="features">
      <div class="feature">
        <h3>🔒 Guaranteed Manifold</h3>
        <p>No caveats, no edge cases - always produces valid manifold output</p>
      </div>
      <div class="feature">
        <h3>⚡ High Performance</h3>
        <p>WASM-based with extensive parallelization support</p>
      </div>
      <div class="feature">
        <h3>🎨 Rich Properties</h3>
        <p>Support for vertex properties, materials, and smooth interpolation</p>
      </div>
    </section>
  </main>
</Layout>
```

**Deliverables:**

- [ ] Working Astro/Starlight site
- [ ] Basic documentation structure
- [ ] Custom homepage
- [ ] Deployed to CloudFlare Pages (basic version)

---

## Phase 2: Individual Project Build System

### 2.1 Define Manifold Studio Project Structure

**Standard project template:**

```
project-name/
├── package.json              # With required scripts and metadata
├── manifest.yml             # Project metadata for gallery
├── src/
│   ├── index.ts            # Main entry point
│   ├── types/              # Type definitions
│   └── assets/             # Static assets
├── public/                 # Public assets for build output
├── tsconfig.json
├── vite.config.js          # Build configuration
└── README.md
```

### 2.2 Create Project Template/Scaffold

**File: `templates/manifold-project/package.json`**

```json
{
  "name": "manifold-project-template",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "ui-build": "npm run build"
  },
  "dependencies": {
    "manifold-3d": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**File: `templates/manifold-project/manifest.yml`**

```yaml
name: "Project Name"
description: "Brief description of the project"
author: "Author Name"
tags: ["3d", "modeling", "manifold"]
created: "2024-07-31"
featured: false
dependencies:
  manifold-3d: "^2.0.0"
  # Only allowed dependencies from allowlist
```

### 2.3 Project Validation Script

**File: `build-scripts/validate-project.js`**

```javascript
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

class ProjectValidator {
  validateStructure(projectPath) {
    const required = ["package.json", "manifest.yml", "src/index.ts"];
    for (const file of required) {
      if (!fs.existsSync(path.join(projectPath, file))) {
        throw new Error(`Missing required file: ${file}`);
      }
    }
  }

  validateManifest(projectPath) {
    const manifestPath = path.join(projectPath, "manifest.yml");
    const manifest = yaml.load(fs.readFileSync(manifestPath, "utf8"));

    const required = ["name", "description", "author"];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required manifest field: ${field}`);
      }
    }

    return manifest;
  }

  validateBuildScript(projectPath) {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectPath, "package.json"), "utf8")
    );

    if (!pkg.scripts || !pkg.scripts["ui-build"]) {
      throw new Error('Project must include "ui-build" script in package.json');
    }
  }
}
```

### 2.4 Individual Project Builder

**File: `build-scripts/build-single-project.js`**

```javascript
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class SingleProjectBuilder {
  constructor(allowedDepsPath) {
    this.validator = new ProjectValidator();
    this.allowedDeps = JSON.parse(fs.readFileSync(allowedDepsPath, "utf8"));
  }

  buildProject(projectPath, outputDir) {
    console.log(`🔨 Building ${path.basename(projectPath)}...`);

    // Validate project structure and dependencies
    this.validator.validateStructure(projectPath);
    this.validator.validateBuildScript(projectPath);
    const manifest = this.validator.validateManifest(projectPath);

    // Validate dependencies against allowlist
    this.validateDependencies(path.join(projectPath, "package.json"));

    const tempDir = `/tmp/manifold-build-${Date.now()}`;

    try {
      // Copy to temp directory
      execSync(`cp -r "${projectPath}" "${tempDir}"`);

      // Install dependencies
      execSync("npm ci", { cwd: tempDir, timeout: 300000 });

      // Run ui-build
      execSync("npm run ui-build", { cwd: tempDir, timeout: 300000 });

      // Find and copy output
      const distDir = path.join(tempDir, "dist");
      if (!fs.existsSync(distDir)) {
        throw new Error("ui-build did not produce dist/ directory");
      }

      // Copy to final output location
      const finalOutput = path.join(outputDir, path.basename(projectPath));
      fs.mkdirSync(finalOutput, { recursive: true });
      execSync(`cp -r "${distDir}"/* "${finalOutput}"/`);

      // Add manifest to output
      fs.writeFileSync(
        path.join(finalOutput, "manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`✅ Built ${path.basename(projectPath)}`);
      return { success: true, manifest };
    } finally {
      execSync(`rm -rf "${tempDir}"`);
    }
  }
}
```

**Deliverables:**

- [ ] Project template/scaffold
- [ ] Project validation system
- [ ] Individual project builder
- [ ] CLI tool for building single projects
- [ ] Documentation for project structure

---

## Phase 3: Gallery Build System + Pagefind Integration

### 3.1 Enhanced Gallery Builder (Building on existing artifact)

**Update existing `build-gallery.js` to include:**

```javascript
class GalleryBuilder {
  // ... existing code ...

  async generateSearchableContent() {
    // Generate content for Pagefind to index
    const projects = JSON.parse(
      fs.readFileSync(path.join(this.outputDir, "gallery-index.json"), "utf8")
    );

    for (const project of projects.projects) {
      const manifest = JSON.parse(
        fs.readFileSync(
          path.join(this.outputDir, project.name, "manifest.json"),
          "utf8"
        )
      );

      // Create searchable page for each project
      const searchablePage = `
        <html>
          <head>
            <title>${manifest.name} - ManifoldCAD Gallery</title>
            <meta name="description" content="${manifest.description}">
            <meta name="author" content="${manifest.author}">
            <meta name="tags" content="${manifest.tags?.join(", ") || ""}">
          </head>
          <body>
            <h1>${manifest.name}</h1>
            <p>${manifest.description}</p>
            <p>By: ${manifest.author}</p>
            <p>Tags: ${manifest.tags?.join(", ") || ""}</p>
          </body>
        </html>
      `;

      fs.writeFileSync(
        path.join(this.outputDir, project.name, "search.html"),
        searchablePage
      );
    }
  }

  async setupPagefind() {
    // Install and run Pagefind
    execSync("npm install -g pagefind", { stdio: "inherit" });

    // Index the gallery content
    execSync(
      `pagefind --source "${this.outputDir}" --bundle-dir "${this.outputDir}/pagefind"`,
      {
        stdio: "inherit",
      }
    );

    console.log("🔍 Generated search index with Pagefind");
  }
}
```

### 3.2 Gallery Search Integration

**File: `src/components/GallerySearch.astro`**

```astro
---
// Gallery search component using Pagefind
---

<div id="gallery-search">
  <input type="search" id="search" placeholder="Search gallery projects...">
  <div id="search-results"></div>
</div>

<script>
  import { PagefindUI } from "/pagefind/pagefind-ui.js";

  new PagefindUI({
    element: "#gallery-search",
    showSubResults: true,
    excerptLength: 30
  });
</script>

<style>
  #gallery-search {
    margin: 2rem 0;
  }

  #search {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
</style>
```

### 3.3 Allowed Dependencies Management

**File: `build-scripts/allowed-deps.json`**

```json
{
  "manifold-3d": {
    "versions": ["*"],
    "category": "core",
    "description": "Core ManifoldCAD library"
  },
  "three": {
    "versions": ["^0.150.0", "^0.151.0", "^0.152.0"],
    "category": "rendering",
    "description": "3D graphics library"
  },
  "dat.gui": {
    "versions": ["^0.7.9"],
    "category": "ui",
    "description": "Lightweight GUI library"
  },
  "lil-gui": {
    "versions": ["^0.18.0"],
    "category": "ui",
    "description": "Modern GUI library"
  },
  "gl-matrix": {
    "versions": ["^3.4.3"],
    "category": "math",
    "description": "Matrix and vector math library"
  },
  "cannon-es": {
    "versions": ["^0.20.0"],
    "category": "physics",
    "description": "Physics engine"
  }
}
```

### 3.4 Gallery CLI Tool

**File: `build-scripts/gallery-cli.js`**

```javascript
#!/usr/bin/env node

const { Command } = require("commander");
const GalleryBuilder = require("./build-gallery.js");

const program = new Command();

program
  .name("manifold-gallery")
  .description("ManifoldCAD Gallery build tools")
  .version("1.0.0");

program
  .command("build-all")
  .description("Build all gallery projects")
  .option("-p, --projects <dir>", "Projects directory", "./gallery-projects")
  .option("-o, --output <dir>", "Output directory", "./gallery-output")
  .option(
    "-d, --deps <file>",
    "Allowed dependencies file",
    "./build-scripts/allowed-deps.json"
  )
  .action(async (options) => {
    const builder = new GalleryBuilder(options.deps);
    builder.outputDir = options.output;
    await builder.buildAllProjects(options.projects);
    await builder.setupPagefind();
  });

program
  .command("validate-project <path>")
  .description("Validate a single project")
  .action((projectPath) => {
    // Validation logic
  });

program
  .command("add-dependency <name> <version>")
  .description("Add a new allowed dependency")
  .action((name, version) => {
    // Add dependency to allowlist
  });

program.parse();
```

**Deliverables:**

- [ ] Enhanced gallery builder with search support
- [ ] Pagefind integration
- [ ] Allowed dependencies management
- [ ] Gallery CLI tool
- [ ] Search component for Astro

---

## Phase 4: Astro Integration

### 4.1 Gallery Pages in Astro

**File: `src/pages/gallery/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import GallerySearch from '../../components/GallerySearch.astro';

// Load gallery data
const galleryData = await import('../../../gallery-output/gallery-index.json');
const projects = galleryData.projects || [];
---

<Layout title="ManifoldCAD Gallery">
  <main>
    <header>
      <h1>Project Gallery</h1>
      <p>Explore projects built with ManifoldCAD</p>
    </header>

    <GallerySearch />

    <section class="gallery-grid">
      {projects.map(project => (
        <article class="project-card">
          <a href={`/gallery/${project.name}/`}>
            <img src={`/gallery-static/${project.name}/thumbnail.png`} alt={project.name} />
            <h3>{project.name}</h3>
            <p>{project.description}</p>
          </a>
        </article>
      ))}
    </section>
  </main>
</Layout>
```

**File: `src/pages/gallery/[...slug].astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const galleryData = await import('../../../gallery-output/gallery-index.json');

  return galleryData.projects.map(project => ({
    params: { slug: project.name },
    props: { project }
  }));
}

const { project } = Astro.props;
const manifest = await import(`../../../gallery-output/${project.name}/manifest.json`);
---

<Layout title={`${manifest.name} - Gallery`}>
  <main>
    <header>
      <h1>{manifest.name}</h1>
      <p>By {manifest.author}</p>
      <p>{manifest.description}</p>
    </header>

    <div class="project-container">
      <iframe
        src={`/gallery-static/${project.name}/`}
        title={manifest.name}
        width="100%"
        height="600px"
        frameborder="0">
      </iframe>
    </div>

    <div class="project-meta">
      <h3>Tags</h3>
      <div class="tags">
        {manifest.tags?.map(tag => (
          <span class="tag">{tag}</span>
        ))}
      </div>
    </div>
  </main>
</Layout>
```

### 4.2 Astro Integration Plugin

**File: `integrations/gallery-integration.js`**

```javascript
import { execSync } from "child_process";
import fs from "fs";

export default function galleryIntegration() {
  return {
    name: "gallery-integration",
    hooks: {
      "astro:build:start": async () => {
        console.log("🔨 Building gallery projects...");

        // Run gallery builder
        execSync("node build-scripts/gallery-cli.js build-all", {
          stdio: "inherit",
        });

        // Copy gallery output to public directory
        if (fs.existsSync("./gallery-output")) {
          execSync("cp -r ./gallery-output ./public/gallery-static");
        }
      },
    },
  };
}
```

**Update `astro.config.mjs`:**

```javascript
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import galleryIntegration from "./integrations/gallery-integration.js";

export default defineConfig({
  integrations: [
    starlight({
      // ... existing config
    }),
    galleryIntegration(),
  ],
});
```

### 4.3 CloudFlare Pages Configuration

**File: `wrangler.toml`**

```toml
name = "manifold-cad-website"
compatibility_date = "2024-07-31"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[[redirects]]
from = "/gallery-static/*"
to = "/gallery-static/:splat"
status = 200
```

**Update `package.json`:**

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "build:gallery": "node build-scripts/gallery-cli.js build-all",
    "build:full": "npm run build:gallery && npm run build"
  }
}
```

### 4.4 GitHub Actions Workflow

**File: `.github/workflows/deploy.yml`**

```yaml
name: Build and Deploy to CloudFlare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build gallery
        run: npm run build:gallery

      - name: Build website
        run: npm run build

      - name: Deploy to CloudFlare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: manifold-cad-website
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Deliverables:**

- [ ] Gallery pages in Astro
- [ ] Dynamic project pages
- [ ] Astro integration plugin
- [ ] CloudFlare Pages deployment
- [ ] GitHub Actions workflow
- [ ] Complete website with docs + gallery

---

## Implementation Timeline

### Week 1: Foundation

- Set up Astro/Starlight project
- Create basic documentation structure
- Deploy initial version to CloudFlare Pages

### Week 2: Project System

- Create project template and validation
- Build individual project builder
- Test with sample projects

### Week 3: Gallery System

- Implement enhanced gallery builder
- Add Pagefind search integration
- Create allowed dependencies system

### Week 4: Integration & Polish

- Integrate gallery with Astro
- Set up automated deployment
- Test end-to-end workflow
- Documentation and launch

## Success Metrics

- [ ] Documentation site live and accessible
- [ ] Gallery accepts and builds user projects
- [ ] Search functionality works across docs and gallery
- [ ] Automated build and deploy pipeline
- [ ] Security: Only allowed dependencies can be used
- [ ] Performance: Site loads quickly, builds complete in <5 minutes

## Dependencies & Prerequisites

**Tools needed:**

- Node.js 18+
- npm/yarn
- Git
- CloudFlare account with Pages enabled

**External dependencies:**

- Astro + Starlight
- Pagefind for search
- CloudFlare Pages for hosting
- GitHub Actions for CI/CD

**Project dependencies:**

- Your existing ManifoldCAD gallery builder (enhanced)
- TypeScript project template
- Allowed dependencies allowlist
