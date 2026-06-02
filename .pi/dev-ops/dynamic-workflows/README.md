# Pi-Dev-Ops Dynamic Workflows Pathway

Source researched: https://code.claude.com/docs/en/workflows
Purpose: turn Claude Code Dynamic Workflows into a senior software engineer execution layer for Unite-Hub / Unite-Group Nexus.

## What the Anthropic workflow pattern adds

Dynamic Workflows are JavaScript orchestration scripts that coordinate many subagents in the background. They are best used when orchestration itself should be a readable, versioned, rerunnable artifact: deep research, large audits, multi-repo consistency checks, complex plans, and migrations.

Important operating facts from the docs:
- Research preview feature.
- Requires Claude Code v2.1.154+.
- Available on paid plans and provider access paths including Anthropic API, Bedrock, Vertex AI, and Microsoft Foundry.
- On Pro, enable from `/config` under Dynamic workflows.
- Bundled `/deep-research` can run 3-10 source-research agents and synthesize findings.
- Workflow scripts are not a replacement for governance, verification, or ticket evidence.

## Pi-Dev-Ops translation

Pi-Dev-Ops should not copy this as "more agents". It should use it as a senior engineer control loop:

1. Intake Gate — one build objective only.
2. Connection Gate — map live routes, components, API paths, data models, env, tests, and external systems before edits.
3. Bloat Gate — reject broad rewrites and speculative abstractions.
4. Build Gate — one active lane unless lanes are genuinely independent.
5. Verification Gate — exact targeted tests, type-check, and production build proof.
6. Review Gate — independent challenger/reviewer checks scope, security, tenant/auth boundaries, and fake-green evidence.
7. Finalise Gate — evidence file written, Linear/Hermes status updated, next pathway recommended.
8. Token Gate — minimal context packs, bounded agents/turns/wall time, summarized receipts.

## Model policy for Phill's system

Use the Dynamic Workflow methodology without making Pi-Dev-Ops dependent on external Anthropic API credits.

Default routing:
- Senior judgment / architecture / final synthesis: GPT-5.5-class provider.
- Long-context challenger / context pack / adversarial review: Kimi 2.5-class provider.
- Claude Opus 4.8 / ultrathink: allowed only when explicitly invoked through Claude Code OAuth/subscription or an approved provider path; reserve it for architecture, risk review, and final pathway synthesis.

## Remaining pathway recommendation

Priority 1: Install the workflow gate, not a new feature.
- Create/validate workflow manifests and evidence records.
- Make every build state visible in Founder OS / Hermes Kanban.
- Prevent moving to the next build without complete/blocked/rolled-back evidence.

Priority 2: Run one live pilot lane.
- Objective: Founder OS Pi-Dev-Ops pathway visibility.
- Scope: display active workflow, next gate, evidence state, model route, and blocker.
- Do not build broad automation until evidence validation is real.

Priority 3: Expand across the portfolio.
- Use `.portfolio/PORTFOLIO.yaml` to resolve product ownership.
- For each product, define required verification commands and denied paths.
- Link each workflow run to Linear + Hermes Kanban.

Priority 4: Add deep-research lanes.
- Use research agents for product discovery, technical audits, and client evidence gathering.
- Require source list + cross-check summary + board recommendation before implementation.

## Definition of Done

A Pi-Dev-Ops workflow is done only when a manifest and evidence file prove:
- request / ticket / repo / branch;
- intended vs actual scope;
- live connection map;
- changed files;
- verification commands and outputs;
- independent review result;
- bloat decision;
- final state: complete, blocked, or rolled_back.

No evidence means not complete.
