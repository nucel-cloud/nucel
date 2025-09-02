import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { webhookRoutes } from '../../routes/webhooks.js';
import { NucelGitHubApp } from '@nucel.cloud/github-app';

// Mock the entire module
vi.mock('@nucel.cloud/github-app', () => {
  return {
    NucelGitHubApp: vi.fn().mockImplementation(() => ({
      verifyAndReceive: vi.fn().mockResolvedValue(undefined),
      getApp: vi.fn(),
      getInstallationOctokit: vi.fn(),
      on: vi.fn(),
      createMiddleware: vi.fn(),
      eachInstallation: vi.fn(),
      eachRepository: vi.fn(),
      createDeployment: vi.fn(),
      updateDeploymentStatus: vi.fn(),
      createCheckRun: vi.fn(),
      updateCheckRun: vi.fn(),
    }))
  };
});

describe('Webhook Routes', () => {
  let app: Hono;
  let mockGitHubApp: NucelGitHubApp;

  beforeEach(() => {
    mockGitHubApp = new NucelGitHubApp({
      appId: '123456',
      privateKey: 'test-key',
      webhookSecret: 'test-secret',
    });
    app = new Hono();
    app.route('/webhooks', webhookRoutes(mockGitHubApp));
    vi.clearAllMocks();
  });

  describe('POST /webhooks/github', () => {
    it('should handle valid webhook with all required headers', async () => {
      const payload = JSON.stringify({ action: 'opened', issue: { number: 1 } });
      const signature = 'sha256=test-signature';
      const event = 'issues';
      const id = 'test-delivery-id';

      vi.mocked(mockGitHubApp.verifyAndReceive).mockResolvedValueOnce(undefined);

      const response = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'x-hub-signature-256': signature,
            'x-github-event': event,
            'x-github-delivery': id,
            'content-type': 'application/json',
          },
          body: payload,
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(mockGitHubApp.verifyAndReceive).toHaveBeenCalledWith({
        id,
        name: event,
        signature,
        payload,
      });
    });

    it('should return 400 when missing signature header', async () => {
      const response = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'x-github-event': 'push',
            'x-github-delivery': 'test-id',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Missing required headers' });
    });

    it('should return 400 when missing event header', async () => {
      const response = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'x-hub-signature-256': 'sha256=test',
            'x-github-delivery': 'test-id',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Missing required headers' });
    });

    it('should return 400 when missing delivery id header', async () => {
      const response = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'x-hub-signature-256': 'sha256=test',
            'x-github-event': 'push',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Missing required headers' });
    });

    it('should return 401 for invalid signature', async () => {
      const error = new Error('signature does not match');
      vi.mocked(mockGitHubApp.verifyAndReceive).mockRejectedValueOnce(error);

      const response = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'x-hub-signature-256': 'sha256=invalid',
            'x-github-event': 'push',
            'x-github-delivery': 'test-id',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Invalid signature' });
    });

    it('should return 500 for webhook processing errors', async () => {
      const error = new Error('Processing failed');
      vi.mocked(mockGitHubApp.verifyAndReceive).mockRejectedValueOnce(error);

      const response = await app.fetch(
        new Request('http://localhost/webhooks/github', {
          method: 'POST',
          headers: {
            'x-hub-signature-256': 'sha256=test',
            'x-github-event': 'push',
            'x-github-delivery': 'test-id',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Webhook processing failed' });
    });
  });

  describe('POST /webhooks/test', () => {
    it('should allow test webhook in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const testData = { test: 'data' };
      const response = await app.fetch(
        new Request('http://localhost/webhooks/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(testData),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Test webhook processed',
        receivedData: testData,
      });
    });

    it('should reject test webhook in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const response = await app.fetch(
        new Request('http://localhost/webhooks/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ test: 'data' }),
        })
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ 
        error: 'Test endpoint only available in development' 
      });
      
      // Reset to test environment
      process.env.NODE_ENV = 'test';
    });
  });

  describe('GET /webhooks/deliveries', () => {
    it('should return mock webhook deliveries', async () => {
      const response = await app.fetch(
        new Request('http://localhost/webhooks/deliveries')
      );

      expect(response.status).toBe(200);
      const data = await response.json() as { deliveries: Array<{ id: string; event: string; timestamp: string; status: string }> };
      expect(data).toHaveProperty('deliveries');
      expect(data.deliveries).toBeInstanceOf(Array);
      expect(data.deliveries).toHaveLength(2);
      
      const delivery = data.deliveries[0];
      expect(delivery).toHaveProperty('id');
      expect(delivery).toHaveProperty('event');
      expect(delivery).toHaveProperty('timestamp');
      expect(delivery).toHaveProperty('status');
    });
  });
});