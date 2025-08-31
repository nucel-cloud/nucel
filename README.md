# Pulumi AWS - Next.js Monorepo with AWS Deployment

A production-ready monorepo for deploying Next.js applications to AWS using Pulumi and OpenNext. This project provides reusable infrastructure components and automated deployment workflows for serverless Next.js applications.

## Project Overview

This monorepo includes multiple Next.js applications with shared components and infrastructure, designed for scalable AWS deployment using serverless architecture.

### Key Features

- **Monorepo Architecture**: Turborepo-powered monorepo with optimized builds and shared dependencies
- **Serverless Deployment**: AWS Lambda-based deployment using OpenNext for Next.js
- **Infrastructure as Code**: Pulumi components for reproducible AWS infrastructure
- **Shared UI Components**: Reusable React component library with Tailwind CSS
- **Type Safety**: 100% TypeScript across all packages
- **Modern Tooling**: Next.js 15 with Turbopack, React 19, and Tailwind CSS v4


### Applications

#### `apps/web`
- **Description**: Main production web application
- **Stack**: Next.js 15, React 19, Tailwind CSS v4
- **Port**: 3001 (development)
- **Features**: Server-side rendering, API routes, OpenNext compatibility

#### `apps/docs`
- **Description**: Documentation site
- **Stack**: Next.js 15, Fumadocs for documentation framework
- **Port**: 3000 (development)
- **Features**: MDX support, documentation UI components, search functionality

#### `apps/svelte`
- **Description**: SvelteKit application with feature parity
- **Stack**: SvelteKit 2, Svelte 5, Tailwind CSS v4
- **Port**: 5173 (development)
- **Features**: Server-side rendering, API routes, streaming, products catalog, dashboard

#### `apps/react-router`
- **Description**: React Router v7 application with feature parity
- **Stack**: React Router 7, React 19, Tailwind CSS v4
- **Port**: 5174 (development)
- **Features**: Server-side rendering, API routes, streaming, file-based routing, nested routes

### Packages

#### `@donswayo/pulumi-nextjs-aws` (v1.1.0)
**Published NPM Package**: Reusable Pulumi components for deploying Next.js apps to AWS

**Features**:
- AWS Lambda functions for SSR and API routes (Node.js 22, ARM64)
- CloudFront distribution with HTTP/3 support and edge functions
- S3 for static assets with intelligent caching strategies
- DynamoDB for ISR (Incremental Static Regeneration) caching
- SQS for on-demand revalidation queue
- Lambda warmer functions for cold start mitigation
- Custom domain support with ACM certificates
- Streaming responses support
- Configurable memory, timeout, and concurrency settings
- CloudFront logging for analytics
- Security headers and CORS configuration
- Geo-location headers forwarding
- OpenNext v3 compatibility
- Shared CloudFront cache policies to avoid AWS resource limits
- Origin Access Control (OAC) support for enhanced security
- Geo-restriction capabilities
- CloudWatch alarms for monitoring (4xx, 5xx errors, origin latency)

**AWS Resources Created**:
- **Lambda Functions**:
  - Server Function: SSR/API routes (1024MB default, 30s timeout)
  - Image Optimization: On-demand image processing (2048MB default)
  - Revalidation Function: ISR cache updates (128MB default)
  - Warmer Function: Prevents cold starts (256MB default)
- **CloudFront Distribution**:
  - HTTP/3 enabled
  - Shared cache policies with get-or-create pattern
  - Edge functions for request/response manipulation
  - Security headers (HSTS, X-Frame-Options, etc.)
  - Origin Access Control (OAC) support for S3
  - Geo-restriction capabilities
  - CloudWatch alarms with SNS notifications
- **Storage & Database**:
  - S3 bucket with versioning and lifecycle policies
  - DynamoDB table for ISR cache
  - SQS queue for revalidation events
- **IAM Roles**: Least-privilege access policies

#### `@donswayo/pulumi-sveltekit-aws`
**Reusable Pulumi Components**: Deploy SvelteKit apps to AWS Lambda, CloudFront, and S3

**Features**:
- SvelteKit adapter for AWS deployment
- AWS Lambda for SSR and API routes
- CloudFront distribution with intelligent caching
- S3 for static assets and prerendered pages
- Custom domain support with ACM certificates
- TypeScript support
- Infrastructure as Code with Pulumi

**AWS Resources Created**:
- Lambda Function for SSR (configurable memory/timeout)
- S3 Bucket for static assets
- CloudFront Distribution with optimized cache behaviors
- IAM Roles with least-privilege policies

#### `@donswayo/pulumi-react-router-aws`
**Reusable Pulumi Components**: Deploy React Router v7 apps to AWS Lambda, CloudFront, and S3

**Features**:
- React Router v7 adapter with buildEnd hook integration
- AWS Lambda with Function URLs for SSR and API routes
- CloudFront distribution with HTTP/2 and HTTP/3 support
- S3 for static assets with intelligent caching
- Streaming response support
- File-based routing with `@react-router/fs-routes`
- Custom domain support with ACM certificates
- TypeScript support
- Infrastructure as Code with Pulumi

**AWS Resources Created**:
- Lambda Function with Function URL (configurable memory/timeout/architecture)
- S3 Bucket with Origin Access Identity (OAI)
- CloudFront Distribution with optimized cache behaviors
- IAM Roles with least-privilege policies

#### `@repo/infra`
**Infrastructure Deployment**: Pulumi deployment configurations for all applications

**Deployment Stacks**:
- `docs`: Documentation site infrastructure
- `web`: Main application infrastructure
- `svelte`: SvelteKit application infrastructure
- `react-router`: React Router application infrastructure

**Configuration**:
- Environment-based settings (development/production)
- Lambda configuration per stack
- Auto-scaling and performance tuning
- Cost optimization through price class selection

#### `@repo/ui`
**Shared Component Library**: React components with Tailwind CSS styling

**Components**:
- Card component
- Gradient utilities
- Turborepo logo
- Shared styles with `ui-` prefix to prevent class conflicts

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 22+ (ARM64 Lambda functions)
- **Package Manager**: pnpm 10.11.0
- **Build System**: Turborepo 2.5.4
- **Framework**: Next.js 15.3.x
- **React**: v19.1.0
- **Styling**: Tailwind CSS v4.1.x
- **TypeScript**: v5.8.x
- **Infrastructure**: @donswayo/pulumi-nextjs-aws v1.1.0

### Infrastructure
- **IaC**: Pulumi v3.x
- **Cloud Provider**: AWS
- **Deployment**: OpenNext v3.7.0
- **CDN**: CloudFront
- **Storage**: S3
- **Database**: DynamoDB
- **Queue**: SQS
- **Compute**: Lambda

## Getting Started

### Prerequisites
- Node.js 22 or higher (recommended for development)
- pnpm 10.11.0
- AWS CLI configured with appropriate permissions
- Pulumi CLI v3.x installed

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pulumi-aws

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run all applications in development mode
pnpm dev

# Run specific app
pnpm --filter web dev
pnpm --filter docs dev

# Run linting
pnpm lint

# Type checking
pnpm check-types

# Format code
pnpm format
```

### Building for Production

```bash
# Build all applications
pnpm build

# Build specific app with OpenNext
pnpm --filter web build:open-next
```

## API Documentation

### @donswayo/pulumi-nextjs-aws

The `@donswayo/pulumi-nextjs-aws` package is a comprehensive Pulumi component that automates the deployment of Next.js applications to AWS using a serverless architecture. It leverages OpenNext to transform your Next.js application into a format optimized for AWS Lambda and CloudFront.

#### Key Architecture Components

1. **CloudFront Distribution**: Global CDN with HTTP/3 support and custom cache policies
2. **Lambda Functions**: 
   - Server function for SSR and API routes
   - Image optimization function for on-demand image processing
   - Revalidation function for ISR cache updates
   - Warmer function to prevent cold starts
3. **S3 Bucket**: Static asset storage with intelligent caching
4. **DynamoDB Table**: ISR cache persistence
5. **SQS Queue**: Revalidation event processing
6. **CloudWatch**: Monitoring and logging
7. **IAM Roles**: Least-privilege security policies

#### Features

- **Zero Configuration**: Works out of the box with sensible defaults
- **OpenNext v3 Compatible**: Latest OpenNext features and optimizations
- **Streaming Support**: Response streaming for better TTFB
- **Custom Domains**: Full support for custom domains with ACM certificates
- **Auto-scaling**: Automatic scaling based on demand
- **Cold Start Mitigation**: Lambda warmer functions and provisioned concurrency
- **Security Headers**: Automatic security headers via CloudFront
- **Geographic Distribution**: Multiple CloudFront price classes
- **Monitoring**: CloudWatch integration for metrics and alarms
- **Cost Optimization**: Configurable resources based on environment
- **TypeScript**: Full TypeScript support with type definitions

#### Installation

```bash
npm install @donswayo/pulumi-nextjs-aws
# or
pnpm add @donswayo/pulumi-nextjs-aws
```

#### Basic Usage

```typescript
import { Next } from "@donswayo/pulumi-nextjs-aws";

