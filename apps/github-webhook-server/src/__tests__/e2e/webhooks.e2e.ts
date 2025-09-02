import { test, expect, APIRequestContext } from '@playwright/test';
import * as crypto from 'crypto';

function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

test.describe('GitHub Webhooks E2E', () => {
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test.describe('POST /webhooks/github', () => {
    test('should accept valid push webhook', async () => {
      const payload = {
        ref: 'refs/heads/main',
        repository: {
          full_name: 'test/repo',
          name: 'repo',
          owner: {
            login: 'test',
          },
        },
        pusher: {
          name: 'test-user',
          email: 'test@example.com',
        },
        commits: [
          {
            message: 'Test commit',
            author: {
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const response = await request.post('/webhooks/github', {
        data: payload,
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'push',
          'x-github-delivery': crypto.randomUUID(),
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ success: true });
    });

    test('should accept valid pull_request webhook', async () => {
      const payload = {
        action: 'opened',
        pull_request: {
          number: 1,
          title: 'Test PR',
          state: 'open',
          user: {
            login: 'test-user',
          },
          head: {
            ref: 'feature-branch',
            sha: 'abc123',
          },
          base: {
            ref: 'main',
            sha: 'def456',
          },
        },
        repository: {
          full_name: 'test/repo',
          name: 'repo',
          owner: {
            login: 'test',
          },
        },
      };

      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const response = await request.post('/webhooks/github', {
        data: payload,
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'pull_request',
          'x-github-delivery': crypto.randomUUID(),
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    test('should reject webhook with missing headers', async () => {
      const response = await request.post('/webhooks/github', {
        data: { test: 'data' },
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Missing required headers' });
    });

    test('should reject webhook with invalid signature', async () => {
      const payload = {
        ref: 'refs/heads/main',
        repository: { full_name: 'test/repo' },
      };

      const response = await request.post('/webhooks/github', {
        data: payload,
        headers: {
          'x-hub-signature-256': 'sha256=invalid',
          'x-github-event': 'push',
          'x-github-delivery': crypto.randomUUID(),
        },
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Invalid signature' });
    });

    test('should handle issue webhook', async () => {
      const payload = {
        action: 'opened',
        issue: {
          number: 1,
          title: 'Test Issue',
          body: 'This is a test issue',
          state: 'open',
          user: {
            login: 'test-user',
          },
        },
        repository: {
          full_name: 'test/repo',
          name: 'repo',
          owner: {
            login: 'test',
          },
        },
      };

      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const response = await request.post('/webhooks/github', {
        data: payload,
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'issues',
          'x-github-delivery': crypto.randomUUID(),
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    test('should handle deployment_status webhook', async () => {
      const payload = {
        deployment_status: {
          state: 'success',
          target_url: 'https://example.com',
          description: 'Deployment completed',
        },
        deployment: {
          id: 1,
          ref: 'main',
          task: 'deploy',
          environment: 'production',
        },
        repository: {
          full_name: 'test/repo',
          name: 'repo',
          owner: {
            login: 'test',
          },
        },
      };

      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const response = await request.post('/webhooks/github', {
        data: payload,
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'deployment_status',
          'x-github-delivery': crypto.randomUUID(),
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });
  });

  test.describe('POST /webhooks/test', () => {
    test('should accept test webhook in development', async () => {
      const testData = {
        test: 'data',
        timestamp: new Date().toISOString(),
      };

      const response = await request.post('/webhooks/test', {
        data: testData,
      });

      if (process.env.NODE_ENV === 'production') {
        expect(response.status()).toBe(403);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          error: 'Test endpoint only available in development',
        });
      } else {
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          success: true,
          message: 'Test webhook processed',
          receivedData: testData,
        });
      }
    });
  });

  test.describe('GET /webhooks/deliveries', () => {
    test('should return webhook deliveries', async () => {
      const response = await request.get('/webhooks/deliveries');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('deliveries');
      expect(Array.isArray(responseBody.deliveries)).toBeTruthy();
      
      if (responseBody.deliveries.length > 0) {
        const delivery = responseBody.deliveries[0];
        expect(delivery).toHaveProperty('id');
        expect(delivery).toHaveProperty('event');
        expect(delivery).toHaveProperty('timestamp');
        expect(delivery).toHaveProperty('status');
      }
    });
  });
});