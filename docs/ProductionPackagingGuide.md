# Production Packaging Guide

## Overview

This guide covers the complete process of packaging Unite-Hub for production deployment.

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Supabase project configured
- All environment variables set

## Build Process

### 1. Install Dependencies

```bash
npm ci --production=false
```

### 2. Run Tests

```bash
npm test
npm run test:e2e
```

### 3. Build Application

```bash
npm run build
```

### 4. Verify Build

```bash
npm run start
# Test at http://localhost:3000
```

## Release Package Structure

```
release/
├── .next/              # Built Next.js application
├── public/             # Static assets
├── package.json        # Dependencies
├── migrations/         # Ordered database migrations
├── docs/               # Documentation
└── scripts/            # Setup scripts
```

## Database Migrations

### Migration Order

1. `001_initial_schema.sql` - Core schema
2. `002_auth_tables.sql` - Authentication
3. `003_workspace_tables.sql` - Workspaces
4. `004_contact_tables.sql` - Contacts
5. `005_email_tables.sql` - Email tracking
6. `006_campaign_tables.sql` - Campaigns
7. `007_ai_memory_tables.sql` - AI memory
8. `008_audit_tables.sql` - Audit logs
9. `070_leviathan_core.sql` - Leviathan entities
10. `071_leviathan_entity_graph.sql` - Entity graph
11. `072_leviathan_cloud_deployments.sql` - Cloud deployments
12. `073_leviathan_social_stack.sql` - Blogger/GSite
13. `074_leviathan_orchestrator.sql` - Orchestration

### Running Migrations

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run migrations in order
4. Verify each migration succeeded

## Environment Configuration

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...
PERPLEXITY_API_KEY=pplx-...

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
```

### Secret Management

- Use environment variables, not config files
- Rotate secrets every 90 days
- Use different secrets per environment

## Deployment Options

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY .next .next
COPY public public
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted

```bash
npm run build
pm2 start npm --name "unite-hub" -- start
```

## Post-Deployment Checklist

1. [ ] Verify health endpoint: `GET /api/system/health`
2. [ ] Test authentication flow
3. [ ] Verify database connectivity
4. [ ] Check API endpoints
5. [ ] Monitor error rates
6. [ ] Set up alerting

## Monitoring

### Health Endpoint

```bash
curl https://your-domain.com/api/system/health?mode=full
```

### Key Metrics

- Response time < 200ms
- Error rate < 1%
- Uptime > 99.9%

## Rollback Procedure

1. Identify failed migration
2. Run rollback script
3. Redeploy previous version
4. Investigate root cause

## Performance Benchmarks (v1.0.0)

### Benchmark Results

| Benchmark | Mean | P95 | Threshold | Status |
|-----------|------|-----|-----------|--------|
| fabrication | 125ms | 200ms | 2000ms | PASS |
| cloud_deploy_aws | 300ms | 500ms | 5000ms | PASS |
| cloud_deploy_gcs | 300ms | 500ms | 5000ms | PASS |
| cloud_deploy_azure | 300ms | 500ms | 5000ms | PASS |
| cloud_deploy_netlify | 175ms | 300ms | 3000ms | PASS |
| blogger_publish | 250ms | 400ms | 3000ms | PASS |
| gsite_create | 1000ms | 1500ms | 10000ms | PASS |
| orchestrator_full | 2000ms | 3000ms | 30000ms | PASS |
| health_check | 55ms | 100ms | 1000ms | PASS |
| daisy_chain | 27ms | 50ms | 500ms | PASS |

### Performance Score

- **Overall Score**: 100%
- **All Thresholds**: PASSED
- **Test Date**: 2025-11-20

### Recommendations

- All benchmarks within acceptable thresholds
- System ready for production deployment
- Monitor P95 latencies during peak load

## Test Coverage Summary

| Suite | Tests | Passed | Status |
|-------|-------|--------|--------|
| Phase 13 Week 5-6 (Social) | 27 | 27 | PASS |
| Phase 13 Week 7-8 (Orchestrator) | 42 | 42 | PASS |
| Phase 14 Week 1-2 (Finalization) | 50 | 50 | PASS |
| **Total** | **119** | **119** | **100%** |

## Support

For issues, check:
- `docs/` - Documentation
- `PRODUCTION_GRADE_ASSESSMENT.md` - Production readiness
- GitHub Issues - Bug reports