const app = new Next("my-app", {
  appPath: "./path-to-nextjs-app",
  openNextPath: ".open-next",
  streaming: true,
  tags: {
    Project: "MyProject",
    Environment: "production"
  }
});

export const url = app.url;
export const distributionId = app.distributionId;
```

#### Complete Configuration Options

```typescript
interface NextArgs {
  // Required
  appPath: string;                    // Path to Next.js application
  
  // Optional
  openNextPath?: string;               // OpenNext build output (default: ".open-next")
  streaming?: boolean;                 // Enable streaming responses (default: true)
  priceClass?: string;                 // CloudFront price class (default: "PriceClass_100")
  waitForDeployment?: boolean;         // Wait for CloudFront deployment (default: true)
  
  // Environment variables
  environment?: Record<string, string>;
  
  // Custom domain configuration
  domain?: {
    name: string;                      // Domain name (e.g., "app.example.com")
    certificateArn?: string;           // ACM certificate ARN
  };
  
  // Lambda configurations
  lambda?: {
    server?: {
      memory?: number;                 // MB (default: 1024)
      timeout?: number;                // Seconds (default: 30)
      reservedConcurrentExecutions?: number;
      provisionedConcurrency?: number; // Warm instances
    };
    image?: {
      memory?: number;                 // MB (default: 2048)
      timeout?: number;                // Seconds (default: 30)
    };
    revalidation?: {
      memory?: number;                 // MB (default: 128)
      timeout?: number;                // Seconds (default: 300)
    };
    warmer?: {
      enabled?: boolean;               // Enable warmer (default: true)
      memory?: number;                 // MB (default: 256)
      timeout?: number;                // Seconds (default: 900)
      concurrency?: number;            // Concurrent warm calls (default: 10)
      schedule?: string;               // CloudWatch schedule (default: "rate(3 minutes)")
    };
  };
  
  // CloudFront logging
  cloudFrontLogging?: {
    bucket: string;                    // S3 bucket for logs
    prefix?: string;                   // Log file prefix
  };
  
  // Resource tags
  tags?: Record<string, string>;
  
  useSharedPolicies?: boolean;         // Use shared CloudFront policies (default: true)
  
  security?: {
    enableOriginAccessControl?: boolean;  // Use OAC instead of OAI
    restrictGeoLocations?: string[];      // ISO country codes to restrict
    webAclId?: string;                    // Optional WAF ACL
  };
  
  alarmEmail?: string;                 // Email for CloudWatch alarm notifications
}
```

#### Advanced Examples

##### Example 1: Production Deployment with Custom Domain and Certificate

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Next } from "@donswayo/pulumi-nextjs-aws";

// Create ACM certificate for custom domain
const certificate = new aws.acm.Certificate("app-cert", {
  domainName: "app.example.com",
  validationMethod: "DNS",
  subjectAlternativeNames: ["*.app.example.com"],
});

// Deploy Next.js app with custom domain
const app = new Next("production-app", {
  appPath: "./apps/web",
  openNextPath: ".open-next",
  streaming: true,
  
  // Custom domain configuration
  domain: {
    name: "app.example.com",
    certificateArn: certificate.arn,
  },
  
  // Production-optimized Lambda configuration
  lambda: {
    server: {
      memory: 2048,
      timeout: 30,
      reservedConcurrentExecutions: 100,
      provisionedConcurrency: 5,  // Keep 5 instances warm
    },
    image: {
      memory: 3008,  // Maximum for image processing
      timeout: 60,
    },
    warmer: {
      enabled: true,
      concurrency: 20,
      schedule: "rate(2 minutes)",  // More aggressive warming
    },
  },
  
  // Environment variables
  environment: {
    NODE_ENV: "production",
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXT_PUBLIC_API_URL: "https://api.example.com",
    ANALYTICS_ID: "GA-XXXXXXXXX",
  },
  
  // CloudFront configuration
  priceClass: "PriceClass_All",  // Global distribution
  
  // Enable CloudFront logging
  cloudFrontLogging: {
    bucket: "my-cloudfront-logs",
    prefix: "production/",
  },
  
  tags: {
    Environment: "production",
    Team: "frontend",
    CostCenter: "engineering",
  },
});

// Create Route53 record
const zone = aws.route53.getZone({ name: "example.com" });
new aws.route53.Record("app-dns", {
  zoneId: zone.then(z => z.zoneId),
  name: "app.example.com",
  type: "A",
  aliases: [{
    name: app.distribution.domainName,
    zoneId: app.distribution.hostedZoneId,
    evaluateTargetHealth: false,
  }],
});

export const appUrl = app.url;
export const cloudFrontId = app.distributionId;
```

