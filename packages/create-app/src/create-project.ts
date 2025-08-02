import { TemplateProcessor, TemplateContext } from './template-processor';
import { runCommand, getPackageManager } from './utils';
import path from 'path';
import { fileURLToPath } from 'url';
import { statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateProjectOptions {
  template: string;
  install: boolean;
  description?: string;
  author?: string;
  usePublished?: boolean;
}

function directoryExists(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export async function createProject(
  projectName: string,
  options: CreateProjectOptions
): Promise<void> {
  const { template, install, description, author } = options;

  console.log(`Creating project "${projectName}" with template "${template}"...`);

  // Create template processor
  const processor = new TemplateProcessor();

  // Get target directory (relative to current working directory)
  const targetDir = path.resolve(process.cwd(), projectName);

  // Calculate packages path relative to the target project directory
  const packagesAbsolutePath = path.resolve(__dirname, '..', '..');
  const packagesPath = path.relative(targetDir, packagesAbsolutePath);

  // Determine whether to use published packages
  // Auto-detect if we're running from a published package vs local development
  const isRunningFromPublishedPackage = !directoryExists(path.join(packagesAbsolutePath, 'configurator'));
  let finalUsePublished = options.usePublished ?? isRunningFromPublishedPackage;

  if (!finalUsePublished) {
    const localPackages = ['configurator', 'wrapper', 'typeface'];
    const allExist = localPackages.every((pkg) => directoryExists(path.join(packagesAbsolutePath, pkg)));
    if (!allExist) {
      console.log('ℹ️  Local packages not found. Falling back to published dependencies.');
      finalUsePublished = true;
    }
  }

  if (isRunningFromPublishedPackage && !options.usePublished) {
    console.log('ℹ️  Running from published package. Using published dependencies.');
  }

  // Create template context
  const context: TemplateContext = TemplateProcessor.createContext(projectName, {
    description,
    author,
    packagesPath: finalUsePublished ? undefined : packagesPath,
    usePublished: finalUsePublished,
  });

  try {
    // Process template
    console.log('📁 Creating project structure...');
    await processor.processTemplate(template, targetDir, context);

    // Install dependencies if requested
    if (install) {
      console.log('📦 Installing dependencies...');
      const packageManager = getPackageManager();
      runCommand(`${packageManager} install`, targetDir);
    }

    console.log('✨ Project created successfully!');

  } catch (error) {
    console.error('❌ Failed to create project:', error);
    throw error;
  }
}
