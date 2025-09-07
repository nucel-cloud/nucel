import { App, createNodeMiddleware } from 'octokit';
import type { App as AppType } from 'octokit';
import type { EmitterWebhookEventName } from '@octokit/webhooks';
import { z } from 'zod';
import sodium from 'libsodium-wrappers';

export * from './types.js';
export * from './handlers/index.js';
export * from './utils/index.js';

const configSchema = z.object({
  appId: z.string(),
  privateKey: z.string(),
  webhookSecret: z.string(),
  oauth: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
  }).optional(),
});

export type GitHubAppConfig = z.infer<typeof configSchema>;

export class NucelGitHubApp {
  private app: AppType;
  private config: GitHubAppConfig;

  constructor(config: GitHubAppConfig) {
    this.config = configSchema.parse(config);
    
    const privateKey = this.config.privateKey.replace(/\\n/g, '\n');
    
    this.app = new App({
      appId: this.config.appId,
      privateKey: privateKey,
      webhooks: {
        secret: this.config.webhookSecret,
      },
      oauth: this.config.oauth,
    });
  }

  /**
   * Get the underlying Octokit App instance
   */
  getApp(): AppType {
    return this.app;
  }

  /**
   * Get an authenticated Octokit instance for a specific installation
   */
  async getInstallationOctokit(installationId: number) {
    return this.app.getInstallationOctokit(installationId);
  }

  /**
   * Register a webhook event handler - passthrough to app.webhooks.on
   */
  get on() {
    return this.app.webhooks.on.bind(this.app.webhooks);
  }

  /**
   * Create middleware for handling webhooks and OAuth
   */
  createMiddleware() {
    return createNodeMiddleware(this.app);
  }

  /**
   * Verify and receive a webhook event (for serverless environments)
   */
  async verifyAndReceive(options: {
    id: string;
    name: string;
    signature: string;
    payload: string | Record<string, any>;
  }) {
    return this.app.webhooks.verifyAndReceive({
      id: options.id,
      name: options.name as EmitterWebhookEventName,
      signature: options.signature,
      payload: typeof options.payload === 'string' ? options.payload : JSON.stringify(options.payload),
    });
  }

  /**
   * Iterate through all installations
   */
  async *eachInstallation() {
    for await (const { octokit, installation } of this.app.eachInstallation.iterator()) {
      yield { octokit, installation };
    }
  }

  /**
   * Iterate through all repositories
   */
  async *eachRepository() {
    for await (const { octokit, repository } of this.app.eachRepository.iterator()) {
      yield { octokit, repository };
    }
  }

