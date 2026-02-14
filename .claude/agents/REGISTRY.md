# Unite-Hub Agent Registry

**Version**: 2.0.0
**Last Updated**: 2026-01-15
**Status**: ✅ Operational - 15 Active Agents

---

## Overview

This registry is the **single source of truth** for all operational agents in Unite-Hub. Each agent is specialized for specific tasks and follows the Orchestrator → Specialist pattern.

### Quick Reference

| Agent | ID | Version | Status | Primary Use |
|-------|-----|---------|--------|-------------|
| Orchestrator | `orchestrator` | 2.0.0 | ✅ Active | Master coordinator, task routing |
| Email Agent | `email-agent` | 2.0.0 | ✅ Active | Gmail processing, intent extraction |
| Content Agent | `content-agent` | 2.0.0 | ✅ Active | Content generation (Extended Thinking) |
| Frontend Specialist | `frontend` | 2.0.0 | ✅ Active | UI/component work, React, Next.js |
| Backend Specialist | `backend` | 2.0.0 | ✅ Active | API routes, database, Supabase |
| SEO Intelligence | `seo` | 2.0.0 | ✅ Active | SEO research, Perplexity Sonar |
| Founder OS | `founder-os` | 2.0.0 | ✅ Active | Founder Intelligence System |
| AI Phill | `ai-phill` | 1.0.0 | ✅ Active | Strategic advisor, Socratic dialogue |
| SEO Leak | `seo-leak` | 1.0.0 | ✅ Active | Google/DOJ leak-informed SEO analysis |
| Cognitive Twin | `cognitive-twin` | 1.0.0 | ✅ Active | Business health monitoring, decision sim |
| Social Inbox | `social-inbox` | 1.0.0 | ✅ Active | Unified social media inbox |
| Search Suite | `search-suite` | 1.0.0 | ✅ Active | Keyword tracking, SERP monitoring |
| Pre-Client Identity | `pre-client-identity` | 1.0.0 | ✅ Active | Pre-sales intelligence |
| WhatsApp Intelligence | `whatsapp-intelligence` | 1.0.0 | ✅ Active | WhatsApp message analysis |
| Boost Bump | `boost-bump` | 1.0.0 | ✅ Active | White-hat SEO boost orchestration |

---

## Agent Definitions

### 1. Orchestrator
**Location**: `.claude/agents/orchestrator/`
**Role**: Master Coordinator
**Priority**: 1 (highest)

**Responsibilities**:
- Task analysis and intelligent routing
- Multi-agent coordination
- Context optimization
- Verification enforcement
- Workflow management

**When to Use**:
- Complex tasks requiring multiple agents
- Task routing decisions needed
- Multi-step workflow coordination
- Cross-functional operations

**Key Files**:
- `agent.md` - Agent definition and capabilities
- `workflows.md` - Workflow patterns and coordination

**Model**: `claude-sonnet-4-5-20250929` (standard operations)

---

### 2. Email Agent
**Location**: `.claude/agents/email-agent/`
**Role**: Email Processing Specialist
**Priority**: 2

**Responsibilities**:
- Gmail OAuth integration
- Email content extraction
- Intent classification (meeting request, question, proposal, etc.)
- Sentiment analysis
- Lead scoring based on email engagement
- Contact record updates

**When to Use**:
- Processing incoming emails
- Email intelligence extraction
- Contact scoring updates
- Gmail integration tasks
- Email-based lead qualification

**Key Files**:
- `agent.md` - Agent definition
- `integrations.md` - Gmail API integration details

**Model**: `claude-sonnet-4-5-20250929` (standard operations)

---

### 3. Content Agent
**Location**: `.claude/agents/content-agent/`
**Role**: Content Generation Specialist
**Priority**: 2

**Responsibilities**:
- Personalized marketing content generation
- Email campaign content
- Social media posts
- Proposal drafts
- Strategic thinking for complex content

