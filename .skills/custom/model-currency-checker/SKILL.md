---
id: model-currency-checker
name: model-currency-checker
type: Capability Uplift
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - check model versions
  - are models up to date
  - model currency
  - which models are we using
  - audit ai models
  - check ai versions
  - model audit
  - update models
description: ">"
---


# Model Currency Checker Skill

> **Purpose**: Prevent the system from running on stale, deprecated, or unapproved AI models.
> Model capability compounds — running on outdated models degrades output quality silently.

## When to Use

Use this skill when:

- Preparing a production deployment (check all model IDs before shipping)
- After an AI provider announces a model update or deprecation
- When output quality seems degraded (may indicate a deprecated model)
- When auditing the codebase for technical debt
- When `pnpm starter:audit` is run

## Approved Model Policy

| Task Category              | Provider    | Approved Model ID        | Approved Since |
| -------------------------- | ----------- | ------------------------ | -------------- |
| Reasoning / orchestration  | Anthropic   | `claude-sonnet-4-6`      | 06/03/2026     |
| Complex reasoning          | Google      | `gemini-2.5-pro-preview` | 06/03/2026     |
| Fast image gen / editing   | Google      | `gemini-2.5-flash-image` | 06/03/2026     |
| Image editing with context | Nano Banana | `nano-banana-pro`        | 06/03/2026     |
| High-fidelity branding     | Google      | `imagen-4`               | 06/03/2026     |
| 3D logo renders            | Google      | `imagen-4`               | 06/03/2026     |

**Review cycle:** Model policy must be reviewed every 90 days.
**Next review due:** 06/06/2026

## Procedure

### Step 1: Scan codebase for model references

Search these file types for model ID strings:

- `*.ts`, `*.js` — TypeScript/JavaScript source
- `*.py` — Python source
- `*.json` — Config files (model IDs in env or config)
- `*.yaml`, `*.yml` — CI/CD configs, docker compose
- `*.env`, `*.env.example` — Environment files

Search patterns to find:

- `gemini-` prefix
- `imagen-` prefix
- `claude-` prefix
- `gpt-` prefix (should not be present — unapproved)
- `ollama` references (check version)

### Step 2: Classify each finding

For each model ID found:

| Classification  | Meaning                                                  |
| --------------- | -------------------------------------------------------- |
| `CURRENT`       | Model ID matches approved policy exactly                 |
| `OUTDATED`      | Model ID was previously approved but has been superseded |
| `UNAPPROVED`    | Model ID not in approved policy                          |
| `REVIEW_NEEDED` | Model ID format matches but version cannot be confirmed  |

### Step 3: Generate report

Run `pnpm starter:audit` to generate `reports/model-currency-report.md` automatically.

Or manually: grep the codebase and compare against the table above.

### Step 4: Remediate

For each OUTDATED or UNAPPROVED model:

1. Find the config file or code that references it
2. Update to the approved model ID
3. Test that the integration still works (prompt compatibility check)
4. Commit the change

## Output Format

```
MODEL CURRENCY REPORT
═══════════════════════════════════════════════════
Date: [DD/MM/YYYY]
Codebase: [root path]

APPROVED POLICY
─────────────────
[table of approved models]

FINDINGS
─────────────────
CURRENT:    [file:line] — [model-id] — [category]
OUTDATED:   [file:line] — [model-id] — Replace with: [approved-id]
UNAPPROVED: [file:line] — [model-id] — Not in approved policy

SUMMARY
─────────────────
Current:    [N]
Outdated:   [N]
Unapproved: [N]

ACTION REQUIRED: Update [N] model reference(s) before shipping.
═══════════════════════════════════════════════════
```

## Validation Gates

Before marking model check complete:

- [ ] All file types scanned (not just .ts)
- [ ] Env files checked (model IDs often set there)
- [ ] CI/CD configs checked (model IDs in workflow env vars)
- [ ] Report saved to `reports/model-currency-report.md`

## Failure Modes

| Failure                                 | Recovery                                                 |
| --------------------------------------- | -------------------------------------------------------- |
| No model references found               | Verify scan covered the right file types and directories |
| Model ID found in env file but not code | Check if env var is actually used                        |
| Model ID in comment only                | Mark as informational, not a live reference              |
| Model has been deprecated by provider   | Update to approved replacement immediately               |

## Eval Examples

### Good Example

**Finding:** `apps/backend/src/models/anthropic.py:14 — claude-2` — OUTDATED
**Action:** Replace with `claude-sonnet-4-6`
**Verification:** Test prompt round-trip after update

### Bad Example (rejected)

**Finding:** "I think the models are up to date."
**Reason rejected:** No scan performed, no evidence, opinion not evidence.