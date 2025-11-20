# Unite-Hub Platform - Final System Overview v1.0.0

## Executive Summary

Unite-Hub is a comprehensive AI-first CRM and marketing automation platform with an integrated Leviathan deployment system. Built across 14 development phases, it provides end-to-end content fabrication, multi-cloud deployment, and SEO optimization capabilities.

---

## Architecture Map

### Phase 1-2: Foundation & Authentication
- **Next.js 16** App Router with Turbopack
- **React 19** with Server Components
- **Supabase Auth** with Google OAuth 2.0 (implicit flow)
- **TypeScript 5.x** strict mode

### Phase 3-4: Database & API
- **PostgreSQL** with Row Level Security (RLS)
- **104 API routes** across all functional areas
- **18+ database tables** with comprehensive indexes

### Phase 5-6: Dashboard & Email
- **shadcn/ui** component library
- **Multi-provider email** (SendGrid → Resend → Gmail SMTP)
- **Email tracking** (opens, clicks, threads)

### Phase 7-8: AI Agents & Campaigns
- **Anthropic Claude API** (Opus 4, Sonnet 4.5, Haiku 4.5)
- **Email Agent** - Intent extraction, sentiment analysis
- **Content Agent** - Extended Thinking for personalization
- **Drip campaigns** with conditional branching

### Phase 9-10: Lead Scoring & Content
- **AI-powered scoring** (0-100 composite algorithm)
- **Content generation** with brand voice
- **Prompt caching** for 90% cost savings

### Phase 11-12: Orchestrator & Cloud
- **Multi-cloud deployment** (AWS S3, GCS, Azure, Netlify)
- **Entity graph** linking system
- **Daisy chain** URL propagation

### Phase 13: Leviathan System
- **FabricatorService** - Content fabrication
- **CloudDeploymentService** - Multi-provider deployment
- **BloggerService** - Google Blogger integration
- **GSiteService** - Google Sites with Playwright stealth
- **DaisyChainService** - Link generation
- **StealthWrapperEngine** - Content obfuscation
- **LeviathanOrchestratorService** - End-to-end orchestration
- **IndexingHealthService** - SEO health monitoring
- **DeploymentAuditService** - Comprehensive audit trail

### Phase 14: Finalization
- **GlobalRegressionSuite** - Platform-wide testing
- **PerformanceAuditService** - Benchmarking with thresholds
- **ReliabilityMatrixService** - Pass/fail analysis
- **ReleaseBuilder** - Production packaging
- **ErrorSurfaceAnalyzer** - Failure pattern analysis

---

## Database Schema (25 Tables)

### Core Tables
| Table | Description |
|-------|-------------|
| organizations | Top-level org entities |
| users | User accounts |
| user_profiles | Extended user data |
| user_organizations | User-org relationships |
| workspaces | Team workspaces |

### Contact & Email
| Table | Description |
|-------|-------------|
| contacts | CRM contacts with ai_score |
| emails | Email messages |
| email_opens | Open tracking |
| email_clicks | Click tracking |
| integrations | OAuth integrations |

### Campaigns
| Table | Description |
|-------|-------------|
| campaigns | Email campaigns |
| drip_campaigns | Drip sequences |
| campaign_steps | Sequence steps |
| campaign_enrollments | Contact enrollments |
| campaign_execution_logs | Execution history |

### Content & AI
| Table | Description |
|-------|-------------|
| generatedContent | AI content drafts |
| aiMemory | Agent memory storage |
| auditLogs | System audit trail |

### Leviathan Tables
| Table | Description |
|-------|-------------|
| leviathan_entities | Core entity tracking |
| entity_graph | Relationship links |
| cloud_deployments | Multi-cloud tracking |
| blogger_posts | Blogger publications |
| gsite_pages | Google Sites pages |
| leviathan_runs | Orchestration runs |
| leviathan_run_steps | Step execution |
| leviathan_run_errors | Error logging |
| indexing_health_checks | SEO health |
| deployment_audit_log | Audit trail |

---

## API Endpoints (104 Total)

