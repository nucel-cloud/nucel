# @repo/infra

Infrastructure deployment for all pulumi-aws apps using Pulumi and AWS.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Initialize Pulumi stacks:
   ```bash
   cd packages/infra
   pulumi stack init docs
   pulumi stack init web
   ```

## Deployment

### Deploy docs app:
```bash
pnpm deploy:docs
```

### Deploy web app:
```bash
pnpm deploy:web
```

## Commands

- `pnpm deploy:docs` - Deploy the docs app
- `pnpm deploy:web` - Deploy the web app
- `pnpm preview:docs` - Preview docs deployment changes
- `pnpm preview:web` - Preview web deployment changes
- `pnpm destroy:docs` - Destroy docs infrastructure
- `pnpm destroy:web` - Destroy web infrastructure

## Configuration

Each stack can be configured with:

```bash
# Set environment
pulumi config set environment production -s docs

# Set custom domain (optional)
pulumi config set domainName docs.example.com -s docs
pulumi config set certificateArn arn:aws:acm:... -s docs
```

## Build Before Deploy

Remember to build your apps with OpenNext before deploying:

```bash
# Build docs
cd apps/docs
npx open-next@latest build

# Build web
cd apps/web
npx open-next@latest build
```