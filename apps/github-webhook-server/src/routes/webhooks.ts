import { Hono } from 'hono';
import type { NucelGitHubApp } from '@nucel.cloud/github-app';

export function webhookRoutes(githubApp: NucelGitHubApp) {
  const app = new Hono();

  app.post('/github', async (c) => {
    const signature = c.req.header('x-hub-signature-256');
    const event = c.req.header('x-github-event');
    const id = c.req.header('x-github-delivery');

    if (!signature || !event || !id) {
      return c.json({ error: 'Missing required headers' }, 400);
    }

    try {
      const body = await c.req.text();
      
      await githubApp.verifyAndReceive({
        id,
        name: event,
        signature,
        payload: body,
      });

      return c.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      
      if (error instanceof Error && error.message.includes('signature')) {
        return c.json({ error: 'Invalid signature' }, 401);
      }
      
      return c.json({ error: 'Webhook processing failed' }, 500);
    }
  });

  // Test webhook endpoint (development only)
  app.post('/test', async (c) => {
    if (process.env.NODE_ENV !== 'development') {
      return c.json({ error: 'Test endpoint only available in development' }, 403);
    }

    const body = await c.req.json();
    
    console.log('Test webhook received:', body);
    
    // Simulate webhook processing
    return c.json({
      success: true,
      message: 'Test webhook processed',
      receivedData: body,
    });
  });

  // List recent webhook deliveries (mock)
  app.get('/deliveries', (c) => {
    return c.json({
      deliveries: [
        {
          id: '1',
          event: 'push',
          timestamp: new Date().toISOString(),
          status: 'success',
        },
        {
          id: '2',
          event: 'pull_request',
          timestamp: new Date().toISOString(),
          status: 'success',
        },
      ]
    });
  });

  return app;
}