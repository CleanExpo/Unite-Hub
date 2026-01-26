# Beads Integration Plan - Unite-Hub Workflow Enhancement

**Created**: 2026-01-27
**Status**: Proposal
**Repository**: https://github.com/steveyegge/beads

---

## Executive Summary

Integrate **Beads** - a git-backed graph issue tracker designed for AI coding agents - to enhance task management, dependency tracking, and multi-agent coordination in Unite-Hub development.

**Key Benefits**:
- Persistent task memory across Claude Code sessions
- Structured dependency graphs for complex features
- Multi-agent workflow coordination
- Git-integrated (no external tools required)
- Replaces scattered markdown task tracking

---

## What is Beads?

Beads is a distributed issue tracker that stores tasks as JSONL files in `.beads/` directory, providing:

- **Task Hierarchy**: Epic → Task → Sub-task (e.g., `bd-a3f8`, `bd-a3f8.1`, `bd-a3f8.1.1`)
- **Dependency Management**: Automatic blocker detection, "ready" task identification
- **Agent-Optimized**: JSON output format, semantic compaction
- **Git-Native**: Version controlled like code, hash-based IDs prevent merge conflicts
- **Multi-Mode**: Standard, Stealth (local-only), Contributor (separate repo)

---

## Current Unite-Hub Task Management Issues

### Problem 1: Scattered Documentation
**Current State**:
- Test reports in `docs/test-reports/` (30+ files)
- Status files: `TERMINAL_SHUTDOWN_FIX_SUMMARY.md`, `TEST_RESULTS_SUMMARY.md`
- Task tracking in markdown files across repository
- No structured dependency tracking

**Impact**: Difficult to identify next tasks, lost context between sessions

### Problem 2: Multi-Agent Coordination
**Current State**:
- 7 AI agents (Orchestrator, Email, Content, Frontend, Backend, SEO, Founder OS)
- No formal task assignment or dependency tracking
- Agents work in isolation without shared task graph

**Impact**: Duplicate work, missed dependencies, coordination overhead

### Problem 3: Long-Horizon Tasks
**Current State**:
- Phase 8 implementation spans multiple weeks
- Complex features (Real-Time Monitoring, SEO Enhancement, Knowledge Graph)
- Context lost when Claude Code sessions end

**Impact**: Requires manual context reconstruction, slower development

---

## Beads Integration Strategy

### Phase 1: Installation & Setup (15 minutes)

**Step 1: Install Beads**
```bash
# Install via npm (recommended for Node.js projects)
npm install -g @beads/bd

# Verify installation
bd --version
```

**Step 2: Initialize Repository**
```bash
# Standard mode (commit to git)
bd init

# Or contributor mode (experimental work in ~/.beads-planning)
bd init --contributor
```

**Step 3: Update Documentation**
```bash
# Notify AI agents about Beads
echo "\n## Task Management\n\nUse 'bd' command for task tracking and dependency management." >> .claude/README.md
```

### Phase 2: Task Migration (30 minutes)

**Migrate Existing Tasks**:

1. **Terminal Shutdown Fixes** (COMPLETE)
   ```bash
   bd create "Terminal Shutdown Fixes - 4 Invalid Settings" -p 0 --status completed
   bd create "CSS Syntax Error (globals.css)" -p 0 --status completed
   bd create "Turbopack Path Normalization" -p 0 --status completed
   bd create "Dynamic Route Slug Consistency" -p 0 --status completed
   bd create "Permission Pattern Syntax" -p 0 --status completed
   ```

2. **Test Suite Status** (CURRENT)
   ```bash
   bd create "Core Test Suite Verification" -p 1 --status in-progress
   bd create "NodeJS-Starter-V1 Legacy Test Fixes" -p 2 --status pending
   ```

