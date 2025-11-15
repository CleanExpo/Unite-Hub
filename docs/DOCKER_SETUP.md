# Docker Setup Guide - Unite-Hub

Complete guide for running Unite-Hub with Docker in development and production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [Service Profiles](#service-profiles)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Docker Desktop** (v20.10+)
   - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: Install Docker Engine + Docker Compose

2. **Git** (for cloning the repository)

3. **Text Editor** (VSCode recommended)

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space
- **CPU**: 2 cores minimum, 4 cores recommended

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/unite-hub.git
cd unite-hub
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local  # or use your preferred editor
```

**Minimum Required Variables:**

```env
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Start Services

```bash
# Make scripts executable (Linux/Mac)
chmod +x docker/*.sh

# Start production mode
./docker/start.sh

# OR start development mode
./docker/start.sh --dev
```

### 4. Access Application

- **App**: http://localhost:3008
- **Health Check**: http://localhost:3008/api/health
- **Redis**: localhost:6379

---

## Configuration

### Environment Variables

Unite-Hub uses `.env.local` for configuration. See `.env.example` for all available options.

#### Core Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | NextAuth.js encryption key | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `ANTHROPIC_API_KEY` | Claude AI API key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ✅ |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `DATABASE_URL` | PostgreSQL connection (if local) | - |
| `ORG_ID` | Default organization ID | - |
| `WORKSPACE_ID` | Default workspace ID | - |

### Docker Compose Profiles

Unite-Hub supports different service combinations via Docker Compose profiles:

#### Default (No Profile)

```bash
./docker/start.sh
```

Services: App + Redis

#### Local Database

```bash
./docker/start.sh --local-db
```

Services: App + Redis + PostgreSQL

Use this if you want to run PostgreSQL locally instead of Supabase Cloud.

#### Nginx Proxy

```bash
./docker/start.sh --proxy
```

Services: App + Redis + Nginx

Adds reverse proxy with rate limiting and caching.

#### Combined

```bash
./docker/start.sh --local-db --proxy
```

Services: App + Redis + PostgreSQL + Nginx

---

## Development Mode

Development mode provides hot reload and debugging capabilities.

### Start Development Environment

```bash
./docker/start.sh --dev
```

### Features

- **Hot Reload**: Code changes reflect immediately
- **Source Maps**: Full debugging support
- **Volume Mounts**: Local code mounted into container
- **Debug Port**: Port 9229 exposed for Node.js debugging

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "protocol": "inspector"
    }
  ]
}
```

### Development Workflow

```bash
# Start dev environment
./docker/start.sh --dev

# View logs
./docker/logs.sh app

# Execute commands in container
docker-compose exec app sh

# Inside container
npm run email-agent
npm run content-agent
npm run orchestrator

# Restart service
docker-compose restart app

# Stop environment
./docker/stop.sh
```

---

## Production Mode

Production mode uses optimized builds with standalone output.

### Build Production Image

```bash
# Build and start
./docker/start.sh --build

# Or rebuild from scratch
./docker/rebuild.sh --no-cache
```

### Production Optimizations

1. **Multi-stage Build**: Minimal image size (~150MB)
2. **Standalone Output**: Self-contained server
3. **Non-root User**: Security best practice
4. **Health Checks**: Automatic restart on failure
5. **Resource Limits**: Prevent resource exhaustion

### Production Deployment

#### Using Docker Compose

```bash
# Start production stack
docker-compose up -d

# With local database
docker-compose --profile local-db up -d

# With Nginx proxy
docker-compose --profile proxy up -d
```

#### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml unite-hub

# Check services
docker stack services unite-hub

# Remove stack
docker stack rm unite-hub
```

#### Using Kubernetes

See `docs/KUBERNETES_DEPLOYMENT.md` (to be created).

---

## Service Profiles

### App Service

**Container**: `unite-hub-app`
**Port**: 3008
**Health Check**: `/api/health`

The main Next.js application with all AI agents.

### Redis Service

**Container**: `unite-hub-redis`
**Port**: 6379
**Health Check**: `redis-cli ping`

Caching layer for session storage and rate limiting.

**Configuration**:
- Max memory: 256MB (production), 128MB (dev)
- Eviction policy: `allkeys-lru`
- Persistence: Append-only file (production only)

### PostgreSQL Service

**Container**: `unite-hub-postgres`
**Port**: 5432
**Profile**: `local-db`

Optional local database (alternative to Supabase Cloud).

**Credentials**:
- Database: `unite_hub`
- User: `unite_hub_user`
- Password: Set in `.env.local`

### Nginx Service

**Container**: `unite-hub-nginx`
**Port**: 80, 443
**Profile**: `proxy`

Reverse proxy with rate limiting and SSL/TLS support.

**Features**:
- API rate limiting: 10 req/s
- General rate limiting: 50 req/s
- Static file caching
- Gzip compression
- Security headers

---

## Commands Reference

### Helper Scripts

All scripts are in `docker/` directory.

#### Start Services

