# Build Troubleshooting Guide

This guide helps you diagnose and fix common build issues.

## Quick Diagnosis

Run the pre-build check to identify issues:
\`\`\`bash
npm run pre-build-check
\`\`\`

## Common Build Errors

### 1. Canvas Module Error
**Error**: `Cannot find module 'canvas'`
**Solution**: 
- The app is configured to handle this automatically
- Ensure `next.config.mjs` has the webpack externals configuration
- Canvas is marked as external for server builds

### 2. TypeScript Errors
**Error**: Type checking failures
**Solution**:
\`\`\`bash
npm run type-check
\`\`\`
Fix any TypeScript errors before building.

### 3. Missing Environment Variables
**Error**: Build fails due to missing env vars
**Solution**:
- Check `.env.example` for required variables
- Set variables in your deployment platform
- Use the health check to verify configuration

### 4. Dependency Issues
**Error**: Module resolution failures
**Solution**:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### 5. Next.js Configuration Issues
**Error**: Build configuration problems
**Solution**:
- Verify `next.config.mjs` syntax
- Check for conflicting plugins
- Ensure all imports are valid

## Build Optimization

### 1. Bundle Analysis
\`\`\`bash
npm run build:analyze
\`\`\`

### 2. Clean Build
\`\`\`bash
npm run clean
npm run build
\`\`\`

### 3. Performance Monitoring
- Use the build status component in the dashboard
- Monitor the `/api/health` endpoint
- Check Vercel deployment logs

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Pre-build check passes
- [ ] Health check endpoint responds
- [ ] Critical pages load correctly

## Getting Help

1. Check the health check page: `/admin/health-check`
2. Review build logs in your deployment platform
3. Run local build to reproduce issues: `npm run build`
4. Check the troubleshooting guide above

## Monitoring

The application includes built-in monitoring:
- Build status component in dashboard
- Health check API endpoint
- Pre-build validation script
- Comprehensive error logging
