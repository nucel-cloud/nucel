import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Hello from Hono on AWS Lambda!',
    timestamp: new Date().toISOString(),
    path: c.req.path,
    method: c.req.method,
  });
});

app.get('/api/users', (c) => {
  return c.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ],
  });
});

app.get('/api/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    user: { id, name: `User ${id}` },
  });
});

app.post('/api/echo', async (c) => {
  const body = await c.req.json();
  return c.json({
    echo: body,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Stream example (text streaming)
app.get('/api/stream', async (c) => {
  c.header('Content-Type', 'text/plain');
  c.header('Transfer-Encoding', 'chunked');
  
  return c.text('Stream chunk 1\nStream chunk 2\nStream chunk 3\nStream chunk 4\nStream chunk 5\n');
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Export for Lambda
export default app;

// For local development
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000;
  console.log(`Server running on http://localhost:${port}`);
  
  const { serve } = await import('@hono/node-server');
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
}