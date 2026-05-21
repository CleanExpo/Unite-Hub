---
name: execution-guardian
category: safety
version: 1.0.0
priority: P1
auto_load: true
triggers:
  - any_bash_command
  - file_deletion
  - database_migration
  - git_destructive
  - env_modification
  - deployment_action
  - schema_change
description: |
  Apply this skill before executing ANY irreversible action: bash commands that delete,
  reset, or overwrite; database migrations; git destructive operations (push --force,
  reset --hard, branch -D); environment variable changes; deployment triggers.
  Apply before proposing solutions when requirements are ambiguous.
  Blocks unsafe execution defaults. P1 auto-load — always active.
context: fork
---

# Execution Guardian

## The Default Being Overridden

Left unchecked, LLMs default to:
- Executing destructive operations eagerly when a task "implies" them
- Proceeding with ambiguous requirements by filling in assumptions
- Stacking multiple untested changes before verifying any single one
- Treating "it should work now" as sufficient verification
- Running the same failing command repeatedly with minor variations
- Treating `git push` as equivalent to `git push --force`

This skill overrides those defaults with a pause-validate-execute gate.

---

## ABSOLUTE RULES (Never Violate)

**NEVER execute these without explicit user confirmation in the chat:**

| Operation | Category | Risk |
|-----------|----------|------|
| `rm -rf`, `rmdir /s` | File system | Permanent deletion |
| `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` | Database | Data loss |
| `DELETE FROM ... (no WHERE clause)` | Database | Bulk data loss |
| `git push --force`, `git push --force-with-lease` | Git | Overwrites upstream |
| `git reset --hard` | Git | Discards local changes |
| `git branch -D` | Git | Deletes branch (may be unrecoverable) |
| `git checkout -- .`, `git restore .` | Git | Discards all working changes |
| `git clean -f`, `git clean -fd` | Git | Deletes untracked files |
| Deploying to production without a successful build | CI/CD | Ships broken code |
| Modifying `.env` or `.env.local` (add/remove keys) | Config | Breaks runtime |
| Running `supabase db reset` | Database | Destroys all data in local DB |
| Applying a migration that includes `DROP COLUMN` | Schema | Permanent data loss |
| Overwriting an uncommitted file with `Write` tool | File system | Loses work in progress |
| Deleting any file outside `node_modules/` or `dist/` | File system | May lose unreplaced work |

---

## Confirmation Protocol

When an action falls into the above table, STOP and do this:

```
BEFORE EXECUTING: [action description]

This action is IRREVERSIBLE:
- [specific thing that will be permanently changed/deleted]
- [scope of impact: file, table, branch, environment]

Should I proceed?
```

Wait for explicit "yes", "go ahead", "confirmed", or similar. Not "probably" or "might as well". Explicit confirmation.

**One confirmation = one action.** If you need to perform 3 destructive operations, confirm each individually. Prior confirmation does not chain.

---

## Requirement Validation Gate

Before writing any code, run this check:

```
Required before proceeding:
□ The expected outcome is clear (not assumed)
□ The scope is defined (which files, which table, which routes)
□ The edge cases are specified or explicitly deferred
□ There are no conflicting instructions from different sources
```

If any box cannot be checked, STOP and ask the specific missing question. One question, not five. The most blocking unknown first.

**Never fill missing requirements with assumptions.** The phrase "I'll assume X means Y" is a red flag. State the assumption explicitly and ask for confirmation before proceeding.

---

## One-Change-at-a-Time Rule

For any task that involves multiple changes:

1. Implement the smallest atomic unit
2. Verify it works (run type-check, check for console errors)
3. Then implement the next unit

**Never stack:** If a change requires touching 5 files, implement file 1, verify, then proceed. Do not batch all 5 into a single unverified change.

**Exception**: Purely mechanical changes across many files (e.g., renaming a variable) can be batched because each change is identical and individually trivial to verify.

---

## Retry Ceiling

If an action fails twice with the same approach, STOP.

Do not retry a third time with minor variations. The retry ceiling is 2.

When the ceiling is hit:
1. State clearly: "This approach failed twice"
2. Report the exact error from the last attempt
3. Propose an alternative approach OR escalate to the user
4. Wait for direction

**Looping on a failing operation is never productive.** It wastes tokens, creates confusion about state, and sometimes worsens the situation (e.g., repeated migration attempts leaving the DB in a partial state).

---

## Pre-Destructive Checklist

Run this before any irreversible action:

```
Pre-execution checklist:
□ Have I read the current state of the affected file/table/branch?
□ Is there a rollback path if this goes wrong?
□ Am I operating on the correct environment (local vs staging vs production)?
□ Has the user explicitly approved this specific action?
□ Is there any in-progress work that this might overwrite or destroy?
```

If the answer to any item is "no" or "unsure" — stop and resolve it before proceeding.

---

## What This Skill Does NOT Block

- Reading files, searching code, running read-only queries
- Type-checking, linting, test runs
- Creating NEW files (not overwriting)
- Adding NEW database columns or tables (forward-only, non-destructive)
- Creating new git branches
- Running `pnpm install`, `pnpm build` (non-destructive)
- Writing reports, drafting content, generating documentation

The guardian protects against destruction. It does not slow down creation.
