# Unite-Hub Daily Driver: Pi-Wrapper, Secure Computer Use, and Agentic Ops

Date: 2026-06-02
Owner: Phill McGurk, CEO
Prepared for: Margot -> Pi-CEO Board -> Senior PM / Engineering Agents
Repository: `D:\Unite-Hub` / `CleanExpo/Unite-Hub`
Status: Deep-research implementation brief; do not ship code from this brief without scoped build lanes and verification.

## Executive decision

The Pi-wrapper belongs inside Unite-Hub, not as a detached Pi-Dev-Ops-only surface.

Pi-Dev-Ops should remain the build engine: repo intake, senior-engineer loops, workflow evidence, model routing, audit receipts, verification and shipping gates.

Unite-Hub must become the daily-driver command centre: one authenticated URL where Phill can operate the group, launch/monitor Pi-Dev-Ops work, approve dangerous browser/computer-use tasks, manage vault access, switch models/providers without losing context, and see the business visually.

Recommended product direction:

1. Unite-Hub becomes the Founder OS.
2. Pi-Dev-Ops becomes the execution engine behind it.
3. Computer/browser-use becomes a controlled capability, not a free-for-all bypass.
4. Credentials move into a governed vault with human-in-the-loop grants.
5. Model selection becomes an explicit Performance / Speed / Cost router, not random provider switching.
6. Agent work runs through a Triangle of Agents:
   - Engineering Agents
   - Product/Project Agents
   - Risk/Approval Agents

## Source research: Claude Code dynamic workflows

Anthropic's Claude Code workflow document describes dynamic workflows as a JavaScript-orchestrated mechanism for spawning many subagents in phases. The key lesson is not "use Anthropic for everything"; it is that senior engineering work improves when orchestration is moved out of chat and into repeatable scripts.

Key findings from the document:

- Dynamic workflows are for large audits, migrations, cross-checked research, and hard plans.
- The workflow script owns loops, branching, phase state, intermediate results, and resumability.
- Claude's context only receives the final result, reducing context bloat.
- Workflows can fan out agents, cross-check claims, adversarially review findings, and produce cited reports.
- Workflows show phase-level agent counts, token totals, and elapsed time.
- Workflows can be paused, resumed, stopped, or saved as reusable commands.
- They can run up to many agents, but this increases token cost and must be controlled.
- Model cost control is explicit: use smaller models for stages that do not need the strongest model.

How this applies locally:

- Pi-Dev-Ops already has the start of this pattern: route -> intake -> scan -> audit -> classify -> verify.
- Unite-Hub needs the human-facing orchestration cockpit for these workflows.
- The architecture should be provider-neutral. Claude/Opus-style workflows are a methodology; execution should route through the configured provider policy, including GPT, Gemini, Grok, Kimi, Qwen, Mistral and others where appropriate.

## Current Unite-Hub reality

Observed from repository:

- Unite-Hub is the correct CRM/daily-driver repo.
- It is a private founder CRM, single tenant, Next.js 16 App Router, React 19, Supabase, Vercel and Tailwind.
- It already has founder routes for dashboard, vault, approvals, Xero, social, bookkeeper, boardroom, email, kanban, strategy, contacts and settings.
- It already has vault encryption code in `src/lib/vault.ts` using AES-256-GCM with PBKDF2-derived keys.
- It already has an `approval_queue` concept in the engineering framework.
- It already has dependencies and integration surfaces for Playwright MCP, Xero, Google, Linear, social channels and AI providers.
- The founder dashboard exists but is not yet a true operating cockpit for the whole business.
- The current docs still mention direct `ANTHROPIC_API_KEY` as critical, which conflicts with the newer Pi-Dev-Ops policy: avoid external Anthropic API credits for normal execution unless using Claude CLI Max/OAuth.

Bottom line: the foundations exist, but the product has not yet been forced into one coherent daily-driver experience.

## Phill's problem statement translated into product requirements

Phill's words describe five missing capabilities:

