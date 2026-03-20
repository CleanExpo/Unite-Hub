# Skill Frontmatter Schema

> Required YAML frontmatter fields for all skill files in `.skills/custom/{id}/SKILL.md`.
> Validate new skills against this schema before adding to SKILLS-INDEX.

---

## Required Fields

```yaml
---
name: {string}           # Unique skill ID (kebab-case, matches directory name)
type: skill              # Always "skill"
version: {semver}        # e.g., "1.0.0"
priority: {1|2|3|4}     # 1=Critical, 2=High, 3=Standard, 4=Optional
domain: {string}         # Domain category (backend, frontend, database, security, etc.)
---
```

## Optional Fields

```yaml
description: {string}    # One-line description for SKILLS-INDEX
requires:                 # Skills that must load before this one
  - skill-id
auto_load: {boolean}     # true = loads on every response (P1 only)
toolsheds:               # Which toolsheds include this skill
  - frontend
  - backend
```

## Priority Reference

| Priority | Label | Load Trigger |
|----------|-------|-------------|
| 1 | Critical | Auto-loads via `pre-response.hook` — always active |
| 2 | High | Orchestrator loads based on task domain classification |
| 3 | Standard | Agent loads from toolshed when dispatched to domain |
| 4 | Optional | Explicit request or skill-manager recommendation only |

## Body Structure

After the frontmatter, every skill file should use **progressive disclosure**:

```markdown
# {Skill Name}

{One-paragraph summary of what this skill provides.}

## Quick Reference

{The most commonly needed patterns — concise, scannable.}

## Patterns

### Pattern 1: {name}
{Implementation pattern with code example}

### Pattern 2: {name}
{Implementation pattern with code example}

## Anti-Patterns

{What NOT to do and why.}

## Australian Context

{Any AU-specific considerations — Privacy Act, WCAG, en-AU conventions.}
```

## Loading Rules

1. **Load only relevant sections** — never dump the full SKILL.md into context
2. **Dependencies auto-load** via `post-skill-load.hook` when `requires:` is set
3. **Toolshed max**: 5–6 skills per agent (enforced via `toolsheds.json`)
4. **P1 skills** must have `auto_load: true` in frontmatter

## Validation Checklist

Before adding a new skill:
- [ ] `name` matches the directory name exactly
- [ ] `type` is `skill`
- [ ] `priority` reflects actual usage frequency
- [ ] `domain` matches an existing toolshed domain
- [ ] Skill purpose is distinct from existing skills
- [ ] Added to `.claude/skills/SKILLS-INDEX.md` at correct priority level
- [ ] Added to relevant toolshed(s) in `.claude/data/toolsheds.json` (if applicable)
- [ ] Run `/vault-init` to verify VAULT-INDEX resolution

## Example (Minimal Valid)

```yaml
---
name: my-new-skill
type: skill
version: 1.0.0
priority: 3
domain: backend
---
```
