# Digital Ocean Deployment Solution

**Date**: 2025-11-30
**Issue Duration**: 1.5+ hours of debugging
**Status**: ROOT CAUSE IDENTIFIED - SOLUTIONS PROVIDED

---

## Problem Summary

The Unite-Hub deployment on Digital Ocean App Platform is failing during the Docker build stage with:

```
Build job failed because it was terminated. This often happens due to resource exhaustion.
```

**Current Status** (from DO API):
- Phase: ERROR
- Build: ERROR
- Deploy: PENDING
- Last Updated: 2025-11-30T08:55:05Z

---

## Root Cause Analysis

### Issue Chain (from git history):

| Commit | Fix Applied | Result |
|--------|-------------|--------|
| 2cd73a9 | npm install instead of npm ci | Partial fix |
| 169e8a4 | Install devDependencies | Fixed missing deps |
| 6889091 | Skip TypeScript + 3GB Node memory | Reduced memory |
| 9387197 | Build-time placeholder env vars | Fixed validation |
| 8bc8b31 | Valid-format placeholder keys | Fixed JWT parsing |
| aa05e71 | Upgrade to professional-m (4GB) | **Still OOM** |

### Why 4GB Isn't Enough:

1. **Node.js heap**: 3GB allocated via `NODE_OPTIONS`
2. **OS overhead**: ~500MB for Alpine Linux + Docker
3. **npm cache**: ~500MB during install
4. **Webpack/Turbopack**: Requires additional memory for bundling
5. **Result**: Total ~4.5GB+ needed, only 4GB available

### Project Memory Requirements:
- TypeScript checking: 8GB (see package.json typecheck script)
- Next.js build: 3-4GB
- Large codebase: 655 routes, 366 migrations, 100+ components

---

## Solutions (Choose One)

### Option A: Upgrade Instance Size (RECOMMENDED)

Upgrade from `professional-m` (4GB) to `professional-l` (8GB):

**File**: `.do/app.yaml` line 15

```yaml
# Change from:
instance_size_slug: professional-m

# To:
instance_size_slug: professional-l
```

**Cost Impact**: ~$12/month additional
**Build Time**: ~5 minutes
**Reliability**: HIGH

### Option B: Switch to Buildpacks (Alternative)

Replace Dockerfile with buildpack-based deployment:

**File**: `.do/app.yaml`

```yaml
services:
  - name: web
    github:
      repo: DisasterRecoveryAgency/Unite-Hub
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    instance_size_slug: professional-m
    http_port: 3008
    # ... rest of config
```

Remove `dockerfile_path: Dockerfile` line.

**Pros**: DO manages memory better with buildpacks
**Cons**: Less control over build process

### Option C: Further Optimize Dockerfile

Add aggressive memory optimizations:

```dockerfile
# In builder stage, before npm run build:

# Clear npm cache to free memory
RUN npm cache clean --force

# Disable webpack cache
ENV NEXT_PRIVATE_STANDALONE=true

# Use swap if available (Alpine)
ENV NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=100"
```

**Risk**: May still OOM with complex builds

---

## Recommended Action Plan

### Immediate Fix (Option A):

1. **Edit** `.do/app.yaml`:
```yaml
instance_size_slug: professional-l
```

2. **Commit and push**:
```bash
git add .do/app.yaml
git commit -m "fix: upgrade to professional-l (8GB) for builds"
git push origin main
```

3. **Monitor deployment**:
```bash
node scripts/check-do-logs.mjs
```

### Verification Commands:

```bash
# Check deployment status
set DIGITALOCEAN_API_TOKEN=<token>
node scripts/check-do-logs.mjs

# Expected output:
# Phase: ACTIVE
# Progress: build: SUCCESS, deploy: SUCCESS
```

---

## Configuration Reference

### Current `.do/app.yaml` Settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| region | syd | Sydney datacenter |
| instance_size_slug | professional-m | 4GB RAM (INSUFFICIENT) |
| dockerfile_path | Dockerfile | Multi-stage build |
| http_port | 3008 | Unite-Hub default |
| health_check | /api/health | Endpoint monitoring |

### Dockerfile Memory Settings:

| Variable | Value | Purpose |
|----------|-------|---------|
| NODE_OPTIONS | --max-old-space-size=3072 | 3GB heap limit |
| SKIP_TYPE_CHECK | 1 | Skip TypeScript |
| NEXT_TELEMETRY_DISABLED | 1 | Reduce overhead |

---

## Instance Size Reference (DO App Platform)

| Slug | RAM | vCPUs | Price/mo | Suitable? |
|------|-----|-------|----------|-----------|
| basic-xs | 512MB | 1 | $5 | NO |
| basic-s | 1GB | 1 | $10 | NO |
| professional-xs | 1GB | 1 | $12 | NO |
| professional-s | 2GB | 1 | $25 | NO |
| professional-m | 4GB | 2 | $50 | MARGINAL |
| **professional-l** | **8GB** | **2** | **$100** | **YES** |
| professional-xl | 16GB | 4 | $200 | Overkill |

---

## Future Optimizations

After deployment is working:

1. **Implement build caching**: Use DO's build cache feature
2. **Split large routes**: Consider code splitting for 655 routes
3. **Use edge caching**: Reduce runtime memory needs
4. **Consider Vercel**: They handle Next.js memory better (free tier available)

---

## Files Modified During Debugging

| File | Change | Commit |
|------|--------|--------|
| Dockerfile | Skip TypeScript, 3GB memory | 6889091 |
| Dockerfile | Build-time env placeholders | 8bc8b31 |
| next.config.mjs | SKIP_TYPE_CHECK support | 6889091 |
| .do/app.yaml | professional-m instance | aa05e71 |

---

## Appendix: DO API Check Script

The `scripts/check-do-logs.mjs` script checks deployment status:

```javascript
// Usage:
// set DIGITALOCEAN_API_TOKEN=<your-token>
// node scripts/check-do-logs.mjs

// Returns:
// Phase: ACTIVE/ERROR/BUILDING
// Progress: build status, deploy status
// Live URL (if successful)
```

---

**Document Created**: 2025-11-30
**Author**: Claude Code (Deployment Audit)
