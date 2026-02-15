#!/usr/bin/env node

import { Command } from 'commander';
import { devCommand } from './commands/dev.js';

const program = new Command();

program
  .name('manifold-studio')
  .description('Manifold Studio development server')
  .version('1.0.0');

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Server port', '4000')
  .option('--configurator-dev-mode', 'Enable configurator source-based development')
  .option('--verbose', 'Enable verbose logging')
  .action(devCommand);

program.parse();
