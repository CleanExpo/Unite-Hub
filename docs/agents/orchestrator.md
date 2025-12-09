# Unite-Hub Agent Architecture

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Status**: Production (V1 MVP)

---

## Agent Topology Overview

Unite-Hub uses a **hierarchical multi-agent architecture** coordinated by an Orchestrator agent. This document defines all agents, their roles, capabilities, tools, and interaction patterns.

### Design Principles (Claude Developer Docs Aligned)

1. **Single Responsibility**: Each agent has one clear purpose
2. **Progressive Disclosure**: Agents load only needed context
3. **Tool-First Approach**: Use Claude-provided server tools where possible
4. **Memory Management**: Use `aiMemory` table for persistent state
5. **Audit Everything**: All agent actions logged to `auditLogs` table
6. **Workspace Isolation**: All operations scoped to `workspaceId`

---

## Agent Definitions

### 1. Orchestrator Agent

**ID**: `unite-hub.orchestrator`
**Model**: `claude-sonnet-4-5-20250929` (primary), `claude-opus-4-5-20251101` (complex reasoning)
**Skill File**: `.claude/skills/orchestrator/SKILL.md`

#### Role
Master coordinator for all Unite-Hub workflows. Routes tasks to specialist agents, manages multi-agent pipelines, maintains context across runs, handles errors, and generates system reports.

#### Capabilities
- Workflow orchestration (email → content pipeline)
- Task routing to specialized agents
- System health monitoring
- Error recovery and retry logic
- Progress reporting
- Audit trail management

#### Tools Available
- `bash_20250124` - Execute CLI commands (`npm run email-agent`, `npm run content-agent`)
- `memory_20250818` - Store workflow state between runs
- Database access via Supabase client

#### When to Invoke
- User requests: "Run full workflow", "Process all emails and generate content"
- User requests: "System health check", "Audit report"
- Scheduled cron jobs (Vercel Cron)
- Manual CLI: `npm run orchestrator`

#### Delegation Pattern
```
User Request → Orchestrator
  ↓
  ├─→ Email Agent (if email processing needed)
  ├─→ Content Agent (if content generation needed)
  ├─→ Frontend Agent (if UI/route work needed)
  ├─→ Backend Agent (if API/database work needed)
  └─→ Report back to user
```

#### Context Management
- Loads: Workflow state from `aiMemory` table
- Stores: Pipeline results, agent execution logs
- Memory keys: `orchestrator:workflow_state`, `orchestrator:last_email_run`, `orchestrator:last_content_run`

---

### 2. Email Agent

**ID**: `unite-hub.email-agent`
**Model**: `claude-sonnet-4-5-20250929` (standard), `claude-opus-4-5-20251101` (complex intent analysis)
**Skill File**: `.claude/skills/email-agent/SKILL.md`

#### Role
Processes incoming emails, extracts sender data, identifies communication intents, links to CRM contacts, analyzes sentiment, and updates contact records with AI insights.

#### Capabilities
- Email parsing and sender extraction
- Intent classification (inquiry, proposal, complaint, question, followup, meeting)
- Sentiment analysis (positive, neutral, negative)
- Contact linking (create or update)
- AI score calculation
- Audit logging

#### Tools Available
- Database access via Supabase client
- `text_editor_20250728` - Parse email content
- Extended Thinking (for complex intent analysis)

#### When to Invoke
- Orchestrator delegates email processing
- User requests: "Process unprocessed emails"
- Scheduled: Every hour (Gmail sync + processing)
- Manual CLI: `npm run email-agent`

#### Input Requirements
```json
{
  "workspaceId": "uuid",
  "limit": 50,
  "processingMode": "batch" | "single"
}
```

#### Output Format
```json
{
  "processed": 15,
  "newContacts": 3,
  "updated": 12,
  "intents": {
    "inquiry": 8,
    "proposal": 4,
    "meeting": 3
  },
  "sentiment": {
    "positive": 10,
    "neutral": 3,
    "negative": 2
  },
  "errors": []
}
```

#### Context Management
- Loads: Unprocessed emails from `emails` table
- Stores: Processed email metadata, contact updates
- Memory: Not used (stateless batch processing)

---

### 3. Content Agent

**ID**: `unite-hub.content-agent`
**Model**: `claude-opus-4-5-20251101` (Extended Thinking enabled, 5000-10000 token budget)
**Skill File**: `.claude/skills/content-agent/SKILL.md`

