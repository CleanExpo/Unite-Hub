# Zero-Downtime Deployment Guide

## Overview

Unite-Hub implements blue-green deployment strategy for zero-downtime production deployments. This approach:

- **Eliminates service interruptions** during deployments
- **Enables instant rollbacks** if issues arise
- **Reduces deployment risk** with gradual traffic switching
- **Supports continuous deployment** for rapid iteration

## Architecture

### Blue-Green Deployment Pattern

```
┌─────────────────────────────────────────┐
│           Nginx Load Balancer           │
│         (Traffic Routing Layer)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌────────────────┐      ┌────────────────┐
│  Blue Slot     │      │  Green Slot    │
│  (Port 3008)   │      │  (Port 3009)   │
│  Active ✅      │      │  Standby ⏸      │
└────────────────┘      └────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
            ┌───────▼────────┐
            │  Redis Cache   │
            │  (Port 6379)   │
            └────────────────┘
```

### Deployment Flow

```
1. Blue slot active, serving traffic
2. Deploy new version to green slot
3. Health check green slot
4. Switch nginx to route to green
5. Monitor green for stability
6. Stop blue slot (old version)
```

## Quick Start

### 1. Initial Setup

Create production environment file:

```bash
cp .env.example .env.production
```

Configure required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
ANTHROPIC_API_KEY=sk-ant-your-key

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Production settings
NODE_ENV=production
ENABLE_DB_POOLER=true
ENABLE_APM=true
APM_PROVIDER=datadog
```

### 2. Build Production Image

```bash
docker-compose -f docker-compose.production.yml build
```

### 3. Deploy to Blue Slot

```bash
./scripts/deploy-blue-green.sh blue
```

### 4. Verify Deployment

```bash
curl http://localhost/api/health/system
```

### 5. Deploy Update to Green Slot

```bash
./scripts/deploy-blue-green.sh green
```

Traffic automatically switches to green if health checks pass.

## Deployment Script

### Usage

```bash
./scripts/deploy-blue-green.sh [blue|green] [options]
```

### Options

- `--dry-run` - Show what would be done without executing
- `--skip-tests` - Skip health checks (NOT recommended)
- `--force` - Force deployment even if health checks fail
- `--rollback` - Rollback to previous deployment
- `--version VERSION` - Deploy specific version (default: latest)

### Examples

**Deploy to blue slot**:
```bash
./scripts/deploy-blue-green.sh blue
```

**Deploy specific version**:
```bash
./scripts/deploy-blue-green.sh green --version v1.2.3
```

**Dry run (test without executing)**:
```bash
./scripts/deploy-blue-green.sh blue --dry-run
```

**Rollback to previous version**:
```bash
./scripts/deploy-blue-green.sh --rollback
```

**Force deployment (skip health checks)**:
```bash
./scripts/deploy-blue-green.sh green --force
```

## Manual Deployment Steps

### Step 1: Build Image

```bash
docker-compose -f docker-compose.production.yml build unite-hub-blue
```

### Step 2: Deploy to Slot

```bash
docker-compose -f docker-compose.production.yml up -d unite-hub-blue
```

### Step 3: Health Check

```bash
# Wait for container to start
sleep 30

# Check health
curl http://localhost:3008/api/health/system

# Expected response (status 200):
{
  "status": "healthy",
  "checks": [...],
  "uptime": 30000
}
```

### Step 4: Update Nginx

Edit `nginx/nginx.conf`:

```nginx
upstream unite_hub {
    server unite-hub-blue:3000;  # Change to blue or green
}
```

Reload nginx:

```bash
docker-compose -f docker-compose.production.yml exec nginx-lb nginx -s reload
```

### Step 5: Monitor

```bash
# Watch logs
docker-compose -f docker-compose.production.yml logs -f unite-hub-blue

# Check metrics
curl http://localhost/api/health/system
```

### Step 6: Stop Old Slot

```bash
docker-compose -f docker-compose.production.yml stop unite-hub-green
```

## Rollback Procedure

### Automatic Rollback

```bash
./scripts/deploy-blue-green.sh --rollback
```

This will:
1. Detect current active slot
2. Restart previous slot
3. Health check previous slot
4. Switch nginx to previous slot
5. Stop current slot

### Manual Rollback

1. **Restart previous slot**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d unite-hub-green
   ```

2. **Health check**:
   ```bash
   curl http://localhost:3009/api/health/system
   ```

3. **Update nginx.conf** to point to green

4. **Reload nginx**:
   ```bash
   docker-compose -f docker-compose.production.yml exec nginx-lb nginx -s reload
   ```

5. **Stop current slot**:
   ```bash
   docker-compose -f docker-compose.production.yml stop unite-hub-blue
   ```

## Health Checks

### Automated Health Checks

The deployment script performs automated health checks:

- **Interval**: Every 5 seconds
- **Timeout**: 60 seconds total
- **Endpoint**: `/api/health/system`
- **Success Criteria**: HTTP 200 status

### Manual Health Check

```bash
curl -i http://localhost:3008/api/health/system
```

**Healthy Response** (200):
```json
{
  "status": "healthy",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "latency": 45
    },
    {
      "name": "redis",
      "status": "healthy",
      "latency": 12
    },
    {
      "name": "ai_service",
      "status": "healthy"
    }
  ],
  "uptime": 3600000,
  "version": "1.0.0"
}
```

