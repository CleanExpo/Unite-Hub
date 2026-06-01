# Three-Machine Founder OS Continuity: Windows Desktop, MacBook Pro, Mac mini

Date: 2026-06-02
Owner: Phill McGurk, CEO
Repository: `D:\Unite-Hub`
Status: Architecture addendum for Unite-Hub daily-driver and Pi-wrapper work

## Executive decision

Phill should be able to use Unite-Hub from any machine and continue the same operating thread without losing context, files, decisions, credentials, approvals, or agent momentum.

The correct design is not three separate agents doing separate things. The correct design is one Founder OS with three machine roles:

1. Mac mini = always-on command host
2. Windows Desktop PC = heavy build / browser / local operations workstation
3. MacBook Pro = mobile founder cockpit

Unite-Hub is the user-facing URL across all three. Pi-Dev-Ops and Hermes-style agents run behind it as coordinated workers.

## Target experience

Phill opens the Unite-Group CRM on the MacBook Pro from anywhere and types:

> I have an idea for Synthex. Build a cleaner social account setup flow and make sure it connects with the account registry and vault approvals.

The system should:

1. Capture the idea in Unite-Hub.
2. Identify the correct application: Synthex, Unite-Hub, RestoreAssist, Authority-Site, Pi-Dev-Ops, or another portfolio app.
3. Convert the idea into a task packet.
4. Route it through Product/Project, Engineering, and Risk agents.
5. Choose which machine should execute which work.
6. Keep context in a durable store, not inside one local chat window.
7. Show progress, receipts, blockers, cost, model choices, and approvals in Unite-Hub.
8. Let Phill leave the house with the MacBook Pro while the Mac mini and/or Windows Desktop continue running background work.
9. Resume the same thread later from any machine.

## Machine roles

### 1. Mac mini — Always-on command host

Role:

- Source of truth for long-running orchestration.
- Runs always-on services, cron, gateway, queue workers, status polling, scheduled briefs, webhook receivers, and background agent dispatch.

Responsibilities:

- Keep the run queue alive.
- Keep context packs synchronized.
- Own the canonical agent profiles, skills, memory snapshots, workflow run manifests, and background processes.
- Receive webhooks from GitHub, Linear, Vercel, Railway, Supabase, Stripe/Xero where appropriate.
- Run lower-risk always-on jobs and scheduled Empire Briefs.
- Act as the central broker between Unite-Hub and worker machines.

Should not:

- Be treated as the only place Phill can work.
- Be the only copy of critical repo state.
- Execute high-risk browser/credential tasks without approval.

### 2. Windows Desktop PC — Heavy execution workstation

Role:

- High-power build/test/browser workstation.
- Best for local Chrome/computer-use, Playwright browser runs, large repo builds, Docker-heavy tasks, GPU/visual work if available, and Windows-specific tools.

Responsibilities:

- Run heavier Pi-Dev-Ops build lanes.
- Run browser/computer-use tasks when a local Windows environment is required.
- Perform local integration checks for apps that need Windows tools or local installed software.
- Execute long test/build loops when it is online and available.

Should not:

- Be the sole source of task truth.
- Hold untracked local-only decisions.
- Run unapproved dangerous tasks against banks, tax, Stripe, social, or Xero.

### 3. MacBook Pro — Mobile founder cockpit

Role:

- Phill's portable command surface.
- Best for voice notes, idea capture, approvals, reviews, high-level steering, and lightweight local work.

Responsibilities:

- Open Unite-Hub from anywhere.
- Capture ideas through chat/voice.
- Approve/reject tasks and credential grants.
- Review receipts, screenshots, briefs, model spend, and board recommendations.
- Trigger work that continues on the Mac mini or Windows Desktop.

Should not:

- Be required to stay awake for long-running jobs.
- Be the primary cron/gateway host.
- Store the only copy of context.

## Core architecture

```text
Phill / MacBook Pro / Browser
        |
        v
Unite-Hub CRM URL
        |
        v
Founder Command Centre + Pi-wrapper
        |
        v
Task Router + Context Pack Store + Approval Queue
        |
        +--> Mac mini host workers
        |       - cron
        |       - queue workers
        |       - webhook receiver
        |       - context pack sync
        |       - scheduled briefs
        |
        +--> Windows Desktop workers
        |       - heavy builds
        |       - Playwright/browser gateway
        |       - Docker/local verification
        |
        +--> Cloud services
                - Vercel
                - Supabase
                - Railway/Pi-Dev-Ops
                - Linear/GitHub
                - OpenRouter/model providers
```

## Required Unite-Hub concepts

### 1. Device Registry

Unite-Hub should know which machines exist and what they are allowed to do.

Suggested device roles:

- `host`: Mac mini
- `heavy_worker`: Windows Desktop PC
- `mobile_cockpit`: MacBook Pro
- `cloud_worker`: Railway/Vercel/serverless systems

Fields:

- device_id
- display_name
- machine_type
- role
- online_status
- last_seen_at
- capabilities
- max_risk_level
- current_load
- allowed_task_types

### 2. Task Packets

Every founder idea should become a durable task packet.

Task packet contents:

- original founder message / transcript
- inferred portfolio app
- business objective
- lane classification
- risk level
- required agents
- required machine capability
- model routing recommendation
- context pack ID
- approval requirements
- done criteria
- current state
- receipts

### 3. Context Packs

Context must not live only inside a chat window or on one machine.

A context pack stores:

- what the user asked
- what app/project it belongs to
- constraints and governance rules
- files/routes/repos involved
- decisions already made
- latest receipts
- model/provider history
- next recommended action
- blockers