1. One URL daily driver
   - Unite-Hub must be the place he opens every morning.
   - It must show business status, approvals, finances, accounts, agents, builds, socials, and live work.

2. Controlled computer/browser use
   - Agents need browser capability for tasks blocked by APIs or missing integrations.
   - Examples: Stripe, banking portals, Xero, Google Cloud Console, social account setup.
   - This must not be implemented as a security bypass. It must be implemented as human-approved browser automation with auditable grants.

3. Clean credential and account control
   - The current account landscape is messy: duplicate emails, forgotten credentials, reused passwords, scattered providers.
   - Unite-Hub needs an Account Registry and Credential Vault to normalize every provider/account/business relationship.

4. Provider/model switching without momentum loss
   - Phill wants to switch between OpenAI, Anthropic, Gemini, Grok, Kimi, Qwen, Mistral etc.
   - The system must preserve task context, decisions, files, receipts, model outputs and next actions across switches.

5. Senior PM / Senior Engineer operating discipline
   - No bloated builds.
   - Finish one lane before the next.
   - Test everything.
   - Optimize for performance, speed and token cost.
   - Provide visible receipts and board-ready recommendations.

## Hard safety boundary

Do not build or instruct agents to bypass bank, Stripe, Google, Xero, social, or tax security controls.

Allowed pattern:

- Phill logs in once or completes MFA himself.
- The system records a time-limited, scoped browser session or OAuth grant where permitted.
- A vault stores credentials/tokens securely.
- A policy engine decides whether an agent may use a credential/session.
- Dangerous actions are queued for explicit approval.
- All actions are logged with screenshots/events where lawful and technically possible.

Not allowed:

- Circumventing MFA.
- Defeating anti-bot controls.
- Scraping or automating against a service in a way that violates legal/contractual constraints.
- Auto-moving money, changing tax filings, or publishing externally without a governance gate.

## Proposed architecture

### 1. Founder Command Centre inside Unite-Hub

Route:

- `/founder/command-centre`

Purpose:

- The daily-driver landing screen.
- One page to see: businesses, agents, approvals, vault health, model spend, current builds, Xero/bookkeeper status, social status, email, browser automation queue, and board brief.

Core panels:

- Empire Snapshot
- Today's Priorities
- Agent Run Queue
- Pi-Dev-Ops Builds
- Browser/Computer-Use Tasks
- Vault / Account Health
- Approvals Needing Phill
- Model Spend and Routing
- Finance/Xero/ATO Status
- Social/Synthex Status
- Recent Receipts / Evidence

### 2. Pi-wrapper in Unite-Hub

The wrapper should be a Unite-Hub UI and API layer around Pi-Dev-Ops, not a clone of Pi-Dev-Ops.

Routes:

- `/founder/pi`
- `/api/pi/route`
- `/api/pi/runs`
- `/api/pi/runs/[id]`
- `/api/pi/approvals`
- `/api/pi/model-router`

Responsibilities:

- Accept founder commands in plain English.
- Classify the lane: research, repo-intake, feature, bugfix, QA, release, browser-task, account-cleanup, finance-task, social-task.
- Send execution to Pi-Dev-Ops or an approved local worker.
- Stream run status and receipts back to Unite-Hub.
- Store run summaries, costs, model choices, and evidence.
- Expose a clear model/provider selector that does not drop context.

Non-responsibilities:

- Do not run unbounded agents from the browser UI.
- Do not store raw model contexts in client components.
- Do not make Unite-Hub dependent on one provider.

### 3. Account Registry

New domain object:

- `accounts_registry`

Tracks every external account:

- Provider: Google, Microsoft, Xero, Stripe, Facebook, LinkedIn, YouTube, TikTok, bank, ATO, ASIC, Vercel, Railway, Supabase, GitHub, Linear, OpenRouter, etc.
- Business owner: Unite-Group Nexus, Synthex, RestoreAssist, ATIA vertical, personal, client.
- Login identifier: email / username / tenant ID.
- Auth method: OAuth, password, passkey, SSO, API key, manual-only.
- MFA method: authenticator, SMS, email, hardware key, unknown.
- Credential location: vault item ID, OAuth connection ID, manual-only marker.
- Agent access level: none, read-only, draft-only, approved-write, human-only.
- Last verified date.
- Risk rating.
- Cleanup status.

