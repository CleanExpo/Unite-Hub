# Skill Health Check - Validation Rubric

> Reference data for MODE 4: Skill Health Check.
> Defines the criteria, scoring, and report format for validating skill quality.

---

## Validation Criteria

Each skill is evaluated against 10 criteria. Each criterion scores 0 (fail) or 1 (pass).

### 1. Frontmatter Completeness

**Weight**: Required

The SKILL.md must include valid YAML frontmatter with all required fields:

```yaml
---
name: skill-name            # Required: kebab-case identifier
description: >-             # Required: under 500 characters
  One-paragraph description.
license: MIT                # Required: licence type
metadata:
  author: NodeJS-Starter-V1 # Required: project identifier
  version: '1.0.0'          # Required: semver string
  locale: en-AU             # Required: must be en-AU
---
```

**Pass**: All 6 fields present with valid values.
**Fail**: Any field missing or `locale` is not `en-AU`.

### 2. When to Apply Section

**Weight**: Required

The SKILL.md must contain a `## When to Apply` section with:

- At least 3 positive triggers (when to activate)
- At least 1 negative trigger or boundary (when NOT to activate)

**Pass**: Section exists with ≥3 positive and ≥1 negative trigger.
**Fail**: Section missing or insufficient triggers.

### 3. Description Length

**Weight**: Required

The frontmatter `description` field must be:

- Minimum: 50 characters
- Maximum: 500 characters

**Pass**: Length within bounds.
**Fail**: Too short (vague) or too long (bloated — Shannon violation).

### 4. File Length

**Weight**: Required

The SKILL.md file must be:

- Maximum: 500 lines

Skills exceeding 500 lines should split content into `references/` files.

**Pass**: ≤500 lines.
**Fail**: >500 lines.

### 5. Australian English

**Weight**: Required

All content must use en-AU spelling. Check for these common violations:

| American (FAIL) | Australian (PASS) |
|-----------------|-------------------|
| analyze | analyse |
| behavior | behaviour |
| catalog | catalogue |
| center | centre |
| color | colour |
| customize | customise |
| defense | defence |
| favor | favour |
| license (verb) | licence (noun) |
| optimize | optimise |
| organize | organise |
| recognize | recognise |
| summarize | summarise |

**Pass**: No American English spellings detected.
**Fail**: One or more American spellings found.

### 6. No Duplicate Functionality

**Weight**: Required

The skill must not substantially overlap with an existing installed skill. Check:

- Trigger phrases do not match another skill >50%
- Core functionality is distinct from all installed skills
- If overlap exists, the skill must explicitly declare its differentiation

**Pass**: Distinct functionality or declared differentiation.
**Fail**: >50% overlap with existing skill without differentiation.

### 7. Declared Dependencies Satisfied

**Weight**: Required

If the skill references other skills as dependencies (via `requires` or in its text), those skills must either:

- Already be installed in `.skills/custom/` or `.skills/vercel-labs-agent-skills/`
- Be flagged as optional with a fallback described

**Pass**: All required dependencies installed or marked optional.
**Fail**: Missing required dependency.

### 8. Code Examples Present

**Weight**: Recommended

Skills with complexity ≥ Medium should include at least one code example demonstrating correct usage.

**Pass**: At least one fenced code block with a language hint.
**Fail**: No code examples in a Medium/High complexity skill.

### 9. Response Format Defined

**Weight**: Recommended

Skills that produce structured output should define their response format using the project convention:

```
[AGENT_ACTIVATED]: {agent_name}
[PHASE]: {current_phase}
[STATUS]: {status}
```

**Pass**: Response format section present or skill does not produce structured output.
**Fail**: Skill produces structured output but format is undefined.

### 10. References Integrity

**Weight**: Recommended

If the SKILL.md references files in `references/`, those files must exist.

**Pass**: All referenced files exist and are non-empty.
**Fail**: Broken reference path.

---

## Scoring

```
health_score = (passed_criteria / total_applicable_criteria) × 100
```

### Pass/Fail Threshold

| Score | Status | Action |
|-------|--------|--------|
| ≥ 80% | **PASS** | Skill is healthy and compliant |
| 60–79% | **WARNING** | Skill works but has quality issues |
| < 60% | **FAIL** | Skill needs remediation before use |

### Required vs Recommended

- **Required** criteria (1-7): Must all pass for a PASS status
- **Recommended** criteria (8-10): Missing these downgrades to WARNING at most

A skill can only achieve PASS if all 7 Required criteria pass.

---

## Health Report Format

```markdown
## Skill Health Report

**Skill**: `{skill-name}`
**Path**: `.skills/custom/{skill-name}/SKILL.md`
**Date**: {DD/MM/YYYY}
**Status**: {PASS | WARNING | FAIL}
**Score**: {score}%

### Criteria Results

| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Frontmatter Completeness | {PASS/FAIL} | {details} |
| 2 | When to Apply Section | {PASS/FAIL} | {details} |
| 3 | Description Length | {PASS/FAIL} | {chars} characters |
| 4 | File Length | {PASS/FAIL} | {lines} lines |
| 5 | Australian English | {PASS/FAIL} | {violations found} |
| 6 | No Duplicate Functionality | {PASS/FAIL} | {details} |
| 7 | Declared Dependencies | {PASS/FAIL} | {details} |
| 8 | Code Examples | {PASS/FAIL} | {count} examples |
| 9 | Response Format | {PASS/FAIL} | {details} |
| 10 | References Integrity | {PASS/FAIL} | {details} |

### Recommendations

{Bulleted list of specific improvements if status is WARNING or FAIL}
```
