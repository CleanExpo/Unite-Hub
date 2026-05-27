# Unite-Hub Operating Brain Integration

Date: 2026-05-28 AEST
Owner: Margot + Senior Project Manager
Status: Active plan

## Purpose

Unite-Hub remains Phill's private founder CRM and command cockpit. Hermes, Pi-Dev-Ops, Margot, and the 2nd Brain now form the operating brain behind it: a continuous memory, delivery, decision-support, and verified execution loop.

This is not a separate product lane. Every active CRM, project delivery, and roadmap item should carry Operating Brain context when the work depends on project state, memory, delivery health, or agent execution.

## Operating Brain Components

| Component | Role | Current source | Responsibility |
| --- | --- | --- | --- |
| Unite-Hub | Founder CRM and command cockpit | This repo, Supabase mirrors, Vercel app | Surface clients, tasks, approvals, delivery health, daily digest, and evidence |
| Hermes Agent | Always-on operator/runtime layer | `D:\Hermes\wiki` when present; `.portfolio/PORTFOLIO.yaml`; repo docs | Read the 2nd Brain, watch project health, propose next actions, delegate agents, verify work, record progress |
| Pi-Dev-Ops | Delivery intelligence layer | `.portfolio/PORTFOLIO.yaml`, GitHub, Linear, Vercel, CI evidence | Track deploy health, issue routing, stale tasks, CI, Vercel state, and agent improvement loops |
| 2nd Brain | Durable memory and source-of-truth layer | Repo docs now; `D:\Hermes\wiki` where present; future semantic store only after stable source rules exist | Store decisions, client/project context, playbooks, progress logs, operating rules, Board/Senior PM rationale |
| Margot | Assistant/operator interface | `docs/margot/*`, command center, voice/task routes | Classify signals, prepare briefs, create safe tasks, update memory, surface digest items, block unsafe action |
| Senior PM | Roadmap and delivery authority | Linear, GitHub, repo plans, command center | Sequence roadmap, triage issues, define acceptance criteria, approve release readiness |
| Board Members | Bounded decision authority | `.pi/ceo-agents/expertise/*`, decision briefs | Decide business rules, irreversible changes, client-facing actions, and strategy tradeoffs |

## Asset Inventory

| Asset | Status | Notes |
| --- | --- | --- |
| `docs/margot/crm-operating-model.md` | Active | Canonical CRM loop and Margot decision classes |
| `docs/margot/high-level-crm-25-step-forecast.md` | Active | Long-range CRM and command-system roadmap |
| `docs/plans/2026-05-23-margot-multi-day-crm-build-plan.md` | Active | Multi-day Margot/Senior PM execution plan |
| `docs/guides/OBSIDIAN_NEXUS_TEMPLATE.md` | Reconciled from PR `#58` | Obsidian + Google to Nexus/Hermes Knowledge Flywheel playbook |
| `.portfolio/PORTFOLIO.yaml` | Active | Portfolio SSOT linking Unite-Hub, Hermes, and Pi-Dev-Ops |
| `.pi/ceo-agents/expertise/*` | Active Board context | Board role prompts and decision lenses |
| `.pi/ceo-agents/memos/hub-connections-24-03-2026.md` | Active delivery memo | Hub health, MACAS/bookkeeper trigger, connected-projects, and nightly sweep direction |
| `.claude/memory/CONSTITUTION.md` | Active local constitution | Operating rules and agent memory contract |
| `src/lib/operating-brain/*` | Active code contract | Pure local routing and improvement-loop helpers with tests |

Known doc gaps to reconcile:

- `docs/margot/daily-crm-digest-template.md` references several older Margot docs that are not currently present in `docs/margot/`. Until those files are restored or replaced, this document is the canonical Operating Brain entrypoint.
- Approval persistence remains a staged decision: use blocked/draft task records now; promote to a dedicated `crm_approvals` table only after route-level tests, migration review, RLS review, and command-center read requirements justify it.
- The portfolio/runtime contract should be kept aligned between `.portfolio/PORTFOLIO.yaml` and `.claude/memory/CONSTITUTION.md` before delivery automation depends on package-manager or runtime metadata.

## Source-of-Truth Matrix

| Domain | Source of truth | Mirror / surface | Conflict rule |
| --- | --- | --- | --- |
| CRM identity and lifecycle | Supabase Unite-Hub tables filtered by `founder_id` | Command center, Margot digest | Supabase wins over derived UI state |
| Project execution | Linear and GitHub | Supabase integration mirrors, command center | Execution system wins for state; Margot records interpretation and next action |
| Delivery health | Vercel, CI, GitHub checks | Pi-Dev-Ops digest, command center | Provider/check result wins; repo stores evidence and runbooks |
| Operating memory | Repo docs now; `D:\Hermes\wiki` where present | 2nd Brain retrieval, Margot digest | Exact docs beat semantic retrieval when confidence is low |
| Obsidian/Nexus playbook | `docs/guides/OBSIDIAN_NEXUS_TEMPLATE.md` | Hermes wiki and future Nexus ingestion | Repo copy is discoverable baseline until wiki sync is verified |
| Board rationale | Decision briefs and `.pi/ceo-agents/expertise/*` | Daily digest, approval queue | Briefs must include evidence, bounded options, and reversible next action |
| Secrets and credentials | 1Password/Vercel/Supabase providers | Names/status only | Never store secret values in repo docs, CRM, digest, or 2nd Brain |
| Digest and timeline evidence | Supabase `agent_actions`, repo progress logs, command-center summaries | Daily digest, Board briefs, 2nd Brain | Minimize PII; store summaries and references before copying raw payloads |

