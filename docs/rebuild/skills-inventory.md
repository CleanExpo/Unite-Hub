# Skills Inventory - Unite-Hub / Synthex Platform

**Generated**: 2025-11-29
**Rebuild Branch**: rebuild/zero-foundation-20251129
**Status**: PRESERVED - These assets form the foundation of the system

---

## Executive Summary

| Category | Count | Status |
|----------|-------|--------|
| SKILL.md Files | 19 | PRESERVED |
| Agent TypeScript Files | 26 | PRESERVED |
| Agent Definition Files | 1 | PRESERVED |
| MCP Configurations | 2 | PRESERVED |

---

## SKILL.md Files (`.claude/skills/`)

### Core System Skills

| Skill | File | Purpose | Model |
|-------|------|---------|-------|
| **Orchestrator** | `orchestrator/SKILL.md` | Master coordinator for all workflows | Sonnet 4.5 / Opus 4.5 |
| **Email Agent** | `email-agent/SKILL.md` | Email processing, intent extraction, contact linking | Sonnet 4.5 |
| **Content Agent** | `content-agent/SKILL.md` | Personalized content generation with Extended Thinking | Opus 4.5 |
| **Frontend** | `frontend/SKILL.md` | React/Next.js UI work | Sonnet 4.5 |
| **Backend** | `backend/SKILL.md` | API routes, database, RLS policies | Sonnet 4.5 |
| **Docs** | `docs/SKILL.md` | Documentation maintenance | Haiku 4.5 |
| **Stripe Agent** | `stripe-agent/SKILL.md` | Billing, subscriptions, dual-mode (test/live) | Sonnet 4.5 |

### Founder Intelligence OS Skills

| Skill | File | Purpose | Model |
|-------|------|---------|-------|
| **AI Phill** | `ai-phill/SKILL.md` | Strategic advisor, Socratic dialogue, blind spot detection | Opus 4.5 |
| **Cognitive Twin** | `cognitive-twin/SKILL.md` | 13-domain health monitoring, anomaly detection | Sonnet 4.5 / Opus 4.5 |
| **Founder OS** | `founder-os/SKILL.md` | Business portfolio, signals, vault, snapshots | Sonnet 4.5 |
| **Pre-Client** | `pre-client/SKILL.md` | Email intelligence, opportunity scoring, relationship timelines | Sonnet 4.5 |

### Marketing & SEO Skills

| Skill | File | Purpose | Model |
|-------|------|---------|-------|
| **SEO Leak** | `seo-leak/SKILL.md` | SEO vulnerability detection, gap analysis | Sonnet 4.5 |
| **No-Bluff SEO** | `no-bluff-seo/SKILL.md` | DataForSEO/SEMRush protocol enforcement | Sonnet 4.5 |
| **Multi-Channel** | `multi-channel/SKILL.md` | Social inbox, ad optimization, multi-platform coordination | Sonnet 4.5 |
| **Social Playbook** | `social-playbook/SKILL.md` | Content scripts, visuals, captions for 6 platforms | Sonnet 4.5 |
| **Video Generation** | `video-generation/SKILL.md` | Video concepts, scripts, shotlists for VEO/Gemini | Sonnet 4.5 |
| **Visual Engine** | `visual-engine/SKILL.md` | Visual experience engine, animations, layouts | Sonnet 4.5 |

### Strategic & Decision Skills

| Skill | File | Purpose | Model |
|-------|------|---------|-------|
| **Decision Moment** | `decision-moment/SKILL.md` | Decision mapping across Awareness→Retention stages | Sonnet 4.5 |
| **Deployment Audit** | `deployment-audit/SKILL.md` | DigitalOcean MCP health checks, crash logs | Sonnet 4.5 |

---

## Agent TypeScript Files (`src/lib/agents/`)

### Core Intelligence Agents

| Agent | File | Purpose |
|-------|------|---------|
| contact-intelligence | `contact-intelligence.ts` | Contact scoring algorithm (0-100) |
| content-personalization | `content-personalization.ts` | Personalized content generation |
| email-processor | `email-processor.ts` | Email parsing and processing |
| email-intelligence-agent | `email-intelligence-agent.ts` | Email analysis with Gemini integration |
| intelligence-extraction | `intelligence-extraction.ts` | Data extraction from various sources |

### Founder OS Agents

| Agent | File | Purpose |
|-------|------|---------|
| aiPhillAgent | `aiPhillAgent.ts` | AI Phill strategic advisor implementation |
| cognitiveTwinAgent | `cognitiveTwinAgent.ts` | 13-domain health monitoring |
| founderOsAgent | `founderOsAgent.ts` | Business portfolio management |
| preClientIdentityAgent | `preClientIdentityAgent.ts` | Pre-sales intelligence |

### Marketing & Social Agents

