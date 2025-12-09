# Long-Running Agent Session Protocol
# Based on Anthropic Research (Nov 26, 2025)
# Implements 80% time savings + 94% success rate pattern

## Session Start Checklist (MANDATORY)

Every session MUST begin with these steps:

1. **Get Bearings** (2 min)
   ```bash
   pwd  # Confirm you're in d:/Unite-Hub
   ```

2. **Read Session History** (3 min)
   ```bash
   # Read last 20 commits
   git log --oneline -20
   
   # Read progress file
   cat claude-progress.txt
   ```

3. **Check Feature List** (2 min)
   ```javascript
   // Read feature_list.json
   // Find first feature where passes=false
   // Display: "Working on [id]: [title]"
   ```

4. **Initialize Environment** (5 min)
   ```bash
   # Run init script
   bash init.sh
   
   # Start dev server if needed
   npm run dev
   ```

5. **Basic Health Check** (3 min)
   - Open http://localhost:3008
   - Verify app loads without errors
   - Check console for warnings
   - If broken: Fix before proceeding

---

## Session Work Loop (ENFORCED STRUCTURE)

### DO (Required Actions)

✅ **Work on ONE feature per session**
   - Read feature from feature_list.json
   - Implement only that feature
   - Do not attempt multiple features

✅ **Test thoroughly before completion**
   - Unit tests for logic
   - Integration tests for API
   - E2E browser tests for UI
   - ALL acceptance criteria must pass

✅ **Update progress file**
   - Append new session entry to claude-progress.txt
   - Include files changed, tests run, observations

✅ **Commit to git**
   ```bash
   git add .
   git commit -m "feat: [Feature Title] - All tests passing"
   ```

✅ **Mark feature complete**
   - Edit feature_list.json
   - Change ONLY `"passes": true` for completed feature
   - Do not modify any other fields

### DON'T (Forbidden Actions)

❌ **Never modify feature_list.json except passes field**
   - Cannot add features
   - Cannot remove features
   - Cannot change acceptance_criteria
   - Cannot change titles/descriptions

❌ **Never skip E2E testing**
   - Code that "looks right" is not tested
   - Must verify end-user experience
   - Must capture screenshots if UI changed

❌ **Never one-shot multiple features**
   - Even if features seem related
   - Even if "quick wins" are tempting
   - Incremental progress prevents context debt

❌ **Never declare completion prematurely**
   - Check feature_list.json: ALL features passes=true?
   - If NO: Continue working
   - Only declare complete when 100% verified

---

## Session End Checklist (MANDATORY)

Before ending session:

1. **Verify Feature Complete**
   ```javascript
   // All acceptance_criteria met?
   // Tests passing?
   // Git committed?
   ```

2. **Update Progress File**
   ```
   Session N - 2025-12-06 HH:MM
   Agent: [your-agent-name]
   Feature: [feature-id] - [feature-title]
   Status: completed
   Changes:
     - [list files modified]
   Git Commit: [commit-hash]
   Tests: passed
   Notes: [observations, any blockers for next session]
   ---
   ```

3. **Display Status**
   ```javascript
   const completed = features.filter(f => f.passes).length;
   const total = features.length;
   const percentage = Math.floor((completed / total) * 100);
   
   console.log(`✅ Feature ${featureId} complete`);
   console.log(`📊 Progress: ${completed}/${total} (${percentage}%)`);
   console.log(`⏭️  Next: ${nextFeature.id} - ${nextFeature.title}`);
   ```

4. **Commit Progress File**
   ```bash
   git add claude-progress.txt
   git commit -m "progress: Session N complete"
   git push
   ```

---

## Special Cases

### If Tests Fail

```javascript
// DO NOT mark feature as passes=true
// Add to progress file:
Status: blocked
Tests: failed
Blockers:
  - [specific error messages]
  - [what needs to be fixed]
Notes: Will retry in next session after fixes

// Commit what you have
git add .
git commit -m "wip: [Feature Title] - Tests failing, needs retry"
```

