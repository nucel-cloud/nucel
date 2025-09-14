# @nucel.cloud/hono-aws

A Hono.js adapter and Pulumi library for deploying Hono applications to AWS using Lambda, S3, and CloudFront.

## Features

- Serverless deployment with AWS Lambda
- Global CDN with CloudFront
- Static asset hosting with S3
- Streaming response support
- Edge-optimized performance
- Infrastructure as Code with Pulumi
- Vite-powered build system
- TypeScript support

## Installation

```bash
pnpm add @nucel.cloud/hono-aws
```

## Usage

### 1. Create Your Hono App

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.json({
    message: 'Hello from Hono on AWS Lambda!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ user: { id, name: `User ${id}` } });
});

export default app;
```

### 2. Build Your App

```bash
pnpm build
```

### 3. Deploy with Pulumi

Create a Pulumi program:

```typescript
import * as pulumi from "@pulumi/pulumi";
import { HonoNucelAws } from "@nucel.cloud/hono-aws";

const app = new HonoNucelAws("my-hono-app", {
  buildPath: ".nucel-build",
  
  environment: {
    NODE_ENV: "production",
    API_URL: "https://api.example.com",
  },
  
  lambda: {
    memorySize: 512,
    timeout: 15,
    architecture: "arm64",
  },
  
  domain: {
    name: "api.example.com",
    certificateArn: "arn:aws:acm:us-east-1:...:certificate/...",
  },
  
  priceClass: "PriceClass_100",
  
  tags: {
    Environment: "production",
    Framework: "Hono",
  },
});

export const url = app.url;
export const distributionId = app.distributionId;
export const bucketName = app.bucketName;
export const functionArn = app.functionArn;
```

Deploy:

```bash
pulumi up
```

## Configuration

### Build Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entryPoint` | `string` | `src/index.ts` | Entry point for your Hono app |
| `out` | `string` | `.nucel-build` | Output directory for build |
| `minify` | `boolean` | `true` | Minify the output bundle |
| `sourcemap` | `boolean` | `false` | Generate source maps |
| `streaming` | `boolean` | `true` | Enable response streaming |
| `external` | `string[]` | `[]` | External dependencies |

### Deployment Options

| Option | Type | Description |
|--------|------|-------------|
| `buildPath` | `string` | Path to build output |
| `environment` | `Record<string, string>` | Environment variables for Lambda |
| `domain` | `{ name, certificateArn }` | Custom domain configuration |
| `lambda` | `{ memorySize, timeout, architecture }` | Lambda configuration |
| `priceClass` | `string` | CloudFront price class |
| `tags` | `Record<string, string>` | AWS resource tags |
| `streaming` | `boolean` | Enable Lambda response streaming |

### Lambda Configuration

```typescript
lambda: {
  memorySize: 512,      // Memory in MB (128-10240)
  timeout: 15,          // Timeout in seconds (1-900)
  architecture: "arm64", // "x86_64" or "arm64"
}
```

## Architecture

The deployment creates:

1. **Lambda Function** - Runs your Hono application
2. **Lambda Function URL** - Public HTTPS endpoint
3. **S3 Bucket** - Stores static assets
4. **CloudFront Distribution** - Global CDN with edge caching
5. **IAM Roles** - Proper permissions for all services

### Request Flow

1. CloudFront receives request
2. Static assets (`/static/*`, `*.js`, `*.css`) are served from S3
3. API requests are forwarded to Lambda Function URL
4. Lambda executes your Hono app
5. Response is cached and delivered through CloudFront

### Supported Features

- **REST APIs** - Full support for RESTful endpoints
- **Middleware** - All Hono middleware patterns
- **Streaming Responses** - Server-sent events and streaming
- **WebSocket** - Via Lambda Function URLs (preview)
- **CORS** - Built-in CORS middleware support
- **Request Validation** - Zod and other validators
- **Authentication** - JWT, sessions, and custom auth
- **File Uploads** - Multipart form data support

## Advanced Usage

### Streaming Responses

Enable streaming for real-time data:

```typescript
// Enable in deployment
const app = new HonoNucelAws("my-app", {
  buildPath: ".nucel-build",
  streaming: true, // Enable streaming
  lambda: {
    timeout: 300, // Longer timeout for streams
  },
});
```

```typescript
// Use in your Hono app
app.get('/api/stream', async (c) => {
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  
  const stream = c.env.streamText(async (stream) => {
    for (let i = 0; i < 10; i++) {
      await stream.write(`data: Event ${i}\n\n`);
      await new Promise(r => setTimeout(r, 1000));
    }
  });
  
  return stream;
});
```

### Custom Lambda Handler

The adapter automatically creates an optimized Lambda handler that:
- Converts Lambda events to Fetch API Request objects
- Handles both Function URL and API Gateway formats
- Supports streaming responses
- Manages Lambda context properly

### Environment Variables

Pass environment variables to your Lambda function:

```typescript
environment: {
  NODE_ENV: "production",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
}
```

### Static Assets

Place static files in a `public` or `static` directory:

```
project/
├── src/
│   └── index.ts
├── static/
│   ├── logo.png
│   └── styles.css
└── package.json
```

These will be automatically deployed to S3 and served via CloudFront.

### Custom Domain

Configure a custom domain with ACM certificate:

```typescript
domain: {
  name: "api.example.com",
  certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/..."
}
```

### CloudFront Price Classes

- `PriceClass_100` - US, Canada, Europe
- `PriceClass_200` - US, Canada, Europe, Asia, Middle East, Africa  
- `PriceClass_All` - All edge locations worldwide

## Middleware Examples

### Authentication

```typescript
import { jwt } from 'hono/jwt';

app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET,
}));
```

### Rate Limiting

```typescript
import { rateLimiter } from 'hono-rate-limiter';

app.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for'),
}));
```

### Request Logging

```typescript
import { logger } from 'hono/logger';

app.use('*', logger());
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Type check
pnpm typecheck
```

## Troubleshooting

### Common Issues

1. **Cold starts**: Use `memorySize: 1024` or higher for better performance
2. **Timeouts**: Increase `timeout` for heavy operations
3. **CORS errors**: Ensure CORS middleware is applied before routes
4. **Static assets 404**: Check CloudFront behaviors and S3 paths

### Debugging

Enable Lambda logging:
```typescript
environment: {
  DEBUG: "true",
  LOG_LEVEL: "debug",
}
```

View CloudWatch logs:
```bash
aws logs tail /aws/lambda/[function-name] --follow
```

## Performance Tips

1. **Use ARM architecture** - Better price/performance ratio
2. **Enable CloudFront compression** - Reduces bandwidth
3. **Set appropriate cache headers** - Leverage edge caching
4. **Minimize cold starts** - Use higher memory allocation
5. **Bundle dependencies** - Reduces package size

## License

MIT