| Agent | File | Purpose |
|-------|------|---------|
| socialInboxAgent | `socialInboxAgent.ts` | Unified social inbox |
| seoLeakAgent | `seoLeakAgent.ts` | SEO vulnerability scanning |
| searchSuiteAgent | `searchSuiteAgent.ts` | Keyword tracking and monitoring |
| boostBumpAgent | `boostBumpAgent.ts` | Browser automation for repetitive tasks |

### Infrastructure Agents

| Agent | File | Purpose |
|-------|------|---------|
| base-agent | `base-agent.ts` | Base class for all agents |
| agentExecutor | `agentExecutor.ts` | Agent execution framework |
| agentPlanner | `agentPlanner.ts` | Multi-step task planning |
| agentSafety | `agentSafety.ts` | Safety guardrails for agents |
| agentArchiveBridge | `agentArchiveBridge.ts` | Archive and retrieval |
| agent-reliability | `agent-reliability.ts` | Retry and reliability patterns |
| model-router | `model-router.ts` | Multi-model routing logic |
| multi-model-orchestrator | `multi-model-orchestrator.ts` | Cross-model orchestration |
| orchestrator-router | `orchestrator-router.ts` | Task routing to specialists |
| orchestrator-self-healing | `orchestrator-self-healing.ts` | Self-healing integration |

### Specialized Agents

| Agent | File | Purpose |
|-------|------|---------|
| calendar-intelligence | `calendar-intelligence.ts` | Calendar event analysis |
| mindmap-analysis | `mindmap-analysis.ts` | Mind map processing |
| whatsapp-intelligence | `whatsapp-intelligence.ts` | WhatsApp message processing |

---

## Agent Architecture Definition

**File**: `.claude/agent.md` (598 lines)

**Contents**:
- 7 Core agent definitions with IDs, models, tools, and capabilities
- 3 Interaction patterns (Full Pipeline, Health Check, Frontend Fix)
- Tool usage guidelines (Bash, Code Execution, Text Editor, Memory)
- Error handling strategy (3 levels)
- Agent coordination rules
- Version 1 constraints

---

## Key Architectural Patterns

### 1. Hierarchical Agent Topology
```
User Request
    ↓
Orchestrator Agent (Coordinator)
    ├── Email Agent (Processing)
    ├── Content Agent (Generation)
    ├── Frontend Agent (UI)
    ├── Backend Agent (API/DB)
    ├── Docs Agent (Documentation)
    └── Stripe Agent (Billing)
```

### 2. Founder Intelligence OS Architecture
```
Founder Request
    ↓
AI Phill (Strategic Advisor)
    ├── Founder OS (Portfolio Management)
    ├── Cognitive Twin (Health Monitoring)
    └── Pre-Client (Lead Intelligence)
```

### 3. Marketing Intelligence Architecture
```
Marketing Task
    ↓
Multi-Channel Agent (Coordinator)
    ├── SEO Leak Agent (Vulnerabilities)
    ├── Social Inbox Agent (Unified Inbox)
    ├── Search Suite Agent (Rankings)
    ├── Social Playbook (Content)
    └── Video Generation (Media)
```

### 4. Model Selection Strategy

| Use Case | Model | Reasoning |
|----------|-------|-----------|
| Standard operations | Sonnet 4.5 | Fast, cost-effective |
| Complex reasoning | Opus 4.5 | Extended Thinking enabled |
| Quick tasks | Haiku 4.5 | Minimal latency/cost |

---

## Mode: HUMAN_GOVERNED

**Critical Pattern**: All skills operate in **HUMAN_GOVERNED** mode:
- Advisory only - agents propose, humans decide
- No automatic business changes
- Present options and recommendations
- Flag risks and opportunities
- Document reasoning for transparency

---

## Preservation Rules

**These assets MUST be preserved during rebuild:**

1. **Directories**:
   - `.claude/skills/` (all 19 SKILL.md files)
   - `src/lib/agents/` (all 26 agent TypeScript files)

2. **Files**:
   - `.claude/agent.md` (agent architecture definition)
   - `.claude/CLAUDE.md` (project conventions)
   - `.claude/config.json` (agent configuration)
   - `.claude/mcp.json` (MCP server configuration)

3. **Patterns**:
   - Hierarchical orchestrator → specialist delegation
   - Extended Thinking for complex analysis
   - Workspace isolation in all database queries
   - Audit logging for all agent actions

---

## Integration Points

| System | Integration | Status |
|--------|-------------|--------|
| Supabase | Database, Auth, RLS | Active |
| Anthropic | Claude API (Opus, Sonnet, Haiku) | Active |
| Stripe MCP | Billing operations | Active |
| Playwright MCP | Browser automation | Active |
| Gmail API | Email sync | Active |
| DataForSEO | SEO intelligence | Active |
| OpenRouter | Multi-model routing | Active |
| Perplexity Sonar | SEO research | Active |

---

**Last Updated**: 2025-11-29 during Phase 0 rebuild initialization
