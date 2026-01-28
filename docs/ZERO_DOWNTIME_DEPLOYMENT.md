# Zero-Downtime Deployment Guide

**Status**: ✅ Production-Ready
**Last Updated**: 2026-01-28
**Version**: 1.0

---

## Overview

Unite-Hub uses a **blue-green deployment strategy** with Docker Compose and Nginx load balancer to achieve zero-downtime deployments.

### Architecture

```
┌─────────────────┐
│  Nginx LB :80   │  ← Single entry point
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Blue │  │Green │  ← Two identical deployment slots
│ :3008│  │:3009 │
└───┬──┘  └──┬───┘
    │        │
    └────┬───┘
         │
    ┌────▼────┐
    │  Redis  │  ← Shared cache
    └─────────┘
```

---

## Quick Start

### Standard Deployment

```bash
# Deploy to the inactive slot (automatically detected)
./scripts/deploy-blue-green.sh

# Deploy to specific slot
./scripts/deploy-blue-green.sh blue
```

### Rollback

```bash
./scripts/deploy-blue-green.sh --rollback
```

---

## Deployment Process

1. **Build Phase** - New Docker image built
2. **Deploy Phase** - Container started in inactive slot
3. **Health Check** - 60 seconds of health checks
4. **Traffic Switch** - Nginx updated to route to new slot
5. **Monitoring** - 30 seconds post-deployment monitoring
6. **Cleanup** - Old slot stopped

**Total Time**: ~5-6 minutes (zero user-facing downtime)

---

## Files

- **Dockerfile**: `Dockerfile.production` (multi-stage builds)
- **Compose**: `docker-compose.production.yml` (blue-green slots)
- **Nginx**: `nginx/nginx.conf` (load balancer)
- **Deploy Script**: `scripts/deploy-blue-green.sh` (automation)
- **Health Check**: `src/app/api/health/route.ts`

---

**Production Readiness**: 95%
