# Agent Skills Reference Guide

**Last Updated**: 2025-11-28
**Source**: Anthropic Engineering Blog & Documentation

---

## What Are Agent Skills?

Skills are **folders containing instructions, scripts, and resources** that Claude can discover and load dynamically to perform better at specific tasks. They transform general-purpose agents into specialized agents.

Think of Skills as **onboarding guides for a new hire** - packaging procedural knowledge into composable, reusable resources.

---

## Anatomy of a Skill

### Required Structure

```
skill-name/
├── SKILL.md          # Required - core instructions
├── reference.md      # Optional - additional context
├── scripts/          # Optional - executable code
│   └── helper.py
└── assets/           # Optional - images, templates
```

### SKILL.md Format

```yaml
---
name: skill-name-lowercase
description: "Critical for triggering - tells Claude WHEN to use this skill"
license: Optional license info
---

# Skill Title

## Overview
What this skill does and when to use it.

## Instructions
Step-by-step procedures for execution.

## Examples
Concrete usage examples.

## Limitations
What this skill cannot do.
```

---

## Progressive Disclosure (Core Design Principle)

Skills load information in layers to keep context lean:

| Level | What Loads | When | Size |
|-------|-----------|------|------|
| 1 | Name + Description | Always (startup) | ~100 tokens |
| 2 | Full SKILL.md body | When triggered | <5k tokens |
| 3 | Additional files | Only as needed | Variable |

**Key Insight**: Context window is precious. Only load what's needed when it's needed.

---

## Writing Effective Descriptions

The description is **the most critical component** - it determines when Claude activates the skill.

### Weak Description
```
This skill helps with PDFs and documents.
```

### Strong Description
```
Comprehensive PDF manipulation toolkit for extracting text and tables,
creating new PDFs, merging/splitting documents, and handling forms.
When Claude needs to fill in a PDF form or programmatically process,
generate, or analyze PDF documents at scale. Use for document workflows
and batch operations. Not for simple PDF viewing or basic conversions.
```

### Description Components
1. **Specific capabilities** - action verbs (extract, create, merge)
2. **Clear triggers** - when to activate
3. **Use cases** - concrete scenarios
4. **Boundaries** - what it doesn't do

---

## Writing Instructions

### Structure Principles
- Use markdown headers for hierarchy
- Bullet points for options
- Code blocks for examples
- Clear inputs and outputs per phase

### Include
- Overview and prerequisites
- Execution steps
- Concrete examples (good/bad)
- Error handling
- Limitations

### Code in Skills
Skills can include executable code for:
- Operations better suited for deterministic code (sorting, calculations)
- Repeatable, consistent workflows
- Batch operations

---

## Skills vs Other Tools

| Tool | Provides | Persistence | Best For |
|------|----------|-------------|----------|
| **Skills** | Procedural knowledge | Across conversations | Specialized expertise |
| **Prompts** | Instructions | Single conversation | Quick requests |
| **Projects** | Background knowledge | Within project | Centralized context |
| **Subagents** | Task delegation | Across sessions | Specialized tasks |
| **MCP** | Tool connectivity | Always available | Data access |

### When to Use Skills
- Organizational workflows (brand guidelines, compliance)
- Domain expertise (Excel formulas, PDF manipulation)
- Personal/team preferences (coding patterns, research methods)
- **Signal**: You're typing the same prompt repeatedly

### Skills + Subagents
- Skills teach **how to do something** (portable expertise)
- Subagents **execute tasks independently** (isolated context + tools)
- Combine: Subagents can use Skills for specialized knowledge

### Skills + MCP
- MCP **connects** Claude to data sources
- Skills teach Claude **what to do** with that data
- Use together: MCP for connectivity, Skills for procedures

---

## Creating a Skill (5 Steps)

### 1. Understand Requirements
- What specific task does this solve?
- What triggers should activate it?
- What does success look like?
- What are edge cases?

### 2. Write the Name
- Lowercase with hyphens: `pdf-editor`, `brand-guidelines`
- Short and clear
- Descriptive of function

### 3. Write the Description
- From Claude's perspective
- Include triggers, capabilities, use cases
- Define boundaries
- Balance specificity and breadth

### 4. Write Instructions
- Structured and scannable
- Concrete examples
- Specify what it cannot do
- Reference additional files as needed

### 5. Test and Iterate
- **Triggering tests**: Does it activate correctly?
- **Functional tests**: Consistent outputs?
- **Edge cases**: Handle unusual inputs?
- **Out-of-scope**: Stay inactive for unrelated tasks?

---

## Best Practices

### Design
- Start with evaluation - identify real gaps first
- Single-purpose skills > broad generic skills
- Structure for scale - split large content into separate files
- Think from Claude's perspective

### Development
- Iterate with Claude - let Claude help improve skills
- Monitor usage - watch for unexpected behaviors
- Document changes in changelog
- Version your skills

### Security
- Only install skills from trusted sources
- Audit code and dependencies before use
- Review external network connections
- Check bundled resources

---

## Example Skills

### Brand Guidelines Skill
```yaml
---
name: brand-guidelines
description: "Applies company brand colors and typography to artifacts.
Use when brand colors, style guidelines, visual formatting, or company
design standards apply."
---

# Brand Styling

## Colors
- Primary: `#141413`
- Accent: `#d97757`
- Background: `#faf9f5`

## Typography
- Headings: Poppins (24pt+)
- Body: Lora
```

### Frontend Design Skill
```yaml
---
name: frontend-design
description: "Create distinctive, production-grade frontend interfaces.
Use when building web components, pages, or applications. Generates
creative, polished code avoiding generic AI aesthetics."
---

# Frontend Aesthetics

## Focus Areas
- Typography: Unique, interesting fonts (avoid Inter, Roboto)
- Color: Cohesive themes with sharp accents
- Motion: CSS animations, micro-interactions
- Backgrounds: Atmosphere and depth
```

---

## Unite-Hub Skills Structure

```
.claude/skills/
├── backend/        # API/database work
├── content-agent/  # Content generation
├── docs/           # Documentation updates
├── email-agent/    # Email processing
├── frontend/       # UI/route work
├── orchestrator/   # Workflow coordination
└── seo/            # SEO operations
```

Each skill should follow the Anthropic patterns above to ensure:
- Proper triggering based on task context
- Efficient context usage via progressive disclosure
- Clear execution with concrete examples
- Appropriate boundaries and limitations

---

**Reference**: [Anthropic Engineering Blog - Agent Skills](https://www.anthropic.com/engineering)
