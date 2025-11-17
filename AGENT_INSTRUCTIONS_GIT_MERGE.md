# Git Merge Agent Instructions
**Agent Type**: Git Merge Specialist
**Task**: Execute safe merge from Designer → main branch
**Priority**: CRITICAL
**Execution Time**: 10-15 minutes

---

## Mission

Safely merge the Designer branch into main using fast-forward merge, create backup branches, verify merge success, and push to remote repository.

---

## Pre-Execution Safety Checks

### 1. Verify Current State
```bash
# Check current branch
git branch --show-current
# Expected: Should be on any branch (we'll switch to main)

# Check for uncommitted changes
git status
# Expected: "nothing to commit, working tree clean"

# Verify Designer branch exists
git branch -a | grep Designer
# Expected: Should see "Designer" and "origin/Designer"
```

**If uncommitted changes exist**:
```bash
# Stash changes
git stash save "Pre-merge stash - [timestamp]"

# Or commit them
git add .
git commit -m "Pre-merge checkpoint"
```

---

### 2. Fetch Latest Changes
```bash
# Fetch all branches from remote
git fetch origin

# List all branches to verify
git branch -a

# Check main branch status
git checkout main
git status
# Expected: "Your branch is up to date with 'origin/main'"

# Pull latest main (if behind)
git pull origin main
```

---

## Merge Execution Steps

### Step 1: Create Backup Branch

**Purpose**: Safety net in case merge needs to be undone

```bash
# Ensure on main branch
git checkout main

# Create backup branch
git branch backup-pre-design-merge

# Verify backup created
git branch | grep backup-pre-design-merge
# Expected: Should see "backup-pre-design-merge" in list

# Push backup to remote
git push origin backup-pre-design-merge

# Verify backup pushed
git branch -r | grep backup-pre-design-merge
# Expected: Should see "origin/backup-pre-design-merge"
```

**Record Backup Details**:
- Backup Branch Name: `backup-pre-design-merge`
- Backup Commit SHA: `[run: git rev-parse HEAD]`
- Timestamp: `[current timestamp]`

---

### Step 2: Verify Merge Readiness

```bash
# Check if merge will be fast-forward
git merge-base main Designer
# Expected: Should return a commit SHA (common ancestor)

# Record common ancestor
COMMON_ANCESTOR=$(git merge-base main Designer)
echo "Common ancestor: $COMMON_ANCESTOR"

# Check divergence
git log main..Designer --oneline
# Expected: Should show Designer commits (8 commits)

git log Designer..main --oneline
# Expected: Should show NOTHING (main has no new commits)
```

**Analysis**:
- If `Designer..main` is empty: ✅ Fast-forward possible
- If `Designer..main` has commits: ⚠️ Diverged branches, merge commit needed

---

### Step 3: Execute Fast-Forward Merge

**Command**:
```bash
# Ensure on main branch
git checkout main

# Merge Designer with fast-forward only
git merge Designer --ff-only
```

**Expected Output**:
```
Updating 14488d5..7edc971
Fast-forward
 .claude/settings.local.json             |   6 +-
 DESIGN_UPDATE_PLAN.md                   | 255 +++++++++++++++++++
 next.config.mjs                         |  15 ++
 src/app/(auth)/forgot-password/page.tsx | 211 ++++++++++++----
 src/app/(auth)/login/page.tsx           | 353 +++++++++++++++++----------
 src/app/(auth)/register/page.tsx        | 373 +++++++++++++++++++---------
 src/app/(auth)/signup/page.tsx          | 205 +++++++++++++---
 src/app/dashboard/campaigns/page.tsx    | 213 +++++++++-------
 src/app/dashboard/contacts/page.tsx     | 302 +++++++++++++----------
 src/app/dashboard/overview/page.tsx     | 122 +++++++---
 src/app/page.tsx                        | 418 +++++++++++++++++++++++++++++++-
 11 files changed, 1881 insertions(+), 592 deletions(-)
 create mode 100644 DESIGN_UPDATE_PLAN.md
```

