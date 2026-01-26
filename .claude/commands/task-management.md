# Task Management Commands (Beads)

**Status**: ✅ Active (Integrated 2026-01-27)
**Tool**: Beads v0.49.1
**Documentation**: `docs/BEADS_INTEGRATION_PLAN.md`

---

## Quick Reference

### Essential Commands

```bash
# View ready tasks (no blockers)
bd ready

# Create task
bd create "Task Title" -p 0 -d "Description"

# Create subtask
bd create "Subtask Title" -p 1 --parent Unite-Hub-abc

# Update task
bd update Unite-Hub-abc --status in_progress
bd update Unite-Hub-abc --status closed

# Show task details
bd show Unite-Hub-abc

# List all tasks
bd list

# Add dependency (task2 depends on task1)
bd dep add Unite-Hub-task2 Unite-Hub-task1

# JSON output for AI agents
bd ready --json
```

### Priority Levels

- **P0** - Critical (use `-p 0`)
- **P1** - High (use `-p 1`)
- **P2** - Medium (use `-p 2`, default)
- **P3** - Low (use `-p 3`)
- **P4** - Backlog (use `-p 4`)

### Task Types

- `task` (default) - Standard work item
- `feature` - New functionality
- `bug` - Bug fix
- `epic` - Large initiative with subtasks
- `chore` - Maintenance work

### Status Values

- `open` - Not started (default)
- `in_progress` - Currently working
- `closed` - Completed
- `blocked` - Waiting on dependencies

---

## Daily Workflow

### Morning Routine

```bash
# Check what's ready to work on
bd ready

# Start work on task
bd update Unite-Hub-abc --status in_progress
```

### During Development

```bash
# Add notes
bd update Unite-Hub-abc --append-notes "Implemented email failover logic"

# Update estimates
bd update Unite-Hub-abc --estimate 120  # 2 hours
```

### Task Completion

```bash
# Mark as complete
bd update Unite-Hub-abc --status closed

# Check next ready task
bd ready
```

---

## Multi-Agent Patterns

### Creating Agent-Assigned Tasks

```bash
# Orchestrator creates task graph
bd create "Email Campaign Analytics" -p 0 -t epic
bd create "Analytics Dashboard UI" -p 1 --parent Unite-Hub-abc -a frontend-specialist
bd create "Analytics API Routes" -p 1 --parent Unite-Hub-abc -a backend-specialist
bd create "Campaign Metrics Schema" -p 1 --parent Unite-Hub-abc -a backend-specialist

# Add dependencies
bd dep add Unite-Hub-dashboard Unite-Hub-api
bd dep add Unite-Hub-api Unite-Hub-schema
```

### Querying Agent Tasks

```bash
# Backend specialist checks assigned tasks
bd ready --json | jq '.[] | select(.assignee=="backend-specialist")'

# Frontend specialist views their work
bd list | grep frontend-specialist
```

---

## Hierarchy Examples

### Phase 8 Feature Development

```bash
# Create epic
bd create "Phase 8: Advanced Features" -p 0 -t epic

# Create features
bd create "Knowledge Graph System" -p 1 -t feature --parent Unite-Hub-phase8
bd create "Social Drip Campaign" -p 1 -t feature --parent Unite-Hub-phase8
bd create "Real-Time Monitoring" -p 1 -t feature --parent Unite-Hub-phase8

# Break down into tasks
bd create "Neo4j Integration" -p 1 --parent Unite-Hub-knowledge-graph
bd create "Entity Resolution Logic" -p 2 --parent Unite-Hub-knowledge-graph

# Set dependencies
bd dep add Unite-Hub-entity-resolution Unite-Hub-neo4j-integration

# View hierarchy
bd show Unite-Hub-phase8
```

### Bug Tracking

```bash
# Create bug with external reference
bd create "Auth Session Timeout" -p 0 -t bug --external-ref "gh-123"

# Add acceptance criteria
bd update Unite-Hub-bug --acceptance "Users remain logged in for 24 hours"

# Link to related task
bd dep add Unite-Hub-bug Unite-Hub-auth-refactor
```