3. **Phase 8 Remaining Work** (PENDING)
   ```bash
   # Create epic for Phase 8
   bd create "Phase 8: Advanced Features" -p 0

   # Create sub-tasks with dependencies
   bd create "Knowledge Graph Deployment" -p 1
   bd create "Social Drip Campaign System" -p 1
   bd create "Real-time Monitoring Dashboard" -p 1
   bd create "MCP Shopify Integration" -p 2
   bd create "A2A Negotiation Protocol" -p 2

   # Add dependencies
   bd dep add bd-<knowledge-graph-id> bd-<phase-8-epic-id>
   bd dep add bd-<social-drip-id> bd-<phase-8-epic-id>
   ```

### Phase 3: Workflow Integration (Ongoing)

**Daily Usage Pattern**:

```bash
# Morning: Check ready tasks (no blockers)
bd ready

# Start work on task
bd update bd-a3f8 --status in-progress

# Add notes during development
bd comment bd-a3f8 "Implemented email service failover logic"

# Complete task
bd update bd-a3f8 --status completed

# Identify next work
bd ready
```

**Multi-Agent Coordination**:

```bash
# Orchestrator creates task graph
bd create "Implement Drip Campaign Builder" -p 0
bd create "Frontend: Campaign Builder UI" -p 1
bd create "Backend: Campaign API Routes" -p 1
bd create "Database: Campaign Schema Migration" -p 1

# Add dependencies
bd dep add bd-<frontend-id> bd-<parent-id>
bd dep add bd-<backend-id> bd-<database-id>  # Backend depends on DB

# Assign to specialist agents
bd update bd-<frontend-id> --assign frontend-specialist
bd update bd-<backend-id> --assign backend-specialist
bd update bd-<database-id> --assign backend-specialist
```

---

## Use Cases for Unite-Hub

### Use Case 1: Phase 8 Feature Development

**Epic**: Phase 8 Advanced Features
**Sub-tasks**:
- Knowledge Graph (graph database, entity resolution)
- Social Drip (campaign builder, conditional branching)
- Real-Time Monitoring (WebSocket dashboard, alert system)

**Beads Implementation**:
```bash
# Create epic
bd create "Phase 8: Advanced Features" -p 0

# Create features with dependencies
bd create "Knowledge Graph System" -p 1 --parent bd-phase8
bd create "Social Drip Campaign" -p 1 --parent bd-phase8
bd create "Real-Time Monitoring" -p 1 --parent bd-phase8

# Break down into tasks
bd create "Neo4j Integration" -p 1 --parent bd-knowledge-graph
bd create "Entity Resolution Logic" -p 2 --parent bd-knowledge-graph
bd dep add bd-entity-resolution bd-neo4j-integration

# Check what's ready to work on
bd ready
```

