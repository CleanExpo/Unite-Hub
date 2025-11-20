# End-to-End Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] All required environment variables configured
- [ ] Secrets stored securely (not in code)
- [ ] Different credentials for staging/production

### Database
- [ ] Supabase project created
- [ ] All migrations applied in order
- [ ] RLS policies enabled
- [ ] Database backups configured

### OAuth Configuration
- [ ] Google OAuth credentials configured
- [ ] Redirect URIs updated for production domain
- [ ] OAuth consent screen approved

### AI Services
- [ ] Anthropic API key valid
- [ ] OpenRouter API key valid (optional)
- [ ] Perplexity API key valid (optional)
- [ ] Rate limits understood

## Build & Test

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console.log in production code
- [ ] Environment variables not hardcoded

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance benchmarks acceptable

### Security
- [ ] No secrets in repository
- [ ] Dependencies up to date
- [ ] No known vulnerabilities (npm audit)

## Deployment

### Infrastructure
- [ ] Hosting platform configured (Vercel/Docker)
- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] CDN configured (if needed)

### Application
- [ ] Production build successful
- [ ] Environment variables set in platform
- [ ] Health check passing
- [ ] Logs accessible

## Post-Deployment

### Verification
- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Dashboard displays data
- [ ] API endpoints respond

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alerts configured

### Documentation
- [ ] Deployment documented
- [ ] Runbook updated
- [ ] Contact information current

## Rollback Plan

### Triggers
- Error rate > 5%
- P95 latency > 2 seconds
- Critical functionality broken
- Security vulnerability discovered

### Procedure
1. Revert to previous deployment
2. Notify stakeholders
3. Investigate root cause
4. Document incident

## Sign-Off

- [ ] QA approval
- [ ] Security approval
- [ ] Product owner approval
- [ ] Operations approval

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Version**: _______________

**Notes**:
