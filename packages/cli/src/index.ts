#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { deploy } from './commands/deploy.js';
import { handleError } from './utils/errors.js';

const program = new Command();

program
  .name('nucel')
  .description('Deploy modern web apps to AWS')
  .version('0.1.0');

program
  .command('deploy')
  .description('Deploy your application')
  .option('-s, --stack <stack>', 'Stack name', 'dev')
  .option('--preview', 'Preview changes without deploying')
  .action(async (options) => {
    try {
      await deploy({
        stack: options.stack,
        destroy: false,
        preview: options.preview || false,
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('destroy')
  .description('Destroy your application infrastructure')
  .option('-s, --stack <stack>', 'Stack name', 'dev')
  .action(async (options) => {
    try {
      await deploy({
        stack: options.stack,
        destroy: true,
        preview: false,
      });
    } catch (error) {
      handleError(error);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}