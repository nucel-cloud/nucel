import { test, expect, APIRequestContext } from '@playwright/test';
import * as crypto from 'crypto';

function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

test.describe('Integration Scenarios E2E', () => {
  let request: APIRequestContext;
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Accept': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    await request.dispose();
    await apiContext.dispose();
  });

  test.describe('Full Webhook Processing Flow', () => {
    test('should process push webhook and track delivery', async () => {
      const deliveryId = crypto.randomUUID();
      const payload = {
        ref: 'refs/heads/main',
        after: 'abc123def456',
        repository: {
          full_name: 'test/integration-repo',
          name: 'integration-repo',
          owner: {
            login: 'test',
          },
        },
        pusher: {
          name: 'integration-test',
          email: 'integration@test.com',
        },
        commits: [
          {
            id: 'abc123',
            message: 'Integration test commit',
            timestamp: new Date().toISOString(),
            author: {
              name: 'Test Author',
              email: 'author@test.com',
            },
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const webhookResponse = await request.post('/webhooks/github', {
        data: payload,
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'push',
          'x-github-delivery': deliveryId,
        },
      });

      expect(webhookResponse.ok()).toBeTruthy();
      expect(webhookResponse.status()).toBe(200);

      const deliveriesResponse = await apiContext.get('/webhooks/deliveries');
      expect(deliveriesResponse.ok()).toBeTruthy();
      
      const deliveries = await deliveriesResponse.json();
      expect(deliveries).toHaveProperty('deliveries');
    });

    test('should handle multiple webhooks concurrently', async () => {
      const webhookPromises = [];
      const events = ['push', 'pull_request', 'issues', 'deployment_status'];

      for (let i = 0; i < 10; i++) {
        const eventType = events[i % events.length]!;
        const payload = {
          action: 'test',
          repository: {
            full_name: `test/concurrent-repo-${i}`,
            name: `concurrent-repo-${i}`,
            owner: { login: 'test' },
          },
        };

        const payloadString = JSON.stringify(payload);
        const signature = generateSignature(payloadString, 'test-webhook-secret');

        webhookPromises.push(
          request.post('/webhooks/github', {
            data: payload,
            headers: {
              'x-hub-signature-256': signature,
              'x-github-event': eventType,
              'x-github-delivery': crypto.randomUUID(),
            },
          })
        );
      }

      const responses = await Promise.all(webhookPromises);
      
      for (const response of responses) {
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
      }
    });
  });

  test.describe('API and Webhook Interaction', () => {
    test('should handle API requests while processing webhooks', async () => {
      const webhookPayload = {
        ref: 'refs/heads/main',
        repository: {
          full_name: 'test/api-webhook-test',
          name: 'api-webhook-test',
          owner: { login: 'test' },
        },
      };

      const payloadString = JSON.stringify(webhookPayload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const promises = [
        request.post('/webhooks/github', {
          data: webhookPayload,
          headers: {
            'x-hub-signature-256': signature,
            'x-github-event': 'push',
            'x-github-delivery': crypto.randomUUID(),
          },
        }),
        apiContext.get('/api/installations'),
        apiContext.get('/api/repositories'),
        apiContext.get('/api/deployments'),
        apiContext.get('/health/detailed'),
      ];

      const responses = await Promise.all(promises);
      
      for (const response of responses) {
        expect([200, 400, 401, 502]).toContain(response.status());
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should continue processing after invalid webhook', async () => {
      const invalidResponse = await request.post('/webhooks/github', {
        data: { invalid: 'data' },
        headers: {
          'x-hub-signature-256': 'invalid',
          'x-github-event': 'push',
          'x-github-delivery': 'invalid-id',
        },
      });

      expect(invalidResponse.status()).toBe(401);

      const healthResponse = await apiContext.get('/health');
      expect(healthResponse.ok()).toBeTruthy();
      expect(healthResponse.status()).toBe(200);

      const validPayload = {
        ref: 'refs/heads/main',
        repository: {
          full_name: 'test/recovery-test',
          name: 'recovery-test',
          owner: { login: 'test' },
        },
      };

      const payloadString = JSON.stringify(validPayload);
      const signature = generateSignature(payloadString, 'test-webhook-secret');

      const validResponse = await request.post('/webhooks/github', {
        data: validPayload,
        headers: {
          'x-hub-signature-256': signature,
          'x-github-event': 'push',
          'x-github-delivery': crypto.randomUUID(),
        },
      });

      expect(validResponse.ok()).toBeTruthy();
      expect(validResponse.status()).toBe(200);
    });

    test('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        request.post('/webhooks/github', {
          data: 'not json',
          headers: { 'Content-Type': 'application/json' },
        }),
        request.get('/api/installations?page=invalid'),
        request.get('/api/repositories?limit=-1'),
      ];

      const responses = await Promise.all(malformedRequests);
      
      for (const response of responses) {
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
      }

      const healthCheck = await apiContext.get('/health');
      expect(healthCheck.ok()).toBeTruthy();
    });
  });

  test.describe('Performance Under Load', () => {
    test('should maintain response times under load', async () => {
      const loadTestPromises = [];
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        if (i % 5 === 0) {
          loadTestPromises.push(apiContext.get('/health'));
        } else if (i % 5 === 1) {
          loadTestPromises.push(apiContext.get('/api/installations'));
        } else if (i % 5 === 2) {
          loadTestPromises.push(apiContext.get('/api/repositories'));
        } else if (i % 5 === 3) {
          loadTestPromises.push(apiContext.get('/api/deployments'));
        } else {
          const payload = { test: i };
          const payloadString = JSON.stringify(payload);
          const signature = generateSignature(payloadString, 'test-webhook-secret');
          
          loadTestPromises.push(
            request.post('/webhooks/github', {
              data: payload,
              headers: {
                'x-hub-signature-256': signature,
                'x-github-event': 'ping',
                'x-github-delivery': crypto.randomUUID(),
              },
            })
          );
        }
      }

      const responses = await Promise.all(loadTestPromises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000);
      
      let successCount = 0;
      for (const response of responses) {
        if (response.ok()) {
          successCount++;
        }
      }
      
      const successRate = (successCount / responses.length) * 100;
      expect(successRate).toBeGreaterThan(80);
    });
  });

  test.describe('State Consistency', () => {
    test('should maintain consistent state across endpoints', async () => {
      const [health, detailed, metrics] = await Promise.all([
        apiContext.get('/health'),
        apiContext.get('/health/detailed'),
        apiContext.get('/health/metrics'),
      ]);

      expect(health.ok()).toBeTruthy();
      expect(detailed.ok()).toBeTruthy();
      expect(metrics.ok()).toBeTruthy();

      const healthData = await health.json();
      const detailedData = await detailed.json();
      
      expect(healthData.status).toBe('ok');
      if (detailedData.status === 'healthy') {
        expect(healthData.status).toBe('ok');
      }
    });

    test('should handle concurrent modifications', async () => {
      const concurrentWebhooks = [];
      
      for (let i = 0; i < 5; i++) {
        const payload = {
          action: 'opened',
          number: i,
          repository: {
            full_name: 'test/concurrent-mod',
            name: 'concurrent-mod',
            owner: { login: 'test' },
          },
        };

        const payloadString = JSON.stringify(payload);
        const signature = generateSignature(payloadString, 'test-webhook-secret');

        concurrentWebhooks.push(
          request.post('/webhooks/github', {
            data: payload,
            headers: {
              'x-hub-signature-256': signature,
              'x-github-event': 'issues',
              'x-github-delivery': crypto.randomUUID(),
            },
          })
        );
      }

      const results = await Promise.all(concurrentWebhooks);
      
      for (const result of results) {
        expect(result.ok()).toBeTruthy();
      }
    });
  });
});