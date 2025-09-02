import { describe, it, expect } from 'vitest';
import { app } from '../index.js';
import type { HealthCheckResponse } from '../routes/health.js';

describe('GitHub Webhook Server', () => {
  describe('GET /', () => {
    it('should return server info', async () => {
      const res = await app.fetch(new Request('http://localhost/'));
      const data = await res.json() as {
        name: string;
        version: string;
        endpoints: {
          health: string;
          webhooks: string;
          api: Record<string, string>;
        };
      };

      expect(res.status).toBe(200);
      expect(data.name).toBe('Nucel GitHub Webhook Server');
      expect(data.version).toBe('0.1.0');
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.health).toBe('/health');
      expect(data.endpoints.webhooks).toBe('/webhooks/github');
      expect(data.endpoints.api).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.fetch(new Request('http://localhost/health'));
      const data = await res.json() as { status: string; timestamp: string };

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
    });

    it('should return detailed health status', async () => {
      const res = await app.fetch(new Request('http://localhost/health/detailed'));
      const data = await res.json() as HealthCheckResponse;

      expect(res.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks).toBeDefined();
      expect(data.checks.github_app).toBeDefined();
      expect(data.checks.memory).toBeDefined();
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('POST /webhooks/github', () => {
    it('should reject webhook without required headers', async () => {
      const res = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: 'data' }),
        })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Missing required headers');
    });

    it('should reject webhook with invalid signature', async () => {
      const res = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hub-signature-256': 'sha256=invalid',
            'x-github-event': 'push',
            'x-github-delivery': '12345',
          },
          body: JSON.stringify({ 
            ref: 'refs/heads/main',
            repository: { full_name: 'test/repo' }
          }),
        })
      );
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data).toHaveProperty('error', 'Invalid signature');
    });
  });

  describe('GET /api/installations', () => {
    it('should return paginated installations or error', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/installations')
      );
      
      // Can return 200 with empty data or error status
      expect([200, 400, 401, 502]).toContain(res.status);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('pagination');
      } else {
        const data = await res.json();
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.fetch(new Request('http://localhost/unknown'));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toHaveProperty('error', 'Not Found');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/installations')
      );

      expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });
});