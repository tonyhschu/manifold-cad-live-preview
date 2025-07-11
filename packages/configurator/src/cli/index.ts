#!/usr/bin/env node

import { Command } from 'commander';
import { devCommand } from './commands/dev.js';

const program = new Command();

program
  .name('manifold-dev')
  .description('Manifold Studio development server')
  .version('1.0.0');

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'UI server port', '3000')
  .option('--pipeline-port <port>', 'Pipeline server port', '3001')
  .option('--verbose', 'Enable verbose logging')
  .action(devCommand);

program.parse();