**If Fast-Forward Fails**:
```
fatal: Not possible to fast-forward, aborting.
```

**Action**: Use regular merge (creates merge commit)
```bash
git merge Designer -m "Merge Designer branch - Modern design system implementation"
```

---

### Step 4: Verify Merge Success

```bash
# Check current status
git status
# Expected: "Your branch is ahead of 'origin/main' by 6 commits"

# Verify all Designer commits are in main
git log --oneline -10
# Expected: Should show Designer commits at the top

# Check file changes
git diff HEAD~6..HEAD --name-only
# Expected: Should list all 11 changed files

# Verify no uncommitted changes
git status
# Expected: "nothing to commit, working tree clean"
```

**Record Merge Details**:
- Merge Type: [Fast-Forward / Merge Commit]
- New HEAD SHA: `[run: git rev-parse HEAD]`
- Files Changed: 11
- Insertions: +1,881
- Deletions: -592

---

### Step 5: Handle Merge Conflicts (If Any)

**Note**: Conflicts NOT expected based on analysis, but be prepared

**If Conflicts Occur**:
```bash
# Check which files have conflicts
git status | grep "both modified"

# For each conflicting file
git diff [file]

# Manually resolve conflicts in editor
# Look for conflict markers:
# <<<<<<< HEAD
# [main version]
# =======
# [Designer version]
# >>>>>>> Designer

# After resolving, stage the file
git add [file]

# Continue merge
git commit -m "Merge Designer branch - Resolved conflicts in [files]"
```

**Conflict Resolution Strategy**:
1. Prefer Designer version for UI/styling changes
2. Prefer main version for business logic
3. Manually merge if both have logic changes
4. Test after resolution

---

### Step 6: Push to Remote

```bash
# Push merged main to remote
git push origin main

# Verify push succeeded
git status
# Expected: "Your branch is up to date with 'origin/main'"

# Check remote main
git log origin/main --oneline -5
# Expected: Should show Designer commits
```

**If Push Fails** (e.g., remote has new commits):
```bash
# Pull with rebase
git pull origin main --rebase

# Re-push
git push origin main
```

**If Force Push Needed** (use with caution):
```bash
# Only if you're certain and coordinated with team
git push origin main --force-with-lease
```

---

### Step 7: Update Designer Branch (Optional)

**Purpose**: Keep Designer in sync with main

```bash
# Switch to Designer
git checkout Designer

# Merge main into Designer (fast-forward)
git merge main --ff-only

# Push updated Designer
git push origin Designer
```

---

### Step 8: Create Release Tag (Optional)

```bash
# Ensure on main branch
git checkout main

# Create annotated tag
git tag -a v1.1-design-system -m "Modern design system implementation

- Updated 8 pages with new gradient design
- Added glass-morphism effects
- Implemented split-screen auth layouts
- Enhanced dashboard with gradient cards
- Improved responsive design
"

# Push tag to remote
git push origin v1.1-design-system

# Verify tag created
git tag -l | grep v1.1-design-system
```

---

## Verification Checklist

After merge, verify:

- [ ] Backup branch created and pushed
- [ ] Main branch merged successfully
- [ ] No merge conflicts (or all resolved)
- [ ] Working tree clean (`git status`)
- [ ] All Designer commits in main (`git log`)
- [ ] 11 files changed in merge
- [ ] Remote main updated (`git push` succeeded)
- [ ] Tag created (optional)

---

## Rollback Procedures

### Rollback Method 1: Hard Reset (Immediate, Destructive)

**Use When**: Merge just completed, not yet pushed, or you have team approval

```bash
# Switch to main
git checkout main

# Hard reset to backup
git reset --hard backup-pre-design-merge

# Verify rollback
git log --oneline -5
# Expected: Should show pre-merge commits only

# If already pushed to remote
git push origin main --force
```

