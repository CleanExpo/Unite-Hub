# Docker Troubleshooting Guide - Unite-Hub

Advanced troubleshooting for Docker deployment issues.

## Table of Contents

- [Container Issues](#container-issues)
- [Network Issues](#network-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Build Issues](#build-issues)

---

## Container Issues

### Container Won't Start

#### Symptom

```bash
docker-compose up -d
# Container exits immediately
```

#### Diagnosis

```bash
# Check container status
docker-compose ps

# View exit code
docker inspect unite-hub-app --format='{{.State.ExitCode}}'

# View logs
docker-compose logs app
```

#### Common Causes

1. **Missing Environment Variables**

```bash
# Check if .env.local exists
ls -la .env.local

# Verify required variables
docker-compose config | grep -A 20 environment
```

**Fix**: Ensure all required variables are set in `.env.local`

2. **Port Conflict**

```bash
# Check if port 3008 is in use
lsof -i :3008  # Mac/Linux
netstat -ano | findstr :3008  # Windows
```

**Fix**: Change port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3009:3008"  # Use different host port
```

3. **Dependency Failure**

```bash
# Check Redis health
docker-compose logs redis
docker-compose exec redis redis-cli ping
```

**Fix**: Ensure dependencies start before app:

```yaml
services:
  app:
    depends_on:
      redis:
        condition: service_healthy
```

### Container Restarts Continuously

#### Symptom

```bash
docker-compose ps
# STATUS shows "Restarting"
```

#### Diagnosis

```bash
# Check restart count
docker inspect unite-hub-app --format='{{.RestartCount}}'

# View recent logs
docker-compose logs --tail=100 app
```

#### Common Causes

1. **Failed Health Check**

```bash
# Test health endpoint
curl http://localhost:3008/api/health

# Check health check logs
docker inspect unite-hub-app --format='{{json .State.Health}}' | jq
```

**Fix**: Increase health check timeout:

```yaml
healthcheck:
  interval: 30s
  timeout: 10s
  start_period: 60s  # Increase startup grace period
  retries: 5
```

2. **Application Crash**

```bash
# Look for Node.js errors
docker-compose logs app | grep -i error

# Common errors:
# - "Cannot find module" → Missing dependencies
# - "EADDRINUSE" → Port conflict
# - "ECONNREFUSED" → Database connection failure
```

**Fix**: Address specific error (see error message sections below)

### Container Shows as "Unhealthy"

#### Symptom

```bash
docker-compose ps
# STATUS shows "Up (unhealthy)"
```

#### Diagnosis

```bash
# Check health status
docker inspect unite-hub-app --format='{{.State.Health.Status}}'

# View health check output
docker inspect unite-hub-app \
  --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

#### Solutions

1. **Health Endpoint Not Responding**

```bash
# Test from inside container
docker-compose exec app sh
wget -O- http://localhost:3008/api/health

# Test from host
curl http://localhost:3008/api/health
```

**Fix**: Verify `/api/health/route.ts` exists and is correct

2. **Slow Startup**

**Fix**: Increase `start_period` in health check:

```yaml
healthcheck:
  start_period: 90s  # Give app more time to start
```

---

## Network Issues

### Cannot Connect Between Containers

#### Symptom

```bash
docker-compose exec app sh
ping redis
# ping: bad address 'redis'
```

#### Diagnosis

```bash
# Check network exists
docker network ls | grep unite-hub

# Inspect network
docker network inspect unite-hub-network

# Verify containers are on same network
docker inspect unite-hub-app --format='{{.NetworkSettings.Networks}}'
docker inspect unite-hub-redis --format='{{.NetworkSettings.Networks}}'
```

#### Solutions

1. **Network Not Created**

```bash
# Manually create network
docker network create unite-hub-network

# Or recreate with docker-compose
docker-compose down
docker-compose up -d
```

2. **Container Not Connected**

```bash
# Connect container to network
docker network connect unite-hub-network unite-hub-app
```

### DNS Resolution Failing

#### Symptom

```bash
# Inside container
nslookup redis
# Server: 127.0.0.11
# Address: 127.0.0.11:53
# ** server can't find redis: NXDOMAIN
```

#### Solutions

1. **Use Container Name, Not Service Name**

```bash
# Wrong
ping app

# Right
ping unite-hub-app
```

2. **Use Service Name in docker-compose**

Within docker-compose network, use service names:

```yaml
environment:
  REDIS_URL: redis://redis:6379  # ✅ Use service name
  # NOT: redis://unite-hub-redis:6379  # ❌
```

### External Connections Failing

#### Symptom

Cannot access Supabase, Claude API, etc. from container

#### Diagnosis

```bash
# Test DNS resolution
docker-compose exec app nslookup api.anthropic.com

# Test connectivity
docker-compose exec app wget -O- https://api.anthropic.com

# Check proxy settings
docker-compose exec app printenv | grep -i proxy
```

#### Solutions

1. **Corporate Proxy**

Add to `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      HTTP_PROXY: http://proxy.company.com:8080
      HTTPS_PROXY: http://proxy.company.com:8080
      NO_PROXY: localhost,127.0.0.1,redis,postgres
```

2. **Firewall Blocking**

```bash
# Test from host first
curl https://api.anthropic.com

# If host works, Docker networking issue
# Check Docker Desktop network settings
```

---

## Database Issues

### Cannot Connect to Supabase

#### Symptom

```
Error: connection to server at "xxx.supabase.co" failed
```

#### Diagnosis

```bash
# Test from container
docker-compose exec app sh
nc -zv xxx.supabase.co 5432

# Check environment variables
docker-compose exec app printenv | grep SUPABASE
```

#### Solutions

1. **Wrong URL**

```bash
# Verify Supabase URL format
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  # ✅
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co/  # ❌ No trailing slash
```

2. **Network Restrictions**

```bash
# Allow Supabase IP ranges in firewall
# See: https://supabase.com/docs/guides/platform/network-restrictions
```

### PostgreSQL Container Won't Start

#### Symptom

```bash
docker-compose --profile local-db up -d
# postgres container exits
```

#### Diagnosis

```bash
# View PostgreSQL logs
docker-compose logs postgres

# Common errors:
# - "data directory has wrong ownership"
# - "database files are incompatible with server"
```

#### Solutions

1. **Permission Issues**

```bash
# Fix volume permissions
docker-compose down
docker volume rm unite-hub-postgres-data
docker-compose --profile local-db up -d
```

2. **Incompatible Data**

```bash
# Backup and recreate
docker-compose exec postgres pg_dump -U unite_hub_user unite_hub > backup.sql
docker-compose down -v
docker-compose --profile local-db up -d
docker-compose exec -T postgres psql -U unite_hub_user unite_hub < backup.sql
```

### Database Connection Pool Exhausted

#### Symptom

```
Error: sorry, too many clients already
```

#### Solutions

1. **Increase PostgreSQL Connections**

```yaml
services:
  postgres:
    command: postgres -c max_connections=200
```

2. **Fix Connection Leaks**

Ensure all database queries properly close connections.

---

## Performance Issues

### Slow Container Startup

#### Symptom

Container takes 60+ seconds to start

#### Diagnosis

```bash
# Check startup time
docker-compose up -d
time docker-compose exec app wget -O- http://localhost:3008/api/health
```

#### Solutions

1. **Reduce Dependencies**

```dockerfile
# Use multi-stage build to minimize image size
FROM node:20-alpine AS deps
# ... install dependencies

FROM node:20-alpine AS runner
COPY --from=deps /app/node_modules ./node_modules
```

2. **Optimize Health Check**

```yaml
healthcheck:
  interval: 30s
  timeout: 5s
  start_period: 120s  # Longer grace period
  retries: 3
```

### High Memory Usage

#### Symptom

```bash
docker stats
# unite-hub-app uses 1.5GB+ memory
```

#### Diagnosis

```bash
# Check Node.js heap
docker-compose exec app sh
node -e "console.log(process.memoryUsage())"
```

#### Solutions

1. **Set Memory Limits**

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

2. **Optimize Node.js Heap**

```yaml
services:
  app:
    environment:
      NODE_OPTIONS: --max-old-space-size=512
```

### Slow Build Times

#### Symptom

`docker-compose build` takes 10+ minutes

#### Solutions

1. **Use BuildKit**

```bash
DOCKER_BUILDKIT=1 docker-compose build
```

2. **Optimize .dockerignore**

```
node_modules
.next
.git
*.md
docs/
tests/
```

3. **Layer Caching**

```dockerfile
# Copy package files first (rarely change)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes often)
COPY . .
```

---

## Security Issues

### Container Running as Root

#### Diagnosis

```bash
docker-compose exec app whoami
# root  ← BAD
```

#### Solution

Verify Dockerfile uses non-root user:

```dockerfile
USER nextjs  # Should be present
```

### Secrets in Logs

#### Symptom

API keys visible in `docker-compose logs`

#### Solution

1. **Never Log Secrets**

```typescript
// BAD
console.log('API Key:', process.env.ANTHROPIC_API_KEY);

// GOOD
console.log('API Key:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing');
```

2. **Filter Logs**

```bash
# View logs without secrets
docker-compose logs app | grep -v "API_KEY"
```

### Exposed Ports

#### Diagnosis

```bash
# Check exposed ports
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

#### Solution

Only expose necessary ports:

```yaml
services:
  redis:
    # Development - expose for debugging
    ports:
      - "6379:6379"

    # Production - no exposure (app connects via internal network)
    # ports:  # commented out
```

---

## Build Issues

### npm install Fails

#### Symptom

```
ERROR: npm install failed
```

#### Diagnosis

```bash
# Build with verbose output
docker build --progress=plain --no-cache .
```

#### Solutions

1. **Network Timeout**

```dockerfile
RUN npm config set fetch-timeout 60000
RUN npm ci
```

2. **Platform Mismatch**

```dockerfile
# Force platform (Apple Silicon → Linux)
FROM --platform=linux/amd64 node:20-alpine
```

### COPY Fails

#### Symptom

```
COPY failed: file not found
```

#### Solutions

1. **Check Build Context**

```bash
# Ensure building from project root
cd /path/to/unite-hub
docker build -t unite-hub .
```

2. **Verify .dockerignore**

```
# Don't ignore required files
!package.json
!package-lock.json
```

### Multi-stage Build Issues

#### Symptom

```
COPY --from=deps failed: stage not found
```

#### Solutions

1. **Name Stages Correctly**

```dockerfile
FROM node:20-alpine AS deps  # ✅ Named stage

COPY --from=deps /app ./  # ✅ Matches stage name
```

2. **Build Specific Stage**

```bash
# Build and test specific stage
docker build --target deps -t unite-hub-deps .
```

---

## Advanced Debugging

### Attach Debugger

```bash
# VSCode launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app"
}
```

### Inspect Filesystem

```bash
# Copy container filesystem to host
docker cp unite-hub-app:/app ./container-dump

# Inspect
ls -la container-dump
```

### Network Packet Capture

```bash
# Install tcpdump in container
docker-compose exec --user root app apk add tcpdump

# Capture traffic
docker-compose exec --user root app \
  tcpdump -i any -w /tmp/capture.pcap

# Copy to host
docker cp unite-hub-app:/tmp/capture.pcap ./
```

### Strace System Calls

```bash
# Attach strace to running process
docker-compose exec --user root app apk add strace
docker-compose exec --user root app strace -p 1
```

---

## Getting Help

If issues persist:

1. **Check Docker Logs**
   ```bash
   # Docker daemon logs
   # Mac: ~/Library/Containers/com.docker.docker/Data/log/
   # Linux: /var/log/docker.log
   ```

2. **GitHub Issues**
   - Search existing issues
   - Create new issue with full logs

3. **Community Support**
   - Discord: [Link]
   - Stack Overflow: Tag `unite-hub`

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