##### Example 2: Multi-Environment Setup with Conditional Configuration

```typescript
import * as pulumi from "@pulumi/pulumi";
import { Next } from "@donswayo/pulumi-nextjs-aws";

const config = new pulumi.Config();
const environment = config.get("environment") || "development";
const isProduction = environment === "production";

// Environment-specific configurations
const envConfigs = {
  development: {
    memory: 512,
    timeout: 20,
    priceClass: "PriceClass_100",
    provisionedConcurrency: 0,
    warmerEnabled: false,
  },
  staging: {
    memory: 1024,
    timeout: 25,
    priceClass: "PriceClass_200",
    provisionedConcurrency: 1,
    warmerEnabled: true,
  },
  production: {
    memory: 2048,
    timeout: 30,
    priceClass: "PriceClass_All",
    provisionedConcurrency: 10,
    warmerEnabled: true,
  },
};

const envConfig = envConfigs[environment as keyof typeof envConfigs];

const app = new Next(`app-${environment}`, {
  appPath: "./apps/web",
  
  lambda: {
    server: {
      memory: envConfig.memory,
      timeout: envConfig.timeout,
      provisionedConcurrency: envConfig.provisionedConcurrency,
    },
    warmer: {
      enabled: envConfig.warmerEnabled,
      schedule: isProduction ? "rate(1 minute)" : "rate(5 minutes)",
    },
  },
  
  priceClass: envConfig.priceClass,
  
  environment: {
    NODE_ENV: environment,
    NEXT_PUBLIC_APP_ENV: environment,
    NEXT_PUBLIC_API_URL: config.require("apiUrl"),
    SENTRY_DSN: config.getSecret("sentryDsn"),
  },
  
  tags: {
    Environment: environment,
    ManagedBy: "pulumi",
  },
});
```

##### Example 3: Monorepo with Multiple Apps Sharing Infrastructure

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Next } from "@donswayo/pulumi-nextjs-aws";

// Shared resources
const loggingBucket = new aws.s3.BucketV2("shared-logs", {
  versioning: { enabled: true },
  lifecycleRules: [{
    enabled: true,
    expiration: { days: 90 },
  }],
});

// Shared certificate for wildcard domain
const wildcardCert = new aws.acm.Certificate("wildcard-cert", {
  domainName: "*.apps.example.com",
  validationMethod: "DNS",
});

// Deploy multiple apps
const apps = [
  { name: "web", path: "./apps/web", subdomain: "www" },
  { name: "admin", path: "./apps/admin", subdomain: "admin" },
  { name: "docs", path: "./apps/docs", subdomain: "docs" },
];

const deployments = apps.map(app => {
  const deployment = new Next(`${app.name}-app`, {
    appPath: app.path,
    
    domain: {
      name: `${app.subdomain}.apps.example.com`,
      certificateArn: wildcardCert.arn,
    },
    
    lambda: {
      server: {
        memory: app.name === "web" ? 2048 : 1024,
        provisionedConcurrency: app.name === "web" ? 5 : 1,
      },
    },
    
    cloudFrontLogging: {
      bucket: loggingBucket.bucket,
      prefix: `${app.name}/`,
    },
    
    tags: {
      App: app.name,
      Project: "monorepo",
    },
  });
  
  return {
    name: app.name,
    url: deployment.url,
    distributionId: deployment.distributionId,
  };
});

export const appUrls = deployments.reduce((acc, app) => {
  acc[app.name] = app.url;
  return acc;
}, {} as Record<string, pulumi.Output<string>>);
```

##### Example 4: Edge Functions and Advanced CloudFront Configuration

```typescript
import { Next } from "@donswayo/pulumi-nextjs-aws";
import * as aws from "@pulumi/aws";

