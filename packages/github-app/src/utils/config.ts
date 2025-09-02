import { z } from 'zod';

const envSchema = z.object({
  GITHUB_APP_ID: z.string(),
  GITHUB_APP_PRIVATE_KEY: z.string(),
  GITHUB_WEBHOOK_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  NUCEL_DOMAIN: z.string().default('nucel.cloud'),
  AWS_REGION: z.string().default('us-east-1'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadEnvConfig(): EnvConfig {
  return envSchema.parse(process.env);
}

export function getDeploymentUrl(options: {
  repository: string;
  environment: string;
  domain?: string;
}): string {
  const domain = options.domain || process.env.NUCEL_DOMAIN || 'nucel.cloud';
  const { repository, environment } = options;
  
  if (environment === 'production') {
    return `https://${repository}.${domain}`;
  }
  
  if (environment.startsWith('preview-pr-')) {
    const prNumber = environment.replace('preview-pr-', '');
    return `https://pr-${prNumber}-${repository}.${domain}`;
  }
  
  return `https://${environment}-${repository}.${domain}`;
}

export function getLogUrl(options: {
  owner: string;
  repository: string;
  commit: string;
  domain?: string;
}): string {
  const domain = options.domain || process.env.NUCEL_DOMAIN || 'nucel.cloud';
  return `https://logs.${domain}/${options.owner}/${options.repository}/${options.commit}`;
}

export function parseDeployCommand(command: string): {
  environment: 'production' | 'staging' | 'preview';
  stack?: string;
} {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('production') || lowerCommand.includes('prod')) {
    return { environment: 'production', stack: 'production' };
  }
  
  if (lowerCommand.includes('staging') || lowerCommand.includes('stage')) {
    return { environment: 'staging', stack: 'staging' };
  }
  
  const stackMatch = lowerCommand.match(/--stack[= ](\S+)/);
  const stack = stackMatch ? stackMatch[1] : 'dev';
  
  return { environment: 'preview', stack };
}