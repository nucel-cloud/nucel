import { Hono } from 'hono';
import type { NucelGitHubApp } from '@nucel.cloud/github-app';
import { z } from 'zod';
import { PaginationHelper, PaginationCache } from '../utils/pagination.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  GitHubAPIError,
  asyncHandler 
} from '../middleware/error-handler.js';
import { rateLimits } from '../middleware/rate-limit.js';

const paginationCache = new PaginationCache();

// Validation schemas
const deploymentSchema = z.object({
  installationId: z.number(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  ref: z.string().min(1),
  environment: z.string().default('production'),
  description: z.string().optional(),
  task: z.string().default('deploy:api'),
  autoMerge: z.boolean().optional(),
  requiredContexts: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const deploymentStatusSchema = z.object({
  installationId: z.number(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  state: z.enum(['error', 'failure', 'inactive', 'in_progress', 'queued', 'pending', 'success']),
  targetUrl: z.string().url().optional(),
  logUrl: z.string().url().optional(),
  description: z.string().optional(),
  environment: z.string().optional(),
  environmentUrl: z.string().url().optional(),
});

const checkRunSchema = z.object({
  installationId: z.number(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  name: z.string().min(1),
  headSha: z.string().min(1),
  status: z.enum(['queued', 'in_progress', 'completed']).optional(),
  conclusion: z.enum(['success', 'failure', 'neutral', 'cancelled', 'skipped', 'timed_out', 'action_required']).optional(),
  detailsUrl: z.string().url().optional(),
  externalId: z.string().optional(),
  output: z.object({
    title: z.string(),
    summary: z.string(),
    text: z.string().optional(),
  }).optional(),
});

export function apiRoutes(githubApp: NucelGitHubApp) {
  const app = new Hono();

  // Get all installations with pagination
  app.get('/installations', rateLimits.read, asyncHandler(async (c) => {
    const pagination = PaginationHelper.parsePaginationParams(c);
    const cacheKey = paginationCache.generateKey('installations', pagination);
    
    // Check cache
    const cached = paginationCache.get(cacheKey);
    if (cached) {
      return c.json(cached);
    }

    const installations = [];
    const iterator = githubApp.eachInstallation();
    
    try {
      // Collect installations with limit
      let count = 0;
      const limit = pagination.limit || PaginationHelper.DEFAULT_LIMIT;
      const startIndex = pagination.cursor 
        ? 0 // Will filter by cursor later
        : ((pagination.page || 1) - 1) * limit;
        
      for await (const { installation } of iterator) {
        if (count >= startIndex + limit + 1) {
          break; // We have enough for this page + check for next
        }
        
        installations.push({
          id: installation.id,
          account: installation.account ? {
            login: installation.account.login,
            id: installation.account.id,
            type: installation.account.type,
            avatar_url: installation.account.avatar_url,
          } : null,
          created_at: installation.created_at,
          updated_at: installation.updated_at,
          app_id: installation.app_id,
          target_type: installation.target_type,
          permissions: installation.permissions,
          events: installation.events,
        });
        
        count++;
      }
      
      // Apply pagination
      const { items, hasMore } = PaginationHelper.applyPagination(
        installations,
        { ...pagination, limit: pagination.limit || PaginationHelper.DEFAULT_LIMIT }
      );
      
      const response = PaginationHelper.createPaginatedResponse(
        items,
        { ...pagination, total: hasMore ? undefined : installations.length },
        c.req.url
      );
      
      // Cache the response
      paginationCache.set(cacheKey, response);
      
      return c.json(response);
    } catch (error) {
      console.error('Failed to fetch installations:', error);
      throw new GitHubAPIError(
        'Failed to fetch installations',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  // Get repositories for an installation with pagination
  app.get('/repositories/:installationId', rateLimits.read, asyncHandler(async (c) => {
    const installationId = parseInt(c.req.param('installationId'));
    
    if (isNaN(installationId)) {
      throw new ValidationError('Invalid installation ID');
    }

    const pagination = PaginationHelper.parsePaginationParams(c);
    
    try {
      const octokit = await githubApp.getInstallationOctokit(installationId);
      
      // GitHub's API already supports pagination
      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: pagination.limit,
        page: pagination.page,
      });
      
      const repositories = data.repositories.map(repo => ({
        id: repo.id,
        node_id: repo.node_id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          id: repo.owner.id,
          avatar_url: repo.owner.avatar_url,
        },
        html_url: repo.html_url,
        description: repo.description,
        fork: repo.fork,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        homepage: repo.homepage,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        watchers_count: repo.watchers_count,
        language: repo.language,
        default_branch: repo.default_branch,
        archived: repo.archived,
        disabled: repo.disabled,
        topics: repo.topics,
      }));
      
      const response = PaginationHelper.createPaginatedResponse(
        repositories,
        {
          ...pagination,
          total: data.total_count,
        },
        c.req.url
      );
      
      return c.json(response);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        throw new NotFoundError('Installation');
      }
      
      console.error('Failed to fetch repositories:', error);
      throw new GitHubAPIError(
        'Failed to fetch repositories',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  // Get single repository details
  app.get('/repositories/:owner/:repo', rateLimits.read, asyncHandler(async (c) => {
    const owner = c.req.param('owner');
    const repo = c.req.param('repo');
    const installationId = c.req.query('installationId');
    
    if (!installationId) {
      throw new ValidationError('installationId query parameter is required');
    }
    
    try {
      const octokit = await githubApp.getInstallationOctokit(parseInt(installationId));
      const { data } = await octokit.rest.repos.get({ owner, repo });
      
      return c.json({
        data: {
          id: data.id,
          name: data.name,
          full_name: data.full_name,
          private: data.private,
          description: data.description,
          default_branch: data.default_branch,
          created_at: data.created_at,
          updated_at: data.updated_at,
          pushed_at: data.pushed_at,
          size: data.size,
          stargazers_count: data.stargazers_count,
          watchers_count: data.watchers_count,
          language: data.language,
          has_issues: data.has_issues,
          has_projects: data.has_projects,
          has_downloads: data.has_downloads,
          has_wiki: data.has_wiki,
          has_pages: data.has_pages,
          archived: data.archived,
          disabled: data.disabled,
          topics: data.topics,
        }
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        throw new NotFoundError('Repository');
      }
      
      throw new GitHubAPIError(
        'Failed to fetch repository',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  // Trigger a deployment
  app.post('/deploy', rateLimits.deployment, asyncHandler(async (c) => {
    const body = await c.req.json();
    const validated = deploymentSchema.parse(body);

    try {
      const deployment = await githubApp.createDeployment(validated);
      const deploymentData = deployment.data;

      // Check if it's an error response
      if ('message' in deploymentData && typeof deploymentData.message === 'string') {
        throw new GitHubAPIError(
          deploymentData.message,
          422,
          deploymentData
        );
      }

      // Type guard to ensure we have a successful deployment
      if (!('id' in deploymentData)) {
        throw new GitHubAPIError(
          'Invalid deployment response',
          502,
          deploymentData
        );
      }

      return c.json({
        success: true,
        data: {
          id: deploymentData.id,
          url: deploymentData.url,
          environment: deploymentData.environment,
          ref: deploymentData.ref,
          sha: deploymentData.sha,
          task: deploymentData.task,
          created_at: deploymentData.created_at,
          updated_at: deploymentData.updated_at,
          statuses_url: deploymentData.statuses_url,
        }
      }, 201);
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      console.error('Failed to create deployment:', error);
      throw new GitHubAPIError(
        'Failed to create deployment',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  // Update deployment status
  app.post('/deployments/:deploymentId/status', rateLimits.write, asyncHandler(async (c) => {
    const deploymentId = parseInt(c.req.param('deploymentId'));
    
    if (isNaN(deploymentId)) {
      throw new ValidationError('Invalid deployment ID');
    }
    
    const body = await c.req.json();
    const validated = deploymentStatusSchema.parse(body);

    try {
      const status = await githubApp.updateDeploymentStatus({
        ...validated,
        deploymentId,
      });

      return c.json({
        success: true,
        data: {
          id: status.data.id,
          state: status.data.state,
          creator: status.data.creator,
          description: status.data.description,
          environment: status.data.environment,
          target_url: status.data.target_url,
          log_url: status.data.log_url,
          environment_url: status.data.environment_url,
          created_at: status.data.created_at,
          updated_at: status.data.updated_at,
        }
      }, 201);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        throw new NotFoundError('Deployment');
      }
      
      console.error('Failed to update deployment status:', error);
      throw new GitHubAPIError(
        'Failed to update deployment status',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  // Create a check run
  app.post('/checks', rateLimits.write, asyncHandler(async (c) => {
    const body = await c.req.json();
    const validated = checkRunSchema.parse(body);

    try {
      const checkRun = await githubApp.createCheckRun(validated);

      return c.json({
        success: true,
        data: {
          id: checkRun.data.id,
          head_sha: checkRun.data.head_sha,
          node_id: checkRun.data.node_id,
          external_id: checkRun.data.external_id,
          url: checkRun.data.url,
          html_url: checkRun.data.html_url,
          details_url: checkRun.data.details_url,
          status: checkRun.data.status,
          conclusion: checkRun.data.conclusion,
          started_at: checkRun.data.started_at,
          completed_at: checkRun.data.completed_at,
          output: checkRun.data.output,
          name: checkRun.data.name,
        }
      }, 201);
    } catch (error) {
      console.error('Failed to create check run:', error);
      throw new GitHubAPIError(
        'Failed to create check run',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  // Get deployment history with pagination
  app.get('/deployments', rateLimits.read, asyncHandler(async (c) => {
    const { owner, repo, installationId } = c.req.query();
    
    if (!owner || !repo || !installationId) {
      throw new ValidationError('owner, repo, and installationId are required');
    }
    
    const pagination = PaginationHelper.parsePaginationParams(c);
    
    try {
      const octokit = await githubApp.getInstallationOctokit(parseInt(installationId));
      
      const { data } = await octokit.rest.repos.listDeployments({
        owner,
        repo,
        per_page: pagination.limit,
        page: pagination.page,
      });
      
      const deployments = data.map(deployment => ({
        id: deployment.id,
        node_id: deployment.node_id,
        sha: deployment.sha,
        ref: deployment.ref,
        task: deployment.task,
        payload: deployment.payload,
        environment: deployment.environment,
        description: deployment.description,
        creator: deployment.creator,
        created_at: deployment.created_at,
        updated_at: deployment.updated_at,
        statuses_url: deployment.statuses_url,
        repository_url: deployment.repository_url,
      }));
      
      const response = PaginationHelper.createPaginatedResponse(
        deployments,
        pagination,
        c.req.url
      );
      
      return c.json(response);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
      throw new GitHubAPIError(
        'Failed to fetch deployments',
        502,
        error instanceof Error ? error.message : undefined
      );
    }
  }));

  return app;
}