# Hermes Knowledge Flywheel: Obsidian + Google Data → Unite-Group Nexus

This playbook is built for your exact goal: make Hermes increasingly agentic by capturing your current + historical Google knowledge, structuring it, and converting it into execution for a $2B-scale trajectory over 24 months.

---

## 0) Important framing (so this actually works)

A $2B outcome in 2 years requires:

- Fast learning loops
- Ruthless prioritization
- Strong decision quality under uncertainty
- High execution velocity with guardrails

This system helps Hermes do that by turning your digital exhaust (Google + Obsidian) into structured intelligence and then into action.

---

## 1) Target system architecture (non-technical view)

Your operating system has 4 layers:

1. **Data Capture Layer**
   - Sources: Gmail, Google Drive, Docs, Sheets, Calendar, YouTube activity/notes, Keep (if exported), and Obsidian vault.
2. **Knowledge Layer**
   - Unified schema in Nexus: notes, decisions, projects, relationships, priorities, signals.
3. **Senior Agent Layer (Hermes)**
   - Strategy, Growth, Offer, Operations agents.
4. **Execution Layer (Command Center)**
   - Tasks, approvals, workflows, scorecards, weekly boardroom decisions.

---

## 2) Command Center prompt mode to control everything

Add an `Obsidian + Google` command mode:

- Trigger: `obs:` for Obsidian actions
- Trigger: `g:` for Google capture actions
- Trigger: `hx:` for Hermes orchestration actions

### Examples

- `g: ingest gmail --since 2024-01-01 --label "strategy" --preview`
- `g: ingest drive --folder "Research" --preview`
- `obs: pull "Nexus/02_Research/YouTube" --since 30d`
- `hx: synthesize qbr-insights --window 90d --goal "$2B_24m"`
- `hx: create weekly-priorities --autonomy L2`

### Required response structure

Every command should return:

1. Intent parsed
2. Data/entities affected
3. Risk level + approvals required
4. Planned changes (preview)
5. Execution result
6. Audit id + timestamp

---

## 3) Knowledge capture from Google (current + historical)

## 3.1 Priority capture order

1. Gmail (high signal for decision/context trail)
2. Google Docs (thinking + strategy drafts)
3. Google Drive (research files, decks, assets)
4. Google Calendar (intent + priorities over time)
5. Google Sheets (models, forecasts, metrics)

## 3.2 Minimal metadata to capture per item

- `source_system` (gmail/docs/drive/calendar/sheets/obsidian)
- `source_id` (provider id)
- `source_url`
- `created_at`
- `updated_at`
- `author`
- `title`
- `summary`
- `tags`
- `project_links`
- `confidence`
- `recommended_next_action`

## 3.3 Knowledge extraction pass (Hermes)

For every imported item, Hermes should extract:

- Goals mentioned
- Constraints mentioned
- Open loops (things you intended to do)
- Strategic hypotheses
- Contacts/partners mentioned
- Repeated themes (patterns in how you think)

---

## 4) Senior Agent model (upgraded for your objective)

Create 4 core Senior Agents:

1. **Senior Strategy Agent**
   - Finds leverage points, sequencing, and strategic trade-offs.
2. **Senior Growth Agent**
   - Turns insights into pipeline, distribution, and demand systems.
3. **Senior Offer Agent**
   - Refines packaging, pricing, and conversion experiments.
4. **Senior Operations Agent**
   - Converts plans into SOPs, owners, cadence, and accountability.

### Autonomy levels

- **L1 Assist:** Analyze + recommend only.
- **L2 Approval:** Draft actions and wait for your sign-off.
- **L3 Bounded Auto:** Execute low-risk recurring actions automatically.

Start all at **L1**. Promote only after weekly scorecard proof.

---

## 5) Vault structure (Obsidian)

```text
Nexus/
  00_Inbox/
  01_Daily/
  02_Research/
    YouTube/
    Google-Docs/
    Google-Drive/
    Competitors/
    Market/
    AI/
  03_Projects/
    Unite-Group-Complete-Hub/
  04_Areas/
  05_Assets/
  06_Decisions/
  07_SOPs/
  08_Agent-Briefs/
  09_Scorecards/
  10_Google-Intelligence/
  99_Archive/
```

---

## 6) Canonical note templates

## 6.1 Google Intelligence Note