**When to Use**:
- Generating personalized content for warm leads
- Creating email campaign content
- Drafting proposals or case studies
- Content requiring strategic depth
- High-value content generation

**Key Files**:
- `agent.md` - Agent definition
- `extended-thinking.md` - Extended Thinking strategies and patterns

**Model**: `claude-opus-4-5-20251101` (Extended Thinking enabled)
**Thinking Budget**: 5000-10000 tokens for complex content

**Cost Note**: Higher cost due to Extended Thinking, use for high-value content only.

---

### 4. Frontend Specialist
**Location**: `.claude/agents/frontend-specialist/`
**Role**: UI/Component Specialist
**Priority**: 3

**Responsibilities**:
- React 19 component development
- Next.js 16 routing and pages
- shadcn/ui component integration
- Tailwind CSS styling
- Client-side state management
- Responsive design implementation

**When to Use**:
- UI bug fixes
- New component development
- Page routing issues
- Styling and design work
- Client-side functionality
- Dashboard improvements

**Key Files**:
- `agent.md` - Agent definition and frontend patterns

**Tech Stack**:
- React 19 (Server Components, RSC)
- Next.js 16 (App Router, Turbopack)
- TypeScript 5.x
- Tailwind CSS
- shadcn/ui components
- Framer Motion (animations)

**Model**: `claude-sonnet-4-5-20250929` (standard operations)

---

### 5. Backend Specialist
**Location**: `.claude/agents/backend-specialist/`
**Role**: API/Database Specialist
**Priority**: 3

**Responsibilities**:
- Next.js API route development (104 endpoints)
- Supabase database operations
- RLS policy implementation
- Authentication and authorization
- Database migrations
- Third-party integrations (Gmail, Stripe, etc.)

**When to Use**:
- API endpoint development
- Database schema changes
- RLS policy work
- Authentication issues
- Integration work
- Backend performance optimization

**Key Files**:
- `agent.md` - Agent definition and backend patterns

**Tech Stack**:
- Next.js API Routes
- Supabase PostgreSQL (15 tables)
- Row Level Security (RLS)
- Supabase Auth (PKCE flow)
- Anthropic Claude API
- Gmail API, Stripe API

**Critical Patterns**:
- ALWAYS filter queries by `workspace_id`
- Use PKCE auth (server-side session validation)
- Run RLS diagnostics before migrations

**Model**: `claude-sonnet-4-5-20250929` (standard operations)

---

### 6. SEO Intelligence
**Location**: `.claude/agents/seo-intelligence/`
**Role**: SEO Research & Analysis Specialist
**Priority**: 3

**Responsibilities**:
- SEO trend research via Perplexity Sonar
- Keyword analysis and competitor research
- Content optimization recommendations
- Technical SEO audits
- Schema markup generation
- CTR optimization testing

**When to Use**:
- SEO research and trends
- Keyword strategy development
- Competitor SEO analysis
- Content optimization guidance
- Technical SEO audits
- Schema markup needs

**Key Files**:
- `agent.md` - Agent definition

**Tech Stack**:
- Perplexity Sonar API (99% cheaper than Semrush)
- OpenRouter multi-model routing
- DataForSEO integration
- SEMRush integration (optional)

**Cost Savings**: $0.005-0.01 per search vs $119-449/mo (Semrush)

**Model**: `claude-sonnet-4-5-20250929` (standard operations)

---

### 7. Founder OS
**Location**: `.claude/agents/founder-os/`
**Role**: Founder Intelligence System
**Priority**: 2

**Responsibilities**:
- Multi-brand business management
- AI assistant (AI Phill) for insights
- Cognitive twin for strategic memory
- SEO vulnerability detection
- Social media unified inbox
- Pre-sales intelligence
- Task automation and approval workflows

**When to Use**:
- Founder-level strategic decisions
- Multi-business operations
- Business health monitoring
- Strategic insights and recommendations
- Cross-business intelligence
- Decision momentum tracking

