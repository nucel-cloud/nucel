import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { NucelGitHubApp } from '@nucel.cloud/github-app';
import { config } from './config.js';
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

// Register webhook handlers
githubApp.on('push', async ({ payload }) => {
  console.log(`📌 Push to ${payload.repository.full_name}`);
  // Handle push events
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