```md
---
id: g-{{system}}-{{YYYYMMDD}}-{{slug}}
type: intelligence/google
status: triage
business_unit: Unite-Group
nexus_project: Unite-Group-Complete-Hub
source_system: gmail
source_url:
source_id:
source_created_at:
source_updated_at:
confidence: 0.7
agent_owner: Senior Strategy Agent
review_on: {{date+7d}}
---

# {{title}}

## Summary
-

## Extracted Signals
- Goal:
- Constraint:
- Opportunity:
- Risk:

## Recommended Actions
- Strategy:
- Growth:
- Offer:
- Ops:

## Decision Needed
- [ ] Yes / [ ] No

## Links
- Hub: [[Nexus/03_Projects/Unite-Group-Complete-Hub]]
```

## 6.2 YouTube Research Note

```md
---
id: yt-{{YYYYMMDD}}-{{slug}}
type: research/youtube
status: triage
research_topics: []
nexus_project: Unite-Group-Complete-Hub
agent_owner: Senior Growth Agent
source_url:
source_channel:
source_title:
source_published_at:
---

# {{title}}

## TL;DR
-

## Key Claims
1.
2.
3.

## Relevance to $2B/24m Goal
-

## Actions
- [ ]
```

---

## 7) Auto-routing logic for Hermes

- `type=intelligence/google` → Strategy Agent first
- If content references marketing/sales growth → Growth Agent
- If pricing/offer mechanics appear → Offer Agent
- If process/team/execution appears → Operations Agent
- If `Decision Needed = Yes` → Draft in `Nexus/06_Decisions/` + approval queue

---

## 8) Guardrails (must-have for autonomous operation)

- No client-facing commitments without approval
- No payment/budget moves without approval
- No destructive delete/sync without confirmation
- Every L3 action must write audit log + rollback instruction
- Weekly agent performance review required

---

## 9) Weekly executive loop (90 minutes)

1. Review top 25 new signals from Google + Obsidian.
2. Ask Strategy Agent for top 5 priorities.
3. Ask Growth/Offer/Ops agents for execution plans.
4. Approve or reject L2 proposals.
5. Score each agent (clarity, quality, speed, trust).
6. Promote/demote autonomy by workflow.

---

## 10) 30-day rollout plan

### Week 1: Data foundation
- Connect Google sources and run preview-only ingestion.
- Normalize metadata.
- Create initial Obsidian folders/templates.

### Week 2: Agent intelligence
- Turn on extraction + routing.
- Start weekly executive loop.
- Keep all agents at L1.

### Week 3: Controlled action
- Promote 1-2 proven workflows to L2.
- Add explicit approval queues.

### Week 4: Bounded autonomy
- Promote repetitive, low-risk workflows to L3.
- Keep strategic/financial/high-risk actions approval-gated.

---

## 11) KPI scorecard for “agenticy”

Track these weekly:

- Time from signal captured → action created
- % recommendations accepted
- % actions completed on time
- Decision cycle time
- Revenue-impact experiments launched
- Error/rollback incidents

If these improve consistently, your system is becoming truly agentic.

---

## 12) First-run checklist

- [ ] Add `obs:`, `g:`, `hx:` prompt modes in Command Center spec
- [ ] Connect and preview-ingest Google sources
- [ ] Create Nexus folder architecture
- [ ] Create Agent Briefs for 4 Senior Agents
- [ ] Turn on auto-routing rules
- [ ] Run first weekly executive loop
- [ ] Score and calibrate autonomy levels

When complete, Hermes becomes your autonomous senior operating layer rather than a reactive assistant.

---

## 13) Telegram quick-decision boxes (recommended)

To speed approvals, Hermes should post every high-impact recommendation with inline Telegram decision buttons.

### Decision buttons

- ✅ Approve
- ❌ Reject
- ⏸ Defer
- 📝 Request Changes
- 🔍 View Evidence

### Minimum behavior contract

- Every button click writes a local decision record to the approval ledger.
- `Approve` and `Reject` are terminal decisions.
- `Defer` and `Request Changes` are non-terminal decisions.
- `View Evidence` returns supporting links/notes without changing state.
- Repeated clicks on terminal items should be idempotent (no conflicting final state).

### Safety constraints

- Keep this lane approval-only; no direct execution from Telegram clicks.
- Keep `requiresHumanApproval=true` and `applyState=pending_human_gate` until a separate apply phase is approved.
- Reject unknown actions or missing request IDs (fail-closed).

