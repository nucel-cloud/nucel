import { Hono } from 'hono';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'warn' | 'fail';
      message?: string;
      responseTime?: number;
    };
  };
  version: string;
  environment: string;
}

const startTime = Date.now();

export const healthRoutes = new Hono();

// Simple health check
healthRoutes.get('/', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check
healthRoutes.get('/detailed', async (c) => {
  const checks: HealthCheckResponse['checks'] = {};
  let overallStatus: HealthCheckResponse['status'] = 'healthy';

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  checks.memory = {
    status: heapUsedPercent < 80 ? 'pass' : heapUsedPercent < 90 ? 'warn' : 'fail',
    message: `Heap usage: ${heapUsedPercent.toFixed(2)}%`,
  };

  if (checks.memory.status === 'warn') overallStatus = 'degraded';
  if (checks.memory.status === 'fail') overallStatus = 'unhealthy';

  // Check GitHub App configuration
  try {
    const hasAppId = !!process.env.GITHUB_APP_ID;
    const hasPrivateKey = !!process.env.GITHUB_APP_PRIVATE_KEY;
    const hasWebhookSecret = !!process.env.GITHUB_WEBHOOK_SECRET;
    
    const configStatus = hasAppId && hasPrivateKey && hasWebhookSecret;
    
    checks.github_app = {
      status: configStatus ? 'pass' : 'fail',
      message: configStatus 
        ? 'GitHub App configured' 
        : 'Missing GitHub App configuration',
    };
    
    if (!configStatus) overallStatus = 'unhealthy';
  } catch (error) {
    checks.github_app = {
      status: 'fail',
      message: 'Failed to check GitHub App configuration',
    };
    overallStatus = 'unhealthy';
  }

  // Check environment variables
  checks.environment = {
    status: 'pass',
    message: `Running in ${process.env.NODE_ENV || 'development'} mode`,
  };

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks,
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Set appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;

  return c.json(response, statusCode);
});

// Liveness probe (for Kubernetes)
healthRoutes.get('/live', (c) => {
  // Simple check to see if the service is alive
  return c.text('OK', 200);
});

// Readiness probe (for Kubernetes)
healthRoutes.get('/ready', async (c) => {
  // Check if the service is ready to accept traffic
  const hasRequiredEnvVars = !!(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_WEBHOOK_SECRET
  );

  if (!hasRequiredEnvVars) {
    return c.text('Not Ready', 503);
  }

  return c.text('Ready', 200);
});

// Metrics endpoint (simplified)
healthRoutes.get('/metrics', (c) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const metrics = [
    `# HELP process_heap_bytes Process heap size in bytes`,
    `# TYPE process_heap_bytes gauge`,
    `process_heap_bytes ${memoryUsage.heapUsed}`,
    ``,
    `# HELP process_heap_total_bytes Process total heap size in bytes`,
    `# TYPE process_heap_total_bytes gauge`,
    `process_heap_total_bytes ${memoryUsage.heapTotal}`,
    ``,
    `# HELP process_rss_bytes Process RSS in bytes`,
    `# TYPE process_rss_bytes gauge`,
    `process_rss_bytes ${memoryUsage.rss}`,
    ``,
    `# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds`,
    `# TYPE process_cpu_user_seconds_total counter`,
    `process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`,
    ``,
    `# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds`,
    `# TYPE process_cpu_system_seconds_total counter`,
    `process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`,
    ``,
    `# HELP process_uptime_seconds Process uptime in seconds`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${(Date.now() - startTime) / 1000}`,
  ].join('\n');

  return c.text(metrics, 200, {
    'Content-Type': 'text/plain; version=0.0.4',
  });
});