**Degraded Response** (206):
```json
{
  "status": "degraded",
  "checks": [
    {
      "name": "redis",
      "status": "degraded",
      "error": "Connection timeout"
    }
  ]
}
```

**Unhealthy Response** (503):
```json
{
  "status": "unhealthy",
  "checks": [
    {
      "name": "database",
      "status": "unhealthy",
      "error": "Connection refused"
    }
  ]
}
```

## Monitoring

### View Logs

**All services**:
```bash
docker-compose -f docker-compose.production.yml logs -f
```

**Specific slot**:
```bash
docker-compose -f docker-compose.production.yml logs -f unite-hub-blue
```

**Nginx**:
```bash
docker-compose -f docker-compose.production.yml logs -f nginx-lb
```

### Check Container Status

```bash
docker-compose -f docker-compose.production.yml ps
```

### Metrics

Access metrics via health endpoint:

```bash
curl http://localhost/api/health/system | jq .
```

## Troubleshooting

### Deployment Fails Health Check

**Symptoms**: Health check times out after 60 seconds

**Solutions**:
1. Check container logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs unite-hub-blue
   ```

2. Verify environment variables:
   ```bash
   docker-compose -f docker-compose.production.yml exec unite-hub-blue env
   ```

3. Test health endpoint directly:
   ```bash
   docker-compose -f docker-compose.production.yml exec unite-hub-blue curl http://localhost:3000/api/health/system
   ```

4. Check database connectivity:
   ```bash
   docker-compose -f docker-compose.production.yml exec unite-hub-blue nc -zv db.your-project.supabase.co 5432
   ```

### Nginx Configuration Error

**Symptoms**: `nginx -t` fails

**Solutions**:
1. Validate nginx config:
   ```bash
   docker-compose -f docker-compose.production.yml exec nginx-lb nginx -t
   ```

2. Check nginx error logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs nginx-lb
   ```

3. Restore backup configuration:
   ```bash
   cp nginx/nginx.conf.backup nginx/nginx.conf
   docker-compose -f docker-compose.production.yml exec nginx-lb nginx -s reload
   ```

### Both Slots Running

**Symptoms**: Both blue and green slots consuming resources

**Solutions**:
1. Determine active slot:
   ```bash
   docker ps --filter name=unite-hub
   ```

2. Stop standby slot:
   ```bash
   docker-compose -f docker-compose.production.yml stop unite-hub-green
   ```

### Database Connection Errors

**Symptoms**: "Connection refused" or "Too many connections"

**Solutions**:
1. Enable connection pooling:
   ```env
   ENABLE_DB_POOLER=true
   DB_POOL_SIZE=20
   ```

2. Check Supabase dashboard for connection limits

3. Verify DATABASE_URL is correct

### Redis Connection Failures

**Symptoms**: Circuit breaker opens, cache misses increase

**Solutions**:
1. Check Redis container:
   ```bash
   docker-compose -f docker-compose.production.yml logs redis
   ```

2. Test Redis connection:
   ```bash
   docker-compose -f docker-compose.production.yml exec redis redis-cli ping
   ```

3. Reset circuit breaker (if needed):
   ```bash
   # Via API (to be implemented)
   curl -X POST http://localhost/api/admin/redis/reset-circuit
   ```

## Performance Optimization

### Multi-Stage Build

The Dockerfile uses multi-stage builds to:
- Reduce final image size (50-70% smaller)
- Separate build dependencies from runtime
- Improve build caching

### Resource Limits

Add to `docker-compose.production.yml`:

```yaml
services:
  unite-hub-blue:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Connection Pooling

Enable database pooling for 60-80% latency reduction:

```env
ENABLE_DB_POOLER=true
DB_POOLER_MODE=transaction
DB_POOL_SIZE=20
```

## Security Checklist

- [ ] Environment variables stored securely (not in git)
- [ ] Non-root user in Docker container (configured)
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Firewall rules configured (ports 80, 443 only)
- [ ] Database credentials rotated regularly
- [ ] API keys stored in secrets management
- [ ] Docker image scanned for vulnerabilities
- [ ] Health check endpoint does not expose sensitive data
- [ ] Rate limiting configured in nginx
- [ ] Security headers enabled (CSP, HSTS, etc.)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and push Docker image
        run: |
          docker-compose -f docker-compose.production.yml build
          docker push your-registry/unite-hub:${{ github.sha }}

      - name: Deploy to blue slot
        run: |
          ssh production-server ./scripts/deploy-blue-green.sh blue --version ${{ github.sha }}

      - name: Notify on failure
        if: failure()
        run: |
          curl -X POST https://hooks.slack.com/your-webhook \
            -d '{"text":"Deployment failed!"}'
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] DNS records updated
- [ ] Monitoring configured (Datadog/etc.)
- [ ] Backup strategy in place
- [ ] Rollback procedure tested
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

## Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Blue-Green Deployment Pattern](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Zero-Downtime Deployments](https://sysdig.com/blog/zero-downtime-deployments/)

---

**Last Updated**: 2025-01-15
**Status**: Production Ready
