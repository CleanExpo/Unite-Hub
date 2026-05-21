# Blueprint Frontmatter Schema

> Required YAML frontmatter fields for all blueprint files in `.claude/blueprints/{id}.blueprint.md`.
> Blueprints define DAGs for the `/minion` one-shot execution protocol.

---

## Required Fields

```yaml
---
name: {string}         # Blueprint ID (kebab-case, matches filename without .blueprint.md)
type: blueprint        # Always "blueprint"
version: {semver}      # e.g., "1.0.0"
toolshed: {string}     # Which toolshed to load (frontend|backend|database|security|infra|debug|test|general)
---
```

## Optional Fields

```yaml
description: {string}      # One-line description
iteration_caps:             # Override default iteration limits
  implement: 1             # Default: 1
  fix_ci: 2                # Default: 2
  fix_lint: 1              # Default: 1
  total: 3                 # Default: 3 (HARD CAP — never increase)
pr_template: {string}      # PR body template (markdown)
rollback_required: {bool}  # true for MIGRATE/DEPLOY blueprints
```

## Iteration Cap Rules

| Counter | Default Cap | Purpose |
|---------|------------|---------|
| `implement` | 1 | Feature/fix/migration/refactor passes |
| `fix_ci` | 2 | CI/test failure remediation |
| `fix_lint` | 1 | Non-auto-fixable lint remediation |
| `total` | **3** | All agentic iterations combined — **NEVER increase** |

When `total >= 3` → `BLUEPRINT_ESCALATION` → halt → human review.

## DAG Structure

After the frontmatter, blueprints define a directed acyclic graph:

```markdown
# {Blueprint Name} Blueprint

## DAG

```
[node_1: implement] → [node_2: lint] → [node_3: type-check] → [node_4: test] → [node_5: commit]
                                                                     ↓ (fail)
                                                               [fix_ci: 1 attempt]
```

## Node Definitions

### node_1: implement
Type: agentic (costs iteration)
Agent: {agent from toolshed}
Input: manifest.task_text
Output: changed files

### node_2: lint
Type: deterministic (no iteration cost)
Command: pnpm turbo run lint -- --fix
Auto-fix: true

[... continue for each node]
```

## PR Template Format

```markdown
## Summary
{bullet points}

## Changes
{file list}

## Test Plan
{checklist}

## Verification
- [ ] type-check passed
- [ ] lint passed
- [ ] tests passed

Blueprint: {name} v{version}
Toolshed: {toolshed}
Agentic iterations: {n}/3

🤖 Generated via /minion
```

## Blueprint Types

| Blueprint | Toolshed | Rollback Required |
|-----------|---------|-------------------|
| `feature` | frontend or backend | No |
| `bugfix` | debug | No |
| `migration` | database | **Yes** |
| `refactor` | general | No |

## Validation Checklist

Before adding a new blueprint:
- [ ] `name` matches filename (without `.blueprint.md`)
- [ ] `type` is `blueprint`
- [ ] `toolshed` exists in `toolsheds.json`
- [ ] `total` iteration cap is ≤ 3 (never exceed)
- [ ] DAG has no cycles (directed acyclic — enforce manually)
- [ ] All agentic nodes identified (cost iteration)
- [ ] All deterministic nodes identified (no iteration cost)
- [ ] PR template included
- [ ] VAULT-INDEX Blueprints table updated
- [ ] Run `/vault-init` to verify resolution

## Example (Minimal Valid)

```yaml
---
name: hotfix
type: blueprint
version: 1.0.0
toolshed: debug
---
```
