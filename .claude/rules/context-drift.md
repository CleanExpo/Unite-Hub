# Context Drift Prevention

> **Problem**: Claude Code's automatic context compaction is lossy. CLAUDE.md has no protected status —
> it is treated as regular context and can be dropped. After compaction, rule violations occur 100% of the time
> without countermeasures. (Confirmed: Anthropic GitHub issues #9796, #13919, #14258)

---

## The 4-Pillar Defence

| Pillar | Mechanism | Trigger | File |
|--------|-----------|---------|------|
| **1. Immutable rules on disk** | CONSTITUTION.md persists across all compaction | Manual read / SessionStart | `.claude/memory/CONSTITUTION.md` |
| **2. Session injection** | CONSTITUTION.md loaded at every new session | SessionStart hook | `session-start-context.ps1` |
| **3. Per-message compass** | ~100-token compass prepended to every user message | UserPromptSubmit hook | `user-prompt-compass.ps1` |
| **4. Pre-compaction save** | State snapshot written before context is destroyed | PreCompact hook | `pre-compact-save.py` |

---

## Memory File Purposes

| File | Purpose | Who Updates |
|------|---------|-------------|
| `CONSTITUTION.md` | Immutable rules — never agent-editable | Human only |
| `compass.md` | Ultra-lean 5-line summary for per-message injection | Human only |
| `current-state.md` | Session state snapshot | PreCompact hook + agents |
| `architectural-decisions.md` | Append-only decision log | Agents (append only) |

### Update Protocol for Agents

- **`current-state.md`**: Agents may update "Active Task", "In-Progress Work", "Next Steps" sections.
- **`architectural-decisions.md`**: Agents append entries in format:
  `[DD/MM/YYYY] DECISION: X | REASON: Y | ALTERNATIVES REJECTED: Z`
- **`CONSTITUTION.md`**: Read-only for agents. Only humans update this.
- **`compass.md`**: Read-only for agents. Only humans update this.

---

## Agent Token Budgets

| Role | Context Budget | Strategy |
|------|---------------|----------|
| Orchestrator | < 80,000 tokens | Delegate file reads to subagents |
| Frontend Specialist | < 60,000 tokens | Load only `apps/web/` relevant files |
| Backend Specialist | < 60,000 tokens | Load only `apps/backend/` relevant files |
| Database Specialist | < 40,000 tokens | Load schema + migration files only |
| Test Engineer | < 50,000 tokens | Load test files + component under test |

---

## Session Handoff Procedure

For long tasks spanning multiple sessions:

1. At end of session, agent writes to `current-state.md`:
   - What was completed
   - What remains
   - Any blocking issues
2. Next session: read `current-state.md` before starting
3. For architectural choices: append to `architectural-decisions.md`

---

## Drift Recovery

If you notice wrong patterns, ignored rules, or architectural violations:

```bash
cat .claude/memory/CONSTITUTION.md          # Re-read immutable rules
cat .claude/memory/current-state.md         # Check last saved state
cat .claude/memory/architectural-decisions.md  # Review decisions log
cat .claude/rules/retrieval-first.md        # Re-read knowledge retrieval order
```

---

## What Is NOT Yet Possible

- **PostCompact hook** — doesn't exist in Claude Code (Issue #3537 open)
- **Pinned context** — not available (Issue #14258 open)
- **Context Editing API** — API-level only, not configurable in `settings.json`

These pillars are the maximum defence achievable with Claude Code's current hook system.
