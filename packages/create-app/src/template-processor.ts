import Handlebars from 'handlebars';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TemplateContext {
  projectName: string;
  projectNameCamelCase: string;
  projectNamePascalCase: string;
  description?: string;
  author?: string;
}

export class TemplateProcessor {
  private templatesDir: string;

  constructor() {
    // Templates are in the templates directory relative to the package root
    this.templatesDir = path.resolve(__dirname, '..', 'templates');
  }

  /**
   * Process a template directory and create project files
   */
  async processTemplate(
    templateName: string, 
    targetDir: string, 
    context: TemplateContext
  ): Promise<void> {
    const templateDir = path.join(this.templatesDir, templateName);
    
    if (!this.directoryExists(templateDir)) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Create target directory
    mkdirSync(targetDir, { recursive: true });

    // Process all files in template directory
    await this.processDirectory(templateDir, targetDir, context);
  }

  /**
   * Recursively process a directory
   */
  private async processDirectory(
    sourceDir: string, 
    targetDir: string, 
    context: TemplateContext
  ): Promise<void> {
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
  private async processFile(
    sourcePath: string, 
    targetPath: string, 
    context: TemplateContext
  ): Promise<void> {
    const content = readFileSync(sourcePath, 'utf8');
    
    // Check if file should be processed with Handlebars (has .hbs extension)
    if (sourcePath.endsWith('.hbs')) {
      const template = Handlebars.compile(content);
      const processedContent = template(context);
      
      // Remove .hbs extension from target path
      const finalTargetPath = targetPath.replace(/\.hbs$/, '');
      writeFileSync(finalTargetPath, processedContent, 'utf8');
    } else {
      // Copy file as-is
      writeFileSync(targetPath, content);
    }
  }

  /**
   * Create template context from project name
   */
  static createContext(projectName: string, options: {
    description?: string;
    author?: string;
  } = {}): TemplateContext {
    return {
      projectName,
      projectNameCamelCase: this.toCamelCase(projectName),
      projectNamePascalCase: this.toPascalCase(projectName),
      description: options.description || `A Manifold Studio project`,
      author: options.author || 'Your Name'
    };
  }

  /**
   * Convert kebab-case to camelCase
   */
  private static toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert kebab-case to PascalCase
   */
  private static toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * Check if directory exists
   */
  private directoryExists(dir: string): boolean {
    try {
      return statSync(dir).isDirectory();
    } catch {
      return false;
    }
  }
}
