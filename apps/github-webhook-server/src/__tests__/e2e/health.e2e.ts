import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('Health Endpoints E2E', () => {
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test.describe('GET /health', () => {
    test('should return simple health status', async () => {
      const response = await request.get('/health');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('status', 'ok');
      expect(responseBody).toHaveProperty('timestamp');
      
      const timestamp = new Date(responseBody.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000);
    });

    test('should be accessible without authentication', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
      
      const response = await unauthenticatedRequest.get('/health');
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      await unauthenticatedRequest.dispose();
    });
  });

  test.describe('GET /health/detailed', () => {
    test('should return detailed health information', async () => {
      const response = await request.get('/health/detailed');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      
      expect(responseBody).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(responseBody.status);
      
      expect(responseBody).toHaveProperty('timestamp');
      expect(responseBody).toHaveProperty('uptime');
      expect(responseBody).toHaveProperty('version', '0.1.0');
      expect(responseBody).toHaveProperty('environment');
      expect(responseBody).toHaveProperty('checks');
      
      expect(responseBody.checks).toHaveProperty('memory');
      expect(responseBody.checks.memory).toHaveProperty('status');
      expect(['pass', 'warn', 'fail']).toContain(responseBody.checks.memory.status);
      expect(responseBody.checks.memory).toHaveProperty('message');
      
      expect(responseBody.checks).toHaveProperty('github_app');
      expect(responseBody.checks.github_app).toHaveProperty('status');
      expect(['pass', 'fail']).toContain(responseBody.checks.github_app.status);
      
      expect(responseBody.checks).toHaveProperty('environment');
      expect(responseBody.checks.environment).toHaveProperty('status', 'pass');
    });

    test('should report uptime correctly', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await request.get('/health/detailed');
      const responseBody = await response.json();
      
      expect(responseBody.uptime).toBeGreaterThan(1000);
    });

    test('should detect missing GitHub App configuration', async ({ playwright }) => {
      const testRequest = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
      
      const response = await testRequest.get('/health/detailed');
      const responseBody = await response.json();
      
      if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY) {
        expect(responseBody.checks.github_app.status).toBe('fail');
        expect(responseBody.checks.github_app.message).toContain('Missing');
      }
      
      await testRequest.dispose();
    });
  });

  test.describe('GET /health/live', () => {
    test('should return liveness status', async () => {
      const response = await request.get('/health/live');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const responseText = await response.text();
      expect(responseText).toBe('OK');
    });

    test('should be fast', async () => {
      const startTime = Date.now();
      const response = await request.get('/health/live');
      const endTime = Date.now();
      
      expect(response.ok()).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  test.describe('GET /health/ready', () => {
    test('should return readiness status', async () => {
      const response = await request.get('/health/ready');
      
      expect([200, 503]).toContain(response.status());
      
      const responseText = await response.text();
      if (response.status() === 200) {
        expect(responseText).toBe('Ready');
      } else {
        expect(responseText).toBe('Not Ready');
      }
    });

    test('should check required environment variables', async () => {
      const response = await request.get('/health/ready');
      
      const hasRequiredEnvVars = !!(
        process.env.GITHUB_APP_ID &&
        process.env.GITHUB_APP_PRIVATE_KEY &&
        process.env.GITHUB_WEBHOOK_SECRET
      );
      
      if (hasRequiredEnvVars) {
        expect(response.status()).toBe(200);
      } else {
        expect(response.status()).toBe(503);
      }
    });
  });

  test.describe('GET /health/metrics', () => {
    test('should return Prometheus-compatible metrics', async () => {
      const response = await request.get('/health/metrics');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/plain');
      
      const responseText = await response.text();
      
      expect(responseText).toContain('# HELP process_heap_bytes');
      expect(responseText).toContain('# TYPE process_heap_bytes gauge');
      expect(responseText).toContain('process_heap_bytes');
      
      expect(responseText).toContain('# HELP process_heap_total_bytes');
      expect(responseText).toContain('# TYPE process_heap_total_bytes gauge');
      expect(responseText).toContain('process_heap_total_bytes');
      
      expect(responseText).toContain('# HELP process_rss_bytes');
      expect(responseText).toContain('# TYPE process_rss_bytes gauge');
      expect(responseText).toContain('process_rss_bytes');
      
      expect(responseText).toContain('# HELP process_cpu_user_seconds_total');
      expect(responseText).toContain('# TYPE process_cpu_user_seconds_total counter');
      expect(responseText).toContain('process_cpu_user_seconds_total');
      
      expect(responseText).toContain('# HELP process_cpu_system_seconds_total');
      expect(responseText).toContain('# TYPE process_cpu_system_seconds_total counter');
      expect(responseText).toContain('process_cpu_system_seconds_total');
      
      expect(responseText).toContain('# HELP process_uptime_seconds');
      expect(responseText).toContain('# TYPE process_uptime_seconds gauge');
      expect(responseText).toContain('process_uptime_seconds');
    });

    test('should return valid metric values', async () => {
      const response = await request.get('/health/metrics');
      const responseText = await response.text();
      
      const lines = responseText.split('\n');
      const metricLines = lines.filter(line => 
        line && !line.startsWith('#') && line.includes(' ')
      );
      
      for (const line of metricLines) {
        const parts = line.split(' ');
        if (parts.length >= 2 && parts[1]) {
          const numValue = parseFloat(parts[1]);
          expect(numValue).not.toBeNaN();
          expect(numValue).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should update metrics over time', async () => {
      const response1 = await request.get('/health/metrics');
      const text1 = await response1.text();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response2 = await request.get('/health/metrics');
      const text2 = await response2.text();
      
      const getMetricValue = (text: string, metric: string): number => {
        const lines = text.split('\n');
        const line = lines.find(l => l.startsWith(metric + ' '));
        if (!line) return 0;
        const parts = line.split(' ');
        if (parts.length < 2 || !parts[1]) return 0;
        return parseFloat(parts[1]);
      };
      
      const uptime1 = getMetricValue(text1, 'process_uptime_seconds');
      const uptime2 = getMetricValue(text2, 'process_uptime_seconds');
      
      expect(uptime2).toBeGreaterThan(uptime1);
    });
  });

  test.describe('Health Check Performance', () => {
    test('all health endpoints should respond quickly', async () => {
      const endpoints = [
        '/health',
        '/health/detailed',
        '/health/live',
        '/health/ready',
        '/health/metrics',
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(endpoint);
        const endTime = Date.now();
        
        expect(response.ok() || response.status() === 503).toBeTruthy();
        expect(endTime - startTime).toBeLessThan(500);
      }
    });

    test('health checks should be cacheable', async () => {
      const response = await request.get('/health');
      
      const cacheControl = response.headers()['cache-control'];
      if (cacheControl) {
        expect(cacheControl).not.toContain('no-cache');
        expect(cacheControl).not.toContain('no-store');
      }
    });
  });
});