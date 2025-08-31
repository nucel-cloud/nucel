import chalk from 'chalk';

export class NucelError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NucelError';
  }
}

export function handleError(error: unknown): never {
  if (error instanceof NucelError) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.code) {
      console.error(chalk.gray(`Code: ${error.code}`));
    }
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }

  console.error(chalk.red(`Unknown error: ${String(error)}`));
  process.exit(1);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}