import { config } from './config.js'; // Load config first to ensure env vars are set
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { NucelGitHubApp } from '@nucel.cloud/github-app';
import { db, githubInstallation, project, deployment } from '@nucel/database';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { webhookRoutes } from './routes/webhooks.js';
import { apiRoutes } from './routes/api.js';
import { healthRoutes } from './routes/health.js';

const app = new Hono();

// Initialize GitHub App
const githubApp = new NucelGitHubApp({
  appId: config.github.appId,
  privateKey: config.github.privateKey,
  webhookSecret: config.github.webhookSecret,
  oauth: config.github.oauth,
});

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: config.isDevelopment ? '*' : config.allowedOrigins,
  credentials: true,
}));

// Routes
app.route('/health', healthRoutes);
app.route('/api', apiRoutes(githubApp));
app.route('/webhooks', webhookRoutes(githubApp));

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Nucel GitHub Webhook Server',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      webhooks: '/webhooks/github',
      api: {
        installations: '/api/installations',
        repositories: '/api/repositories',
        deployment: '/api/deploy',
      }
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Start server
const port = config.port;
console.log(`🚀 GitHub Webhook Server starting on port ${port}`);
console.log(`📝 Environment: ${config.nodeEnv}`);
console.log(`🔗 GitHub App ID: ${config.github.appId}`);
console.log(`🌍 Domain: ${config.nucelDomain}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server is running at http://localhost:${port}`);

// Test database connection
try {
  await db.select().from(githubInstallation).limit(1);
  console.log('✅ Database connection successful');
} catch (error) {
  console.error('❌ Database connection failed:', error);
}

// Register webhook handlers
githubApp.on('installation', async ({ payload }) => {
  console.log(`[GitHub Webhook] New installation event: ${payload.action}`);
  console.log(`[GitHub Webhook] Installation ID: ${payload.installation.id}`);
  
  // Type guard for account
  if (!payload.installation.account) {
    console.error(`[GitHub Webhook] Installation missing account information`);
    return;
  }

  // Get account login - handle both User and Organization types
  const accountLogin = 'login' in payload.installation.account 
    ? payload.installation.account.login 
    : payload.installation.account.name;
    
  // Determine account type
  const accountType = 'type' in payload.installation.account 
    ? payload.installation.account.type 
    : 'Organization';

  console.log(`[GitHub Webhook] Account: ${accountLogin} (${accountType})`);

  if (payload.action === 'created' || payload.action === 'new_permissions_accepted') {
    try {
      // Save the installation with userId as 'pending' - will be claimed during onboarding
      await db.insert(githubInstallation).values({
        id: nanoid(),
        installationId: payload.installation.id,
        userId: null, // Will be claimed when user refreshes onboarding page
        accountLogin: accountLogin,
        accountType: accountType,
        accountAvatarUrl: payload.installation.account.avatar_url || null,
        targetType: payload.installation.target_type || 'User',
        repositorySelection: payload.installation.repository_selection || 'all',
        permissions: JSON.stringify(payload.installation.permissions || {}),
        events: JSON.stringify(payload.installation.events || []),
        installedAt: new Date(payload.installation.created_at),
        updatedAt: new Date(payload.installation.updated_at),
      });
      
      console.log(`[GitHub Webhook] ✅ Saved installation ${payload.installation.id} as pending`);
    } catch (error) {
      console.error(`[GitHub Webhook] ❌ Failed to save installation:`, error);
    }
  }
  
  if (payload.action === 'deleted') {
    console.log(`[GitHub Webhook] Installation ${payload.installation.id} was deleted`);
    // Optionally mark installation as deleted in database
  }
});

githubApp.on('installation_repositories', async ({ payload }) => {
  console.log(`[GitHub Webhook] Installation repositories updated for ${payload.installation.id}`);
  console.log(`[GitHub Webhook] Action: ${payload.action}`);
  
  if (payload.repositories_added && payload.repositories_added.length > 0) {
    console.log(`[GitHub Webhook] Added repositories:`, payload.repositories_added.map(r => r.full_name));
  }
  
  if (payload.repositories_removed && payload.repositories_removed.length > 0) {
    console.log(`[GitHub Webhook] Removed repositories:`, payload.repositories_removed.map(r => r.full_name));
  }
});

githubApp.on('push', async ({ payload }) => {
  console.log(`📌 Push to ${payload.repository.full_name}`);
  
  const branch = payload.ref.replace('refs/heads/', '');
  
  // Check if this push is to a project's default branch
  const projects = await db
    .select()
    .from(project)
    .where(
      and(
        eq(project.githubRepo, payload.repository.full_name),
        eq(project.githubInstallationId, payload.installation?.id || 0)
      )
    )
    .limit(1);
  
  if (projects.length === 0) {
    console.log(`[GitHub Webhook] No project found for ${payload.repository.full_name}`);
    return;
  }
  
  const proj = projects[0];
  
  if (!proj || branch !== proj.defaultBranch) {
    console.log(`[GitHub Webhook] Push to non-default branch ${branch}, skipping`);
    return;
  }
  
  // Create deployment record
  await db.insert(deployment).values({
    id: nanoid(),
    projectId: proj.id,
    commitSha: payload.after,
    commitMessage: payload.head_commit?.message || '',
    commitAuthor: payload.pusher.name,
    branch,
    status: 'pending',
    deploymentType: 'commit',
    environment: 'production',
    createdAt: new Date(),
  });
  
  console.log(`[GitHub Webhook] Created deployment for ${payload.repository.full_name}`);
});

githubApp.on('pull_request', async ({ payload }) => {
  console.log(`🔀 PR ${payload.action} in ${payload.repository.full_name}`);
  // Handle pull request events
});

githubApp.on('issue_comment', async ({ payload }) => {
  console.log(`💬 Comment in ${payload.repository.full_name}`);
  // Handle issue comments
});

githubApp.on('deployment', async ({ payload }) => {
  console.log(`🚀 Deployment in ${payload.repository.full_name}`);
  // Handle deployment events
});

export { app, githubApp };