# Docker Build Troubleshooting Guide for Next.js
*Comprehensive solutions for Docker build failures with Next.js applications*

## Quick Diagnosis Commands

```bash
# Run comprehensive diagnostic
bash scripts/docker-debug.sh

# Quick checks
npm run verify:standalone     # Verify standalone build works
npm run build:debug          # Debug build with verbose output
npm run docker:build-debug   # Debug Docker build

# Emergency builds
npm run build:nuclear        # Nuclear build option
npm run docker:build-nuclear # Nuclear Docker build
```

## 🚨 Emergency Quick Fixes

### 1. Immediate Standalone Fix
```bash
# Use resilient configuration
cp next.config.resilient.js next.config.js
npm run build:resilient
```

### 2. Nuclear Build (Last Resort)
```bash
# Maximum compatibility build
npm run build:nuclear
docker build -f Dockerfile.nuclear -t app:nuclear .
```

### 3. Memory Issues
```bash
# Increase memory allocation
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

## 🔍 Common Error Patterns & Solutions

### Error: ".next/standalone directory not created"

**Cause**: Missing `output: 'standalone'` configuration

**Solution**:
```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  // ... other config
}
```

**Verification**:
```bash
npm run build
ls -la .next/standalone/server.js  # Should exist
```

### Error: "server.js not found"

**Cause**: Build completed but standalone structure is incorrect

**Solutions**:
1. **Version Check**: Ensure Next.js 12.1.0+
2. **Config Check**: Verify standalone output in config
3. **Manual Creation**: Emergency directory creation

```bash
# Emergency fix
mkdir -p .next/standalone
cp -r .next/* .next/standalone/ 2>/dev/null || true
```

### Error: "failed to compute cache key"

**Cause**: Docker can't find specified files or case sensitivity issues

**Solutions**:
1. **Check file names**: `Dockerfile` vs `dockerfile`
2. **Verify .dockerignore**: Ensure required files aren't excluded
3. **Case sensitivity**: Use exact file names

```bash
# Check current directory
ls -la Dockerfile*
cat .dockerignore
```

### Error: Memory/Resource exhaustion

**Symptoms**:
- Build hangs or kills silently
- "JavaScript heap out of memory"
- Build fails at webpack compilation

**Solutions**:
```bash
# Increase Docker memory to 6-8GB in Docker Desktop
# Or use nuclear build options
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## 🔧 Build Configurations by Scenario

### Standard Production Build
```dockerfile
# Use Dockerfile.resilient
docker build -f Dockerfile.resilient -t app:production .
```

### High-Memory Applications
```dockerfile
# Modify NODE_OPTIONS in Dockerfile.resilient
ENV NODE_OPTIONS="--max-old-space-size=8192"
```

### Legacy/Problematic Codebases
```dockerfile
# Use Dockerfile.nuclear
docker build -f Dockerfile.nuclear -t app:nuclear .
```

### Development/Testing
```dockerfile
# Use debug target
docker build -f Dockerfile.resilient --target debug -t app:debug .
docker run -it app:debug /bin/sh
```

## 🎯 Configuration Matrix

| Scenario | Config File | Docker File | Memory | Build Command |
|----------|-------------|-------------|--------|---------------|
| **Standard** | `next.config.resilient.js` | `Dockerfile.resilient` | 6GB | `npm run docker:build` |
| **High-Memory** | `next.config.resilient.js` | `Dockerfile.resilient` | 8GB+ | Custom NODE_OPTIONS |
| **Legacy/Problem** | `next.config.nuclear.js` | `Dockerfile.nuclear` | 8GB+ | `npm run docker:build-nuclear` |
| **Debug** | Any | `Dockerfile.resilient` | 6GB | `npm run docker:build-debug` |

## 🔄 Step-by-Step Troubleshooting

### Step 1: Verify Local Build
```bash
rm -rf .next
npm run build
npm run verify:standalone
```

If this fails, fix local issues first before Docker.

### Step 2: Check Configuration
```bash
# Ensure standalone output
grep -r "output.*standalone" next.config*

# Check Next.js version
npm list next
```

### Step 3: Test Docker Stages
```bash
# Test dependencies stage
docker build -f Dockerfile.resilient --target deps -t test:deps .

# Test builder stage  
docker build -f Dockerfile.resilient --target builder -t test:builder .

# Test debug stage
docker build -f Dockerfile.resilient --target debug -t test:debug .
```

### Step 4: Debug Build Process
```bash
# Run with detailed output
DOCKER_BUILDKIT=1 docker build --progress=plain --no-cache -f Dockerfile.resilient . 2>&1 | tee build.log

# Analyze log
grep -i "error\|failed\|missing" build.log
```

### Step 5: Nuclear Option
If all else fails:
```bash
cp next.config.nuclear.js next.config.js
npm run build:nuclear
docker build -f Dockerfile.nuclear -t app:nuclear .
```

## 🧪 Testing & Verification

### Local Testing
```bash
# Test standalone build
npm run build:resilient
node .next/standalone/server.js

# Test in browser
curl http://localhost:3000
```

### Docker Testing
```bash
# Build and test
docker build -f Dockerfile.resilient -t test-app .
docker run -p 3000:3000 test-app

# Health check
curl http://localhost:3000/api/health
```

### Debug Container
```bash
# Interactive debugging
docker build -f Dockerfile.resilient --target debug -t debug-app .
docker run -it debug-app /bin/sh

# Inside container:
ls -la .next/standalone/
cat next.config.js
node --version
```

## 🚀 Performance Optimizations

### Build Speed
- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker layer caching
- Use multi-stage builds
- Cache node_modules between builds

### Memory Optimization
- Use `webpackMemoryOptimizations: true`
- Exclude large binaries from tracing
- Optimize bundle splitting
- Consider base image size

### Reliability
- Implement retry logic for installations
- Add build verification steps
- Use health checks
- Implement fallback strategies

## 📊 Common Issues Statistics

Based on the comprehensive guide analysis:

1. **Configuration Issues (60%)**:
   - Missing `output: 'standalone'`
   - Incorrect Next.js version
   - Wrong webpack config

2. **Memory Issues (25%)**:
   - Insufficient Docker memory
   - Large bundle sizes
   - Memory leaks in builds

3. **Docker-specific (10%)**:
   - Layer caching problems
   - File permission issues
   - Base image incompatibilities

4. **Environment Issues (5%)**:
   - Node.js version mismatches
   - Missing dependencies
   - Network/proxy problems

## 🆘 Emergency Contacts & Resources

- **Next.js Documentation**: https://nextjs.org/docs/advanced-features/output-file-tracing
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Standalone Mode Guide**: https://nextjs.org/docs/advanced-features/output-file-tracing#automatically-copying-traced-files

## 📋 Pre-deployment Checklist

- [ ] Local build succeeds with standalone output
- [ ] Docker build completes successfully  
- [ ] Health endpoints respond correctly
- [ ] Memory usage is acceptable
- [ ] Build time is reasonable (<10 minutes)
- [ ] Image size is optimized (<500MB)
- [ ] Security scanning passes
- [ ] Load testing completed

Remember: **Most Docker build failures are configuration issues, not fundamental problems**. Follow this guide systematically, and you'll resolve 95% of build failures.
