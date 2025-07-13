# @repo/pulumi-nextjs-aws

A reusable Pulumi library for deploying Next.js applications to AWS using OpenNext v3.

## Features

- Serverless deployment using AWS Lambda and CloudFront
- Edge optimization with CloudFront distribution
- ISR support with DynamoDB and SQS
- Static asset handling with S3
- Image optimization with dedicated Lambda function
- Lambda warming to reduce cold starts
- Streaming support for better performance
- Modular architecture with small, focused components

## Installation

```bash
pnpm add @repo/pulumi-nextjs-aws
```

## Usage

### Basic Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import { OpenNextDeployment } from "@repo/pulumi-nextjs-aws";

const site = new OpenNextDeployment("my-nextjs-app", {
  appPath: "./apps/web",
  openNextPath: ".open-next",
  environment: {
    NODE_ENV: "production",
    NEXT_PUBLIC_API_URL: "https://api.example.com",
  },
});

export const url = site.url;
export const distributionId = site.distributionId;
```

### Advanced Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import { OpenNextDeployment } from "@repo/pulumi-nextjs-aws";

const site = new OpenNextDeployment("my-app", {
  appPath: "./apps/web",
  openNextPath: ".open-next",
  streaming: true,
  
  domain: {
    name: "app.example.com",
    certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/...",
  },
  
  lambda: {
    server: {
      memory: 1024,
      timeout: 30,
      provisionedConcurrency: 2,
    },
    image: {
      memory: 2048,
      timeout: 30,
    },
    warmer: {
      concurrency: 10,
      schedule: "rate(3 minutes)",
    },
  },
  
  priceClass: "PriceClass_All",
  cloudFrontLogging: {
    bucket: "my-logs-bucket",
    prefix: "cloudfront/",
  },
  
  environment: {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://...",
  },
  
  tags: {
    Environment: "production",
    Team: "frontend",
  },
});
```

## Prerequisites

### 1. Configure Package Manager (Important for Monorepos)

If you're using pnpm in a monorepo, you must configure it to avoid symlinks for OpenNext compatibility.

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

This ensures that dependencies are copied as real files instead of symlinks, which is required for OpenNext bundling to work correctly.

### 2. Configure Next.js for Monorepos

Add this to your `next.config.ts` for proper monorepo support:
```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",

  transpilePackages: ["@repo/ui"], // Add your workspace packages
};

export default nextConfig;
```

### 3. Build with OpenNext

Build your Next.js app with OpenNext:
```bash
npx @opennextjs/aws build
```

### 4. Configure AWS

Ensure AWS credentials are configured:
```bash
aws configure
```

## Architecture

The library creates these AWS resources:

- Lambda Functions: Server-side rendering, image optimization, ISR revalidation
- S3 Bucket: Static assets and cache storage
- CloudFront Distribution: Global CDN with optimized caching
- DynamoDB Table: ISR tag-based cache invalidation
- SQS Queue: ISR revalidation queue
- IAM Roles: Proper permissions for each service

## Advanced Usage

You can use individual components for more control:

```typescript
import { 
  createS3Bucket, 
  createISRTable,
  createCloudFrontDistribution 
} from "@repo/pulumi-nextjs-aws";

const s3 = createS3Bucket({ name: "my-app", tags: {} });
const dynamodb = createISRTable({ name: "my-app", tags: {} });
```

## License

MIT