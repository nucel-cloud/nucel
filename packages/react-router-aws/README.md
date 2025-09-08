# @nucel.cloud/react-router-aws

A React Router v7 adapter and Pulumi library for deploying React Router applications to AWS using Lambda, S3, and CloudFront.

## Features

- Serverless deployment with AWS Lambda
- Global CDN with CloudFront
- Static asset hosting with S3
- Server-side rendering support
- API routes and streaming responses
- Infrastructure as Code with Pulumi
- Simple configuration
- TypeScript support

## Installation

```bash
pnpm add @nucel.cloud/react-router-aws
```

## Usage

### 1. Configure the Adapter

In your `react-router.config.ts`:

```typescript
import type { Config } from "@react-router/dev/config";
import reactRouterAwsAdapter from "@nucel.cloud/react-router-aws";

const adapter = reactRouterAwsAdapter({
  out: '.react-router-aws',
  polyfill: true,
  precompress: false,
});

export default {
  ssr: true,
  buildDirectory: "build",
  serverBuildFile: "index.js",
  
  // Run the adapter after build completes
  async buildEnd({ buildManifest, serverBuildPath }) {
    await adapter.build({
      serverBuildFile: 'build/server/index.js',
      buildDirectory: 'build/client',
      routes: buildManifest?.routes || {},
    });
  },
} satisfies Config;
```

### 2. Build Your App

```bash
pnpm build
```

This will create a `.react-router-aws` directory with:
- `server/` - Lambda function code with dependencies
- `client/` - Static assets for S3/CloudFront
- `metadata.json` - Deployment metadata

### 3. Deploy with Pulumi

Create a Pulumi program:

```typescript
import * as pulumi from "@pulumi/pulumi";
import { ReactRouterAwsDeployment } from "@nucel.cloud/react-router-aws";

const app = new ReactRouterAwsDeployment("my-react-router-app", {
  buildPath: ".react-router-aws",
  
  environment: {
    NODE_ENV: "production",
    PUBLIC_API_URL: "https://api.example.com",
  },
  
  lambda: {
    memory: 512,
    timeout: 30,
    architecture: "arm64",
  },
  
  domain: {
    name: "app.example.com",
    certificateArn: "arn:aws:acm:us-east-1:...:certificate/...",
  },
  
  priceClass: "PriceClass_100",
  
  tags: {
    Environment: "production",
    Team: "frontend",
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

### Adapter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `out` | `string` | `.react-router-aws` | Output directory for build |
| `polyfill` | `boolean` | `true` | Add Node.js polyfills |
| `precompress` | `boolean` | `false` | Precompress static assets |
| `envPrefix` | `string` | `""` | Environment variable prefix filter |

### Deployment Options

| Option | Type | Description |
|--------|------|-------------|
| `buildPath` | `string` | Path to adapter build output |
| `environment` | `Record<string, string>` | Environment variables for Lambda |
| `domain` | `{ name, certificateArn }` | Custom domain configuration |
| `lambda` | `{ memory, timeout, architecture }` | Lambda configuration |
| `priceClass` | `string` | CloudFront price class |
| `tags` | `Record<string, string>` | AWS resource tags |

### Lambda Configuration

```typescript
lambda: {
  memory: 512,      // Memory in MB (128-10240)
  timeout: 30,      // Timeout in seconds (1-900)
  architecture: "arm64", // "x86_64" or "arm64"
}
```

## Architecture

The deployment creates:

1. **Lambda Function** - Handles server-side rendering and API routes
2. **Lambda Function URL** - Public endpoint for the Lambda function
3. **S3 Bucket** - Stores static assets (JS, CSS, images)
4. **CloudFront Distribution** - Global CDN with intelligent routing
5. **IAM Roles** - Proper permissions for all services

### Request Flow

1. CloudFront receives request
2. Static assets (`/assets/*`, `*.js`, `*.css`, etc.) are served from S3
3. Dynamic requests are forwarded to Lambda Function URL
4. Lambda renders the page or handles API routes
5. Response is cached and delivered through CloudFront

### Supported Features

- **Server-Side Rendering (SSR)** - Full support for React Router SSR
- **API Routes** - All React Router API route patterns
- **Streaming Responses** - Server-sent events and streaming API support
- **File-based Routing** - Automatic route discovery with `@react-router/fs-routes`
- **Dynamic Routes** - Parameters like `products.$id.tsx`
- **Nested Routes** - Outlet-based nested routing
- **Data Loading** - Loader and action functions
- **Meta Tags** - Dynamic meta tag generation

## Prerequisites

### 1. Configure Package Manager (Important for monorepo)

If you're using pnpm in a monorepo, you must configure it to avoid symlinks.

Add this to your root `.npmrc`:
```
node-linker=node-modules
```

or 

```
node-linker=hoisted
shamefully-hoist=true
hoist=true
```

This ensures that dependencies are copied as real files instead of symlinks, which is required for Lambda bundling.

### 2. React Router Dependencies

Ensure your React Router app has the required dependencies:

```json
{
  "dependencies": {
    "@react-router/architect": "^7.0.0",
    "@react-router/fs-routes": "^7.0.0",
    "@react-router/node": "^7.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0"
  },
  "devDependencies": {
    "@react-router/dev": "^7.0.0",
    "@nucel.cloud/react-router-aws": "workspace:*"
  }
}
```

### 3. Configure AWS

Ensure AWS credentials are configured:
```bash
aws configure
```

## Advanced Usage

### Custom Lambda Handler

The adapter uses `@react-router/architect` for request handling, supporting both API Gateway v2 and Lambda Function URL formats.

### Environment Variables

Pass environment variables to your Lambda function:

```typescript
environment: {
  NODE_ENV: "production",
  DATABASE_URL: process.env.DATABASE_URL,
  API_KEY: process.env.API_KEY,
}
```

### Custom Domain

Configure a custom domain with ACM certificate:

```typescript
domain: {
  name: "app.example.com",
  certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/..."
}
```

### CloudFront Price Classes

- `PriceClass_100` - US, Canada, Europe
- `PriceClass_200` - US, Canada, Europe, Asia, Middle East, Africa
- `PriceClass_All` - All edge locations

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Type check
pnpm check-types
```

## Troubleshooting

### Common Issues

1. **Routes not working**: Ensure `react-router.config.ts` has `ssr: true`
2. **Static assets 404**: Check CloudFront cache behaviors for `/assets/*`
3. **Lambda timeout**: Increase timeout in lambda configuration
4. **Build failures**: Ensure all dependencies are installed with `--production` flag

### Debugging

Enable Lambda logging:
```typescript
environment: {
  DEBUG: "true",
  NODE_ENV: "development",
}
```

View CloudWatch logs:
```bash
aws logs tail /aws/lambda/[function-name] --follow
```

## License

MIT