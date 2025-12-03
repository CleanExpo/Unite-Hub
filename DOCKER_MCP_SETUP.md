# Docker MCP Setup Guide - Unite-Hub

## Overview

This guide walks through setting up Docker-based MCP (Model Context Protocol) servers to offload resource-intensive terminal operations to isolated containers.

**Benefits:**
- 70-80% faster file/code search (offloaded to MCP)
- Terminal remains responsive during builds
- Isolated process execution (no blocking)
- Database operations via MCP
- Git operations without blocking

---

## Architecture

```
Claude Code Terminal
        ↓
    MCP Gateway (Port 3200)
        ↓
    ┌───┴───┬──────┬──────┐
    ↓       ↓      ↓      ↓
Filesystem Process Database Git
 (3100)   (3101)  (3102) (3103)
```

### Tier 1: Critical (Recommended to start)
- **Filesystem MCP**: File read/write, glob search, content search
- **Process MCP**: Bash execution, npm commands, Docker control

### Tier 2: High Value (Add after Tier 1 working)
- **Database MCP**: Supabase queries, migrations
- **Git MCP**: Git operations, GitHub integration

---

## Quick Start

### 1. Prerequisites

```bash
# Verify Docker is running
docker version

# Verify you're in the Unite-Hub directory
cd d:\Unite-Hub
```

### 2. Build MCP Servers

```bash
# Build all MCP server images
docker-compose -f docker-compose.mcp.yml build

# Expected output:
# [+] Building 0.0s (N/N) FINISHED
# ...
```

### 3. Start MCP Services

```bash
# Start MCP gateway and all servers
docker-compose -f docker-compose.mcp.yml up -d

# Expected output:
# [+] Running 5/5
#  ✔ Network unite-hub-mcp-network  Created
#  ✔ Container unite-hub-mcp-filesystem  Started
#  ✔ Container unite-hub-mcp-process    Started
#  ✔ Container unite-hub-mcp-database   Started
#  ✔ Container unite-hub-mcp-git        Started
#  ✔ Container unite-hub-mcp-gateway    Started
```

### 4. Verify Health

```bash
# Check all containers are running
docker-compose -f docker-compose.mcp.yml ps

# Expected output:
# NAME                        STATUS
# unite-hub-mcp-filesystem    Up (healthy)
# unite-hub-mcp-process       Up (healthy)
# unite-hub-mcp-database      Up (healthy)
# unite-hub-mcp-git           Up (healthy)
# unite-hub-mcp-gateway       Up (healthy)

# Test gateway is responding
curl http://localhost:3200/health

# Expected output: {"status":"ok"}
```

### 5. Configure Claude Code

Copy `.claude/mcp-docker.json` to `.claude/mcp.json`:

```bash
cp .claude/mcp-docker.json .claude/mcp.json
```

Or update your Claude Code configuration to connect to the gateway:

```json
{
  "mcpServers": {
    "unite-hub-filesystem": {
      "type": "sse",
      "url": "http://localhost:3200/mcp/filesystem"
    },
    "unite-hub-process": {
      "type": "sse",
      "url": "http://localhost:3200/mcp/process"
    }
  }
}
```

### 6. Test MCP Integration

```bash
# In Claude Code, try these commands:

# Test filesystem MCP
claude "Search for all TypeScript files in src/: use the unite-hub-filesystem MCP"

# Test process MCP
claude "Run 'npm --version' and show output using the unite-hub-process MCP"
```

---

## Monitoring

### View Logs

```bash
# View all MCP logs
docker-compose -f docker-compose.mcp.yml logs -f

# View specific service logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-filesystem
docker-compose -f docker-compose.mcp.yml logs -f mcp-process
docker-compose -f docker-compose.mcp.yml logs -f mcp-gateway
```

### Check Resource Usage

```bash
# See CPU/memory consumption
docker stats unite-hub-mcp-*

# Expected (under light load):
# NAME                    CPU %   MEM USAGE / LIMIT
# unite-hub-mcp-filesystem   0.0%   45MB / 512MB
# unite-hub-mcp-process      0.0%   120MB / 4GB
# unite-hub-mcp-database     0.0%   60MB / 1GB
# unite-hub-mcp-git          0.0%   40MB / 512MB
# unite-hub-mcp-gateway      0.0%   80MB / 512MB
```

---

## Common Tasks

### Add a New MCP Server

1. Create `docker/mcp/Dockerfile.{name}`
2. Add to `docker-compose.mcp.yml` under `services:`
3. Add to MCP gateway server registry
4. Update `.claude/mcp.json`
5. Rebuild: `docker-compose -f docker-compose.mcp.yml build`

### Stop MCP Services

```bash
docker-compose -f docker-compose.mcp.yml down
```

### Clean Up (Remove containers and volumes)

```bash
docker-compose -f docker-compose.mcp.yml down -v
```

### Rebuild Without Cache

```bash
docker-compose -f docker-compose.mcp.yml build --no-cache
```

### Scale a Service (e.g., multiple process workers)

```yaml
# In docker-compose.mcp.yml
mcp-process:
  ...
  deploy:
    replicas: 3  # Run 3 instances
```

Then restart: `docker-compose -f docker-compose.mcp.yml up -d`

---

## Troubleshooting

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3200
```

Solution:
```bash
# Find process using port 3200
netstat -ano | findstr :3200

# Kill it
taskkill /PID <PID> /F

# Restart MCP
docker-compose -f docker-compose.mcp.yml up -d
```

### Container Fails to Start

```bash
# Check logs
docker-compose -f docker-compose.mcp.yml logs mcp-filesystem

# Common issues:
# - Missing Dockerfile
# - Docker socket permission denied (for process MCP)
# - Insufficient disk space
```

### Claude Code Not Connecting

1. Verify gateway is running: `docker ps | grep mcp-gateway`
2. Test gateway health: `curl http://localhost:3200/health`
3. Check Claude Code config: `.claude/mcp.json` has correct URLs
4. Restart Claude Code if changed config

### Database Connection Errors

```
Error: getaddrinfo ENOTFOUND database

# This means container can't reach Supabase
# Add DEBUG: export DATABASE_URL to see connection attempt
```

---

## Performance Tuning

### Memory Limits

If containers are using too much memory, adjust in `docker-compose.mcp.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 1G  # Reduce from 4G for process MCP
```

Then restart: `docker-compose -f docker-compose.mcp.yml up -d`

### CPU Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1'  # Limit to 1 CPU core
```

### Disk Cache

```bash
# Clean Docker cache (keeps images/volumes)
docker builder prune

# Clean all unused Docker resources
docker system prune -a
```

---

## What's Next?

After Tier 1 is working:

1. **Add Database MCP** (Tier 2):
   - Uncomment database service in `docker-compose.mcp.yml`
   - Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars
   - Rebuild: `docker-compose -f docker-compose.mcp.yml build`

2. **Add Git MCP** (Tier 2):
   - Uncomment git service
   - Set `GITHUB_TOKEN` env var
   - Rebuild and restart

3. **Monitor Performance**:
   - Compare terminal responsiveness before/after
   - Check `docker stats` during builds
   - Measure search speed improvements

---

## References

- **Docker Compose Reference**: https://docs.docker.com/compose/compose-file/
- **MCP Specification**: https://modelcontextprotocol.io/
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Windows Docker Setup**: https://docs.docker.com/desktop/setup/install/windows-install/

---

**Status**: MCP architecture ready for Tier 1 deployment
**Last Updated**: 2025-12-03
