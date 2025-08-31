# Nucel

Deploy modern web applications without vendor lock-in. Own your infrastructure. Pay only for what you use.

## Installation

```bash
npm install -g @donswayo/nucel-cli
```

## Usage

```bash
# Deploy your app (auto-detects framework)
nucel deploy

# Deploy to production
nucel deploy --stack production

# Preview changes
nucel deploy --preview
```

## Supported Frameworks

- **Next.js 14+** - App Router, Pages Router, ISR, Streaming SSR
- **SvelteKit 2+** - SSR, Form Actions, Adapters
- **React Router v7** - Full Remix features, Loaders, Actions

## Why Nucel?

- **Full Ownership** - Runs in YOUR cloud account
- **Zero Platform Fees** - Only pay cloud costs (~$5/month)
- **No Vendor Lock-in** - Open source, portable
- **Unlimited Everything** - No limits on builds, bandwidth, or team members
- **Multi-Cloud Ready** - AWS today, GCP/Azure/Cloudflare coming

## Documentation

Full docs at: https://nucel.dev (coming soon)

For now: [./apps/docs](./apps/docs)

## Packages

| Package | Description |
|---------|-------------|
| [@donswayo/nucel-cli](https://www.npmjs.com/package/@donswayo/nucel-cli) | CLI for deployments |
| [@donswayo/pulumi-nextjs-aws](https://www.npmjs.com/package/@donswayo/pulumi-nextjs-aws) | Next.js adapter |
| [@donswayo/pulumi-sveltekit-aws](https://www.npmjs.com/package/@donswayo/pulumi-sveltekit-aws) | SvelteKit adapter |
| [@donswayo/pulumi-react-router-aws](https://www.npmjs.com/package/@donswayo/pulumi-react-router-aws) | React Router v7 adapter |

## License

MIT