**Key Files**:
- `agent.md` - Agent definition and 8 sub-agents

**Sub-Agents** (8 total):
1. Founder OS Agent - Main orchestrator
2. AI Phill - Personal assistant
3. Cognitive Twin - Deep memory and decision tracking
4. SEO Leak Engine - Vulnerability detection
5. Social Inbox - Unified social media inbox
6. Search Suite - Keyword tracking
7. Boost Bump - Browser automation
8. Pre-Client Identity - Email-to-contact resolution

**Database**: 15 tables (founder_businesses, founder_business_vault_secrets, etc.)

**Model**: `claude-opus-4-5-20251101` (Extended Thinking for strategic analysis)

---

## Agent Selection Flow

```
User Request
    ↓
    ├─→ [Simple UI fix] → Frontend Specialist
    ├─→ [API/Database work] → Backend Specialist
    ├─→ [Email processing] → Email Agent
    ├─→ [Content generation] → Content Agent
    ├─→ [SEO research] → SEO Intelligence
    ├─→ [Strategic/Founder] → Founder OS
    └─→ [Complex/Multi-step] → Orchestrator
         ↓
         Orchestrator analyzes and routes to appropriate specialist(s)
```

### Decision Rules

**Use Orchestrator when**:
- Task involves 2+ agents
- Workflow has multiple steps
- Task requires coordination
- Unclear which specialist to use

**Direct to Specialist when**:
- Single clear task
- One agent's domain
- Quick operation
- No coordination needed

---

## Version History

### v2.0.0 (2026-01-15) - Current
- ✅ Modularized all agent definitions
- ✅ Created canonical registry (this file)
- ✅ Archived 21 deprecated agent files (556KB cleanup)
- ✅ Established Orchestrator → Specialist pattern
- ✅ 78% context reduction achieved (1,890 → 394 lines)

### v1.0.0 (2025-11-15)
- Initial agent architecture
- Monolithic agent definitions
- 7 operational agents established

---

## Status & Metrics

**Total Agents**: 15 operational
**Total LOC**: 16,116 lines of production code
**Test Coverage**: 235+ tests (100% pass rate)
**Production Readiness**: 65% (targeting 85-90% with Stage 4)

**Context Metrics**:
- Core CLAUDE.md: 394 lines (down from 1,255)
- Total context reduction: 78%
- Agent-specific loading: 52% faster
- Estimated cost savings: $200-500/month

---

## Deprecation Policy

**Deprecated Files**: Moved to `archived/deprecated-agents/` (2026-01-15)

Deprecated agent files include:
- AI-CONTENT-GENERATION-AGENT.md
- AI-INTELLIGENCE-EXTRACTION-AGENT.md
- CAMPAIGN-AGENT.md
- EMAIL-AGENT.md
- WORKFLOW-AGENT.md
- ...and 16 more (21 total, 556KB)

**Policy**: Deprecated agents are archived for 90 days, then permanently deleted if no issues arise.

---

## Contributing

When adding a new agent:
1. Create directory in `.claude/agents/<agent-name>/`
2. Add `agent.md` with YAML frontmatter
3. Update this REGISTRY.md
4. Add to orchestrator routing logic
5. Update `.claude/README.md` quick reference

**YAML Frontmatter Format**:
```yaml
---
name: agent-name
type: agent
role: Agent Role
priority: 1-5
version: 2.0.0
status: active
---
```

---

## Workforce Engine Integration

Agents in this registry are managed at runtime by the Workforce Engine, which
provides lifecycle management, skill loading, hooks, memory, and workflow
orchestration.

**Implementation**: `src/lib/agents/workforce/`

### Runtime Architecture

```
initializeWorkforce(workspaceId)
  ├─→ Protocol v1.0 init (Agent Card validation, escalation rules)
  ├─→ Skill index build (parse .claude/skills/ SKILL.md files)
  ├─→ Default hooks (safety, audit, permission, rate-limit, token-budget)
  └─→ Workforce registry (capability index from agents × skills)
```