### If Feature Too Large

```javascript
// If feature takes >60 minutes:
// 1. Implement what you can
// 2. Update progress file with partial progress
// 3. DO NOT mark passes=true
// 4. Next session will continue same feature

Status: in-progress
Notes: Feature partially complete. Implemented [X, Y], still need [Z].
```

### If Context Window Nearly Full

```javascript
// Signs: Response getting slow, tokens warning
// Action:
// 1. Finish current feature if <10 min remaining
// 2. Otherwise: Save progress, mark in-progress, end session
// 3. Next session: Read progress, continue same feature
```

---

## Feature Categories & Agents

| Category | Recommended Agent | Testing Method |
|----------|-------------------|----------------|
| infrastructure | orchestrator | bash scripts, init.sh |
| backend | backend-agent | API tests, curl, Postman |
| ai-agent | orchestrator | Agent execution, logs |
| frontend | frontend-agent | Browser E2E, screenshots |
| testing | test-agent | Test suite execution |
| database | backend-agent | SQL queries, RLS tests |
| integration | orchestrator | OAuth flows, webhooks |
| monitoring | backend-agent | Metrics, dashboards |

---

## Quick Reference Commands

```bash
# Start session
pwd
git log --oneline -20
cat claude-progress.txt
cat feature_list.json | jq '.features[] | select(.passes==false) | .id, .title' -r

# During work
npm run dev          # Port 3008
npm test             # Run tests
npm run build        # Verify builds

# End session
git add .
git commit -m "feat: [Feature] - Tests passing"
git push

# Update progress
echo "Session N - $(date)" >> claude-progress.txt
# ... append session details
git add claude-progress.txt feature_list.json
git commit -m "progress: Session N complete"
git push
```

---

## Economic Impact Metrics

Based on Anthropic research analyzing 100,000 conversations:

| Metric | Without Pattern | With Pattern | Improvement |
|--------|-----------------|--------------|-------------|
| Task completion time | 8 hours | 1.5 hours | **80% faster** |
| First-attempt success | 72% | 94% | **+22%** |
| Rework rate | 35% | 6% | **-29%** |
| Code quality | 58/100 | 88/100 | **+30 points** |

**For Unite-Hub**: Potential 300-500% capacity increase with same agent team.

---

## Failure Mode Prevention

### One-Shotting (Premature Completion)
**Problem**: Agent thinks all work done after 50% complete
**Solution**: Check feature_list.json - ALL must be passes=true

### Skipping Tests
**Problem**: Feature marked complete without verification
**Solution**: Enforce test-before-commit, no exceptions

### Context Debt
**Problem**: Next session doesn't know what happened
**Solution**: Progress file maintains complete history

### Broken Environment
**Problem**: Build fails, dependencies missing
**Solution**: Run init.sh every session start

### Scope Creep
**Problem**: User requests "just one more feature" mid-session
**Solution**: Feature list is immutable - finish current workflow first

---

## Integration with Unite-Hub Architecture

This long-running pattern integrates with existing:

- **Orchestrator Agent** (`.claude/agent.md`) - Acts as Initializer
- **Email Agent** (`src/lib/agents/email-processor.ts`) - Execution mode
- **Content Agent** (`src/lib/agents/content-personalization.ts`) - Execution mode
- **CLAUDE.md** - Context file (load at session start)
- **Context Manifest** (`.claude/context-manifest.md`) - 76% token savings

---

## Success Criteria

Session is successful when:

✅ ONE feature completed and tested
✅ Git commit created with descriptive message
✅ Progress file updated
✅ Feature marked passes=true in feature_list.json
✅ Next feature identified for next session
✅ No blockers left for next agent

---

**Status**: Active - all future sessions follow this protocol
**Created**: 2025-12-06
**Source**: Anthropic Research "Effective Harnesses for Long-Running Agents"
