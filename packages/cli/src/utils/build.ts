import { execSync } from 'child_process';
import chalk from 'chalk';
import { getErrorMessage } from './errors.js';

export interface BuildOptions {
  verbose?: boolean;
}

export async function buildProject(buildCommand: string, options: BuildOptions = {}): Promise<void> {
  const projectRoot = process.cwd();
  const { verbose } = options;

  if (verbose) {
    console.log(chalk.gray(`Working directory: ${projectRoot}`));
    console.log(chalk.gray(`Build command: ${buildCommand}`));
    console.log(chalk.gray(`Environment: NODE_ENV=production`));
  }

  try {
    execSync(buildCommand, {
      cwd: projectRoot,
      stdio: verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });
  } catch (error) {
    throw new Error(`Build failed: ${getErrorMessage(error)}`);
  }
}