This solves the current mess before adding more automation.

### 4. Vault Access Grants

The existing vault is a good base but needs governance objects.

New concepts:

- `vault_items`: encrypted secrets and metadata.
- `vault_access_grants`: time-limited, scoped permission for an agent/run/task.
- `browser_sessions`: stored references to browser contexts, never a promise of permanent access.
- `approval_queue`: human sign-off before dangerous use.
- `audit_events`: immutable receipt of use.

Grant model:

- Who requested access?
- Which run/task needs it?
- Which provider/account?
- What scope?
- Read only or write capable?
- Expires when?
- Requires Phill's approval?
- Was it used?
- What happened?

Default policy:

- View/use credential only inside server-side worker or approved browser runtime.
- Never expose decrypted secrets to the browser client.
- Never print secrets into logs.
- All credential access writes an audit event.

### 5. Browser/Computer-Use Gateway

Recommended implementation pattern:

- Use Playwright as the controlled browser automation layer.
- Keep browser workers server-side/local, not inside client code.
- Persist only approved storage state/session references where permitted.
- Use screenshots and action logs as receipts.
- Queue every dangerous or external-facing action through approvals.

Task categories:

- Safe read-only: dashboard checks, status screenshots, download reports.
- Draft-only: prepare invoice, prepare social post, stage settings, draft email.
- Approved-write: publish, submit, send, change billing, create account, connect app.
- Human-only: bank transfer, tax filing submission, MFA setup, irreversible account closure.

The browser gateway should not try to defeat service security. It should help Phill use his own logged-in sessions safely and consistently.

### 6. Provider and Model Router

Unite-Hub should expose a Senior PM grade router based on the trade-off triangle:

- Performance: output quality, reasoning, coding ability, long-context handling.
- Speed: latency, iteration rate, UI responsiveness.
- Cost: tokens, provider pricing, subscription vs API spend, failure/retry cost.

Recommended routing table:

| Work type | Primary model class | Challenger / fallback | Reason |
|---|---|---|---|
| Founder intake / routing | cheap-fast model | mid model | deterministic classification, low cost |
| Daily brief summarisation | Gemini Flash / GPT mini / Qwen mid | Kimi for synthesis | speed + long context |
| Deep architecture | GPT-5.5-class or Kimi 2.5/2.6-class | Grok / Gemini Pro challenger | higher reasoning needed |
| UI polish / visual critique | Gemini Pro/vision or GPT vision | Grok/Kimi text review | multimodal design review |
| Code implementation | GPT-5.5-class / Qwen / Kimi | separate reviewer model | coding plus adversarial review |
| Large context repo audit | Kimi / Gemini long-context | GPT/Grok executive synthesis | context window + final judgment |
| Cheap worker swarm | free/cheap Qwen/DeepSeek/Nemotron class | Gemini Flash Lite | many low-risk agents |
| External-facing copy | GPT/Gemini/Grok depending voice | humanizer/reviewer | tone and risk gate |
| Finance/legal/tax advice support | retrieval + conservative model | human approval | cannot be autonomous final authority |
| Computer-use/browser tasks | planner + Playwright worker | risk reviewer | action safety more important than raw IQ |

Router outputs should include:

- selected_model
- provider
- role
- reason
- expected_cost_band
- expected_latency_band
- context_pack_id
- approval_required
- fallback_model
- reviewer_model

The model router should be stored as data, not hardcoded across UI pages.

### 7. Context Continuity Layer

Provider switching fails when context lives only inside one chat window.

Unite-Hub needs explicit context packs:

- `context_packs`
- `task_receipts`
- `agent_run_summaries`
- `decision_records`
- `artifact_links`

Each agent run should write:

- objective
- constraints
- current files/systems touched
- decisions made
- evidence collected
- next recommended action
- unresolved blockers
- model/provider used
- cost/time estimate

