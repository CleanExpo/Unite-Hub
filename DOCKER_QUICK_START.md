# Docker Quick Start - Unite-Hub

Get Unite-Hub running with Docker in 5 minutes.

## Prerequisites

- Docker Desktop installed and running
- Git (to clone repository)

## 1. Setup Environment

```bash
# Clone repository
git clone https://github.com/your-org/unite-hub.git
cd unite-hub

# Copy environment template
cp .env.example .env.local

# Edit with your credentials
# Minimum required: NEXTAUTH_SECRET, SUPABASE_*, ANTHROPIC_API_KEY, GOOGLE_*
```

## 2. Start Docker

### Linux/Mac

```bash
# Make scripts executable (first time only)
chmod +x docker/*.sh

# Start production mode
./docker/start.sh

# OR start development mode (with hot reload)
./docker/start.sh --dev
```

### Windows

```cmd
REM Start production mode
docker\start.bat

REM OR start development mode
docker\start.bat --dev
```

### Using npm scripts (any OS)

```bash
# Production
npm run docker:start

# Development
npm run docker:start:dev
```

## 3. Access Application

- **App**: http://localhost:3008
- **Health Check**: http://localhost:3008/api/health

## 4. Common Commands

### View Logs

```bash
# All services
npm run docker:logs

# App only
npm run docker:logs:app

# Or use helper scripts
./docker/logs.sh app          # Linux/Mac
docker\logs.bat app           # Windows
```

### Stop Services

```bash
# Stop containers (keep data)
npm run docker:stop

# Stop and remove all data
npm run docker:stop:clean

# Or use helper scripts
./docker/stop.sh              # Linux/Mac
docker\stop.bat               # Windows
```

### Restart Services

```bash
# Rebuild and restart
npm run docker:rebuild

# Or use helper scripts
./docker/rebuild.sh           # Linux/Mac
docker\rebuild.bat            # Windows
```

### Access Container Shell

```bash
# Open shell in app container
npm run docker:shell

# Or directly
docker-compose exec app sh
```

## 5. Troubleshooting

### Port Already in Use

Change port in `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "3009:3008"  # Use 3009 instead
```

### Container Won't Start

```bash
# View logs
npm run docker:logs:app

# Check status
docker-compose ps

# Rebuild from scratch
npm run docker:rebuild
```

### Health Check Failing

```bash
# Test health endpoint
curl http://localhost:3008/api/health

# View health check logs
docker inspect unite-hub-app --format='{{json .State.Health}}' | jq
```

## 6. Advanced Usage

### Include Local PostgreSQL

```bash
# Instead of Supabase Cloud
./docker/start.sh --local-db        # Linux/Mac
docker\start.bat --local-db         # Windows
```

### Include Nginx Proxy

```bash
# Add reverse proxy with rate limiting
./docker/start.sh --proxy           # Linux/Mac
docker\start.bat --proxy            # Windows
```

### Combine Options

```bash
# Development + Local DB + Proxy
./docker/start.sh --dev --local-db --proxy
```

## 7. Production Deployment

For production deployment, see:
- [DOCKER_SETUP.md](docs/DOCKER_SETUP.md) - Complete guide
- [DOCKER_TROUBLESHOOTING.md](docs/DOCKER_TROUBLESHOOTING.md) - Advanced debugging

## Quick Reference Card

| Task | Command |
|------|---------|
| Start | `npm run docker:start` |
| Start (dev) | `npm run docker:start:dev` |
| Stop | `npm run docker:stop` |
| Logs | `npm run docker:logs:app` |
| Shell | `npm run docker:shell` |
| Rebuild | `npm run docker:rebuild` |
| Health | `npm run docker:health` |

---

Need help? See [DOCKER_SETUP.md](docs/DOCKER_SETUP.md) for full documentation.