  /**
   * Create a deployment
   */
  async createDeployment(options: {
    installationId: number;
    owner: string;
    repo: string;
    ref: string;
    environment?: string;
    description?: string;
    task?: string;
    autoMerge?: boolean;
    requiredContexts?: string[];
    payload?: Record<string, any>;
    transientEnvironment?: boolean;
    productionEnvironment?: boolean;
  }) {
    const octokit = await this.getInstallationOctokit(options.installationId);
    
    return octokit.rest.repos.createDeployment({
      owner: options.owner,
      repo: options.repo,
      ref: options.ref,
      environment: options.environment || 'production',
      description: options.description,
      task: options.task || 'deploy',
      auto_merge: options.autoMerge ?? false,
      required_contexts: options.requiredContexts ?? [],
      payload: options.payload || {},
      transient_environment: options.transientEnvironment ?? false,
      production_environment: options.productionEnvironment ?? true,
    });
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(options: {
    installationId: number;
    owner: string;
    repo: string;
    deploymentId: number;
    state: 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued' | 'pending' | 'success';
    targetUrl?: string;
    logUrl?: string;
    description?: string;
    environment?: string;
    environmentUrl?: string;
    autoInactive?: boolean;
  }) {
    const octokit = await this.getInstallationOctokit(options.installationId);
    
    return octokit.rest.repos.createDeploymentStatus({
      owner: options.owner,
      repo: options.repo,
      deployment_id: options.deploymentId,
      state: options.state,
      target_url: options.targetUrl,
      log_url: options.logUrl,
      description: options.description,
      environment: options.environment,
      environment_url: options.environmentUrl,
      auto_inactive: options.autoInactive,
    });
  }

  /**
   * Create or update repository secrets
   */
  async createOrUpdateRepoSecrets(options: {
    installationId: number;
    owner: string;
    repo: string;
    secrets: Record<string, string>;
  }) {
    const octokit = await this.getInstallationOctokit(options.installationId);
    
    // Initialize libsodium
    await sodium.ready;
    
    // Get repository public key for secret encryption
    const { data: publicKey } = await octokit.rest.actions.getRepoPublicKey({
      owner: options.owner,
      repo: options.repo,
    });
    
    // Encrypt and create each secret
    const results = [];
    for (const [name, value] of Object.entries(options.secrets)) {
      // Convert the secret and key to Uint8Array
      const messageBytes = sodium.from_string(value);
      const keyBytes = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
      
      // Encrypt using libsodium
      const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
      
      // Convert to base64
      const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
      
      const result = await octokit.rest.actions.createOrUpdateRepoSecret({
        owner: options.owner,
        repo: options.repo,
        secret_name: name,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });
      
      results.push({ name, status: result.status });
    }
    
    return results;
  }

  /**
   * Create or update workflow file
   */
  async createOrUpdateWorkflowFile(options: {
    installationId: number;
    owner: string;
    repo: string;
    path: string;
    content: string;
    message: string;
  }) {
    const octokit = await this.getInstallationOctokit(options.installationId);
    
    // Try to get existing file first
    let existingSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: options.owner,
        repo: options.repo,
        path: options.path,
      });
      
      if ('sha' in existingFile) {
        existingSha = existingFile.sha;
      }
    } catch (error: any) {
      // File doesn't exist, which is fine
      if (error.status !== 404) {
        throw error;
      }
    }
    
    // Create or update the file
    const result = await octokit.rest.repos.createOrUpdateFileContents({
      owner: options.owner,
      repo: options.repo,
      path: options.path,
      message: options.message,
      content: Buffer.from(options.content).toString('base64'),
      sha: existingSha,
    });
    
    return result.data;
  }

  /**
   * Create a check run
   */
  async createCheckRun(options: {
    installationId: number;
    owner: string;
    repo: string;
    name: string;
    headSha: string;
    status?: 'queued' | 'in_progress' | 'completed';
    conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
    startedAt?: string;
    completedAt?: string;
    detailsUrl?: string;
    externalId?: string;
    output?: {
      title: string;
      summary: string;
      text?: string;
    };
  }) {
    const octokit = await this.getInstallationOctokit(options.installationId);
    
    return octokit.rest.checks.create({
      owner: options.owner,
      repo: options.repo,
      name: options.name,
      head_sha: options.headSha,
      status: options.status,
      conclusion: options.conclusion,
      started_at: options.startedAt,
      completed_at: options.completedAt,
      details_url: options.detailsUrl,
      external_id: options.externalId,
      output: options.output,
    });
  }

  /**
   * Update a check run
   */
  async updateCheckRun(options: {
    installationId: number;
    owner: string;
    repo: string;
    checkRunId: number;
    status?: 'queued' | 'in_progress' | 'completed';
    conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
    completedAt?: string;
    output?: {
      title: string;
      summary: string;
      text?: string;
    };
  }) {
    const octokit = await this.getInstallationOctokit(options.installationId);
    
    return octokit.rest.checks.update({
      owner: options.owner,
      repo: options.repo,
      check_run_id: options.checkRunId,
      status: options.status,
      conclusion: options.conclusion,
      completed_at: options.completedAt,
      output: options.output,
    });
  }
}