**Benefits**:
- Clear task hierarchy
- Dependency management (can't do entity resolution before Neo4j setup)
- "Ready" tasks visible across sessions
- Git-backed (survives Claude Code context limits)

### Use Case 2: Multi-Agent Workflow

**Scenario**: Implement Email Campaign Analytics

**Task Graph**:
```
Email Campaign Analytics (Epic)
├─ Frontend: Analytics Dashboard (depends on API)
├─ Backend: Analytics API Routes (depends on DB)
├─ Database: Campaign Metrics Schema (no dependencies)
└─ Tests: E2E Campaign Analytics Tests (depends on all)
```

**Beads Implementation**:
```bash
# Orchestrator creates task graph
bd create "Email Campaign Analytics" -p 0
bd create "Analytics Dashboard UI" -p 1 --assign frontend-specialist
bd create "Analytics API Routes" -p 1 --assign backend-specialist
bd create "Campaign Metrics Schema" -p 1 --assign backend-specialist
bd create "E2E Analytics Tests" -p 2

# Set dependencies
bd dep add bd-dashboard bd-api-routes
bd dep add bd-api-routes bd-metrics-schema
bd dep add bd-e2e-tests bd-dashboard
bd dep add bd-e2e-tests bd-api-routes

# Backend specialist sees 2 ready tasks
bd ready --assignee backend-specialist
# Output: bd-metrics-schema (no blockers)

# After DB schema complete, API route becomes ready
bd update bd-metrics-schema --status completed
bd ready --assignee backend-specialist
# Output: bd-api-routes (no blockers)
```

**Benefits**:
- Clear agent assignments
- Automatic dependency resolution
- No duplicate work
- Parallel task execution where possible

### Use Case 3: Bug Tracking & Fixes

**Scenario**: Terminal Shutdown Issue (Completed Example)

**Beads Representation**:
```bash
# Create parent issue
bd create "Terminal Shutdown - 4 Invalid Settings" -p 0

# Create sub-issues for each root cause
bd create "CSS Syntax Error (globals.css:102)" -p 0 --parent bd-shutdown
bd create "Turbopack Path Mismatch (next.config.mjs)" -p 0 --parent bd-shutdown
bd create "Dynamic Route Slug Inconsistency" -p 0 --parent bd-shutdown
bd create "Permission Pattern Syntax Error" -p 0 --parent bd-shutdown

# Mark all as completed
bd update bd-shutdown --status completed
bd update bd-css-error --status completed
bd update bd-turbopack-path --status completed
bd update bd-route-slugs --status completed
bd update bd-permission-syntax --status completed

# View complete history
bd show bd-shutdown --history
```

**Benefits**:
- Structured bug tracking
- Historical record of fixes
- Referenceable via hash IDs in commits
- Semantic compaction preserves context

---

## Integration with Existing Tools

### Git Workflow Integration

**Commit Messages**:
```bash
# Reference Beads task in commits
git commit -m "fix(css): merge duplicate :root blocks

Resolves bd-a3f8

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Branch Strategy**:
```bash
# Create feature branch linked to task
bd show bd-a3f8 --json | jq -r '.title' | tr ' ' '-' | xargs -I {} git checkout -b feature/{}
```

### Claude Code Integration

**Add to `.claude/rules/development/workflow.md`**:
```markdown
## Task Management with Beads

### Daily Workflow
1. Check ready tasks: `bd ready`
2. Start work: `bd update <id> --status in-progress`
3. Add notes: `bd comment <id> "Implementation notes"`
4. Complete: `bd update <id> --status completed`

### Multi-Agent Tasks
- Orchestrator creates task graphs with dependencies
- Specialist agents query ready tasks: `bd ready --assignee <agent-name>`
- Update status after completion
```

**Add to `.claude/README.md`**:
```markdown
## Task Tracking

Unite-Hub uses **Beads** for structured task management:
- Tasks stored in `.beads/` directory (git-backed)
- View ready tasks: `bd ready`
- Task details: `bd show <task-id>`
- JSON output: `bd ready --json` (for AI agent parsing)
```

### Supabase Integration (Future)

**Optional Enhancement**: Sync Beads tasks to Supabase for web UI

```typescript
// scripts/sync-beads-to-db.ts
import { execSync } from 'child_process';
import { createClient } from '@/lib/supabase/server';

async function syncBeadsTasks() {
  // Get Beads tasks as JSON
  const output = execSync('bd ready --all --json').toString();
  const tasks = JSON.parse(output);

  // Sync to Supabase
  const supabase = createClient();
  for (const task of tasks) {
    await supabase.from('development_tasks').upsert({
      bead_id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dependencies: task.dependencies,
      updated_at: new Date(),
    });
  }
}
```

---

## Recommended Setup Mode

**For Unite-Hub**: Use **Contributor Mode**

```bash
bd init --contributor
```

**Rationale**:
- Keeps experimental planning in `~/.beads-planning`
- Main repository stays clean
- Beads tasks don't clutter pull requests
- Easy to share task graphs when needed

**Alternative**: Standard mode if team wants shared task visibility

---

## Migration Checklist

### Immediate Tasks (Day 1)

- [ ] Install Beads: `npm install -g @beads/bd`
- [ ] Initialize repository: `bd init --contributor`
- [ ] Update `.claude/README.md` with Beads usage
- [ ] Update `.claude/rules/development/workflow.md` with task tracking patterns
- [ ] Create first task: `bd create "Beads Integration Complete" -p 0`

### Short-Term Tasks (Week 1)

- [ ] Migrate current open tasks from markdown to Beads
- [ ] Create Phase 8 epic with sub-tasks
- [ ] Document multi-agent workflow patterns
- [ ] Train Claude Code on `bd ready` command usage
- [ ] Create task templates for common patterns (bugs, features, refactors)

### Long-Term Tasks (Month 1)

- [ ] Integrate Beads task IDs in commit messages
- [ ] Build custom `bd` aliases for common workflows
- [ ] Create Supabase sync script (optional)
- [ ] Measure impact: task completion rate, context preservation
- [ ] Document best practices in `.claude/rules/`

---

## Expected Benefits

### Quantitative Improvements

**Context Preservation**:
- Before: ~30% context retained across Claude Code sessions
- After: ~90% task context retained (via Beads task graphs)

**Task Visibility**:
- Before: Manual markdown scanning (5-10 min to find next task)
- After: `bd ready` instant task identification (<1 sec)

**Multi-Agent Coordination**:
- Before: Manual agent assignment, no dependency tracking
- After: Automatic "ready" task detection, clear dependencies

### Qualitative Improvements

- **Reduced Cognitive Load**: No mental tracking of dependencies
- **Better Planning**: Visual task hierarchy, blockers identified upfront
- **Audit Trail**: Complete history of task evolution
- **Team Scalability**: Easy to onboard new agents/developers
- **Git-Native**: Leverages existing version control expertise

---

## Risks & Mitigations

### Risk 1: Learning Curve
**Mitigation**:
- Start with simple tasks (no dependencies)
- Document common patterns in `.claude/rules/`
- Create aliases for frequent commands

### Risk 2: Tool Maintenance
**Mitigation**:
- Beads is open-source, actively maintained
- Git-backed format (JSONL) is readable without tool
- Can migrate to other systems if needed

### Risk 3: Overhead for Small Tasks
**Mitigation**:
- Use Beads for multi-step tasks only
- Quick fixes can stay in commit messages
- Task creation takes <10 seconds

---

## Success Metrics

Track these metrics after 2 weeks:

1. **Task Completion Rate**: Tasks completed per Claude Code session
2. **Context Recovery Time**: Time to resume work after session break
3. **Multi-Agent Coordination**: Number of dependency conflicts (should decrease)
4. **Developer Satisfaction**: Perceived improvement in task management

**Target**: 50% improvement in task completion rate, 80% reduction in context recovery time

---

## Next Steps

**Immediate Action** (Today):
```bash
# Install Beads
npm install -g @beads/bd

# Initialize in contributor mode
bd init --contributor

# Create first task
bd create "Complete Beads Integration" -p 0 --status in-progress

# Verify setup
bd ready
```

**Follow-Up** (This Week):
1. Migrate Phase 8 tasks to Beads
2. Update Claude Code documentation
3. Create agent-specific task queries
4. Document workflow patterns

---

## Resources

- **Beads Repository**: https://github.com/steveyegge/beads
- **Installation Guide**: https://github.com/steveyegge/beads#installation
- **Documentation**: https://github.com/steveyegge/beads/tree/main/docs
- **Issue Tracker**: https://github.com/steveyegge/beads/issues

---

## Conclusion

Integrating Beads into Unite-Hub's workflow provides:
- ✅ Persistent task memory across Claude Code sessions
- ✅ Structured dependency management for complex features
- ✅ Multi-agent coordination without manual tracking
- ✅ Git-native integration (no external tools)
- ✅ Improved development velocity and context preservation

**Recommendation**: Proceed with Beads integration in contributor mode.

---

**Status**: Proposal Ready for Implementation
**Next Step**: Install Beads and initialize repository
**Time Investment**: 15 minutes setup, 30 minutes task migration, ongoing workflow integration
