# Protocol: THE PURGE - Unite-Hub/Synthex Decoupling Specification

**Date**: 2026-01-24
**Status**: ACTIVE
**Objective**: Decouple Synthex into standalone entity, refocus Unite-Hub as pure CRM

---

## Executive Summary

Unite-Hub will be refactored to a **pure CRM/SaaS platform** (User Management, Billing, Project Tracking). All Synthex-specific code (AI Video Generation, Marketing Agency features) will be extracted to a new **standalone Synthex-V1 repository**.

The two platforms will communicate via **Webhook Bridge** architecture.

---

## Phase 1: THE PURGE (Unite-Hub Refactor)

### 1.1 Deprecation Targets

**Immediate Deprecation** (Move to `_deprecated/` then delete after Synthex extraction):

```
src/app/synthex/                      # 3 main pages
src/app/api/synthex/                  # 283 API routes (80+ categories)
src/components/synthex/               # 32 UI components
src/lib/synthex/                      # 123 services
src/ui/synthex/                       # Additional UI components
scripts/synthex-*.mjs                 # 6 build scripts
supabase/migrations/*synthex*.sql     # All synthex migrations
tests/unit/synthex/                   # Test files
```

**Founder OS Integration** (Convert to External API consumers):
```
src/app/founder/synthex/             # Portfolio views → API consumers
src/app/founder/synthex-portfolio/   # → External API
src/app/founder/synthex-seo/         # → External API
```

### 1.2 Unite-Hub Retained Core

After PURGE, Unite-Hub retains:

```
✅ src/app/(client)/          # CRM dashboard
✅ src/app/founder/           # Founder OS (minus synthex/)
✅ src/app/api/               # Core CRM APIs (contacts, projects, billing)
✅ src/lib/                   # Core utilities (auth, supabase, agents)
✅ src/components/            # UI library (minus synthex/)
✅ supabase/migrations/       # Core tables (workspaces, contacts, projects)
```

### 1.3 External API Slot

Create webhook listener interface for Synthex communication:

```typescript
// src/app/api/external/synthex/route.ts
// Webhook endpoint for Synthex status updates

// src/app/api/external/[partner]/route.ts
// Generic external partner API slot
```

---

## Phase 2: GENESIS (Synthex-V1 Standalone)

### 2.1 New Repository Structure

```
Synthex-V1/
├── .claude/
│   ├── CLAUDE.md              # Synthex-specific instructions
│   └── agents/                # AI agent definitions
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Landing page, conversion flows
│   │   ├── portal/            # Client portal
│   │   ├── studio/            # Design studio
│   │   └── api/               # Synthex APIs
│   ├── components/
│   │   ├── ui/                # Design system (Scientific Luxury)
│   │   └── marketing/         # Marketing components
│   ├── lib/
│   │   ├── services/          # Business logic (extracted)
│   │   ├── ai/                # Claude/Gemini/Veo integration
│   │   └── integrations/      # External service connectors
│   └── hooks/
├── supabase/
│   └── migrations/            # Dedicated Synthex schema
├── ARCHITECTURE.md
└── package.json
```

### 2.2 Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | Turbopack, React 19 |
| Database | Supabase (Dedicated) | Separate instance from Unite-Hub |
| AI Engine | Anthropic Claude 3.7 | Content generation |
| Video | Google Veo API | Video generation |
| Visual | Aetheros System | Extracted from Unite-Hub |
| Auth | Supabase Auth | Standalone auth |
| Payments | Stripe | Separate Stripe account |

### 2.3 Design Mandate: "Scientific Luxury"

```css
/* Core Tokens */
--bg-primary: #0a0a0a;           /* OLED Black */
--accent-primary: #00d9ff;       /* Neon Cyan */
--accent-secondary: #ff00ff;     /* Electric Magenta */
--glass-bg: rgba(255,255,255,0.05);
--glass-border: rgba(255,255,255,0.1);

/* Motion */
--transition-velocity: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--gsap-ease: power3.out;
```

---

## Phase 3: THE BRIDGE (Webhook Architecture)

### 3.1 Synthex → Unite-Hub Webhook