### Authentication (8)
- POST /api/auth/initialize-user
- GET /api/auth/session
- POST /api/auth/logout
- GET /api/integrations/gmail/connect
- GET /api/integrations/gmail/callback
- POST /api/integrations/gmail/disconnect
- GET /api/integrations/gmail/status

### Contacts (12)
- GET/POST /api/contacts
- GET/PUT/DELETE /api/contacts/[id]
- GET /api/contacts/search
- POST /api/contacts/bulk
- GET /api/contacts/hot-leads

### Campaigns (15)
- GET/POST /api/campaigns
- GET/PUT/DELETE /api/campaigns/[id]
- POST /api/campaigns/[id]/send
- GET/POST /api/drip-campaigns
- POST /api/drip-campaigns/[id]/enroll
- GET /api/drip-campaigns/[id]/stats

### AI Agents (10)
- POST /api/agents/contact-intelligence
- POST /api/agents/content-generation
- POST /api/agents/email-processor
- POST /api/agents/orchestrator
- GET /api/agents/memory

### Leviathan (20)
- POST /api/leviathan/orchestrate
- GET /api/leviathan/orchestrate?runId=
- POST /api/leviathan/fabricate
- POST /api/leviathan/deploy
- POST /api/leviathan/blogger/publish
- POST /api/leviathan/gsite/create
- GET /api/leviathan/health
- GET /api/leviathan/audit

### System (5)
- GET /api/system/health
- GET /api/system/health?mode=extended
- GET /api/system/health?mode=full

---

## Services Architecture

### AI Layer
```
Request → Enhanced Router
    ├─→ [Gmail/Calendar/Drive] → Gemini 3 (20%)
    ├─→ [Standard operations] → OpenRouter (70%)
    └─→ [Complex reasoning] → Anthropic Direct (10%)
```

### Leviathan Orchestration
```
Orchestrate Request
    ↓
FabricatorService → Content
    ↓
CloudDeploymentService → Multi-cloud
    ↓
BloggerService → Blog posts
    ↓
GSiteService → Google Sites
    ↓
DaisyChainService → Link propagation
    ↓
IndexingHealthService → SEO checks
    ↓
DeploymentAuditService → Logging
```

---

## Test Coverage

### Unit Tests
- **Phase 13 Week 5-6**: 27 tests (Social Stack)
- **Phase 13 Week 7-8**: 42 tests (Orchestrator)
- **Phase 14 Week 1-2**: 50 tests (Finalization)

### Test Categories
- GlobalRegressionSuite: 30+ tests across 5 categories
- PerformanceAuditService: 10 benchmark tests
- ReliabilityMatrixService: Phase/subsystem coverage
- ErrorSurfaceAnalyzer: Pattern detection

---

## Performance Thresholds

| Benchmark | Max Mean | Max P95 |
|-----------|----------|---------|
| fabrication | 2000ms | 3000ms |
| cloud_deploy_aws | 5000ms | 8000ms |
| cloud_deploy_gcs | 5000ms | 8000ms |
| cloud_deploy_azure | 5000ms | 8000ms |
| cloud_deploy_netlify | 3000ms | 5000ms |
| blogger_publish | 3000ms | 5000ms |
| gsite_create | 10000ms | 15000ms |
| orchestrator_full | 30000ms | 45000ms |
| health_check | 1000ms | 2000ms |
| daisy_chain | 500ms | 1000ms |

---

## Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_URL
NEXTAUTH_SECRET
ANTHROPIC_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

### Optional
```env
OPENROUTER_API_KEY
PERPLEXITY_API_KEY
SENDGRID_API_KEY
RESEND_API_KEY
```

---

## Deployment

### Recommended Stack
- **Hosting**: Vercel
- **Database**: Supabase
- **CDN**: Vercel Edge Network

### Commands
```bash
npm ci
npm run build
npm run start
```

### Health Check
```bash
curl https://your-domain.com/api/system/health?mode=full
```

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.0.0 | 2025-11-20 | Initial production release |

---

## License

Proprietary - Unite Group

---

**Generated**: 2025-11-20
**Platform**: Unite-Hub v1.0.0
