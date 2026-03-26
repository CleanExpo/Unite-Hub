---
name: agent-name                     # kebab-case, matches directory name
type: agent
role: [Role Title]                   # Short noun phrase: "Primary Code Builder", not "Builds code"
priority: 1-5                        # 1 = highest (always consulted), 5 = specialist on-demand
version: 1.0.0
model: sonnet|opus|haiku             # sonnet default; opus for complex reasoning; haiku for fast/cheap
tools:
  - Read
  - Write                            # Remove if agent is read-only (e.g., verification, review)
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent                            # Add only if this agent spawns subagents
blocking: false                      # true = no other agent proceeds until this one passes
skills_required:
  - skill-name                       # Skills to load when this agent activates
context: fork
---

# [Agent Display Name]

## Defaults This Agent Overrides

[REQUIRED — Name the specific LLM defaults this agent suppresses. Be explicit.]

Left unchecked, LLMs default to:
- [Specific bad behavior #1 that this agent prevents]
- [Specific bad behavior #2]
- [Specific bad behavior #3]

This agent overrides those defaults with [one-sentence summary of what this agent does instead].

---

## ABSOLUTE RULES

[REQUIRED — Non-negotiable constraints specific to this agent's domain]

**NEVER:**
- [Action this agent must never take]

**ALWAYS:**
- [Action this agent must always take]

---

## [Domain Section 1: Core Patterns]

[The main content of the agent — the patterns, rules, and reference material it uses]

[Use code blocks for patterns that should be used literally]
[Use tables for configuration, tokens, comparisons]
[Use numbered lists for sequences]

---

## [Domain Section 2: Reference Patterns]

[Secondary patterns, edge cases, non-obvious rules]

---

## Verification Gate

[REQUIRED for implementing agents — What this agent must verify before reporting complete]

Before reporting complete:
- [ ] [Specific check #1]
- [ ] [Specific check #2]

Route to `verification` agent for independent Tier [A/B/C/D] verification.

---

## This Agent Does NOT

[Optional — clarify scope boundaries to prevent agents from overstepping]

- [Thing outside this agent's scope]
- [Another thing this agent hands off to another agent]