#### Role
Generates personalized marketing content (followup emails, proposals, case studies) for contacts with AI score ≥ 60 using Extended Thinking for high-quality output.

#### Capabilities
- Content personalization based on contact history
- Multiple content types (followup, proposal, case study)
- Interaction history analysis
- Company research integration
- Draft management (create, review, approve)

#### Tools Available
- Database access via Supabase client
- Extended Thinking (`anthropic-beta: thinking-2025-11-15`)
- `web_fetch_20250910` - Research company websites (future)

#### When to Invoke
- Orchestrator delegates after email processing
- User requests: "Generate content for warm leads"
- Scheduled: Daily (after email processing)
- Manual CLI: `npm run content-agent`

#### Input Requirements
```json
{
  "workspaceId": "uuid",
  "minScore": 60,
  "contentTypes": ["followup", "proposal", "case_study"],
  "limit": 20
}
```

#### Output Format
```json
{
  "generated": 12,
  "byType": {
    "followup": 8,
    "proposal": 3,
    "case_study": 1
  },
  "avgThinkingTokens": 7500,
  "errors": []
}
```

#### Context Management
- Loads: Contact data, interaction history, previous content
- Stores: Generated content drafts in `generatedContent` table
- Memory: Not used (contact-specific context loaded per generation)

---

### 4. Frontend Agent

**ID**: `unite-hub.frontend`
**Model**: `claude-sonnet-4-5-20250929`
**Skill File**: `.claude/skills/frontend/SKILL.md` (to be created)

#### Role
Handles frontend/UX/route work for Unite-Hub dashboard. Fixes UI bugs, implements components, updates layouts, ensures responsive design.

#### Capabilities
- React 19 / Next.js 16 development
- shadcn/ui component implementation
- Tailwind CSS styling
- Route creation and breadcrumb setup
- Client-side state management
- Responsive design

#### Tools Available
- `text_editor_20250728` - Edit React/TSX files
- `bash_20250124` - Run `npm run dev`, build commands
- File system access

#### When to Invoke
- Orchestrator delegates UI work
- User requests: "Fix dashboard layout", "Add new contact page", "Update navigation"
- Manual: Direct CLI interaction

#### Context Management
- Loads: Current component structure, existing routes
- Stores: Component changes, route updates
- Memory: Not used (file-based work)

---

### 5. Backend Agent

**ID**: `unite-hub.backend`
**Model**: `claude-sonnet-4-5-20250929`
**Skill File**: `.claude/skills/backend/SKILL.md` (to be created)

#### Role
Handles backend/API/database work for Unite-Hub. Implements API routes, database queries, authentication, integrations.

#### Capabilities
- Next.js API route development
- Supabase database operations
- Row Level Security (RLS) policies
- API authentication and authorization
- Third-party integrations (Gmail, Stripe)
- Database schema migrations

#### Tools Available
- `text_editor_20250728` - Edit API routes, database files
- `bash_20250124` - Run migrations, test APIs
- `code_execution_20250825` - Test database queries
- File system access

#### When to Invoke
- Orchestrator delegates API work
- User requests: "Create new API endpoint", "Fix database query", "Update RLS policies"
- Manual: Direct CLI interaction

#### Context Management
- Loads: Database schema, existing API routes
- Stores: API changes, schema updates
- Memory: Not used (file-based work)

---

### 6. Docs Agent

**ID**: `unite-hub.docs`
**Model**: `claude-haiku-4-5-20251001` (fast, cost-effective)
**Skill File**: `.claude/skills/docs/SKILL.md` (to be created)

#### Role
Maintains documentation files (README.md, .claude/claude.md, .claude/agent.md, API docs). Ensures docs stay in sync with codebase.

#### Capabilities
- Markdown documentation generation
- API documentation updates
- README maintenance
- Architecture diagram creation (text-based)
- Changelog management

#### Tools Available
- `text_editor_20250728` - Edit markdown files
- File system access

#### When to Invoke
- After significant code changes
- User requests: "Update README", "Document new API endpoint"
- Manual: Direct CLI interaction

#### Context Management
- Loads: Existing documentation
- Stores: Updated documentation
- Memory: Not used (file-based work)

---

### 7. Stripe Agent

**ID**: `unite-hub.stripe-agent`
**Model**: `claude-sonnet-4-5-20250929`
**Skill File**: `.claude/skills/stripe-agent/SKILL.md`
**MCP Server**: `stripe` (via `@stripe/mcp`)

