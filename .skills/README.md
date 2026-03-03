# Skills - NodeJS-Starter-V1

Agent skills that extend AI coding assistant capabilities for this project.

## What Are Skills?

Skills are packaged instructions and scripts that extend AI agent capabilities. They provide:

- **Domain-specific knowledge** (design systems, algorithms, workflows)
- **Automated enforcement** (style guidelines, performance rules)
- **Contextual activation** (trigger on relevant phrases)

## Directory Structure

```
.skills/
├── AGENTS.md                       # Skills registry for AI agents
├── README.md                       # This file
├── vercel-labs-agent-skills/       # Vercel's official skills
│   └── skills/
│       ├── react-best-practices/   # React/Next.js optimisation
│       └── web-design-guidelines/  # Accessibility & UX
└── custom/                         # Project-specific skills
    ├── genesis-orchestrator/       # Phase-locked workflow
    ├── council-of-logic/           # Mathematical validation
    └── scientific-luxury/          # Design system enforcement
```

## Available Skills

### Vercel Labs Skills

| Skill                     | Purpose                                |
| ------------------------- | -------------------------------------- |
| `react-best-practices`    | 57 performance rules for React/Next.js |
| `web-design-guidelines`   | 100+ accessibility and UX rules        |
| `vercel-deploy-claimable` | One-command Vercel deployment          |

### Custom Skills

| Skill                  | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `genesis-orchestrator` | Autonomous phase-locked project execution      |
| `council-of-logic`     | O(n) enforcement, physics-based animations     |
| `scientific-luxury`    | OLED black, spectral colours, timeline layouts |

## Usage

Skills activate automatically based on conversation context:

- "Build a new feature" → `genesis-orchestrator`
- "Optimise this algorithm" → `council-of-logic`
- "Create a component" → `scientific-luxury`
- "Review React performance" → `react-best-practices`

## Installation for Claude Code

```bash
# Install Vercel skills globally
cp -r .skills/vercel-labs-agent-skills/skills/* ~/.claude/skills/

# Install custom skills globally
cp -r .skills/custom/* ~/.claude/skills/
```

## Creating Custom Skills

1. Create directory: `.skills/custom/{skill-name}/`
2. Add `SKILL.md` with frontmatter:

```yaml
---
name: skill-name
description: When to use this skill. Include trigger phrases.
license: MIT
metadata:
  author: your-name
  version: '1.0.0'
---
```

3. Write skill instructions in markdown
4. Optionally add `scripts/` and `references/` directories

## Best Practices

- **Keep SKILL.md under 500 lines** - put reference material in separate files
- **Write specific descriptions** - helps agents know when to activate
- **Use progressive disclosure** - reference supporting files as needed
- **Prefer scripts over inline code** - script execution doesn't consume context

## Related Documentation

- [Vercel Skills Docs](https://skills.sh)
- [Agent Skills Repository](https://github.com/vercel-labs/agent-skills)
- [Claude Code Skills Guide](https://docs.anthropic.com/claude-code)
