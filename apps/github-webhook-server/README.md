# Nucel GitHub Webhook Server

¡ GitHub App webhook server built with Hono


### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your GitHub App credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `GITHUB_APP_ID`: Your GitHub App ID
- `GITHUB_APP_PRIVATE_KEY`: Your GitHub App private key (PEM format)
- `GITHUB_WEBHOOK_SECRET`: Your webhook secret
- `GITHUB_CLIENT_ID`: OAuth client ID (optional)
- `GITHUB_CLIENT_SECRET`: OAuth client secret (optional)
- `NUCEL_DOMAIN`: Your deployment domain (default: nucel.cloud)
- `PORT`: Server port (default: 3000)

### 3. Run the Server

Development mode:
```bash
pnpm dev
```

Production mode:
```bash
pnpm build
pnpm start
```

## API Endpoints

### Health Checks

- `GET /health` - Simple health check
- `GET /health/detailed` - Detailed health status with checks
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/metrics` - Prometheus-compatible metrics

### Webhooks

- `POST /webhooks/github` - GitHub webhook receiver
- `POST /webhooks/test` - Test webhook endpoint (dev only)
- `GET /webhooks/deliveries` - List recent webhook deliveries

### API

#### Installations
- `GET /api/installations` - List all installations (paginated)
  - Query params: `page`, `limit`, `cursor`

#### Repositories
- `GET /api/repositories/:installationId` - List repositories for installation (paginated)
- `GET /api/repositories/:owner/:repo` - Get repository details
  - Query param: `installationId`

#### Deployments
- `POST /api/deploy` - Create a deployment
- `GET /api/deployments` - List deployments (paginated)
  - Query params: `owner`, `repo`, `installationId`, `page`, `limit`
- `POST /api/deployments/:deploymentId/status` - Update deployment status

#### Check Runs
- `POST /api/checks` - Create a check run

## Pagination

The API supports both page-based and cursor-based pagination:

### Page-based:
```
GET /api/installations?page=2&limit=20
```

### Cursor-based:
```
GET /api/installations?cursor=eyJpZCI6MTIzNDU2NywidGlt...&limit=20
```

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true,
    "nextCursor": "...",
    "prevCursor": "..."
  },
  "links": {
    "self": "/api/installations?page=2&limit=20",
    "next": "/api/installations?page=3&limit=20",
    "prev": "/api/installations?page=1&limit=20",
    "first": "/api/installations?page=1&limit=20",
    "last": "/api/installations?page=8&limit=20"
  }
}
```

## Rate Limiting

Different endpoints have different rate limits:

- **Webhooks**: 100 requests/minute
- **Read Operations**: 100 requests/minute
- **Write Operations**: 20 requests/minute
- **Deployments**: 10 requests/5 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time
- `Retry-After`: Seconds until retry (when limited)

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [...],
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

Error codes:
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `GITHUB_API_ERROR` - GitHub API error
- `INTERNAL_SERVER_ERROR` - Server error

## Testing Webhooks

For local development, use the test endpoint:

```bash
curl -X POST http://localhost:3000/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"event": "push", "repository": {"full_name": "test/repo"}}'
```

For production webhooks, configure your GitHub App webhook URL:
```
https://your-domain.com/webhooks/github
```