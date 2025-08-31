# Nucel CLI

Open-source deployment platform for modern web applications. Deploy Next.js, SvelteKit, and React Router applications to AWS without infrastructure complexity.

## Overview

Nucel abstracts away the complexity of AWS deployments using Pulumi's Automation API. No Pulumi CLI installation required - everything runs through the Nucel CLI with inline Pulumi programs.

## Features

- **Zero Configuration Deployments** - Automatic framework detection and optimal AWS configuration
- **Pulumi Automation API** - Infrastructure as code without Pulumi CLI dependency
- **Multi-Framework Support** - Production-ready deployments for Next.js, SvelteKit, and React Router v7
- **Environment Management** - Automatic environment variable loading and injection
- **Stack Management** - Multiple deployment environments (dev, staging, production)
- **Preview Deployments** - Dry-run capability to review changes before deployment

## Installation

```bash
npm install -g nucel
# or
pnpm add -g nucel
# or
yarn global add nucel
```

## Quick Start

```bash
# In your project directory
nucel deploy
```

That's it! Nucel will:
1. Detect your framework (Next.js, SvelteKit, or React Router)
2. Build your application
3. Deploy to AWS using optimal settings

## Commands

### `nucel deploy`

Deploy your application to AWS.

```bash
nucel deploy [options]

Options:
  -s, --stack <stack>  Stack name (default: "dev")
  --preview           Preview changes without deploying (dry run)
```

### `nucel destroy`

Destroy your application infrastructure.

```bash
nucel destroy [options]

Options:
  -s, --stack <stack>  Stack name (default: "dev")
```

## Configuration

### Automatic Configuration

Nucel automatically:
- Detects your framework from `package.json`
- Uses your project name from `package.json`
- Loads environment variables from `.env`, `.env.local`, `.env.production`
- Configures optimal AWS settings for your framework

### Manual Configuration

Create a `nucel.config.ts` file in your project root:

```typescript
import { defineConfig } from 'nucel';

export default defineConfig({
  // Override project name
  name: 'my-awesome-app',
  
  // Specify framework (auto-detected by default)
  framework: 'nextjs', // 'nextjs' | 'sveltekit' | 'react-router'
  
  // Custom build command
  buildCommand: 'pnpm build',
  
  // Output directory
  outputDirectory: '.next',
  
  // Environment variables
  environment: {
    API_URL: 'https://api.example.com',
    // Secrets are handled securely
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // AWS configuration
  aws: {
    region: 'us-west-2',
    profile: 'production', // Optional AWS profile
  },
  
  // Custom domains
  domains: ['example.com', 'www.example.com'],
  
  // Custom headers
  headers: {
    'X-Custom-Header': 'value',
  },
  
  // URL rewrites
  rewrites: [
    { source: '/old-path', destination: '/new-path' },
  ],
  
  // Redirects
  redirects: [
    { source: '/old', destination: '/new', permanent: true },
  ],
});
```

## Environment Variables

### Automatic Loading

Nucel automatically loads environment variables from:
- `.env`
- `.env.local`
- `.env.production`

### Framework-Specific Variables

**Next.js**: Variables prefixed with `NEXT_PUBLIC_` are included
**SvelteKit**: Variables prefixed with `PUBLIC_` are included  
**React Router**: Variables prefixed with `VITE_` are included

### AWS Credentials

Configure AWS credentials using standard methods:

```bash
# AWS CLI
aws configure

# Environment variables
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_REGION=us-east-1

# AWS Profile
export AWS_PROFILE=production
```

## Framework Support

### Next.js

- Automatic OpenNext build
- Server-side rendering
- API routes
- Image optimization
- ISR support

### SvelteKit

- SSR and CSR support
- Adapter automatically configured
- API endpoints
- Static assets optimization

### React Router v7

- Server-side rendering
- Data loaders
- Actions support
- Streaming responses

## How It Works

Nucel deploy your application without requiring any installation. It:

1. **Detects Framework** - Analyzes your `package.json` and project structure
2. **Loads Configuration** - Merges automatic detection with `nucel.config.ts`
3. **Builds Application** - Runs framework-specific build commands
4. **Creates Infrastructure** - Uses Pulumi Automation API to provision AWS resources:
   - Lambda functions for SSR
   - S3 buckets for static assets
   - CloudFront CDN for global distribution
   - API Gateway for routing
5. **Deploys Code** - Uploads your built application to AWS

## Requirements

- Node.js 22+
- AWS Account with configured credentials
- One of the supported frameworks:
  - Next.js 14+
  - SvelteKit 2.0+
  - React Router v7+

## Development

```bash
# Clone the repository
git clone https://github.com/DonsWayo/nucel

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run locally
node dist/index.js deploy
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © [DonsWayo](https://github.com/DonsWayo)

## Support

- [GitHub Issues](https://github.com/DonsWayo/nucel/issues)
- [Documentation](https://nucel.dev/docs)
- [Discord Community](https://discord.gg/nucel)

---

Built with ❤️ by the Nucel team