---

## Integration with Git

### Commit Messages

```bash
# Reference Beads task in commits
git commit -m "fix(auth): resolve session timeout issue

Resolves Unite-Hub-abc

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Branch Naming

```bash
# Create feature branch from task title
bd show Unite-Hub-abc --json | jq -r '.title' | tr ' ' '-' | xargs -I {} git checkout -b feature/{}
```

---

## JSON Output for AI Agents

```bash
# Get ready tasks as JSON
bd ready --json

# Example output structure:
[
  {
    "id": "Unite-Hub-sd6",
    "title": "Evaluate Beads Integration",
    "description": "Test Beads integration...",
    "status": "open",
    "priority": 0,
    "issue_type": "task",
    "owner": "phill.mcgurk@gmail.com",
    "created_at": "2026-01-27T07:42:52Z",
    "updated_at": "2026-01-27T07:43:17Z"
  }
]

# Parse with jq
bd ready --json | jq '.[] | select(.priority < 2) | .title'
```

---

## Common Patterns

### Feature Development Workflow

```bash
# 1. Create feature epic
bd create "Email Templates System" -p 1 -t feature

# 2. Break into tasks
bd create "Design template schema" -p 1 --parent Unite-Hub-templates
bd create "Implement CRUD API" -p 1 --parent Unite-Hub-templates
bd create "Build UI editor" -p 1 --parent Unite-Hub-templates
bd create "Add E2E tests" -p 2 --parent Unite-Hub-templates

# 3. Set dependencies
bd dep add Unite-Hub-crud Unite-Hub-schema
bd dep add Unite-Hub-ui Unite-Hub-crud
bd dep add Unite-Hub-tests Unite-Hub-ui

# 4. Work on ready tasks
bd ready  # Shows only Unite-Hub-schema (no blockers)

# 5. As tasks complete, next becomes ready
bd update Unite-Hub-schema --status closed
bd ready  # Now shows Unite-Hub-crud
```

### Bug Triage Workflow

```bash
# Create bug
bd create "Email service fails silently" -p 0 -t bug

# Add investigation notes
bd update Unite-Hub-bug --notes "Occurs when SendGrid quota exceeded"

# Create fix task
bd create "Add email service failover" -p 0 --parent Unite-Hub-bug

# Link to related issue
bd dep add Unite-Hub-fix Unite-Hub-monitoring-task
```

---

## Advanced Features

### Defer Tasks

```bash
# Defer until specific date
bd update Unite-Hub-abc --defer "2026-02-01"

# Defer for 1 week
bd update Unite-Hub-abc --defer "+1w"

# Clear defer
bd update Unite-Hub-abc --defer ""
```

### Due Dates

```bash
# Set due date
bd update Unite-Hub-abc --due "next friday"

# Relative dates
bd update Unite-Hub-abc --due "+3d"

# Clear due date
bd update Unite-Hub-abc --due ""
```

### Labels

```bash
# Add labels
bd update Unite-Hub-abc --add-label frontend,urgent

# Set labels (replace all)
bd update Unite-Hub-abc --set-labels backend,database

# Remove label
bd update Unite-Hub-abc --remove-label urgent
```

---

## Troubleshooting

### Check System Health

```bash
bd doctor
```

### View All Issues (Including Closed)

```bash
bd list --all
```

### Find Task by Title

```bash
bd list | grep "Email"
```

### View Task History

```bash
bd show Unite-Hub-abc --history
```

---

## Resources

- **Beads Repository**: https://github.com/steveyegge/beads
- **Integration Plan**: `docs/BEADS_INTEGRATION_PLAN.md`
- **Issues Tracker**: https://github.com/steveyegge/beads/issues
- **Local Database**: `.beads/beads.db`
- **Task Prefix**: `Unite-Hub-*`

---

**Last Updated**: 2026-01-27
**Version**: Beads v0.49.1
**Status**: ✅ Active Integration