**Warning**: `--force` overwrites remote history. Coordinate with team!

---

### Rollback Method 2: Revert Merge Commit (Safe, Preserves History)

**Use When**: Merge already pushed and others may have pulled

```bash
# Find merge commit SHA
git log --oneline -10 | grep "Merge"
MERGE_SHA=$(git log --oneline -10 | grep "Merge" | head -1 | cut -d' ' -f1)

# Create revert commit
git revert -m 1 $MERGE_SHA

# Push revert
git push origin main
```

**Explanation**: `-m 1` keeps main branch history, reverses Designer changes

---

### Rollback Method 3: Cherry-Pick (Selective)

**Use When**: Only specific files need to be reverted

```bash
# Revert specific file to pre-merge state
git checkout backup-pre-design-merge -- src/app/page.tsx

# Commit revert
git commit -m "Revert src/app/page.tsx to pre-merge state"

# Push
git push origin main
```

---

### Rollback Method 4: Branch Swap (Nuclear Option)

**Use When**: Everything is broken and you need to start over

```bash
# Delete current main
git branch -D main

# Recreate main from backup
git checkout -b main backup-pre-design-merge

# Force push to remote
git push origin main --force
```

**Warning**: Only use as last resort with team approval

---

## Troubleshooting

### "fatal: Not possible to fast-forward"
**Cause**: Main has commits not in Designer
**Fix**: Use regular merge instead
```bash
git merge Designer -m "Merge Designer branch"
```

### "refusing to merge unrelated histories"
**Cause**: Branches have no common ancestor (rare)
**Fix**: Force merge with allow-unrelated-histories
```bash
git merge Designer --allow-unrelated-histories
```

### "error: failed to push some refs"
**Cause**: Remote main has new commits
**Fix**: Pull and rebase
```bash
git pull origin main --rebase
git push origin main
```

### Merge Conflicts in Binary Files
**Cause**: Image or other binary file changed in both branches
**Fix**: Choose one version
```bash
# Use Designer version
git checkout --theirs [file]

# Or use main version
git checkout --ours [file]

git add [file]
git commit
```

---

## Report Template

**Copy and fill out**:

```markdown
# Git Merge Report
**Date**: [YYYY-MM-DD HH:MM]
**Agent**: Git Merge Specialist
**Status**: ✅ SUCCESS / ❌ FAILED / ⚠️ COMPLETED WITH WARNINGS

---

## Pre-Merge State

### Main Branch
- Commit SHA: [SHA]
- Status: [clean/dirty]
- Up-to-date with remote: [YES/NO]

### Designer Branch
- Commit SHA: [SHA]
- Commits ahead of main: [count]
- Status: [clean/dirty]

### Common Ancestor
- Commit SHA: [SHA]
- Description: [commit message]

---

## Backup

### Backup Branch Created
- Name: backup-pre-design-merge
- Commit SHA: [SHA]
- Pushed to remote: [YES/NO]
- Verification: [PASS/FAIL]

---

## Merge Execution

### Merge Type
- Method: [Fast-Forward / Merge Commit / Rebase]
- Command: `git merge Designer --ff-only`
- Duration: [seconds]

### Merge Result
- Status: [SUCCESS/FAILED]
- Conflicts: [NONE / count]
- Files Changed: [count]
- Insertions: +[count]
- Deletions: -[count]

### Conflict Resolution (if applicable)
- Files with conflicts: [list]
- Resolution strategy: [description]
- Resolved by: [manual/automated]

---

## Post-Merge Verification

### Working Tree
- Status: [clean/dirty]
- Uncommitted changes: [count]

### Commit History
- HEAD SHA: [SHA]
- Designer commits merged: [YES/NO]
- History linear: [YES/NO]

### File Changes
- Total files modified: [count]
- Expected files: 11
- Match: [YES/NO]
- Unexpected changes: [list if any]

---

## Remote Push

### Push to origin/main
- Status: [SUCCESS/FAILED]
- Method: [normal / force / force-with-lease]
- Verification: [PASS/FAIL]

### Tag Creation (optional)
- Tag name: v1.1-design-system
- Tag SHA: [SHA]
- Pushed: [YES/NO]

---

## Designer Branch Update (optional)

### Sync Designer with main
- Status: [DONE / SKIPPED]
- Method: [fast-forward / merge]
- Pushed: [YES/NO]

---

## Issues Encountered

### Critical Issues
1. [Issue description]
   - **Error**: [error message]
   - **Resolution**: [how it was fixed]
   - **Impact**: [description]

### Warnings
1. [Warning description]
   - **Impact**: [description]
   - **Action Taken**: [description]

---

## Final State

### Main Branch
- HEAD SHA: [SHA]
- Commits ahead of origin/main: [count]
- Status: [up-to-date / ahead / diverged]

### Files Changed (verify all 11)
- [ ] .claude/settings.local.json
- [ ] DESIGN_UPDATE_PLAN.md
- [ ] next.config.mjs
- [ ] src/app/(auth)/forgot-password/page.tsx
- [ ] src/app/(auth)/login/page.tsx
- [ ] src/app/(auth)/register/page.tsx
- [ ] src/app/(auth)/signup/page.tsx
- [ ] src/app/dashboard/campaigns/page.tsx
- [ ] src/app/dashboard/contacts/page.tsx
- [ ] src/app/dashboard/overview/page.tsx
- [ ] src/app/page.tsx

---

## Rollback Plan

### If Needed
- Backup branch: backup-pre-design-merge
- Backup SHA: [SHA]
- Rollback method: [Hard Reset / Revert / Cherry-Pick]
- Estimated rollback time: [minutes]

### Rollback Tested
- Dry run performed: [YES/NO]
- Verified backup works: [YES/NO]

---

## Recommendations

### Merge Status
**APPROVE**: [YES/NO]

**Reasoning**:
[Explain decision]

### Next Steps
1. [Action item]
2. [Action item]
3. [Action item]

### Follow-Up Required
- [List any follow-up tasks]

---

## Merge Timeline

- **Backup Created**: [HH:MM:SS]
- **Merge Started**: [HH:MM:SS]
- **Merge Completed**: [HH:MM:SS]
- **Pushed to Remote**: [HH:MM:SS]
- **Total Duration**: [MM:SS]

---

**Executed By**: Git Merge Agent
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
**Git Version**: [run: git --version]
```

---

## Success Criteria

### Must Succeed (Blocking)
- ✅ Backup branch created and pushed
- ✅ Merge completes without errors
- ✅ All conflicts resolved (if any)
- ✅ Working tree clean after merge
- ✅ Push to remote succeeds

### Should Succeed (Non-Blocking)
- ✅ Fast-forward merge (preferred)
- ✅ Linear history maintained
- ✅ Tag created for release

---

## Execution Checklist

**Pre-Merge**:
- [ ] Verify current branch and status
- [ ] Fetch latest changes from remote
- [ ] Pull latest main branch
- [ ] Check for uncommitted changes
- [ ] Record pre-merge state

**Backup**:
- [ ] Create backup branch
- [ ] Push backup to remote
- [ ] Verify backup creation
- [ ] Record backup SHA

**Merge**:
- [ ] Switch to main branch
- [ ] Attempt fast-forward merge
- [ ] Handle conflicts (if any)
- [ ] Verify merge success
- [ ] Check working tree status
- [ ] Record merge details

**Post-Merge**:
- [ ] Verify all files changed
- [ ] Check commit history
- [ ] Push to remote
- [ ] Create release tag (optional)
- [ ] Update Designer branch (optional)
- [ ] Fill out report template
- [ ] Submit report

---

**Time Estimate**: 10-15 minutes
**Difficulty**: Medium
**Risk Level**: Low (with backup)

---

**End of Git Merge Instructions**
