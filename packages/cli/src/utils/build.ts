import { execSync } from 'child_process';
import chalk from 'chalk';
import { getErrorMessage } from './errors.js';

export async function buildProject(buildCommand: string): Promise<void> {
  const projectRoot = process.cwd();

  console.log(chalk.gray(`Running: ${buildCommand}`));

  try {
    execSync(buildCommand, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });
  } catch (error) {
    throw new Error(`Build failed: ${getErrorMessage(error)}`);
  }
}