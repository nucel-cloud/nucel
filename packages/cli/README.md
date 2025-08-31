# Nucel CLI

Open-source deployment platform for modern web applications. Deploy Next.js, SvelteKit, and React Router applications to AWS without infrastructure complexity.

## Overview

Nucel abstracts away the complexity of AWS deployments using Pulumi's Automation API. No Pulumi CLI installation required - everything runs through the Nucel CLI with inline Pulumi programs.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Configuration](#configuration)
- [AWS Credentials](#aws-credentials)
- [Environment Variables](#environment-variables)
- [Supported Frameworks](#supported-frameworks)
- [Architecture](#architecture)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Features

- **Zero Configuration Deployments** - Automatic framework detection and optimal AWS configuration
- **Pulumi Automation API** - Infrastructure as code without Pulumi CLI dependency
- **Multi-Framework Support** - Production-ready deployments for Next.js, SvelteKit, and React Router v7
- **Environment Management** - Automatic environment variable loading and injection
- **Stack Management** - Multiple deployment environments (dev, staging, production)
- **Preview Deployments** - Dry-run capability to review changes before deployment

## Prerequisites

- Node.js 22.0 or higher
- AWS Account with appropriate IAM permissions
- AWS credentials configured (see [AWS Credentials](#aws-credentials) section)
- Supported framework project (Next.js, SvelteKit, or React Router v7)

## Installation

### Global Installation

```bash
npm install -g @donswayo/nucel-cli
```

### Local Installation

```bash
npm install --save-dev @donswayo/nucel-cli
```

For local installation, use `npx nucel` to run commands.

## Quick Start

### Basic Deployment

```bash
# Navigate to your project directory
cd my-nextjs-app

# Deploy to development environment
nucel deploy

# Deploy to production environment
nucel deploy --stack production

# Preview changes without deploying
nucel deploy --preview
```

### Using AWS Vault

```bash
# Deploy with aws-vault for secure credential management
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="" \
  aws-vault exec personal --no-session -- nucel deploy

# Deploy to production with aws-vault
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="" \
  aws-vault exec production --no-session -- nucel deploy --stack production

# Preview deployment with aws-vault
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="" \
  aws-vault exec personal --no-session -- nucel deploy --preview
```

## Commands

### Deploy Command

```bash
nucel deploy [options]
```

Deploys your application to AWS. Automatically detects framework, builds the application, and provisions AWS infrastructure.

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --stack <name>` | Target deployment stack | `dev` |
| `--preview` | Preview changes without applying | `false` |

#### Examples

```bash
# Deploy to development
nucel deploy

# Deploy to production
nucel deploy --stack production

# Preview deployment changes
nucel deploy --preview

# Deploy specific stack with preview
nucel deploy --stack staging --preview
```

### Destroy Command

```bash
nucel destroy [options]
```

Removes all AWS infrastructure for the specified stack.

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --stack <name>` | Target stack to destroy | `dev` |

#### Examples

```bash
# Destroy development infrastructure
nucel destroy

# Destroy production infrastructure
nucel destroy --stack production

# Destroy with aws-vault
AWS_DEFAULT_REGION=us-east-1 aws-vault exec personal --no-session -- \
  nucel destroy --stack staging
```

## Configuration

### Automatic Configuration

Nucel automatically detects and configures:

1. **Framework Detection** - Analyzes package.json dependencies and project structure
2. **Project Naming** - Uses package.json name field for resource naming
3. **Build Commands** - Determines appropriate build command for detected framework
4. **Output Directories** - Identifies build output location based on framework
5. **Environment Variables** - Loads from .env files in priority order
6. **AWS Region** - Uses AWS_REGION environment variable or defaults to us-east-1

### Configuration File

Create a `nucel.config.ts` or `nucel.config.js` file in your project root for custom configuration:

```typescript
// nucel.config.ts
export default {
  // Project name (used for AWS resource naming)
  name: 'my-app',
  
  // Framework override (auto-detected if not specified)
  framework: 'nextjs', // 'nextjs' | 'sveltekit' | 'react-router'
  
  // Custom build command
  buildCommand: 'npm run build',
  
  // Build output directory
  outputDirectory: '.next',
  
  // Runtime environment variables
  environment: {
    API_URL: 'https://api.example.com',
    DATABASE_URL: process.env.DATABASE_URL,
    ANALYTICS_ID: 'UA-123456',
  },
  
  // AWS configuration
  aws: {
    region: 'us-west-2',
    profile: 'production', // AWS CLI profile name
  },
  
  // Custom domains (requires Route53 hosted zone)
  domains: ['example.com', 'www.example.com'],
  
  // HTTP headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
  },
  
  // URL rewrites
  rewrites: [
    { source: '/api/:path*', destination: 'https://api.example.com/:path*' },
  ],
  
  // Redirects
  redirects: [
    { source: '/old-path', destination: '/new-path', permanent: true },
  ],
};
```

## AWS Credentials

### Configuration Methods

Nucel supports multiple AWS credential configuration methods:

#### 1. AWS Vault (Recommended for Development)

```bash
# Configure aws-vault profile
aws-vault add personal

# Deploy using aws-vault
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="" \
  aws-vault exec personal --no-session -- nucel deploy

# Deploy to production
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="" \
  aws-vault exec production --no-session -- nucel deploy --stack production

# Preview changes
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="" \
  aws-vault exec personal --no-session -- nucel deploy --preview
```

#### 2. AWS CLI Profiles

```bash
# Configure AWS CLI profile
aws configure --profile production

# Deploy using profile
AWS_PROFILE=production nucel deploy --stack production
```

#### 3. Environment Variables

```bash
export AWS_ACCESS_KEY_ID="*****"
export AWS_SECRET_ACCESS_KEY="****"
export AWS_DEFAULT_REGION="us-east-1"

nucel deploy
```

#### 4. IAM Instance Roles (EC2/ECS/Lambda)

When running on AWS infrastructure with IAM roles attached, credentials are automatically resolved.

### Required IAM Permissions

The AWS credentials must have permissions to create and manage:

- Lambda functions and function URLs
- S3 buckets and objects
- CloudFront distributions
- IAM roles and policies
- CloudWatch log groups
- API Gateway (for some frameworks)

## Environment Variables

### Loading Priority

Environment variables are loaded in the following order (later files override earlier ones):

1. `.env` - Default environment variables
2. `.env.production` - Production-specific variables
3. `.env.test` - Test environment variables
4. `.env.local` - Local overrides (not committed to version control)
5. Process environment variables

### Framework-Specific Conventions

| Framework | Public Variables | Server Variables |
|-----------|-----------------|------------------|
| Next.js | `NEXT_PUBLIC_*` | All other variables |
| SvelteKit | `PUBLIC_*` | All other variables |
| React Router | `VITE_*` | N/A (client-side only) |

### Example .env File

```bash
# .env
DATABASE_URL=postgresql://localhost/myapp
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-123456789
```

## Supported Frameworks

### Next.js

**Requirements:** Next.js 14.0 or higher

**Features:**
- Server-side rendering (SSR)
- Static site generation (SSG)
- Incremental static regeneration (ISR)
- API routes
- Image optimization
- Middleware support
- App Router and Pages Router

**Build Configuration:**
```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  // Nucel handles the rest
}
```

### SvelteKit

**Requirements:** SvelteKit 2.0 or higher with AWS adapter

**Features:**
- Server-side rendering (SSR)
- Client-side rendering (CSR)
- API endpoints
- Static asset optimization
- Form actions
- Load functions

**Adapter Configuration:**
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-aws';

export default {
  kit: {
    adapter: adapter()
  }
}
```

### React Router v7

**Requirements:** React Router 7.0 or higher

**Features:**
- Server-side rendering
- Data loaders and actions
- Streaming responses
- Nested routing
- Error boundaries
- Deferred data loading

**Build Configuration:**
```javascript
// react-router.config.ts
export default {
  ssr: true,
  // Nucel handles deployment configuration
}
```

## Architecture

### Deployment Process

1. **Configuration Loading**
   - Detects framework from package.json dependencies
   - Loads nucel.config.ts if present
   - Merges environment variables from .env files
   - Validates configuration

2. **Build Phase**
   - Executes framework-specific build command
   - Optimizes assets for production
   - Generates server and client bundles

3. **Infrastructure Provisioning**
   - Creates Pulumi inline program
   - Provisions AWS resources
   - Configures security policies
   - Sets up CDN distribution

4. **Deployment**
   - Uploads server code to Lambda
   - Syncs static assets to S3
   - Invalidates CloudFront cache
   - Returns deployment URL

### AWS Resources Created

| Resource | Purpose | Configuration |
|----------|---------|---------------|
| Lambda Function | Server-side rendering | 1GB memory, 10s timeout |
| S3 Bucket | Static assets | Private, CloudFront access only |
| CloudFront Distribution | CDN | Global edge locations |
| Lambda Function URL | HTTP endpoint | Public access |
| IAM Execution Role | Lambda permissions | Minimal required permissions |
| CloudWatch Log Group | Application logs | 7-day retention |

## Stack Management

### Understanding Stacks

Stacks are isolated deployment environments. Each stack maintains its own:
- AWS resources
- Configuration
- State file
- Environment variables

### Common Stack Patterns

```bash
# Development workflow
nucel deploy --stack dev

# Staging deployment
nucel deploy --stack staging

# Production deployment
nucel deploy --stack production

# Feature branch deployment
nucel deploy --stack feature-auth

# Preview deployment
nucel deploy --stack pr-123 --preview
```

### Stack State

Nucel uses local state management by default. State files are stored in:
```
.pulumi/
  stacks/
    dev.json
    staging.json
    production.json
```

**Important:** Add `.pulumi/` to your `.gitignore` file.

## Production Deployment

### Complete Production Setup

```bash
# 1. Configure production AWS credentials
aws-vault add production

# 2. Create production environment file
cat > .env.production << EOF
DATABASE_URL=postgresql://prod-db.example.com/myapp
REDIS_URL=redis://prod-redis.example.com:6379
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=GA-PRODUCTION
EOF

# 3. Create Nucel configuration
cat > nucel.config.ts << EOF
export default {
  name: 'my-production-app',
  aws: {
    region: 'us-east-1',
  },
  domains: ['example.com', 'www.example.com'],
  environment: {
    NODE_ENV: 'production',
  },
}
EOF

# 4. Preview production deployment
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="secure-password" \
  aws-vault exec production --no-session -- \
  nucel deploy --stack production --preview

# 5. Deploy to production
AWS_DEFAULT_REGION=us-east-1 PULUMI_CONFIG_PASSPHRASE="secure-password" \
  aws-vault exec production --no-session -- \
  nucel deploy --stack production
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Nucel
        run: npm install -g @donswayo/nucel-cli
      
      - name: Deploy to production
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1
          PULUMI_CONFIG_PASSPHRASE: ${{ secrets.PULUMI_PASSPHRASE }}
        run: nucel deploy --stack production
```

## Troubleshooting

### Common Issues

#### AWS Credentials Not Found

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Set credentials explicitly
export AWS_PROFILE=personal
nucel deploy

# Use aws-vault
aws-vault exec personal -- nucel deploy
```

#### Build Failures

```bash
# Run build command manually
npm run build

# Check framework-specific requirements
nucel deploy --preview

# Verify build output directory
ls -la .next  # For Next.js
ls -la build  # For React Router
```

#### Pulumi Passphrase Required

```bash
# Set passphrase for local state
export PULUMI_CONFIG_PASSPHRASE="your-secure-passphrase"
nucel deploy

# Or use empty passphrase for development
PULUMI_CONFIG_PASSPHRASE="" nucel deploy
```

#### Framework Not Detected

```bash
# Specify framework explicitly in nucel.config.ts
export default {
  framework: 'nextjs', // or 'sveltekit' or 'react-router'
}
```

## License

MIT

## Support

- GitHub Issues: https://github.com/donswayo/pulu-front
- Documentation: https://github.com/donswayo/pulu-front/tree/main/apps/docs