### Agent Lifecycle States

Each agent transitions through managed states:

```
offline → idle → active → busy → idle (cycle)
              ↘ degraded → maintenance → idle
```

State transitions are validated against a strict matrix in
`agent-lifecycle.ts`. Invalid transitions throw errors.

### Per-Agent Execution Flow

When the Workforce Orchestrator assigns a workstream to an agent:

1. **Spawn** — `lifecycleManager.spawn(agentId)` loads Agent Card + Priority 1 skills
2. **Pre-hooks** — Safety, permission, rate-limit, token-budget checks
3. **Memory** — Load agent context from persistent memory (importance-weighted)
4. **Skills** — Load task-matched skills via keyword matching
5. **Execute** — Delegate to existing orchestrator-router / agentPlanner
6. **Post-hooks** — Audit logging
7. **Verify** — Output quality check via Protocol v1.0 verification
8. **Store** — Persist results in agent memory for future context
9. **Metrics** — Update execution time, success rate, token usage

### Key Modules

| Module | Purpose |
|--------|---------|
| `workforce/types.ts` | Shared types (skills, hooks, workflows, memory) |
| `workforce/skill-loader.ts` | Parse SKILL.md files, resolve dependencies |
| `workforce/hooks.ts` | 5 built-in lifecycle hooks (safety, audit, permission, rate-limit, token-budget) |
| `workforce/enhanced-hooks.ts` | 5 enhanced hooks (PII redaction, brand voice, critic review, draft tracking, health monitor) |
| `workforce/memory.ts` | Persistent memory (workspace/agent/session scopes) |
| `workforce/agent-lifecycle.ts` | Agent spawning, state management, permissions |
| `workforce/registry.ts` | Unified registry combining agents + skills + hooks |
| `workforce/orchestrator.ts` | Workflow coordinator with parallel workstreams |
| `workforce/index.ts` | Barrel export + `initializeWorkforce()` |

### Usage

```typescript
import {
  initializeWorkforce,
  workforceOrchestrator,
} from '@/lib/agents/workforce';

// At startup
const status = await initializeWorkforce(workspaceId);

// Execute a task
const result = await workforceOrchestrator.run({
  workspaceId,
  objective: 'Process incoming emails and update CRM contacts',
});
```

### Enhanced Capabilities (Phase 2.5)

| Capability | Module | Purpose |
|------------|--------|---------|
| PII Redaction | `security/pii-redactor.ts` | Detect/redact PII with reversible tokenization + AES-256-GCM field encryption |
| Critic Agent | `agents/critic-agent.ts` | 6-dimension content quality review (Haiku fast → Sonnet escalation) |
| Proactive Monitor | `agents/proactive-monitor.ts` | Agent performance, system health, dependency scanning, anomaly detection |
| Draft Tracker | `agents/draft-tracker.ts` | Content lifecycle (draft → critic → review → approved → published) |
| Brand Voice Engine | `brands/brand-voice-engine.ts` | RAG-style brand voice profiles, prompt enrichment, voice validation |

### Hook Pipeline (10 hooks, auto-registered at initialization)

```
Pre-execution:
  1. Safety Validator     → Block dangerous commands
  2. Permission Checker   → Validate against Agent Card
  3. Rate Limiter         → Sliding window enforcement
  4. Token Budget         → Cumulative token tracking
  5. PII Redactor         → Strip PII before external calls
  6. Brand Voice Enricher → Inject voice context for content agents

Post-execution:
  10. Critic Reviewer     → Auto-review generated content
  15. Draft Tracker       → Route content through draft pipeline
  90. Health Monitor      → Record metrics for anomaly detection
  100. Audit Logger       → Log all actions to event system
```

---

**This is the canonical agent registry. Do NOT create duplicate agent definitions outside of this registry.**
**Last Updated**: 2026-02-14
