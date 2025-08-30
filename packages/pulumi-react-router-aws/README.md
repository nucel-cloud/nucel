# @donswayo/pulumi-react-router-aws

A React Router v7 adapter and Pulumi library for deploying React Router applications to AWS using Lambda, S3, and CloudFront.

> **Note**: This adapter supports React Router v7 (which includes the evolution of Remix v2). For older Remix versions, please use a different adapter.

## Features

- 🚀 Serverless deployment with AWS Lambda
- 🌍 Global CDN with CloudFront
- 📦 Static asset hosting with S3
- ⚡ Optimized for performance with Lambda Function URLs
- 🔧 Simple configuration
- 🏗️ Infrastructure as Code with Pulumi
- 🎭 Full SSR and streaming support

## Installation

```bash
pnpm add @donswayo/pulumi-remix-aws
```

## Usage

### 1. Configure the Adapter

In your `vite.config.ts`:

```typescript
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import remixAwsAdapter from "@donswayo/pulumi-remix-aws/adapter";

export default defineConfig({
  plugins: [
    remix({
      adapter: remixAwsAdapter({
        out: '.remix-aws',
        polyfill: true,
        precompress: false,
      })
    }),
  ],
});
```

### 2. Build Your App

```bash
pnpm build
```

This will create a `.remix-aws` directory with:
- `server/` - Lambda function code with handler
- `client/` - Static assets for S3/CloudFront
- `metadata.json` - Build metadata

### 3. Deploy with Pulumi

Create a Pulumi program:

```typescript
import { RemixAwsDeployment } from "@donswayo/pulumi-remix-aws";

const app = new RemixAwsDeployment("my-remix-app", {
  buildPath: "./.remix-aws",
  
  environment: {
    SESSION_SECRET: "your-secret-here",
    // Add your environment variables
  },
  
  lambda: {
    memory: 512,
    timeout: 30,
    architecture: 'arm64', // Use Graviton for better price/performance
  },
  
  priceClass: "PriceClass_100", // Use PriceClass_All for global distribution
  
  tags: {
    Application: "remix-app",
    Environment: "production",
  },
});

export const url = app.url;
export const distributionId = app.distributionId;
```

### 4. Deploy

```bash
pulumi up
```

## Configuration Options

### Adapter Options

- `out` - Output directory for build artifacts (default: `.remix-aws`)
- `polyfill` - Include Node.js polyfills (default: `true`)
- `precompress` - Precompress static assets (default: `false`)
- `envPrefix` - Environment variable prefix to include

### Deployment Options

- `buildPath` - Path to the adapter output directory
- `environment` - Environment variables for Lambda
- `lambda` - Lambda configuration (memory, timeout, architecture)
- `priceClass` - CloudFront price class
- `domain` - Custom domain configuration
- `tags` - AWS resource tags

## Architecture

The deployment creates:

1. **Lambda Function** - Handles SSR and API routes with Function URL
2. **S3 Bucket** - Stores static assets (JS, CSS, images)
3. **CloudFront Distribution** - Global CDN with intelligent routing
   - `/build/*` → S3 (cached)
   - `/*` → Lambda (dynamic)
4. **IAM Roles** - Secure permissions for Lambda

## Features

### Server-Side Rendering (SSR)
Full SSR support with streaming for optimal performance.

### API Routes
All Remix API routes are handled by Lambda.

### Static Assets
Efficiently served from S3 with CloudFront caching.

### Environment Variables
Securely passed to Lambda function.

### Custom Domains
Support for custom domains with ACM certificates.

## Performance

- **Cold Starts**: ~200-400ms with 512MB memory
- **Warm Requests**: ~10-50ms response time
- **Static Assets**: Served from CloudFront edge locations
- **Compression**: Automatic gzip/brotli compression

## Cost Optimization

- Use ARM64 (Graviton) for 20% cost savings
- Configure appropriate Lambda memory (512MB recommended)
- Use CloudFront caching to reduce Lambda invocations
- Consider Reserved Concurrency for predictable traffic

## Comparison with Other Adapters

| Feature | @donswayo/pulumi-remix-aws | Vercel | Netlify |
|---------|----------------------------|---------|----------|
| SSR | ✅ | ✅ | ✅ |
| API Routes | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Custom Domains | ✅ | ✅ | ✅ |
| Infrastructure as Code | ✅ | ❌ | ❌ |
| AWS Native | ✅ | ❌ | ❌ |
| Cost Control | ✅ | Limited | Limited |

## Troubleshooting

### Build Issues
- Ensure you're using Remix with Vite
- Check that `@remix-run/architect` is installed

### Deployment Issues
- Verify AWS credentials are configured
- Check Pulumi stack is initialized
- Ensure build path exists

### Runtime Issues
- Check Lambda logs in CloudWatch
- Verify environment variables are set
- Monitor Lambda memory usage

## License

MIT