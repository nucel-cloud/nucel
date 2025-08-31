# Pulumi AWS Framework Deployment

Deploy Next.js, SvelteKit, and React Router v7 (Remix v2) applications to AWS using serverless architecture with Pulumi Infrastructure as Code.

## Packages

| Package | Version | Framework |
|---------|---------|-----------|
| [@donswayo/pulumi-nextjs-aws](https://www.npmjs.com/package/@donswayo/pulumi-nextjs-aws) | 1.1.2 | Next.js 14+ with OpenNext v3 |
| [@donswayo/pulumi-sveltekit-aws](https://www.npmjs.com/package/@donswayo/pulumi-sveltekit-aws) | 0.1.0 | SvelteKit 2+ |
| [@donswayo/pulumi-react-router-aws](https://www.npmjs.com/package/@donswayo/pulumi-react-router-aws) | 0.1.0 | React Router v7 (Remix v2) |

## Architecture

All three frameworks deploy to the same AWS architecture:

- **Lambda**: Server-side rendering and API routes
- **CloudFront**: Global CDN distribution
- **S3**: Static asset storage
- **CloudWatch**: Monitoring and logs

## Installation

```bash
# Next.js
pnpm add -D @donswayo/pulumi-nextjs-aws

# SvelteKit
pnpm add -D @donswayo/pulumi-sveltekit-aws

# React Router v7
pnpm add -D @donswayo/pulumi-react-router-aws
```

## Quick Start

Each package provides an adapter for building and a Pulumi component for deploying. Full documentation is available in each package's README:

- **Next.js**: Uses OpenNext v3 for build - see [/packages/pulumi-nextjs-aws/README.md](/packages/pulumi-nextjs-aws/README.md)
- **SvelteKit**: Custom adapter integrated with Vite - see [/packages/pulumi-sveltekit-aws/README.md](/packages/pulumi-sveltekit-aws/README.md)  
- **React Router v7**: Custom adapter with buildEnd hook - see [/packages/pulumi-react-router-aws/README.md](/packages/pulumi-react-router-aws/README.md)

React Router v7 is the evolution of Remix v2, offering the same powerful features with improved APIs and patterns.

## Configuration Options

### Common Configuration (All Frameworks)

| Option | Type | Description |
|--------|------|-------------|
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

### CloudFront Price Classes

- `PriceClass_100` - US, Canada, Europe
- `PriceClass_200` - US, Canada, Europe, Asia, Middle East, Africa
- `PriceClass_All` - All edge locations worldwide

## Features

### All Frameworks Support

- **Server-Side Rendering (SSR)** - Full SSR support with streaming
- **API Routes** - Serverless API endpoints
- **Static Assets** - Optimized CDN delivery
- **Dynamic Routes** - Parameter-based routing
- **Environment Variables** - Secure configuration management
- **Custom Domains** - Use your own domain with SSL
- **Auto-Scaling** - Automatic Lambda scaling
- **Global CDN** - CloudFront distribution

### Framework-Specific Features

#### Next.js
- **Incremental Static Regeneration (ISR)** with DynamoDB cache
- **Image Optimization** with dedicated Lambda
- **App Router** and **Pages Router** support
- **Middleware** support with Lambda@Edge
- **On-demand Revalidation** with SQS

#### SvelteKit
- **Prerendering** with S3 storage
- **Form Actions** support
- **Load Functions** with streaming
- **Hooks** for request/response handling

#### React Router v7 (Remix v2)
- **Loaders and Actions** for data fetching
- **Nested Routes** with Outlet components
- **Progressive Enhancement** 
- **Streaming Responses** for better performance
- **Meta Tags** for SEO optimization

## Prerequisites

### Required Software

```bash
# Node.js 22+
node --version

# pnpm 10.11+
pnpm --version

# AWS CLI
aws --version

# Pulumi
pulumi version
```

### AWS Configuration

```bash
# Configure AWS credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_DEFAULT_REGION=us-east-1
```

### Monorepo Configuration (pnpm)

For monorepo deployments, configure pnpm to avoid symlinks:

```
# .npmrc
node-linker=hoisted
shamefully-hoist=true
hoist=true
```

## Deployment

Each package handles its own build process through adapters. After building with the respective adapter, use Pulumi to deploy:

```bash
# Initialize Pulumi stack
pulumi stack init production

# Deploy to AWS (after building with adapter)
pulumi up

# View outputs
pulumi stack output
```

## Monitoring

All deployments include CloudWatch monitoring:

- **Lambda Metrics**: Invocations, errors, duration, throttles
- **CloudFront Metrics**: Requests, cache hit ratio, origin latency
- **Custom Alarms**: Configurable thresholds for all metrics

View logs:
```bash
# Lambda logs
aws logs tail /aws/lambda/[function-name] --follow

# CloudFront logs (if configured)
aws s3 ls s3://[log-bucket]/cloudfront/
```

## Cost Optimization

Typical monthly costs for moderate traffic (1M requests/month):

- **Lambda**: $2-10 (with ARM64 architecture)
- **CloudFront**: $5-20 (depending on data transfer)
- **S3**: $1-5 (static assets)
- **CloudWatch**: $2-5 (logs and metrics)

**Total**: ~$10-40/month for most applications

## Troubleshooting

### Common Issues

#### Build Failures
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Verify AWS credentials are configured

#### Deployment Failures
- Check AWS service quotas
- Verify IAM permissions
- Ensure domain certificate is in us-east-1 region

#### Runtime Errors
- Check CloudWatch logs for Lambda errors
- Verify environment variables are set
- Ensure Lambda memory/timeout is sufficient

### Debug Commands

```bash
# Check Lambda function
aws lambda get-function --function-name [name]

# Test Lambda directly
aws lambda invoke --function-name [name] response.json

# Check CloudFront distribution
aws cloudfront get-distribution --id [distribution-id]

# View S3 bucket contents
aws s3 ls s3://[bucket-name]/
```

## Contributing

Contributions are welcome! Each package includes its own README with detailed documentation:

- `/packages/pulumi-nextjs-aws/README.md` - Next.js adapter documentation
- `/packages/pulumi-sveltekit-aws/README.md` - SvelteKit adapter documentation
- `/packages/pulumi-react-router-aws/README.md` - React Router adapter documentation

## License

MIT

## Documentation

Detailed documentation for each package is available in their respective README files:
- [Next.js adapter documentation](/packages/pulumi-nextjs-aws/README.md)
- [SvelteKit adapter documentation](/packages/pulumi-sveltekit-aws/README.md)
- [React Router adapter documentation](/packages/pulumi-react-router-aws/README.md)