## Margot Decision Router

Margot classifies each signal before action. Inputs include Linear, GitHub, Vercel, Supabase, voice/tasks, CRM events, portfolio docs, Hermes ticks, Pi-Dev-Ops checks, and 2nd Brain updates.

Outputs are daily digest items, command-center items, Linear tasks, blocked approvals, decision briefs, and 2nd Brain updates.

| Class | Use when | Output |
| --- | --- | --- |
| Auto-execute | Local, reversible, no external side effects | Safe repo docs, progress log, health read, 2nd Brain update |
| Draft | Safe to prepare but not execute | Migration plan, Linear comment text, external message draft, acceptance criteria |
| Delegate | Scoped implementation or review with verification | Agent task, Linear issue, GitHub checklist, evidence update |
| Ask Board | Production write, env mutation, deploy, migration, billing, external comms, client merge, business judgement | Decision brief and blocked approval item |
| Block | Missing identity, access, evidence, or safety prerequisite | Blocker with exact prerequisite and owner |
| Never do | Secret exposure, destructive action without recovery, disallowed production write | Refusal plus safer alternative brief |

The code contract lives in `src/lib/operating-brain/decision-router.ts`.

## Hermes Continuous 1% Loop

Each recurring tick checks:

1. `unite-hub-sandbox` deploy state and required env readiness.
2. Local gates: `pnpm run lint`, `pnpm run type-check`, `pnpm run test`.
3. Stale Linear/GitHub tasks and active roadmap blockers.
4. Integration health across Vercel, GitHub, Linear, Supabase, and CRM mirrors.
5. 2nd Brain sync path and no-secret memory rules.
6. Unfinished roadmap items, especially `UNI-2056` and `UNI-2057`.

The tick selects one highest-leverage safe 1% improvement. Unsafe work becomes an approval request. Every completed tick records:

- Decision
- Evidence
- Tests
- Files touched
- Remaining risk
- Next 1%

The code contract lives in `src/lib/operating-brain/continuous-improvement.ts`.

## P0 Deploy Stabilization Gate

`unite-hub-sandbox` must reach latest deploy `READY` before feature work is treated as stable. Margot and Pi-Dev-Ops may inspect Vercel state and prepare a remediation brief, but they must not mutate env vars, project binding, production config, or deploy settings without approval.

Current evidence on 2026-05-28:

- Portfolio sandbox project: `unite-hub-sandbox`, `prj_tNqIsHGY3kvw7zdO2bXVxFWTPIk0`.
- Local `.vercel/project.json` binding: `unite-hub`, `prj_9uMZx73Gp8DCWsFPmvVzhnGy6zQM`.
- Latest sandbox deploy: `dpl_DXUWGA39HoCjrcukuD4absTbwkAH`.
- Latest sandbox deploy state: `ERROR`.
- Latest sandbox deploy commit: `bd76d89e685f81f09b9694694c0273b73ab83a37` from PR `#58`.

Required evidence:

- Vercel project binding for `unite-hub-sandbox`
- Required env var presence check without printing secret values
- Latest deploy URL and state
- Blocker owner and next action when not `READY`

## Active Roadmap Requirements

After deploy stability, Senior PM triages `UNI-2056` and `UNI-2057`. Each item must include:

- Owner
- Status
- Blocker
- Next action
- Evidence link
- Operating Brain dependency: Hermes, Pi-Dev-Ops, Margot, and 2nd Brain context required for completion

Board memo sequencing from `.pi/ceo-agents/memos/hub-connections-24-03-2026.md` becomes the delivery backdrop after P0 stability:

1. Sprint 1: bookkeeper completion to MACAS auto-trigger with data-readiness gate and human-review badge.
2. Sprint 2: Hub Status via connected-projects API and dashboard widget for the seven portfolio businesses.
3. Sprint 3: nightly intelligence sweep that starts with GitHub and Linear, then expands only after evidence quality is stable.

## Governance Gates

| Gate | Passing evidence |
| --- | --- |
| Deploy | `unite-hub-sandbox` latest Vercel deploy is `READY` |
| Local | `pnpm run lint`, `pnpm run type-check`, and `pnpm run test` pass or have explicit blockers |
| Governance | Margot action classes are documented and unsafe actions block by default |
| Memory | 2nd Brain update path is explicit and stores no secret values |
| PM | Linear/GitHub/Vercel items carry owner, status, blocker, next action, and evidence |

## Data Minimization Rules

- Store secret names, provider states, hashes, or links only; never store secret values.
- Prefer summarized digest evidence over raw emails, raw CRM notes, or broad personal data.
- Use `privacy_scope` semantics from the CRM model when deciding whether an item belongs in command center, client context, Board brief, or private founder memory.
- Connected-project and nightly-sweep data should store operational KPIs, timestamps, issue links, commit links, and health summaries; avoid copying raw customer or client payloads.
- Any unclear retention, redaction, or client-identity question becomes `block`, not `auto_execute`.