This lets the system switch from Kimi to GPT to Gemini without losing momentum.

### 8. Agent Triangle

The core operating triangle:

1. Senior Project/Product Agent
   - Converts Phill's voice notes into scope, priorities, acceptance criteria, and trade-offs.
   - Owns business outcome and sequence.

2. Senior Engineering Agent
   - Owns architecture, implementation, tests, evidence, anti-bloat and close-the-loop discipline.
   - Uses Pi-Dev-Ops as the build engine.

3. Risk / Governance Agent
   - Owns approvals, credential risk, external-facing actions, financial/tax/banking constraints, and board gates.

Every meaningful task should be decomposed by this triangle before execution.

## Three-machine continuity addendum

Phill's preferred operating model is now explicit: Unite-Hub must work across the Windows Desktop PC, MacBook Pro, and Mac mini without losing context or momentum.

The architecture addendum is captured at:

- `D:\Unite-Hub\docs\strategy\2026-06-02-three-machine-founder-os-continuity.md`

Core decision:

- Mac mini = always-on command host for queues, cron, context sync, webhooks, scheduled briefs, and background orchestration.
- Windows Desktop PC = heavy execution workstation for builds, local verification, Docker, Playwright/browser tasks, and high-power local work.
- MacBook Pro = mobile founder cockpit for idea capture, approvals, review, voice/chat input, and portable access through Unite-Hub.

Product promise:

> Open Unite-Hub anywhere, type an idea, and the system turns it into a tracked task packet with the right app, right agents, right machine, right model, and right approval path.

This requires four added primitives after the initial Command Centre and Pi-wrapper MVP:

1. Device Registry + Heartbeats
2. Task Packets + Context Packs
3. Machine Assignment Router
4. Run Queue UI

These primitives must exist before the system attempts serious browser/computer-use automation, because without them the work will fragment across machines and context will be lost.

## Recommended build lanes

### Lane 0 — Decision record and route correction

Goal:

- Record the architectural decision that Pi-wrapper belongs inside Unite-Hub.

Deliverables:

- This brief.
- Update engineering docs to point daily-driver work at Unite-Hub.
- Mark Pi-Dev-Ops as backend execution engine, not founder daily UI.

Acceptance:

- Agents stop adding founder UI into Pi-Dev-Ops unless explicitly scoped.

### Lane 1 — Command Centre shell

Goal:

- Build `/founder/command-centre` as a high-quality daily-driver shell using existing widgets where possible.

Deliverables:

- Page route.
- Navigation entry.
- Panels for priority, approvals, vault, Pi runs, integrations, browser tasks, model spend.
- No fake claims; empty states must say what is connected vs pending.

Acceptance:

- Type-check passes.
- Page loads authenticated.
- No light backgrounds, no rounded-md/lg/xl/full.

### Lane 2 — Pi-wrapper MVP

Goal:

- Unite-Hub can submit a founder command to a local/Pi-Dev-Ops adapter and display a receipt.

Deliverables:

- `src/lib/pi-wrapper/types.ts`
- `src/lib/pi-wrapper/router.ts`
- `/api/pi/route`
- `/founder/pi`
- Tests for classification and response schema.

Acceptance:

- A command can be classified without touching external systems.
- The API returns JSON with lane, model recommendation, approval level, and next action.

### Lane 3 — Account Registry MVP

Goal:

- Create a clean inventory of accounts before automating them.

Deliverables:

- Supabase migration for `accounts_registry`.
- Founder page for accounts.
- Import/manual add flow.
- Status tags: unknown, verified, needs cleanup, agent-ready, human-only.

Acceptance:

- No raw passwords shown or stored in UI.
- All rows scoped by `founder_id`.

### Lane 4 — Vault Grants and Approval Gate

Goal:

- Let Phill grant scoped access once for a task/session without exposing secrets broadly.

Deliverables:

- `vault_access_grants` table.
- Grant request API.
- Approval UI integration.
- Audit events.

