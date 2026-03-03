# Skill Manager Command

Manage the project's skill ecosystem: analyse gaps, generate new skills, browse the catalogue, and validate health.

## Usage

```
/skill-manager [subcommand] [arguments]
```

## Subcommands

### analyse

Run a full gap analysis of the project's skill ecosystem.

```
/skill-manager analyse
```

**What it does**:

1. Scans all installed skills in `.skills/custom/` and `.skills/vercel-labs-agent-skills/`
2. Detects project context (CI/CD, Docker, API routes, database, AI integration)
3. Applies dependency, complementary-pair, and category-coverage rules
4. Scores and ranks gaps by priority

**Output**: Gap Analysis Report with Critical, Recommended, and Nice to Have classifications.

### generate

Generate a new skill from a catalogue template or free-form description.

```
/skill-manager generate {skill-name-or-description}
```

**Examples**:

```
/skill-manager generate api-contract
/skill-manager generate "webhook handling with signature verification"
/skill-manager generate 3.1                  # By catalogue number
```

**What it does**:

1. Resolves the template from the catalogue (or generates from scratch)
2. Produces a compliant SKILL.md with correct frontmatter and structure
3. Runs health check on the generated skill
4. Registers the skill in `.skills/AGENTS.md`

**Output**: Generated SKILL.md content + health check results + file paths.

### browse

Browse the built-in skill catalogue.

```
/skill-manager browse [filter]
```

**Examples**:

```
/skill-manager browse                        # Show all categories
/skill-manager browse api                    # Filter to API & Integration
/skill-manager browse --complexity=low       # Filter by complexity
/skill-manager browse --complements=council-of-logic  # Skills that pair with council-of-logic
```

**Output**: Filtered catalogue table from `references/catalog.md`.

### health

Validate skill quality and compliance.

```
/skill-manager health {skill-name | --all}
```

**Examples**:

```
/skill-manager health council-of-logic       # Check one skill
/skill-manager health skill-manager          # Self-check
/skill-manager health --all                  # Check all installed skills
```

**What it does**:

1. Loads the skill's SKILL.md
2. Evaluates against 10 criteria (frontmatter, triggers, en-AU, length, etc.)
3. Calculates health score (pass threshold: 80%)

**Output**: Health Report with per-criterion results and recommendations.

## Report Formats

### Gap Analysis Report

```
[AGENT_ACTIVATED]: Skill Manager
[PHASE]: Analysis
[STATUS]: complete

## Skill Gap Analysis Report
**Installed Skills**: {count}
**Gaps Identified**: {count}

### Critical Gaps (Score >= 75)
| Rank | Skill | Score | Reason |
...

### Recommended Gaps (Score 40-74)
...
```

### Health Report

```
[AGENT_ACTIVATED]: Skill Manager
[PHASE]: Health Check
[STATUS]: complete

## Skill Health Report
**Skill**: `{name}`
**Status**: {PASS | WARNING | FAIL}
**Score**: {score}%

### Criteria Results
| # | Criterion | Status | Notes |
...
```
