#!/usr/bin/env node

import { Command } from 'commander';
import { createProject } from './create-project';
import { validateProjectName } from './utils';

const program = new Command();

program
  .name('@manifold-studio/create-app')
  .description('Create a new Manifold Studio project')
  .version('0.3.0')
  .argument('<project-name>', 'name of the project to create')
  .option('-t, --template <template>', 'template to use (currently only "basic" is available)', 'basic')
  .option('--no-install', 'skip dependency installation')
  .option('--use-published', 'use published npm packages instead of local file: dependencies')
  .action(async (projectName: string, options: { template: string; install: boolean; usePublished: boolean }) => {
    try {
      // Validate project name
      const validation = validateProjectName(projectName);
      if (!validation.valid) {
        console.error(`Error: ${validation.error}`);
        process.exit(1);
      }

      // Create the project
      await createProject(projectName, {
        template: options.template,
        install: options.install,
        usePublished: options.usePublished,
      });

      console.log(`\n✅ Successfully created ${projectName}!`);
      console.log('\nNext steps:');
      console.log(`  cd ${projectName}`);
      if (!options.install) {
        console.log('  npm install');
      }
      console.log('  npm run dev');
      console.log('\nHappy modeling! 🎨');
    } catch (error) {
      console.error('Error creating project:', error);
      process.exit(1);
    }
  });

program.parse();
