# Beads - AI Agent Memory System

> **Persistent, git-backed issue tracking for AI coding agents**

## Overview

Beads (`bd`) is a distributed issue tracker designed specifically for AI agents. It provides **persistent, structured memory** that survives across sessions, replacing ephemeral task lists with a dependency-aware graph system stored in git.

**Repository**: https://github.com/steveyegge/beads

## Why Beads?

### The Problem

Traditional AI coding sessions suffer from:
- **Context loss** - Tasks forgotten between sessions
- **No dependency tracking** - What's ready to work on?
- **Merge conflicts** - Multiple developers/agents clash
- **No audit trail** - What was done and why?

### The Solution

Beads solves this with:

| Feature | Benefit |
|---------|---------|
| **Git-Native Storage** | Issues stored as JSONL in `.beads/` - versioned, mergeable |
| **Collision-Free IDs** | Hash-based IDs (`bd-a1b2`) prevent merge conflicts |
| **Dependency Graph** | `bd ready` shows only unblocked, actionable tasks |
| **Hierarchical Structure** | Epic → Task → Subtask (`bd-a3f8.1.1`) |
| **JSON Output** | `--json` flag for programmatic AI parsing |
| **Session Protocol** | "Land the Plane" ensures work is always pushed |

## Installation

The Beads CLI is installed locally in this project:

```bash
# Location
.bin/bd.exe           # Windows binary

# Verify installation
.bin/bd.exe --version
# bd version 0.49.1
```

### Global Installation (Optional)

```bash
# npm (recommended)
npm install -g @beads/bd

# Go
go install github.com/steveyegge/beads/cmd/bd@latest

# macOS
brew install beads
```

## Quick Start

### Essential Commands

```bash
# View ready tasks (unblocked)
bd ready

# Create a new task
bd create "Implement user authentication" -p 0 --description "Add JWT-based auth"

# Create subtask (hierarchical)
bd create "Create login endpoint" --parent bd-abc1

# Add dependency (A blocks B)
bd dep add bd-def2 bd-abc1

# Update status
bd update bd-abc1 --status in_progress

# Close task
bd close bd-abc1 --reason "Completed and tested"

# View task details
bd show bd-abc1

# Sync to git
bd sync
```

### Priority Levels

| Priority | Usage |
|----------|-------|
| `-p 0` | Critical / Blocking |
| `-p 1` | High priority |
| `-p 2` | Normal (default) |
| `-p 3` | Low priority |

### Status Values

- `open` - Not started
- `in_progress` - Currently working
- `blocked` - Waiting on dependency
- `closed` - Complete

## Agent Workflow

### Session Start

```bash
# Check what's ready to work on
bd ready --json

# Pick a task and start
bd update bd-abc1 --status in_progress
```

### During Work

```bash
# Create subtasks as needed
bd create "Write unit tests" --parent bd-abc1

# Track blockers
bd dep add bd-new1 bd-external
```

### Session End ("Land the Plane")

**CRITICAL**: Always complete these steps before ending:

```bash
# 1. File remaining work as issues
bd create "TODO: Finish error handling" -p 2

# 2. Update task statuses
bd update bd-abc1 --status in_progress
bd close bd-def2 --reason "Completed"

# 3. Sync and push
git pull --rebase
bd sync
git push

# 4. Verify clean state
git status  # Should be "up to date with origin/main"
```

**Rule**: Work is NOT complete until `git push` succeeds. Never end a session with local-only changes.

## Hierarchical Structure

Tasks support nested organisation:

```
bd-a3f8          # Epic: User Authentication
├── bd-a3f8.1    # Task: Login system
│   ├── bd-a3f8.1.1  # Subtask: Login endpoint
│   └── bd-a3f8.1.2  # Subtask: Token refresh
└── bd-a3f8.2    # Task: Logout system
```

Create hierarchical tasks:

```bash
bd create "User Authentication" -p 0        # Creates bd-a3f8
bd create "Login system" --parent bd-a3f8   # Creates bd-a3f8.1
bd create "Login endpoint" --parent bd-a3f8.1  # Creates bd-a3f8.1.1
```

## Workflow Modes

### Standard Mode (Default)

```bash
bd init
```

Issues committed to main branch alongside code.

### Stealth Mode

```bash
bd init --stealth
```

Track tasks locally without committing to the repo. Useful for personal task tracking on shared projects.

### Contributor Mode

```bash
bd init --contributor
```

Route planning to a separate repository. Keeps experimental work isolated from pull requests.

## Configuration

### View Config

```bash
bd config list
```

### Common Settings

```bash
# Set default priority
bd config set default_priority 1

# Enable auto-sync
bd config set auto_sync true

# Set sync debounce (seconds)
bd config set sync_debounce_secs 30
```

## Integration with Project Workflow

### With GENESIS Protocol

Beads integrates with the project's phase-based development:

```bash
# Phase planning
bd create "Phase 3: Authentication System" -p 0

# Section breakdown
bd create "SECTION_A: JWT Configuration" --parent bd-phase3
bd create "SECTION_B: Database Auth Layer" --parent bd-phase3
bd create "SECTION_C: API Routes" --parent bd-phase3
```

### With Council of Logic

Before creating implementation tasks:

```bash
bd create "Optimise user lookup" -p 1 --description "
Turing: Target O(log n) with hash index
Von Neumann: Async query pattern
Shannon: Compress user payload
"
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `bd ready` | Show unblocked tasks |
| `bd list` | Show all open tasks |
| `bd create "title"` | Create new task |
| `bd show <id>` | View task details |
| `bd update <id>` | Modify task |
| `bd close <id>` | Close task |
| `bd dep add <child> <parent>` | Add dependency |
| `bd dep rm <child> <parent>` | Remove dependency |
| `bd sync` | Force sync to git |
| `bd doctor` | Health check |

### JSON Output

For programmatic use (AI agents):

```bash
bd ready --json
bd list --json
bd show bd-abc1 --json
```

## Troubleshooting

### Sync Issues

```bash
# Force sync
bd sync

# Check health
bd doctor

# Fix issues
bd doctor --fix
```

### Merge Conflicts

Beads' hash-based IDs make conflicts rare. If they occur:

```bash
# Accept incoming changes
git checkout --theirs .beads/issues.jsonl

# Re-import
bd import
```

### Daemon Issues

```bash
# Check daemon status
bd daemon status

# Restart daemon
bd daemon restart

# Run without daemon (worktrees)
bd --no-daemon <command>
```

## File Structure

```
.beads/
├── beads.db           # SQLite database (primary)
├── issues.jsonl       # JSONL export (git-tracked)
└── config.toml        # Local configuration

AGENTS.md              # Agent workflow instructions
```

## Best Practices

1. **Always use `bd ready`** - Focus on actionable tasks
2. **Add descriptions** - Future sessions need context
3. **Use dependencies** - Prevent working on blocked tasks
4. **Hierarchical breakdown** - Epic → Task → Subtask
5. **Sync frequently** - `bd sync` after significant changes
6. **Land the Plane** - Always push before session end

## Resources

- [GitHub Repository](https://github.com/steveyegge/beads)
- [CLI Reference](https://github.com/steveyegge/beads/blob/main/docs/CLI_REFERENCE.md)
- [Agent Workflow](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md)
- [Claude Integration](https://github.com/steveyegge/beads/blob/main/docs/CLAUDE.md)

---

**Beads provides the memory layer AI agents need for long-horizon development work.**
