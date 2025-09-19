# AWS Static Site Stack

Deploy static sites and SPAs to AWS S3 and CloudFront with Nucel.

## Features

- **S3 + CloudFront** - Fast, global CDN distribution
- **Secure by Default** - Private S3 bucket with Origin Access Control (OAC)
- **Custom Domains** - Support for custom domains with ACM certificates
- **SPA Support** - Automatic routing for single-page applications
- **Smart Caching** - Optimized cache behaviors for different file types
- **CloudFront Logging** - Optional access logs for analytics
- **Resource Tagging** - Consistent tagging across all resources

## Usage

### Basic Deployment

```typescript
import { StaticSite } from "@nucel.cloud/static-aws-stack";

const site = new StaticSite("my-app", {
  sitePath: "./dist", // Path to your built static files
});

export const url = site.url;
```

### With Custom Domain

```typescript
import { StaticSite } from "@nucel.cloud/static-aws-stack";

const site = new StaticSite("my-app", {
  sitePath: "./dist",
  domain: {
    name: "app.example.com",
    includeWWW: true, // Also creates www.app.example.com
  },
});

export const url = site.url;
```

### With Existing Certificate

```typescript
import { StaticSite } from "@nucel.cloud/static-aws-stack";

const site = new StaticSite("my-app", {
  sitePath: "./dist",
  domain: {
    name: "app.example.com",
    certificateArn: "arn:aws:acm:us-east-1:123456789:certificate/...",
  },
});
```

### Advanced Configuration

```typescript
import { StaticSite } from "@nucel.cloud/static-aws-stack";

const site = new StaticSite("my-app", {
  sitePath: "./dist",
  
  // Custom domain configuration
  domain: {
    name: "app.example.com",
    includeWWW: true,
  },
  
  // CloudFront configuration
  priceClass: "PriceClass_100", // Use only North America and Europe edge locations
  waitForDeployment: true, // Wait for CloudFront deployment to complete
  
  // Logging configuration
  logging: {
    prefix: "cdn-logs/",
    includeCookies: false,
  },
  
  // SPA configuration (default handles most SPAs)
  customErrorResponses: [
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 0,
    },
  ],
  
  // Environment and tagging
  environment: "production",
  tags: {
    Environment: "production",
    Project: "my-app",
  },
});

// Invalidate cache after deployment
site.invalidateCache(["/*"]);

export const url = site.url;
export const distributionId = site.distributionId;
```

## Configuration Options

### StaticSiteArgs

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `sitePath` | `string` | Path to static files to deploy | Required |
| `domain` | `DomainConfig` | Custom domain configuration | - |
| `priceClass` | `string` | CloudFront price class | `PriceClass_100` |
| `logging` | `CloudFrontLoggingConfig` | CloudFront access logging | - |
| `waitForDeployment` | `boolean` | Wait for CloudFront deployment | `true` |
| `customErrorResponses` | `CustomErrorResponse[]` | Error page configuration | SPA defaults |
| `cacheBehaviors` | `CacheBehavior[]` | Custom cache behaviors | - |
| `environment` | `string` | Environment name for resources | - |
| `tags` | `Record<string, string>` | Tags for all resources | - |
| `defaultRootObject` | `string` | Default index document | `index.html` |
| `enableCompression` | `boolean` | Enable CloudFront compression | `true` |

### DomainConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | `string` | Domain name (e.g., "example.com") | Required |
| `certificateArn` | `string` | Existing ACM certificate ARN | Auto-created |
| `includeWWW` | `boolean` | Include www subdomain | `true` |
| `hostedZoneId` | `string` | Route53 hosted zone ID | Auto-detected |

## Default Caching Strategy

The stack implements smart caching behaviors:

- **HTML files**: No cache (`max-age=0, must-revalidate`)
- **JS/CSS files**: Long cache (1 year with immutable)
- **Images**: Long cache (1 year)
- **Fonts**: Long cache (1 year)
- **JSON files**: Short cache (1 hour)

## SPA Support

By default, the stack is configured for single-page applications:

1. 404 errors return `index.html` with 200 status
2. 403 errors return `index.html` with 200 status
3. Client-side routing works out of the box

## Cache Invalidation

After deployment, you can invalidate the CloudFront cache:

```typescript
// Invalidate all files
site.invalidateCache(["/*"]);

// Invalidate specific paths
site.invalidateCache(["/index.html", "/app.js"]);
```

## Cost Optimization

- Uses `PriceClass_100` by default (North America & Europe only)
- Implements efficient caching to reduce origin requests
- S3 versioning enabled for rollback capability
- Optional CloudFront logging (only pay for S3 storage)

## Security

- S3 bucket is completely private
- CloudFront uses Origin Access Control (OAC)
- Minimum TLS 1.2 for HTTPS connections
- Automatic security headers can be added

## Outputs

The stack exports the following values:

- `url`: The CloudFront URL (or custom domain if configured)
- `distributionId`: CloudFront distribution ID
- `distributionDomainName`: CloudFront domain name
- `bucketName`: S3 bucket name
- `bucketArn`: S3 bucket ARN
- `certificateArn`: ACM certificate ARN (if created)