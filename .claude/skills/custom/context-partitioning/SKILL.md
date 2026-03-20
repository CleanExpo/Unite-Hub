---
name: context-partitioning
category: context
version: 2.0.0
description: Manifest-first context isolation — each subagent receives only its scope, never the full codebase
author: Unite Group (ported from NodeJS-Starter-V1)
priority: 1
auto_load: true
triggers:
  - any_dispatch
  - spawn_subagent
  - agent_harness
---

# Context Partitioning — Manifest-First Dispatch

## The Problem

Without explicit context isolation, the main orchestrator context window accumulates:
- Full file reads that were only needed once
- Subagent outputs that are already committed to disk
- Skill files that don't apply to the current task
- Historical reasoning that compaction will destroy anyway

Result: context bloat → compaction → rule violations → wrong output.

## The Solution: Manifest-First

**Rule**: Before dispatching ANY subagent, the orchestrator MUST produce a typed manifest.
The manifest is the subagent's entire world — it reads NOTHING outside its manifest.

---

## Manifest Format

```json
{
  "agent": "frontend-specialist",
  "task": "Add persona avatar upload to SocialPersonasManager",
  "toolshed": "frontend",
  "token_budget": 60000,
  "files": {
    "must_read": [
      "src/components/social/SocialPersonasManager.tsx",
      "src/lib/businesses.ts"
    ],
    "reference_only": [
      "src/app/globals.css"
    ],
    "must_not_touch": [
      "src/lib/supabase/",
      "supabase/migrations/"
    ]
  },
  "skills": ["scientific-luxury", "react-best-practices"],
  "constraints": [
    "founder_id isolation — never workspace_id",
    "Scientific Luxury: #050505 bg, #00F5FF accent, rounded-sm only",
    "Framer Motion only — no CSS transitions"
  ],
  "success_criteria": "Avatar upload renders, persists to Supabase Storage, no TypeScript errors",
  "output_format": "edited_files_list + verification_tier_A_result",
  "verification_agent": "verification"
}
```

---

## Orchestrator Rules (Hard Constraints)

### What the Orchestrator MUST do:
1. **Glob/Grep only** — discover file paths, never read file contents in main context
2. **Produce manifest first** — before calling any Agent tool
3. **Pass manifest as prompt** — subagent's entire context = manifest + agent.md
4. **Receive structured summary** — subagent returns file list + verification output, not full code

### What the Orchestrator MUST NOT do:
- Read full file contents (use Grep for specific lines if truly needed)
- Hold subagent working files in main context
- Load skills that don't apply to the current routing decision
- Re-read files the subagent has already handled

---

## Token Budget Enforcement

| Agent Role | Hard Cap | Consequence of Breach |
|-----------|----------|-----------------------|
| Orchestrator | 80,000 | Delegate immediately — do not read more files |
| Frontend Specialist | 60,000 | Scope to `src/components/` + `src/app/` only |
| Senior Fullstack | 60,000 | Scope to task-relevant `src/app/api/` + `src/lib/` files |
| Database Specialist | 40,000 | Scope to `supabase/migrations/` + schema file only |
| Security Auditor | 50,000 | Scope to auth path + affected routes only |
| Bug Hunter | 40,000 | Failing file + direct imports one level deep only |
| Test Engineer | 50,000 | Test file + source file under test only |
| Verification | 30,000 | Verification output only — no source reads |

---

## Context Scope Definitions

| Scope Token | Resolves To |
|-------------|-------------|
| `src/` | Full src directory — only for orchestrator planning |
| `failing-file-only` | The single file containing the error |
| `direct-imports-one-level` | Files imported by the failing file (not transitive) |
| `test-files` | `src/**/*.test.ts`, `src/**/*.spec.ts`, `tests/` |
| `source-file-under-test` | The exact file being tested |
| `task-specific` | Orchestrator selects based on task decomposition |

---

## Manifest-First Dispatch Protocol

```
Step 1 — DISCOVER (Orchestrator, Glob/Grep only)
  → Identify affected files by pattern, not by reading
  → Check VAULT-INDEX.md for known asset locations
  → Load toolshed entry from toolsheds.json

Step 2 — MANIFEST (Orchestrator, write manifest)
  → Populate must_read, reference_only, must_not_touch
  → Select max 5-6 skills from toolshed
  → Set token_budget from toolsheds.json
  → Write success_criteria in verifiable terms

Step 3 — DISPATCH (Orchestrator → Agent tool)
  → Pass manifest as the agent's complete prompt
  → Agent reads ONLY manifest.files.must_read
  → Agent loads ONLY manifest.skills

Step 4 — RETURN (Subagent → Orchestrator)
  → Return: list of files modified + verification output
  → Do NOT return full file contents
  → Do NOT return intermediate reasoning

Step 5 — INTEGRATE (Orchestrator)
  → Accept structured summary
  → Route to verification agent
  → Main context stays lean
```

---

## Anti-Patterns (Never Do)

| Anti-Pattern | Why | Fix |
|-------------|-----|-----|
| `Read("src/")` in orchestrator | Dumps entire codebase into context | Glob for paths only |
| Subagent reads files outside manifest | Context bleed, token waste | Manifest must_not_touch |
| Return full file content from subagent | Doubles context usage | Return file path + diff summary |
| Load all P1 skills for every task | Token waste on irrelevant skills | Load toolshed subset only |
| Re-verify work in orchestrator | Redundant, wastes context | Delegate to verification agent |

---

## Integration with Toolsheds

This skill works in tandem with `.claude/data/toolsheds.json`:
- Each toolshed entry defines `token_budget`, `skills`, and `context_scope`
- Orchestrator selects toolshed by task domain → produces manifest → dispatches

Reference: `.claude/AGENT_HARNESS.md` Phase 4 for dispatch protocol.
