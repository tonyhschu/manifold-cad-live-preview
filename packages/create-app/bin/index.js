#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/template-processor.ts
import Handlebars from "handlebars";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var TemplateProcessor = class {
  templatesDir;
  constructor() {
    this.templatesDir = path.resolve(__dirname, "..", "templates");
  }
  /**
   * Process a template directory and create project files
   */
  async processTemplate(templateName, targetDir, context) {
    const templateDir = path.join(this.templatesDir, templateName);
    if (!this.directoryExists(templateDir)) {
      throw new Error(`Template "${templateName}" not found`);
    }
    mkdirSync(targetDir, { recursive: true });
    await this.processDirectory(templateDir, targetDir, context);
  }
  /**
   * Recursively process a directory
   */
  async processDirectory(sourceDir, targetDir, context) {
    const items = readdirSync(sourceDir);
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      const stat = statSync(sourcePath);
      if (stat.isDirectory()) {
        mkdirSync(targetPath, { recursive: true });
        await this.processDirectory(sourcePath, targetPath, context);
      } else {
        await this.processFile(sourcePath, targetPath, context);
      }
    }
  }
  /**
   * Process a single file
   */
  async processFile(sourcePath, targetPath, context) {
    const content = readFileSync(sourcePath, "utf8");
    if (sourcePath.endsWith(".hbs")) {
      const template = Handlebars.compile(content);
      const processedContent = template(context);
      const finalTargetPath = targetPath.replace(/\.hbs$/, "");
      writeFileSync(finalTargetPath, processedContent, "utf8");
    } else {
      writeFileSync(targetPath, content);
    }
  }
  /**
   * Create template context from project name
   */
  static createContext(projectName, options = {}) {
    return {
      projectName,
      projectNameCamelCase: this.toCamelCase(projectName),
      projectNamePascalCase: this.toPascalCase(projectName),
      description: options.description || `A Manifold Studio project`,
      author: options.author || "Your Name"
    };
  }
  /**
   * Convert kebab-case to camelCase
   */
  static toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  /**
   * Convert kebab-case to PascalCase
   */
  static toPascalCase(str) {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }
  /**
   * Check if directory exists
   */
  directoryExists(dir) {
    try {
      return statSync(dir).isDirectory();
    } catch {
      return false;
    }
  }
};

// src/utils.ts
import { execSync } from "child_process";
import { existsSync } from "fs";
function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Project name cannot be empty" };
  }
  const validNameRegex = /^[a-z0-9-_]+$/;
  if (!validNameRegex.test(name)) {
    return {
      valid: false,
      error: "Project name can only contain lowercase letters, numbers, hyphens, and underscores"
    };
  }
  if (existsSync(name)) {
    return {
      valid: false,
      error: `Directory "${name}" already exists`
    };
  }
  const reservedNames = ["node_modules", "package", "npm", "test", "src"];
  if (reservedNames.includes(name)) {
    return {
      valid: false,
      error: `"${name}" is a reserved name and cannot be used`
    };
  }
  return { valid: true };
}
function runCommand(command, cwd) {
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
      encoding: "utf8"
    });
  } catch (error) {
    throw new Error(`Failed to run command: ${command}`);
  }
}
function getPackageManager() {
  return "npm";
}

// src/create-project.ts
import path2 from "path";
async function createProject(projectName, options) {
  const { template, install, description, author } = options;
  console.log(`Creating project "${projectName}" with template "${template}"...`);
  const processor = new TemplateProcessor();
  const context = TemplateProcessor.createContext(projectName, {
    description,
    author
  });
  const targetDir = path2.resolve(process.cwd(), projectName);
  try {
    console.log("\u{1F4C1} Creating project structure...");
    await processor.processTemplate(template, targetDir, context);
    if (install) {
      console.log("\u{1F4E6} Installing dependencies...");
      const packageManager = getPackageManager();
      runCommand(`${packageManager} install`, targetDir);
    }
    console.log("\u2728 Project created successfully!");
  } catch (error) {
    console.error("\u274C Failed to create project:", error);
    throw error;
  }
}

// src/index.ts
var program = new Command();
program.name("@manifold-studio/create-app").description("Create a new Manifold Studio project").version("1.0.0").argument("<project-name>", "name of the project to create").option("-t, --template <template>", 'template to use (currently only "basic" is available)', "basic").option("--no-install", "skip dependency installation").action(async (projectName, options) => {
  try {
    const validation = validateProjectName(projectName);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      process.exit(1);
    }
    await createProject(projectName, {
      template: options.template,
      install: options.install
    });
    console.log(`
\u2705 Successfully created ${projectName}!`);
    console.log("\nNext steps:");
    console.log(`  cd ${projectName}`);
    if (!options.install) {
      console.log("  npm install");
    }
    console.log("  npm run dev");
    console.log("\nHappy modeling! \u{1F3A8}");
  } catch (error) {
    console.error("Error creating project:", error);
    process.exit(1);
  }
});
program.parse();