#### Role
Manages all Stripe billing operations including product/price creation, subscription management, checkout sessions, webhooks, and dual-mode (test/live) billing for staff vs. customer separation.

#### Capabilities
- Product and price management (create, list, update)
- Checkout session creation
- Subscription lifecycle management (create, upgrade, downgrade, cancel)
- Customer management
- Invoice generation and tracking
- Webhook event processing
- Dual-mode billing (test/live separation)
- Billing report generation
- Configuration auditing

#### Tools Available
- MCP Stripe tools: `mcp__stripe__create_product`, `mcp__stripe__create_price`, `mcp__stripe__create_checkout_session`, etc.
- Database access via Supabase client
- `text_editor_20250728` - Edit billing configuration files

#### When to Invoke
- User requests: "Setup Stripe products", "Create checkout session"
- Orchestrator delegates billing operations
- Webhook events received
- User requests: "Audit billing configuration"
- Scheduled: Monthly billing reports

#### Input Requirements
```json
{
  "action": "create_checkout" | "setup_products" | "process_webhook" | "audit" | "report",
  "workspaceId": "uuid",
  "userId": "uuid",
  "email": "user@example.com",
  "tier": "starter" | "professional" | "elite",
  "billing": "monthly" | "annual"
}
```

#### Output Format
```json
{
  "success": true,
  "action": "create_checkout",
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "sessionId": "cs_xxx",
    "mode": "test" | "live"
  }
}
```

#### Context Management
- Loads: Workspace billing settings, customer data
- Stores: Subscription records, invoice history
- Memory: Not used (webhook-driven state)

#### Dual-Mode Billing Logic
```
Email/Role Check
  ├─→ Staff domain (unite-group.in, etc.) → TEST mode
  ├─→ Sandbox registry email → TEST mode
  ├─→ Staff role (founder, admin) → TEST mode
  └─→ External customer → LIVE mode
```

#### Pricing Tiers (AUD, GST Included)
| Tier | Monthly | Annual |
|------|---------|--------|
| Starter | $495 | $4,950 |
| Professional | $895 | $8,950 |
| Elite | $1,295 | $12,950 |

---

## Agent Interaction Patterns

### Pattern 1: Full Pipeline (Email → Content)

```
User: "Run full workflow"
  ↓
Orchestrator Agent
  ├─ 1. Execute Email Agent
  │    └─ Process unprocessed emails
  │    └─ Update contacts
  │    └─ Log audit events
  ├─ 2. Evaluate Email Results
  │    └─ Get contact scores
  │    └─ Filter warm leads (≥60)
  ├─ 3. Execute Content Agent
  │    └─ Generate personalized content
  │    └─ Store drafts
  ├─ 4. Generate Report
  │    └─ Summary of actions
  │    └─ Recommendations
  └─ 5. Return to User
```

### Pattern 2: System Health Check

```
User: "Run system audit"
  ↓
Orchestrator Agent
  ├─ 1. Check Database Integrity
  │    └─ Verify all tables
  │    └─ Count records
  ├─ 2. Query Audit Logs (24h)
  │    └─ Count actions
  │    └─ Identify errors
  ├─ 3. Check Agent Health
  │    └─ Last run timestamps
  │    └─ Success rates
  ├─ 4. Generate Health Report
  └─ 5. Return to User
```

### Pattern 3: Frontend Fix Request

```
User: "Fix dashboard contacts page workspace filtering"
  ↓
Orchestrator Agent
  ├─ Analyze request
  ├─ Delegate to Frontend Agent
  │    └─ Frontend Agent
  │         ├─ Read dashboard/contacts/page.tsx
  │         ├─ Identify missing workspace filter
  │         ├─ Add .eq("workspace_id", workspaceId)
  │         ├─ Test changes
  │         └─ Return success
  └─ Return to User
```

---

## Tool Usage Guidelines (Claude Developer Docs)

### Bash Tool (`bash_20250124`)

**When to Use**:
- Running CLI commands: `npm run email-agent`, `npm run dev`
- Git operations: `git status`, `git add`, `git commit`
- File system operations: `ls`, `mkdir`, `find`

**Session Management**:
- Persistent shell session (5 min timeout)
- Working directory maintained across commands
- Use `&&` for dependent commands

**Example**:
```bash
npm run email-agent && npm run content-agent
```

### Code Execution Tool (`code_execution_20250825`)

