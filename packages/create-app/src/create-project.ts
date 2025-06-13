import { TemplateProcessor, TemplateContext } from './template-processor';
import { runCommand, getPackageManager } from './utils';
import path from 'path';

export interface CreateProjectOptions {
  template: string;
  install: boolean;
  description?: string;
  author?: string;
}

export async function createProject(
  projectName: string, 
  options: CreateProjectOptions
): Promise<void> {
  const { template, install, description, author } = options;
  
  console.log(`Creating project "${projectName}" with template "${template}"...`);
  
  // Create template processor
  const processor = new TemplateProcessor();
  
  // Create template context
  const context: TemplateContext = TemplateProcessor.createContext(projectName, {
    description,
    author
  });
  
  // Get target directory (relative to current working directory)
  const targetDir = path.resolve(process.cwd(), projectName);
  
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
