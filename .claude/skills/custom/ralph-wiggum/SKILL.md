---
name: ralph-wiggum
category: workflow
version: 2.0.0
description: Autonomous task completion loop with PRD tracking and persistent progress memory
author: Unite Group (ported from NodeJS-Starter-V1, adapted for Next.js-only stack)
priority: 2
auto_load: false
triggers:
  - ralph
  - autonomous
  - loop
  - prd
  - overnight
requires:
  - verification-first
  - context-partitioning
---

# Ralph Wiggum Technique

## Overview

A simple, powerful pattern for autonomous multi-iteration development:

1. **`plans/prd.json`** — JSON file with user stories, each with a `passes` boolean
2. **`plans/progress.txt`** — Append-only LLM memory between iterations
3. **Loop** — Run Claude Code repeatedly until all tasks pass

Named after Ralph Wiggum from The Simpsons — simple but effective.

> "Me fail English? That's unpossible!" — Ralph Wiggum

---

## Why It Works

| Problem | Solution |
|---------|----------|
| LLMs lose context between sessions | `progress.txt` persists learnings |
| Tendency to declare victory | Verification gate blocks false completion |
| No structured task state | `prd.json` machine-readable task list |
| Complex orchestration overhead | Simple loop, no LangGraph needed |

---

## PRD Format (`plans/prd.json`)

```json
{
  "project": "Unite-Group Nexus",
  "version": "1.0.0",
  "user_stories": [
    {
      "id": "US-001",
      "epic": "Social",
      "title": "Persona avatar upload",
      "description": "As a founder, I want to upload an avatar for each brand persona",
      "priority": "high",
      "acceptance_criteria": [
        "File picker opens on click",
        "Image uploads to Supabase Storage under founder_id prefix",
        "Avatar displays immediately after upload",
        "Error state shown if upload fails"
      ],
      "verification": {
        "type_check": true,
        "lint": true,
        "unit_tests": true,
        "build": false,
        "e2e": false
      },
      "passes": false,
      "last_attempt": null,
      "attempt_count": 0,
      "depends_on": []
    }
  ],
  "metadata": {
    "total_stories": 1,
    "passing_stories": 0
  }
}
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `passes` | Only `true` after verification gate passes |
| `priority` | Execution order: critical > high > medium > low |
| `depends_on` | Story IDs that must pass first |
| `acceptance_criteria` | Specific, verifiable requirements |
| `attempt_count` | Tracks failed attempts — escalate at 3 |

---

## Progress File (`plans/progress.txt`)

Append-only. The LLM reads this at the start of each iteration to learn from previous failures.

```markdown
# Ralph Progress Log
# Project: Unite-Group Nexus
# Created: 20/03/2026

---

## Session 1: 20/03/2026 10:30 AEST
**Task**: US-001 — Persona avatar upload
**Status**: IN_PROGRESS

### Work Done
- Added file input to SocialPersonasManager.tsx
- Wired to Supabase Storage upload

### Issues Encountered
- Type error: `File | null` not assignable — needs explicit null check

### Learnings
- Supabase Storage path must include founder_id: `avatars/${founderId}/${personaId}`
- Use `useState<File | null>(null)` not `useState(null)` for file state

### Next Steps
1. Fix null check on file input handler
2. Run Tier A verification

---

## Session 2: 20/03/2026 11:00 AEST
**Task**: US-001 — Persona avatar upload
**Status**: COMPLETED

### Work Done
- Fixed null check
- All Tier A verification passed

### Learnings
- Supabase Storage public URL: `supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl`

### Next Steps
- Move to US-002
```

---

## Verification Pipeline (Unite-Group Stack)

ALL must pass before marking `passes: true`:

```bash
pnpm run type-check    # TypeScript — always required
pnpm run lint          # ESLint — always required
pnpm vitest run        # Unit tests — if verification.unit_tests: true
pnpm build             # Build — if verification.build: true
```

> E2E (Playwright) is run manually or via CI only — not in the loop by default.

---

## Loop Workflow

```
Iteration N:
  1. All stories passed? → EXIT (done)
  2. Find highest-priority unpassed story (respect depends_on)
  3. Read progress.txt — load learnings from previous attempts
  4. Produce context manifest (context-partitioning skill)
  5. Implement per acceptance criteria
  6. Run verification pipeline
  7. PASS → set passes: true → git commit → append to progress.txt
     FAIL → increment attempt_count → record issue → append to progress.txt
  8. Next iteration
```

---

## Escalation Rules

| Condition | Action |
|-----------|--------|
| `attempt_count >= 3` | Stop — record blocker — skip to next story — flag for human review |
| Dependency not yet passed | Skip story — work on next available |
| Verification tool fails (not code) | Record as infra blocker — do not increment attempt_count |

---

## Invocation

```bash
# Via slash command
/ralph run 50    # Max 50 iterations

# Manual: provide this prompt to Claude Code
"Read plans/prd.json and plans/progress.txt.
Find the highest-priority unpassed story.
Implement it, verify it, update both files.
Repeat until all stories pass or you reach {N} iterations."
```

---

## Best Practices

### Small, Focused Stories
- 1–2 hour scope maximum
- One component or one API route per story
- Specific acceptance criteria (not "it works")

### Always Read Progress First
Previous learnings prevent repeating the same mistake across sessions.

### Commit After Each Pass
Creates safe checkpoints — a failed story doesn't undo previous work.

```bash
# Commit format
git commit -m "feat(US-001): persona avatar upload"
```

### Australian Context
All implementations follow en-AU defaults automatically via the `pre-response` hook:
- en-AU spelling
- DD/MM/YYYY dates
- AUD currency

---

## Integration with Agent Harness

For stories requiring 3+ agents, Ralph delegates to the Harness instead of implementing directly:

```
Story requires frontend + database + API changes
  → Ralph creates manifest per context-partitioning skill
  → Dispatches to Agent Harness (AGENT_HARNESS.md)
  → Harness returns structured result
  → Ralph runs verification gate
  → Ralph updates prd.json and progress.txt
```

---

## References

- [Original Ralph article](https://ghuntley.com/ralph/) — Jeffrey Huntley
- [Matt Pocock video](https://www.youtube.com/watch?v=_IK18goX4X8)
- Verification protocol: `.claude/skills/custom/verification-first/SKILL.md`
- Context isolation: `.claude/skills/custom/context-partitioning/SKILL.md`