This is what enables provider switching and machine switching without losing momentum.

### 4. Machine Assignment Router

The system should route tasks by capability:

| Task type | Preferred machine | Reason |
|---|---|---|
| Idea capture / approval | MacBook Pro via Unite-Hub | Mobile founder workflow |
| Long-running scheduler / brief | Mac mini | Always-on host |
| Webhook/event processing | Mac mini | Reliable listener |
| Heavy repo build/test | Windows Desktop PC | More power/local tools |
| Browser/computer-use spike | Windows Desktop PC first, Mac mini fallback | Chrome/Playwright control and screenshots |
| Lightweight docs/research | Mac mini or cloud | Low risk background work |
| UI review | MacBook Pro + screenshot review, worker executes | Founder sees product visually |
| Credential grant approval | MacBook Pro/Unite-Hub UI | Human-in-the-loop |

### 5. Run Queue

Unite-Hub needs a visible run queue:

- queued
- assigned
- running
- waiting_for_approval
- blocked
- completed
- failed
- cancelled

Every run must show:

- assigned machine
- assigned agents
- selected model/provider
- cost estimate / actual token spend where available
- current phase
- latest receipt
- next action

## Chat-window idea flow

When Phill types or dictates an idea, the system should follow this loop:

1. Capture
   - Store raw idea/transcript.

2. Interpret
   - Detect portfolio target: Unite-Hub, Synthex, RestoreAssist, Pi-Dev-Ops, Authority-Site, etc.
   - Detect task type: product, engineering, finance, marketing, browser task, account cleanup, research.

3. Route
   - Product Agent decides outcome and priority.
   - Engineering Agent decides implementation lane and verification.
   - Risk Agent decides approval/security requirements.

4. Context pack
   - Store durable summary so any machine/model can continue.

5. Machine assignment
   - Mac mini for always-on/background.
   - Windows Desktop for heavy/browser/local.
   - MacBook Pro for founder approval/review.

6. Execute
   - Run the smallest lane.
   - Keep progress in Unite-Hub.

7. Verify
   - Tests, screenshots, receipts, audit events.

8. Report
   - Board-ready result with next recommendation.

## Multi-provider continuity

Model/provider switching should not restart the work.

Provider switch flow:

1. Load context pack.
2. Load latest receipts and decision records.
3. Compress active state into provider-neutral task packet.
4. Select model by Performance / Speed / Cost.
5. Continue from the current phase, not from the beginning.
6. Write back a new receipt.

This allows GPT, Gemini, Claude, Grok, Kimi, Qwen, Mistral or other models to contribute without each becoming a separate silo.

## Security and credential policy

Three-machine continuity must not mean credential sprawl.

Rules:

- Credentials stay in Unite-Hub vault / approved OS vault integrations.
- Decrypted secrets never appear in the browser client.
- Machine workers receive scoped grants, not permanent broad secrets.
- MacBook approval can unlock a time-limited task grant for Mac mini or Windows Desktop.
- Browser/computer-use tasks produce screenshots/action logs.
- Dangerous actions stay human-approved.

## Build lanes to add after current Lane 1/2

The previous plan starts with:

1. Command Centre shell
2. Pi-wrapper MVP

Add these as the next architecture lanes:

### Lane 2A — Device Registry and Heartbeat

Goal:

- Unite-Hub can see Mac mini, Windows Desktop and MacBook Pro status.

Deliverables:

- `devices` table or equivalent.
- Heartbeat API.
- Capability metadata.
- Command Centre panel showing machine status.

Acceptance:

- Each machine can report last_seen, role, capabilities and availability.
- Offline machines are visible, not silently assumed available.

### Lane 2B — Task Packet and Context Pack Store

Goal:

- Founder chat ideas become durable packets that survive machine/model switching.

Deliverables:

- `task_packets` model.
- `context_packs` model.
- API for creating task packet from chat input.
- Tests for app-target classification.

Acceptance:

- An idea can be classified to the correct portfolio app.
- Context pack can be reloaded by another worker/model.

### Lane 2C — Machine Assignment Router

Goal:

- Route work to Mac mini, Windows Desktop, MacBook Pro or cloud based on task requirements.

Deliverables:

- pure routing function.
- tests for browser task, heavy build, scheduled brief, mobile approval.
- UI field showing assigned machine.

Acceptance:

- Browser/heavy tasks do not accidentally assign to a sleeping laptop.
- Long-running jobs prefer Mac mini.

### Lane 2D — Run Queue UI

Goal:

- Founder can see all background agents and machine assignments from Unite-Hub.

Deliverables:

- Run queue panel.
- statuses: queued, assigned, running, waiting_for_approval, blocked, completed, failed.
- latest receipt preview.

Acceptance:

- Phill can leave with MacBook Pro and still see what the other machines are doing.

## Recommended first product promise

The first product promise should be simple:

"Open Unite-Hub anywhere, type an idea, and the system turns it into a tracked task packet with the right app, right agents, right machine, right model, and right approval path."

Do not promise full autonomous bank/social/browser control first. Promise continuity, clarity and routing first.

## Board-level recommendation

Approve the three-machine architecture, but sequence it behind the immediate daily-driver shell and Pi-wrapper MVP.

Recommended order:

1. `/founder/command-centre`
2. `/founder/pi` Pi-wrapper MVP
3. Device Registry + Heartbeats
4. Task Packets + Context Packs
5. Machine Assignment Router
6. Run Queue UI
7. Account Registry
8. Vault Grants
9. Browser Gateway Spike
10. Provider Router + Cost Dashboard

This gives Phill the feeling that the system "just works" before attempting high-risk automation.
