# Agent Frontmatter Schema

> Required YAML frontmatter fields for all agent files in `.claude/agents/{id}/agent.md`.
> Validate new agents against this schema before adding to VAULT-INDEX.

---

## Required Fields

```yaml
---
name: {string}        # Unique agent ID (kebab-case, matches directory name)
type: agent           # Always "agent"
role: {string}        # Human-readable role title
priority: {1|2|3|4}  # 1=Critical, 2=High, 3=Standard, 4=Specialist
version: {semver}     # e.g., "1.0.0"
---
```

## Optional Fields

```yaml
model: {sonnet|opus|haiku}   # Model override (default: sonnet)
tools:                        # Tool whitelist for this agent
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
inherits_from: {primer.md}   # Primer file to inherit from
skills_required:              # Skills that must be loaded before execution
  - path/to/skill.md
hooks_triggered:              # Hooks this agent fires
  - hook-name
```

## Priority Reference

| Priority | Label | Description |
|----------|-------|-------------|
| 1 | Critical | Auto-loads on every session. Always active. |
| 2 | High | Loads on relevant task classification. |
| 3 | Standard | Loads when orchestrator dispatches to this domain. |
| 4 | Specialist | Loads only on explicit request. |

## Body Structure

After the frontmatter, every agent file should include:

```markdown
# {Role} Agent

{One-paragraph purpose statement. What this agent does and what makes it distinct from similar agents.}

## Core Responsibilities

1. {Numbered list of primary responsibilities}

## {Domain-specific section — e.g., patterns, templates, protocols}

## Interaction with Other Agents

- Works with [[other-agent]] for {purpose}
- Escalates to [[orchestrator]] when {condition}

## Constraints

- {Hard rules this agent must follow}
- {What it must NOT do}
```

## Validation Checklist

Before adding a new agent:
- [ ] `name` matches the directory name exactly
- [ ] `type` is `agent`
- [ ] `role` is distinct from all existing agents (check VAULT-INDEX)
- [ ] `priority` assigned based on criticality
- [ ] `version` starts at `1.0.0`
- [ ] Agent purpose is distinct from existing agents (no duplicates)
- [ ] `[[wiki-link]]` added to `.claude/VAULT-INDEX.md` Agents table
- [ ] Run `/vault-init` to verify resolution

## Example (Minimal Valid)

```yaml
---
name: my-new-agent
type: agent
role: My New Agent
priority: 3
version: 1.0.0
---
```