// Create Lambda@Edge function for additional processing
const edgeFunction = new aws.lambda.Function("edge-auth", {
  runtime: "nodejs20.x",
  handler: "index.handler",
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(`
      exports.handler = async (event) => {
        const request = event.Records[0].cf.request;
        const headers = request.headers;
        
        // Add security headers
        headers['strict-transport-security'] = [{
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubdomains; preload'
        }];
        
        headers['content-security-policy'] = [{
          key: 'Content-Security-Policy',
          value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline';"
        }];
        
        return request;
      };
    `),
  }),
  publish: true,
  role: edgeFunctionRole.arn,
});

const app = new Next("app-with-edge", {
  appPath: "./apps/web",
  
  // This component automatically handles CloudFront configuration
  // but you can extend it with additional edge functions if needed
  
  environment: {
    NEXT_PUBLIC_CDN_URL: "https://cdn.example.com",
  },
});
```

#### Component Outputs

The Next component exports several useful outputs for monitoring and integration:

```typescript
const app = new Next("my-app", { /* config */ });

// Available outputs
export const outputs = {
  // Primary outputs
  url: app.url,                           // CloudFront distribution URL
  distributionId: app.distributionId,     // CloudFront distribution ID
  bucketName: app.bucketName,             // S3 bucket name for assets
  
  // Lambda function outputs (if server rendering is enabled)
  serverFunctionUrl: app.serverFunctionUrl,   // Direct Lambda URL
  serverFunctionArn: app.serverFunctionArn,   // Lambda ARN
  imageFunctionUrl: app.imageFunctionUrl,     // Image optimization URL
  imageFunctionArn: app.imageFunctionArn,     // Image Lambda ARN
  
  // IAM outputs
  serverRoleArn: app.serverRoleArn,       // Server Lambda role ARN
  serverRoleName: app.serverRoleName,     // Server Lambda role name
};
```

#### Monitoring and Observability

##### CloudWatch Dashboards

```typescript
import * as aws from "@pulumi/aws";

// Create CloudWatch dashboard for monitoring
const dashboard = new aws.cloudwatch.Dashboard("app-dashboard", {
  dashboardName: "nextjs-app-metrics",
  dashboardBody: pulumi.interpolate`{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
            [".", "Duration", {"stat": "Average", "label": "Avg Duration"}],
            [".", "ConcurrentExecutions", {"stat": "Maximum", "label": "Max Concurrent"}]
          ],
          "period": 300,
          "stat": "Average",
          "region": "us-east-1",
          "title": "Lambda Metrics"
        }
      },
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/CloudFront", "Requests", {"stat": "Sum"}],
            [".", "BytesDownloaded", {"stat": "Sum"}],
            [".", "BytesUploaded", {"stat": "Sum"}],
            [".", "4xxErrorRate", {"stat": "Average"}],
            [".", "5xxErrorRate", {"stat": "Average"}]
          ],
          "period": 300,
          "stat": "Sum",
          "region": "us-east-1",
          "title": "CloudFront Metrics",
          "view": "timeSeries"
        }
      }
    ]
  }`,
});

// Create CloudWatch alarms
const errorAlarm = new aws.cloudwatch.MetricAlarm("high-error-rate", {
  comparisonOperator: "GreaterThanThreshold",
  evaluationPeriods: 2,
  metricName: "Errors",
  namespace: "AWS/Lambda",
  period: 60,
  statistic: "Sum",
  threshold: 10,
  alarmDescription: "Triggers when Lambda errors exceed threshold",
  dimensions: {
    FunctionName: app.serverFunctionArn.apply(arn => arn.split(":").pop()!),
  },
});
```

##### Cost Optimization

```typescript
// Use tags for cost allocation
const app = new Next("app", {
  appPath: "./apps/web",
  tags: {
    Environment: "production",
    CostCenter: "engineering",
    Project: "customer-portal",
    Owner: "frontend-team",
  },
});

// Set up budget alerts
const budget = new aws.budgets.Budget("app-budget", {
  budgetType: "COST",
  limitAmount: "1000",
  limitUnit: "USD",
  timePeriodStart: "2025-01-01",
  timeUnit: "MONTHLY",
  costFilters: [{
    name: "TagKeyValue",
    values: ["Project$customer-portal"],
  }],
});
```

## Deployment

### Infrastructure Setup

1. **Configure Pulumi**:
```bash
cd packages/infra
pulumi stack init <stack-name>
```

2. **Set Configuration**:
```bash
pulumi config set environment production
```

3. **Deploy Infrastructure**:
```bash
# Deploy web application
pnpm deploy:web