```
POST /api/external/synthex/status
Authorization: Bearer {SYNTHEX_WEBHOOK_SECRET}

{
  "event": "project.status_update",
  "project_id": "uuid",
  "workspace_id": "uuid",
  "status": "completed",
  "metrics": {
    "videos_generated": 5,
    "content_pieces": 12
  },
  "timestamp": "2026-01-24T12:00:00Z"
}
```

### 3.2 Unite-Hub → Synthex Webhook

```
POST {SYNTHEX_API_URL}/api/webhooks/crm
Authorization: Bearer {UNITE_HUB_SECRET}

{
  "event": "contact.created",
  "contact_id": "uuid",
  "workspace_id": "uuid",
  "data": {
    "name": "...",
    "email": "..."
  }
}
```

### 3.3 Event Types

| Source | Event | Payload |
|--------|-------|---------|
| Synthex | `project.created` | Project metadata |
| Synthex | `project.status_update` | Status + metrics |
| Synthex | `project.completed` | Final deliverables |
| Synthex | `campaign.launched` | Campaign data |
| Synthex | `content.generated` | Content metadata |
| Unite-Hub | `contact.created` | Contact data |
| Unite-Hub | `contact.updated` | Updated fields |
| Unite-Hub | `workspace.created` | Workspace data |
| Unite-Hub | `billing.subscription_changed` | Plan changes |

---

## Extraction Roadmap

### Week 1-2: Core Extraction
- [ ] Create Synthex-V1 repository
- [ ] Set up Next.js 15 + Supabase
- [ ] Copy Tier 1 services (45 cleanly extractable)
- [ ] Copy Tier 1 API routes
- [ ] Copy UI components
- [ ] Set up design system tokens

### Week 3-4: Advanced Marketing
- [ ] Extract experimentation framework
- [ ] Extract audience/segmentation
- [ ] Extract revenue attribution
- [ ] Create Claude API abstraction layer

### Week 5-6: AI/Intelligence Layer
- [ ] Extract agent orchestration
- [ ] Extract knowledge graph services
- [ ] Create video generation abstraction
- [ ] Set up Aetheros visual system

### Week 7-8: Bridge & Testing
- [ ] Implement webhook bridge
- [ ] Full integration testing
- [ ] Multi-tenant RLS verification
- [ ] Production readiness audit

### Week 9+: Unite-Hub PURGE
- [ ] Move synthex code to `_deprecated/`
- [ ] Remove deprecated code
- [ ] Update CLAUDE.md
- [ ] Final verification

---

## Verification Checklist

### Unite-Hub Post-PURGE
- [ ] No `synthex` imports in active code
- [ ] No `synthex_*` tables referenced
- [ ] External API slots functional
- [ ] Webhook bridge tested
- [ ] CRM core fully operational

### Synthex-V1 Launch
- [ ] All services migrated
- [ ] Multi-tenant isolation verified
- [ ] Design system implemented
- [ ] CI/CD pipeline functional
- [ ] Production deployment ready

---

## File Manifest

### Unite-Hub: Create
```
src/app/api/external/synthex/route.ts      # Webhook listener
src/app/api/external/[partner]/route.ts    # Generic partner API
src/lib/webhooks/synthex-bridge.ts         # Bridge utilities
```

### Unite-Hub: Deprecate
```
src/app/synthex/                           # MOVE to _deprecated/
src/app/api/synthex/                       # MOVE to _deprecated/
src/components/synthex/                    # MOVE to _deprecated/
src/lib/synthex/                           # MOVE to _deprecated/
```

### Synthex-V1: Create
```
ARCHITECTURE.md                            # System architecture
src/lib/services/*                         # Extracted services
src/app/api/*                              # Extracted routes
src/components/*                           # Extracted components
supabase/migrations/*                      # Schema
```

---

## Rollback Plan

If extraction fails:
1. Restore Unite-Hub from `main` branch
2. Keep `_deprecated/` code intact until Synthex stable
3. Revert webhook bridge if causing issues
4. Document failure points for retry

---

**Approved by**: Genesis Architect
**Execution Start**: 2026-01-24
