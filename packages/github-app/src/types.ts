import type { components } from '@octokit/openapi-types';

export type Repository = components['schemas']['repository'];
export type PullRequest = components['schemas']['pull-request'];
export type Issue = components['schemas']['issue'];
export type Installation = components['schemas']['installation'];
export type User = components['schemas']['simple-user'];

export interface DeploymentConfig {
  appName: string;
  stackName: string;
  environment: 'preview' | 'production' | 'staging';
  framework: 'nextjs' | 'sveltekit' | 'react-router';
  awsRegion?: string;
  domains?: string[];
}

export interface DeploymentResult {
  url: string;
  environment: string;
  deploymentId: number;
  checkRunId?: number;
  logUrl?: string;
  duration?: number;
}

export interface BuildResult {
  success: boolean;
  duration: number;
  logs?: string;
  error?: string;
}

export interface NucelDeploymentPayload {
  deployment: DeploymentConfig;
  repository: {
    owner: string;
    name: string;
    branch: string;
    commit: string;
  };
  pullRequest?: {
    number: number;
    headRef: string;
    baseRef: string;
  };
}