# Deploy documentation site
pnpm deploy:docs

# Preview changes before deployment
pnpm preview:web
pnpm preview:docs
```

### Deployment Configuration

The infrastructure supports multiple deployment configurations:

#### Development Environment
- Minimal Lambda memory allocation (512MB-1024MB)
- No provisioned concurrency
- Cost-optimized CloudFront price class

#### Production Environment
- Higher Lambda memory (1024MB-1536MB)
- Provisioned concurrency for reduced cold starts
- Lambda warmer functions (5-minute intervals)
- Global CloudFront distribution

### Environment Variables

Configure in `packages/infra/index.ts`:
```typescript
environment: {
  NODE_ENV: "production",
  NEXT_PUBLIC_APP_NAME: "Your App Name",
  // Add custom environment variables
}
```

## Scripts Reference

### Root Level
- `pnpm build` - Build all packages and applications
- `pnpm dev` - Start all applications in development mode
- `pnpm lint` - Run ESLint across all packages
- `pnpm check-types` - TypeScript type checking
- `pnpm format` - Format code with Prettier

### Infrastructure (`packages/infra`)
- `pnpm deploy:web` - Deploy web application infrastructure
- `pnpm deploy:docs` - Deploy documentation infrastructure
- `pnpm preview:web` - Preview web deployment changes
- `pnpm preview:docs` - Preview docs deployment changes
- `pnpm destroy:web` - Destroy web infrastructure
- `pnpm destroy:docs` - Destroy documentation infrastructure

### Applications
- `pnpm --filter web dev` - Run web app in development
- `pnpm --filter docs dev` - Run docs in development
- `pnpm --filter web build:open-next` - Build web app for AWS deployment

## Architecture

### Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  CloudFront  │────▶│   Lambda    │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │      S3      │     │  DynamoDB   │
                    │   (Assets)   │     │  (ISR Cache)│
                    └──────────────┘     └─────────────┘
```

### Lambda Functions

1. **Server Function**: Handles SSR and API routes
2. **Image Optimization**: On-demand image processing
3. **Revalidation Function**: Processes ISR revalidation
4. **Warmer Function**: Prevents cold starts

## Configuration

### Tailwind CSS

The monorepo uses a shared Tailwind configuration with:
- Shared design tokens
- Component-specific prefixes (`ui-` for UI package)
- Tailwind CSS v4 with PostCSS

### TypeScript

Shared TypeScript configurations for:
- Next.js applications
- React libraries
- Node.js packages

### ESLint

Unified linting rules including:
- Next.js specific rules
- Prettier integration
- TypeScript support

## Troubleshooting

### Common Issues and Solutions

#### 1. OpenNext Build Failures
```bash
# Ensure OpenNext is installed
pnpm add -D @opennextjs/aws

# Clear cache and rebuild
rm -rf .open-next
pnpm build:open-next
```

#### 2. Lambda Function Size Limits
- Use Lambda layers for large dependencies
- Enable output file tracing in next.config.js
- Optimize bundle size with tree shaking

#### 3. Cold Start Issues
```typescript
// Increase warmer configuration
lambda: {
  warmer: {
    concurrency: 30,  // Increase concurrent warm calls
    schedule: "rate(1 minute)",  // More frequent warming
  },
  server: {
    provisionedConcurrency: 10,  // Keep more instances warm
  }
}
```

#### 4. CloudFront Cache Issues
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

#### 5. Custom Domain SSL Certificate
- Certificate must be in us-east-1 region for CloudFront
- Use DNS validation for automatic renewal
- Allow time for DNS propagation

### Performance Optimization Tips

1. **Enable Streaming**: Reduces time to first byte
2. **Use ISR**: Incremental Static Regeneration for dynamic content
3. **Optimize Images**: Use Next.js Image component with optimization
4. **Enable HTTP/3**: Better performance on mobile networks
5. **Geographic Distribution**: Use appropriate CloudFront price class

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is private and proprietary.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [OpenNext](https://open-next.js.org/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [CloudFront](https://aws.amazon.com/cloudfront/)
