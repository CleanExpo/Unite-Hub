---
name: git-worktrees
description: Creates isolated git worktrees for feature development with automatic dependency installation, baseline test verification, and .gitignore safety checks. Extends the /minion isolation model with a formal worktree workflow. Triggers on "new feature", "isolate", "worktree", multi-session work, or when parallel development is needed.
license: MIT
metadata:
  author: NodeJS-Starter-V1 — adapted from obra/superpowers (MIT)
  version: '1.0.0'
  locale: en-AU
---

# Git Worktrees

Adapted from [obra/superpowers](https://github.com/obra/superpowers) — MIT. Provides a formal worktree workflow that extends the existing `/minion` isolation model.

## Purpose

Isolate feature development from `main` using `git worktree`. Each feature gets its own working directory with clean dependencies and a verified test baseline — preventing feature branches from corrupting each other.

## When to Use

- Starting any non-trivial feature (especially multi-session work)
- Parallel feature development (2+ features in flight simultaneously)
- Risky refactors that may break other work in progress
- When the `/minion` command is used with the `--isolate` flag
- Any time you need a clean environment to verify tests pass

**Don't use when:**
- Hotfix on `main` (patch directly)
- Single-file trivial change
- Throwaway prototype / spike

---

## Worktree Setup Workflow

### Step 1: Determine Worktree Directory

Check in this priority order:

1. **Existing `.worktrees/` directory** at project root → use it
2. **Existing `worktrees/` directory** at project root → use it
3. **CLAUDE.md preference** — check for stated worktree location preference
4. **Default**: Create `.worktrees/` at project root, add to `.gitignore`

```bash
# Check what exists
ls -la | grep worktrees
grep -i "worktree" CLAUDE.md
```

### Step 2: Safety — Verify .gitignore

**MANDATORY before creating any worktree in a project-local directory.**

Project-local worktrees MUST be in `.gitignore` to prevent accidentally committing worktree contents.

```bash
# Check if .worktrees/ is already ignored
grep -e "\.worktrees" -e "worktrees/" .gitignore

# If not present, add it
echo ".worktrees/" >> .gitignore
git add .gitignore
git commit -m "chore: add .worktrees/ to .gitignore"
```

### Step 3: Create the Worktree

```bash
# Create worktree on a new branch
git worktree add .worktrees/<feature-name> -b feature/<feature-name>

# Example
git worktree add .worktrees/auth-refresh -b feature/auth-refresh

# Verify
git worktree list
```

### Step 4: Auto-Detect and Install Dependencies

Navigate to the new worktree and install based on detected project type:

```bash
cd .worktrees/<feature-name>

# NodeJS-Starter-V1 is a monorepo — always:
pnpm install

# Backend Python dependencies
cd apps/backend && uv sync && cd ../..
```

**Detection logic** (in order):
| Indicator File | Command |
|---------------|---------|
| `pnpm-lock.yaml` | `pnpm install` |
| `package-lock.json` | `npm ci` |
| `yarn.lock` | `yarn install` |
| `pyproject.toml` | `uv sync` |
| `requirements.txt` | `pip install -r requirements.txt` |

### Step 5: Baseline Test Verification

**MANDATORY. Never skip.** Run baseline tests before writing any feature code.

```bash
# Full test suite — must be green before starting feature work
pnpm turbo run test

# If baseline is red, STOP. Fix the baseline before starting feature work.
# Do not begin feature development on a broken test suite.
```

Report the baseline result:
- ✅ Baseline green: N tests passing → proceed to feature development
- ❌ Baseline red: Stop. Fix failing tests on `main` before creating worktree.

### Step 6: Report and Begin Work

```
Worktree created: .worktrees/<feature-name>
Branch: feature/<feature-name>
Dependencies: installed (pnpm + uv sync)
Baseline: ✅ N tests passing

Ready to begin: <feature-name>
```

---

## Working in the Worktree

```bash
# Navigate to worktree
cd .worktrees/<feature-name>

# All standard commands work as expected
pnpm dev
pnpm test --filter=web
cd apps/backend && uv run pytest -v
pnpm turbo run type-check
```

The worktree is a full git checkout — commit, branch, push as normal.

---

## Cleanup

### After Merging / PR Approved

```bash
# Return to root
cd "D:\Node JS Starter V1"

# Remove the worktree
git worktree remove .worktrees/<feature-name>

# Delete the branch (if merged)
git branch -d feature/<feature-name>

# Verify
git worktree list
```

### Stale Worktrees

```bash
# List all worktrees with status
git worktree list

# Prune worktrees whose branches no longer exist
git worktree prune

# Force remove a locked/stale worktree
git worktree remove --force .worktrees/<stale-name>
```

---

## NodeJS-Starter-V1 Specifics

| Item | Detail |
|------|--------|
| Worktree location | `.worktrees/<feature-name>/` |
| .gitignore entry | `.worktrees/` |
| Monorepo deps | `pnpm install` (root) |
| Backend Python deps | `cd apps/backend && uv sync` |
| Test baseline | `pnpm turbo run test` |
| Docker services | Start separately: `pnpm run docker:up` (shared, not per-worktree) |

**Note on Docker**: PostgreSQL and Redis run as shared Docker services. They are not per-worktree — all worktrees share the same database instance. Use separate databases or reset between tests if isolation is critical.

---

## Integration with /minion

The `/minion` command uses `--isolate` to request worktree isolation. This skill provides the formal protocol that backs that flag:

```bash
# /minion with isolation
/minion --isolate "implement auth refresh token rotation"
# → creates .worktrees/auth-refresh-token-rotation/
# → installs deps, runs baseline
# → executes blueprint in isolation
# → creates PR when done
# → removes worktree after PR created
```

---

## Safety Checklist

Before creating a worktree:
- [ ] `.worktrees/` is in `.gitignore`
- [ ] Base branch (`main`) is clean: `git status`
- [ ] All current changes committed or stashed

After creating a worktree:
- [ ] Dependencies installed: `pnpm install && cd apps/backend && uv sync`
- [ ] Baseline tests passing: `pnpm turbo run test`
- [ ] Worktree listed correctly: `git worktree list`

Before removing a worktree:
- [ ] All work committed and pushed
- [ ] PR created (if applicable)
- [ ] Branch merged or intentionally preserved