Acceptance:

- Decrypted secrets never leave server-side execution.
- Every grant has expiry, purpose and audit event.

### Lane 5 — Browser Gateway spike

Goal:

- Prove read-only browser automation using Playwright against a safe internal/demo target before touching bank/Stripe/Xero/social.

Deliverables:

- Local browser worker adapter.
- Storage-state/session reference model.
- Screenshot/action receipt format.
- Read-only demo task.

Acceptance:

- No bank/social/tax automation in first spike.
- Screenshot receipt and action log stored.
- Approval gate demonstrated.

### Lane 6 — Provider Router and Cost Dashboard

Goal:

- Make model/provider switching intentional and visible.

Deliverables:

- Model registry file in Unite-Hub, seeded from Nexus Hub OpenRouter registry.
- Router function with Performance / Speed / Cost scoring.
- Cost dashboard panel.
- Context pack persistence.

Acceptance:

- Tests prove routing choices for cheap routing, deep architecture, UI vision, code implementation, and browser task planning.

### Lane 7 — Daily-driver visual cleanup

Goal:

- Make Unite-Hub feel like a finished founder cockpit, not scattered modules.

Deliverables:

- Navigation review.
- Dashboard consolidation.
- Visual hierarchy pass.
- Empty-state cleanup.
- App-like command palette flow.

Acceptance:

- Founder can answer: What needs me? What is running? What is broken? What made money? What needs cleanup? from one URL.

## Data model sketch

```sql
-- Account registry: clean map of external accounts
create table accounts_registry (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null,
  provider text not null,
  business_key text,
  login_identifier text,
  auth_method text not null default 'unknown',
  mfa_method text,
  vault_item_id uuid,
  oauth_connection_id uuid,
  agent_access_level text not null default 'none',
  risk_rating text not null default 'unknown',
  cleanup_status text not null default 'unknown',
  last_verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scoped grants for dangerous capability access
create table vault_access_grants (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null,
  vault_item_id uuid,
  account_id uuid,
  run_id text,
  requested_by text not null,
  purpose text not null,
  scope text not null,
  access_level text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  approved_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Browser task receipts
create table browser_task_receipts (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null,
  run_id text not null,
  account_id uuid,
  task_category text not null,
  approval_id uuid,
  status text not null,
  action_log jsonb not null default '[]'::jsonb,
  screenshot_refs jsonb not null default '[]'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
```

## Immediate agent handoff

Dispatch order:

1. project-manager
   - Convert this brief into Linear epics/issues grouped by the lanes above.
   - Mark Lane 1 and Lane 2 as the first execution sequence.

2. code-auditor
   - Read-only audit of current founder dashboard, vault, approvals, social, Xero and bookkeeper modules.
   - Identify reusable components and dead UI.

3. senior-fullstack
   - Implement Lane 1 only after code-auditor map is complete.
   - Do not start account registry or browser gateway until Lane 1 passes.

4. database-architect
   - Draft migrations for account registry and vault grants, but do not apply until Lane 3/4.

5. api-integrations
   - Map integration status for Xero, Google, Stripe, social, Linear, GitHub and OpenRouter.
   - Identify which should use OAuth/API vs browser-assisted fallback.

6. qa-tester
   - Define Playwright smoke path for `/founder/command-centre` and `/founder/pi`.

## My recommendation

Do not start with bank/Stripe/social browser automation. That is the highest-risk part and will bog the team down.

Start with the daily-driver shell and Pi-wrapper because they immediately fix the biggest product problem: Phill has no trusted cockpit.

Then clean the account registry. Only after the system knows which accounts exist, who owns them, how they authenticate, and what risk class they have should browser/computer-use be allowed.

The right sequence is:

1. Command Centre
2. Pi-wrapper MVP
3. Account Registry
4. Vault Grants
5. Browser Gateway Spike
6. Provider Router + Cost Dashboard
7. Visual/product polish loop

This sequence reduces bloat, keeps the build testable, and gives Phill visible progress quickly without creating a dangerous credential automation mess.
