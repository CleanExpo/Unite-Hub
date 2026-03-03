---
name: notebooklm-second-brain
description: 'Notebook First retrieval policy — query NotebookLM notebooks before web search or context dumping'
version: 1.0.0
locale: en-AU
category: meta-orchestration
tags:
  - retrieval
  - knowledge-management
  - notebooklm
  - second-brain
triggers:
  - onboarding
  - debugging
  - architecture
  - security
  - post-build
---

# NotebookLM Second Brain

> **Policy**: Query the relevant NotebookLM notebook **before** web search or dumping full docs into context.

## Description

This skill enforces a "Notebook First" retrieval policy. Instead of loading entire markdown files or running web searches for architecture decisions, debugging patterns, or security knowledge, the agent queries purpose-built NotebookLM notebooks via the `nlm` CLI. This keeps the agent context window lean and retrieval fast.

## When to Apply

| Scenario                      | Notebook            | Why                                    |
| ----------------------------- | ------------------- | -------------------------------------- |
| "How does auth work?"         | `project_sot`       | Architecture decisions live here       |
| "Why is this test failing?"   | `debug_kb`          | Error patterns and debugging playbooks |
| "Is this input sanitised?"    | `security_handbook` | OWASP patterns and security reviews    |
| "Explain the codebase"        | `repo_onboarding`   | Codebase atlas and mind maps           |
| After successful build/verify | `project_sot`       | Auto-sync implementation notes         |

## Core Directives

### 1. Notebook ID Location

All notebook IDs are stored in `.claude/notebooklm/notebooks.json`. Never hard-code or fabricate IDs.

```bash
# Read current notebook config
cat .claude/notebooklm/notebooks.json
```

### 2. Notebook Routing

| Query Type                                          | Target Notebook     | Fallback                   |
| --------------------------------------------------- | ------------------- | -------------------------- |
| Architecture, feature specs, implementation history | `project_sot`       | Read CLAUDE.md directly    |
| Error patterns, test failures, debugging steps      | `debug_kb`          | Search codebase with grep  |
| OWASP, auth patterns, security reviews              | `security_handbook` | Web search security docs   |
| "How does X work?", codebase overview, onboarding   | `repo_onboarding`   | Read source files directly |

### 3. CLI Command Reference

```bash
# Authentication
nlm login                              # Browser cookie extraction (one-time)
nlm login --check                      # Verify auth status

# Notebook management
nlm notebook list                      # List all notebooks
nlm notebook create "Name"             # Create new notebook
nlm notebook query <notebook_id>       # Interactive query

# Source management
nlm source add <notebook_id> --file <path>    # Add file source
nlm source add <notebook_id> --url <url>      # Add URL source
nlm source add <notebook_id> --text "content" # Add text source
nlm source list <notebook_id>                 # List sources

# Notes and audio
nlm note create <notebook_id> "Title"         # Create note
nlm audio create <notebook_id> --confirm      # Generate audio overview
```

### 4. Deterministic Routine

When setting up a new notebook:

1. **Create** — `nlm notebook create "Name"`
2. **Add sources** — Upload relevant files and URLs
3. **Query** — Verify the notebook returns useful answers
4. **Export** — Save notebook ID to `notebooks.json`

### 5. Post-Build Sync

After successful `pnpm run verify` or `pnpm build`, the sync hook (`.claude/hooks/scripts/notebooklm-sync.ps1`) automatically creates an implementation note in `project_sot` with:

- Commit message and hash
- Changed files list
- Test results summary
- Detected TODO items

## Anti-Patterns

- **Never fabricate notebook IDs** — only use IDs from `notebooks.json` (populated by `/notebooklm-bootstrap`)
- **Never dump full docs into context** when a notebook query would suffice
- **Never skip the notebook** and go straight to web search for project-specific knowledge
- **Never hard-code notebook IDs** in scripts or commands — always read from config

## Integration Points

| System               | Integration                                            |
| -------------------- | ------------------------------------------------------ |
| **Beads**            | Sync completed Beads tasks as implementation notes     |
| **Council of Logic** | Architecture queries route through `project_sot` first |
| **Hooks**            | Post-verify sync hook adds notes automatically         |
| **Skills**           | Other skills can query notebooks for domain knowledge  |

## Setup

Run the bootstrap command to install, authenticate, and create all notebooks:

```bash
/notebooklm-bootstrap
```

This installs `notebooklm-mcp-cli`, authenticates via browser, creates the 4 notebooks, seeds them with project sources, and writes IDs to `notebooks.json`.

## Validation

```bash
python scripts/validate-notebooks.py              # Schema validation
python scripts/validate-notebooks.py --check-ids   # Verify IDs populated
python scripts/validate-notebooks.py --dry-run-sync # Preview sync note
```