**When to Use**:
- Testing database queries
- Quick data transformations
- JSON validation

**Limitations**:
- Python 3.11.12 only
- No network access
- 5GiB RAM limit

### Text Editor Tool (`text_editor_20250728`)

**When to Use**:
- Viewing files: `text_editor_20250728.view("src/lib/db.ts")`
- Creating files: `text_editor_20250728.create("new-file.ts", content)`
- String replacement: `text_editor_20250728.str_replace(file, old, new)`
- Inserting text: `text_editor_20250728.insert(file, line, text)`
- Undo changes: `text_editor_20250728.undo_edit(file)`

**Best Practices**:
- Always view file before editing
- Use str_replace for surgical changes
- Undo if changes break tests

### Memory Tool (`memory_20250818`)

**When to Use**:
- Store workflow state between runs
- Cache expensive computations
- Track agent execution history

**Storage Pattern**:
```typescript
// Store
await memory.store({
  key: "orchestrator:workflow_state",
  value: { status: "running", startedAt: Date.now() }
});

// Retrieve
const state = await memory.retrieve({ key: "orchestrator:workflow_state" });
```

**Unite-Hub Memory Keys**:
- `orchestrator:workflow_state` - Current workflow status
- `orchestrator:last_email_run` - Last email agent execution
- `orchestrator:last_content_run` - Last content agent execution
- `orchestrator:pipeline_cache` - Contact scores after email processing

---

## Error Handling Strategy

### Error Levels

**Level 1: Recoverable** (Log and continue)
- Single email fails to process
- Claude API timeout (retry once)
- Network blip

**Level 2: Significant** (Log, retry with reduced scope, alert user)
- Contact data missing/invalid
- Email agent fails 50% of batch
- Content generation rate < 80%

**Level 3: Critical** (Log, halt workflow, alert immediately)
- Database connection lost
- Claude API down (all retries failed)
- All agents failing

### Error Logging Pattern

All agents must log errors to `auditLogs` table:

```typescript
await supabase.from("auditLogs").insert({
  organization_id: orgId,
  action: "email_agent_error",
  resource_type: "email",
  resource_id: emailId,
  context: {
    error_message: error.message,
    stack_trace: error.stack,
    email_from: email.from,
    processing_step: "intent_extraction"
  },
  created_at: new Date().toISOString()
});
```

---

## Agent Coordination Rules

1. **Orchestrator is the single entry point** for multi-step workflows
2. **Specialist agents do NOT call each other** - only Orchestrator coordinates
3. **All agents are stateless** - state stored in database or Memory tool
4. **Workspace isolation is mandatory** - all queries must filter by `workspace_id`
5. **Audit everything** - every agent action logged to `auditLogs`
6. **Fail gracefully** - agents return error status, do not throw exceptions
7. **Report progress** - agents provide clear status messages

---

## Version 1 Constraints

**What We Build (MVP)**:
- ✅ Email processing pipeline
- ✅ Content generation pipeline
- ✅ Orchestrator coordination
- ✅ Dashboard fixes (workspace filtering, auth)
- ✅ API endpoint stabilization

**What We Do NOT Build (Post-V1)**:
- ❌ Advanced A/B testing
- ❌ Multi-language support
- ❌ Complex drip campaign branching
- ❌ Real-time collaboration features
- ❌ Mobile app

---

## Agent Files Reference

| Agent | Skill File | Script | Config |
|-------|-----------|--------|--------|
| Orchestrator | `.claude/skills/orchestrator/SKILL.md` | `scripts/run-orchestrator.mjs` | `.claude/config.json` |
| Email Agent | `.claude/skills/email-agent/SKILL.md` | `scripts/run-email-agent.mjs` | `.claude/config.json` |
| Content Agent | `.claude/skills/content-agent/SKILL.md` | `scripts/run-content-agent.mjs` | `.claude/config.json` |
| Frontend Agent | `.claude/skills/frontend/SKILL.md` | N/A (interactive) | N/A |
| Backend Agent | `.claude/skills/backend/SKILL.md` | N/A (interactive) | N/A |
| Docs Agent | `.claude/skills/docs/SKILL.md` | N/A (interactive) | N/A |
| Stripe Agent | `.claude/skills/stripe-agent/SKILL.md` | `scripts/run-stripe-agent.mjs` | `.claude/mcp.json` |

---

## Next Steps

See `.claude/claude.md` for complete system overview and project context.
