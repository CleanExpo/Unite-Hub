---
name: finishing-branch
description: End-of-feature workflow for development branches. Verifies tests pass, generates PR description, chooses merge strategy, cleans up worktrees, and manages branch lifecycle. Triggers on "create PR", "merge", "finishing", "branch cleanup", "ready to merge", or at end of feature work.
license: MIT
metadata:
  author: NodeJS-Starter-V1 — adapted from obra/superpowers (MIT)
  version: '1.0.0'
  locale: en-AU
---

# Finishing a Development Branch

Adapted from [obra/superpowers](https://github.com/obra/superpowers) — MIT. Structured end-of-feature workflow for the NodeJS-Starter-V1 monorepo.

## Overview

Before merging or creating a PR, every development branch must pass a structured completion protocol:

1. Verify all tests pass
2. Determine the base branch and merge strategy
3. Generate a meaningful PR description
4. Execute the chosen action
5. Clean up worktrees and stale branches

---

## Step 1: Verify Tests Pass

**MANDATORY. Never skip this step.**

```bash
# Full monorepo test suite — must be green
pnpm turbo run test

# Type check — must be 0 errors
pnpm turbo run type-check

# Lint — must be clean
pnpm turbo run lint

# Optional: coverage check
cd apps/backend && uv run pytest --cov=src --cov-fail-under=40
```

If ANY check fails → stop. Fix the failures before offering merge options. Do not create a PR with failing tests.

---

## Step 2: Review Commits and Determine Base Branch

```bash
# What's on this branch vs main?
git log --oneline main..HEAD

# What files changed?
git diff main...HEAD --name-only

# Full diff for PR description generation
git diff main...HEAD
```

Determine base branch:
- **`main`** — standard for all feature branches (NodeJS-Starter-V1 uses trunk-based development)
- **`release/*`** — if releasing to a specific version branch

---

## Step 3: Generate PR Description

Based on the commit log and diff, generate:

```markdown
## Summary

- <bullet: what was implemented/changed>
- <bullet: why this change was made>
- <bullet: key technical decisions>

## Test Plan

- [ ] `pnpm turbo run test` — all N tests passing
- [ ] `pnpm turbo run type-check` — 0 TypeScript errors
- [ ] `pnpm turbo run lint` — clean
- [ ] <manual smoke test step if applicable>
- [ ] <specific feature test step>

## Related

<!-- Link any Linear issues, PRs, or docs -->
```

**PR title format** (Conventional Commits):
```
feat(web): add contractor availability calendar component
fix(backend): resolve JWT token expiry race condition
refactor(db): migrate contractor model to SQLAlchemy 2.0 style
docs(claude): update CLAUDE.md with new auth endpoints
```

---

## Step 4: Present Options

Present **exactly** these 4 options:

```
Branch: feature/<name>
Base: main
Tests: ✅ N passing

What would you like to do?

1. Merge to main locally (fast-forward or squash)
2. Push and create a Pull Request
3. Keep branch as-is for later
4. Discard the work (type "discard" to confirm)
```

### Option 1: Merge Locally

```bash
# Switch to main
git checkout main

# Fast-forward merge (clean history)
git merge --ff-only feature/<name>

# OR squash merge (single clean commit)
git merge --squash feature/<name>
git commit -m "feat(<scope>): <description>"

# Push
git push origin main
```

### Option 2: Push and Create PR

```bash
# Push the feature branch
git push -u origin feature/<name>

# Create PR via GitHub CLI
gh pr create \
  --title "feat(<scope>): <description>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet points>

## Test Plan
- [ ] pnpm turbo run test — N tests passing
- [ ] pnpm turbo run type-check — 0 errors
- [ ] pnpm turbo run lint — clean

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --base main
```

The PR is labelled `review-required`. Never merge without human review.

### Option 3: Keep Branch As-Is

```bash
# Push to remote for safekeeping
git push -u origin feature/<name>

# Note the branch for future reference
echo "Preserved: feature/<name> — <reason>"
```

Worktree is kept intact.

### Option 4: Discard (Requires Typed Confirmation)

Require the user to type `discard` before proceeding:

```
⚠️  This will permanently delete all work on feature/<name>.
Type "discard" to confirm: _
```

```bash
# After confirmation
git checkout main
git branch -D feature/<name>
git push origin --delete feature/<name> 2>/dev/null || true
```

---

## Step 5: Clean Up Worktree

**For Options 1, 4:** Remove worktree immediately after action.
**For Option 2 (PR):** Remove worktree after PR is created (branch still exists on remote).
**For Option 3 (Keep):** Preserve worktree until explicitly cleaned up.

```bash
# Return to project root
cd "D:\Node JS Starter V1"

# Remove worktree
git worktree remove .worktrees/<feature-name>

# Prune any stale references
git worktree prune

# Verify clean state
git worktree list
git branch -vv | grep gone | awk '{print $1}'  # List orphaned local branches
```

---

## Stale Branch Cleanup

Run periodically to keep the repo clean:

```bash
# List branches merged into main
git branch --merged main | grep -v "^\*\|main"

# Delete merged local branches
git branch --merged main | grep -v "^\*\|main" | xargs git branch -d

# Prune deleted remote branches
git fetch --prune

# List remote branches
git branch -r | grep -v "HEAD\|main"
```

---

## NodeJS-Starter-V1 PR Checklist

Before creating a PR, verify all of the following:

```
□ pnpm turbo run test — all tests passing (show count)
□ pnpm turbo run type-check — 0 TypeScript errors
□ pnpm turbo run lint — clean output
□ git status — working tree clean, all changes committed
□ git log --oneline main..HEAD — commits make sense, no junk commits
□ PR description generated with Summary + Test Plan sections
□ Conventional Commit format in PR title
□ Linear issue linked (if applicable)
□ No TODO comments left in code (or intentional TODOs noted in PR)
```

---

## Merge Strategy Guide

| Scenario | Strategy | Why |
|----------|----------|-----|
| Single clean commit | `--ff-only` | Preserves linear history |
| Multiple messy commits | `--squash` | Clean history, single commit per feature |
| Complex feature with meaningful history | Regular merge | Preserves context |
| Hotfix | `--ff-only` directly to main | Fast, no PR needed |

NodeJS-Starter-V1 default: **squash merge** into `main` for features. This keeps `git log --oneline` readable.

---

## Integration with Git Worktrees Skill

This skill is the natural exit point for the `git-worktrees` skill:

```
git-worktrees skill → [feature work] → finishing-branch skill
     ↑                                           ↓
  Create worktree                     Merge/PR + cleanup worktree
```

After PR is approved and merged, return here to run Step 5 cleanup.

---

## Related Skills

- **`git-worktrees`** — Creates the worktree that this skill cleans up
- **`tdd`** — All code on the branch should have been written test-first
- **`verification-before-completion`** — Step 1 (test verification) is an instance of this skill
- **`dispatching-parallel-agents`** — If CI fails during PR, use this to fix failures in parallel