```bash
./docker/start.sh [OPTIONS]

Options:
  --dev        Development mode (hot reload)
  --local-db   Include PostgreSQL service
  --proxy      Include Nginx reverse proxy
  --build      Rebuild images before starting
```

#### Stop Services

```bash
./docker/stop.sh [OPTIONS]

Options:
  --clean      Remove volumes (deletes data)
```

#### Rebuild Images

```bash
./docker/rebuild.sh [OPTIONS]

Options:
  --no-cache   Build without Docker cache
```

#### View Logs

```bash
./docker/logs.sh [SERVICE] [OPTIONS]

Services:
  app          Next.js application
  redis        Redis cache
  postgres     PostgreSQL database
  nginx        Nginx proxy

Options:
  --no-follow  Don't follow logs (show and exit)
```

### Docker Compose Commands

```bash
# List running services
docker-compose ps

# View logs
docker-compose logs -f [service]

# Execute command in container
docker-compose exec app sh

# Restart service
docker-compose restart [service]

# Scale service (app only, since it's stateless)
docker-compose up -d --scale app=3

# View resource usage
docker-compose stats

# Remove everything (including volumes)
docker-compose down -v
```

### Docker Commands

```bash
# List all containers
docker ps -a

# Inspect container
docker inspect unite-hub-app

# View container logs
docker logs -f unite-hub-app

# Execute shell in container
docker exec -it unite-hub-app sh

# Copy files to/from container
docker cp local-file.txt unite-hub-app:/app/
docker cp unite-hub-app:/app/file.txt ./

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Error**: `Bind for 0.0.0.0:3008 failed: port is already allocated`

**Solution**:

```bash
# Find process using port 3008
lsof -i :3008  # Mac/Linux
netstat -ano | findstr :3008  # Windows

# Kill process or change port in docker-compose.yml
ports:
  - "3009:3008"  # Map to different host port
```

#### Container Fails Health Check

**Error**: Container shows as "unhealthy"

**Solution**:

```bash
# Check health check logs
docker inspect --format='{{json .State.Health}}' unite-hub-app | jq

# View application logs
docker logs unite-hub-app

# Check health endpoint manually
curl http://localhost:3008/api/health
```

#### Out of Memory

**Error**: Container killed or OOM errors

**Solution**:

```bash
# Increase Docker Desktop memory limit
# Settings > Resources > Memory > 4GB+

# Or limit container memory in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
```

#### Build Failures

**Error**: Docker build fails during `npm install`

**Solution**:

```bash
# Clear npm cache
docker-compose build --no-cache

# Check .dockerignore (shouldn't ignore package.json)
cat .dockerignore

# Manually build with verbose output
docker build --progress=plain -t unite-hub .
```

#### Permission Errors

**Error**: Permission denied when accessing files

**Solution**:

```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Or run container as root (not recommended)
docker-compose exec --user root app sh
```

#### Database Connection Errors

**Error**: Cannot connect to Supabase or PostgreSQL

**Solution**:

```bash
# Verify environment variables
docker-compose exec app printenv | grep SUPABASE

# Test connection from container
docker-compose exec app sh
nc -zv your-project.supabase.co 5432

# Check .env.local is mounted correctly
docker-compose exec app cat /app/.env.local
```

### Debugging Tips

#### 1. Check Container Status

```bash
docker-compose ps
```

All containers should show "Up" and "healthy".

#### 2. View Full Logs

```bash
# All services
docker-compose logs --tail=100

# Specific service with timestamps
docker-compose logs --tail=50 --timestamps app
```

#### 3. Inspect Container

```bash
# View container configuration
docker inspect unite-hub-app

# Check environment variables
docker exec unite-hub-app printenv

# Check file system
docker exec unite-hub-app ls -la /app
```

#### 4. Test Health Endpoints

```bash
# App health check
curl http://localhost:3008/api/health

# Redis health check
docker-compose exec redis redis-cli ping

# PostgreSQL health check (if using local-db)
docker-compose exec postgres pg_isready -U unite_hub_user
```

#### 5. Network Debugging

```bash
# Check Docker networks
docker network ls

# Inspect unite-hub network
docker network inspect unite-hub-network

# Test connectivity between containers
docker-compose exec app ping redis
docker-compose exec app nc -zv postgres 5432
```

### Performance Issues

#### Slow Build Times

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Or set in environment
export DOCKER_BUILDKIT=1
```

#### Slow Container Startup

```bash
# Reduce dependencies in development
# Use .dockerignore to exclude unnecessary files

# Use smaller base image
# alpine images are ~5MB vs ~100MB for full images
```

#### High Memory Usage

```bash
# Monitor resource usage
docker stats

# Optimize Redis memory
# In docker-compose.yml, reduce maxmemory:
command: redis-server --maxmemory 128mb
```

---

## Next Steps

- [Docker Troubleshooting Guide](DOCKER_TROUBLESHOOTING.md)
- [Kubernetes Deployment](KUBERNETES_DEPLOYMENT.md)
- [Production Best Practices](PRODUCTION_BEST_PRACTICES.md)
- [Security Hardening](SECURITY_HARDENING.md)

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
