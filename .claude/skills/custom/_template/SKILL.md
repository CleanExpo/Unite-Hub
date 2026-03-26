---
name: skill-name                     # kebab-case, matches directory name
category: design|safety|reasoning|architecture|workflow|verification|backend|security
version: 1.0.0
priority: P1|P2|P3|P4
auto_load: true|false                # true only for P1
triggers:
  - specific_event_or_domain         # What causes this skill to activate
  - another_trigger
description: |
  [REQUIRED — This is what Claude reads to decide whether to apply the skill]

  Apply this skill for ANY [exhaustive list of scenarios where this applies].
  Trigger verbs: ANY, BEFORE, WHEN, AFTER.
  Be specific — vague descriptions cause missed triggers.
  End with: "[Priority context]. [Auto-load statement if P1]."
context: fork
---

# [Skill Display Name]

## The Default Being Overridden

[REQUIRED — Name the specific LLM defaults this skill replaces. Be concrete.]

Left unchecked, LLMs default to:
- [Specific bad default #1 — name the exact behavior, not a vague category]
- [Specific bad default #2]
- [Specific bad default #3]

This skill overrides those defaults with [one-sentence summary of replacement approach].

---

## ABSOLUTE RULES (Never Violate)

[REQUIRED — The non-negotiable rules. Use tables, code blocks, or numbered lists.]
[Rules that start with NEVER or ALWAYS are the highest-signal part of this skill.]

**NEVER:**
- [Specific banned action]

**ALWAYS:**
- [Specific required action]

---

## [Rule Category 1]

[REQUIRED — At least 2 substantive sections with concrete patterns/rules]

[Use code blocks for patterns that should be copied literally]
[Use tables for comparison information]
[Use numbered lists for sequences]
[Use prose for reasoning that requires explanation]

---

## [Rule Category 2]

[Reference materials go here — palettes, patterns, checklist items, command examples]

---

## References

[Optional — Point to related skills, agents, or files]
[e.g.: "See `references/color-system.md` for full token set."]
[e.g.: "This skill triggers `council-of-logic` when [condition]."]
