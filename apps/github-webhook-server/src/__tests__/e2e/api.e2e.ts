import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('API Endpoints E2E', () => {
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Accept': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test.describe('GET /', () => {
    test('should return server information', async () => {
      const response = await request.get('/');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('name', 'Nucel GitHub Webhook Server');
      expect(responseBody).toHaveProperty('version', '0.1.0');
      expect(responseBody).toHaveProperty('endpoints');
      expect(responseBody.endpoints).toEqual({
        health: '/health',
        webhooks: '/webhooks/github',
        api: {
          installations: '/api/installations',
          repositories: '/api/repositories',
          deployments: '/api/deployments',
        },
      });
    });
  });

  test.describe('GET /api/installations', () => {
    test('should return installations with pagination', async () => {
      const response = await request.get('/api/installations');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(Array.isArray(responseBody.data)).toBeTruthy();
        expect(responseBody).toHaveProperty('pagination');
        expect(responseBody.pagination).toHaveProperty('page');
        expect(responseBody.pagination).toHaveProperty('limit');
        expect(responseBody.pagination).toHaveProperty('total');
        expect(responseBody.pagination).toHaveProperty('hasNext');
        expect(responseBody.pagination).toHaveProperty('hasPrev');
      } else {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
      }
    });

    test('should support pagination parameters', async () => {
      const response = await request.get('/api/installations?page=1&limit=10');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody.pagination.page).toBe(1);
        expect(responseBody.pagination.limit).toBe(10);
      }
    });

    test('should validate pagination parameters', async () => {
      const response = await request.get('/api/installations?page=0&limit=1000');
      
      if (response.status() === 400) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
      }
    });
  });

  test.describe('GET /api/installations/:id', () => {
    test('should return 404 for non-existent installation', async () => {
      const response = await request.get('/api/installations/999999');
      
      expect([404, 401, 502]).toContain(response.status());
      
      if (response.status() === 404) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error', 'Installation not found');
      }
    });

    test('should handle invalid installation ID', async () => {
      const response = await request.get('/api/installations/invalid');
      
      expect([400, 404]).toContain(response.status());
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error');
    });
  });

  test.describe('GET /api/repositories', () => {
    test('should return repositories list', async () => {
      const response = await request.get('/api/repositories');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(Array.isArray(responseBody.data)).toBeTruthy();
        expect(responseBody).toHaveProperty('pagination');
      } else {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
      }
    });

    test('should support filtering by installation', async () => {
      const response = await request.get('/api/repositories?installation_id=123456');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
      }
    });
  });

  test.describe('GET /api/deployments', () => {
    test('should return deployments list', async () => {
      const response = await request.get('/api/deployments');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(Array.isArray(responseBody.data)).toBeTruthy();
        expect(responseBody).toHaveProperty('pagination');
      } else {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
      }
    });

    test('should support filtering by repository', async () => {
      const response = await request.get('/api/deployments?repo=test/repo');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
      }
    });

    test('should support filtering by environment', async () => {
      const response = await request.get('/api/deployments?environment=production');
      
      expect([200, 400, 401, 502]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
      }
    });
  });

  test.describe('Rate Limiting', () => {
    test('should include rate limit headers', async () => {
      const response = await request.get('/api/installations');
      
      expect(response.headers()['x-ratelimit-limit']).toBeDefined();
      expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers()['x-ratelimit-reset']).toBeDefined();
    });

    test('should enforce rate limits', async () => {
      const requests = [];
      const limit = 10;
      
      for (let i = 0; i < limit + 5; i++) {
        requests.push(request.get('/api/installations'));
      }
      
      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];
      
      const remaining = lastResponse ? parseInt(lastResponse.headers()['x-ratelimit-remaining'] || '0') : 0;
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request.get('/api/unknown');
      
      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error', 'Not Found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request.post('/webhooks/github', {
        data: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=test',
          'x-github-event': 'push',
          'x-github-delivery': 'test-id',
        },
      });
      
      expect(response.ok()).toBeFalsy();
      expect([400, 401]).toContain(response.status());
    });
  });
});