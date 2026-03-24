---
paths: skills/**/*.md
---

# Skills and Agent Orchestration Rules

## Skill System

Skills define agent behaviors with YAML frontmatter + Markdown:

```markdown
---
name: skill-name
version: 1.0.0
description: What this skill teaches agents to do
priority: 1-10  # Lower = higher priority
triggers:
  - keyword1
  - keyword2
requires:
  - core/VERIFICATION.md
---

# Skill Content
```

## Priority System

| Priority | Usage | Example |
|----------|-------|---------|
| 1 | Core orchestration | `ORCHESTRATOR.md` |
| 2 | Critical patterns | `VERIFICATION.md` |
| 3 | Domain-specific | `FASTAPI.md`, `NEXTJS.md` |
| 4-5 | Optional guidance | `CODING-STANDARDS.md` |

## Task Routing

```yaml
# Frontend tasks → frontend/*.md
triggers: [react, component, ui, tailwind, nextjs]

# Backend tasks → backend/*.md
triggers: [api, agent, supabase, server-action]

# Database tasks → database/*.md
triggers: [migration, supabase, database, sql]
```

## Key Skills

- **Orchestrator** (`ORCHESTRATOR.md`): Routes all tasks
- **Verification** (`core/VERIFICATION.md`): Verification-first approach
- **Long Running** (`backend/LONG-RUNNING-AGENTS.md`): Multi-session agents
- **Tool Use** (`backend/ADVANCED-TOOL-USE.md`): Tool calling patterns

## Skills Index

All available skills are indexed in `.claude/skills/SKILLS-INDEX.md`.
Before creating a new skill, check the index to avoid duplication.

## Skill Versioning & Deprecation Protocol

```yaml
# In skill frontmatter:
version: 1.0.0           # Increment MINOR for additions, MAJOR for breaking changes
deprecated: false         # Set true when superseded
superseded_by: null       # Point to replacement skill name
```

**Deprecation steps**:
1. Set `deprecated: true` and `superseded_by: new-skill-name` in frontmatter
2. Add deprecation notice at top of skill body: `> ⚠️ DEPRECATED — use [new-skill-name] instead.`
3. Update SKILLS-INDEX.md to move entry to Deprecated section
4. Keep deprecated skill for 2 milestones before deletion (transition period)

## Critical Rules

- Always require `core/VERIFICATION.md`
- Use specific triggers, avoid generic ones
- Include verification criteria in all skills
- Chain dependencies correctly
- Check SKILLS-INDEX before creating new skills (avoid duplicates)
