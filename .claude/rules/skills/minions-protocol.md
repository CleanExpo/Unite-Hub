# Minions Protocol — Scoped Rule File

> **Scope**: Applies within `.claude/blueprints/**` and `.claude/commands/minion.md` contexts only.
> **Authority**: Overrides default interactive workflow when `/minion` command is active.
> **Locale**: en-AU — colour, behaviour, optimisation, organised, licence (noun).

---

## One-Shot Mandate

When executing via `/minion`, the agent MUST complete the full blueprint DAG without:

- Asking clarifying questions (escalate instead)
- Requesting confirmation at intermediate steps
- Pausing for user input of any kind

The only human touchpoint is the PR review gate at the end.

If the task is ambiguous → output `BLUEPRINT_ESCALATION` immediately. Do not attempt to guess intent.

---

## Context Scoping Rule

The pre-hydration manifest defines the COMPLETE set of files available for this invocation.

**Permitted**: Files listed in `manifest.always` and `manifest.domain`.
**Prohibited**: Any file not listed in the manifest — even if logically relevant.

Rationale (Shannon Information Theory): Loading unrequested context adds noise that degrades
the signal quality of the specific task. Toolshed curation eliminates decision paralysis by
constraining the search space to domain-relevant patterns only.

---

## Iteration Counting Requirement

Every agentic node execution MUST:

1. Increment `iterations.total` in `.claude/data/minion-state.json`
2. Increment the node-specific counter (`implement`, `fix_ci`, `fix_lint`)
3. Check total against the cap (3) before proceeding

The `iteration-counter.py` PreToolUse hook enforces this automatically for `Task` tool calls.
For direct agentic work (non-Task), the agent must self-report counts.

**Hard caps (non-advisory):**
| Node | Cap |
|------|-----|
| `implement` | 1 |
| `fix-ci` | 2 |
| `fix-lint` | 1 |
| **Total per blueprint** | **3** |

---

## Human Review Gate

`/minion` NEVER merges PRs. The workflow always terminates at `create-pr`.

The PR is labelled `minion-generated` to signal it was produced autonomously and requires
human validation before merging.

Rationale: Even with 1,300+ PRs/week, Stripe's Minions system maintains mandatory human
review. Autonomous generation accelerates throughput; human review preserves correctness.

---

## en-AU Locale Enforcement

All output from blueprint execution must use Australian English:

| American       | Australian    |
| -------------- | ------------- |
| color          | colour        |
| behavior       | behaviour     |
| optimization   | optimisation  |
| organize       | organise      |
| license (noun) | licence       |
| authorization  | authorisation |

All dates: DD/MM/YYYY. All times: AEST or AEDT. All currency: AUD.

---

## Escalation vs Retry Policy

| Situation                                | Action                                       |
| ---------------------------------------- | -------------------------------------------- |
| Iteration cap reached                    | `BLUEPRINT_ESCALATION` — halt                |
| Agentic node fails once                  | `BLUEPRINT_ESCALATION` — halt (no retry)     |
| HIGH risk detected by execution-guardian | `BLUEPRINT_ESCALATION` — halt                |
| Ambiguous task description               | `BLUEPRINT_ESCALATION` — halt                |
| Auto-fix resolves the issue              | Continue DAG (no iteration cost)             |
| Deterministic node fails                 | Retry once (deterministic nodes have no cap) |

---

## Minions Additive Principle

The `/minion` pathway is **additive** to the existing interactive system:

- All existing commands (`/new-feature`, `/audit`, `/verify`, `/ui-review`) are unchanged
- Genesis orchestrator multi-turn protocol is unchanged
- Council of Logic, Execution Guardian, System Supervisor are unchanged
- Minion calls them as **deterministic nodes** — their logic runs, but LLM reasoning is bounded

The minion pathway adds a one-shot lane alongside the existing multi-turn highway.
