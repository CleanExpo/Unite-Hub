# UI Review — Parallel User Story Validation

> **Usage**: `/ui-review [init|run|report] [--parallel N]`

Orchestrates browser-based QA by reading user stories from `ai-review/stories/` and executing them via the `browser-qa` agent.

---

## Subcommands

### `/ui-review init`

Creates the `ai-review/` directory structure if it doesn't exist:

```
ai-review/
  README.md
  stories/
    _template.md
    .gitkeep
  results/
    .gitkeep
  screenshots/
    .gitkeep
```

Also creates a sample story from `_template.md` to get started.

### `/ui-review run [--parallel N]`

1. **Discover stories**: Glob `ai-review/stories/*.md` (exclude `_template.md`)
2. **Validate prerequisites**: Check that the target URLs are reachable
3. **Spawn agents**: For each story, launch a `browser-qa` agent
   - Default: sequential (1 at a time)
   - `--parallel N`: Run N stories concurrently
4. **Collect results**: Each agent writes to `ai-review/results/{story-name}-report.md`
5. **Summary**: Output aggregate pass/fail count

### `/ui-review report`

Reads all files in `ai-review/results/` and generates a summary:

```markdown
## UI Review Summary

**Date**: DD/MM/YYYY
**Stories**: X total | Y passed | Z failed

### Results

| Story | Priority | Status | Steps |
|-------|----------|--------|-------|
| Login Flow | critical | PASS | 5/5 |
| Dashboard Load | high | FAIL | 3/4 |

### Failed Stories
- **Dashboard Load**: Step 4 failed — expected chart to render within 3s

### Screenshots
All evidence in `ai-review/screenshots/`
```

---

## Workflow Example

```bash
# 1. Initialise (first time)
/ui-review init

# 2. Write stories in ai-review/stories/
#    Use _template.md as a starting point

# 3. Run all stories
/ui-review run

# 4. Run with parallelism
/ui-review run --parallel 3

# 5. Generate summary
/ui-review report
```

---

## Story File Format

See `ai-review/stories/_template.md` for the canonical format. Each story must have:

- **Frontmatter**: `name`, `url`, `priority`
- **Preconditions**: What must be true before running
- **Steps**: Numbered list of browser actions
- **Expected**: Bullet list of assertions

---

## Agent Configuration

The command uses the `browser-qa` agent (`.claude/agents/browser-qa/agent.md`) which:
- Loads the `playwright-browser` skill
- Runs in headless mode
- Captures screenshots at every step
- Produces structured markdown reports

---

## Output Locations

| Artefact | Location |
|----------|----------|
| Story definitions | `ai-review/stories/` |
| Test reports | `ai-review/results/` |
| Screenshots | `ai-review/screenshots/` |
| Playwright HTML report | `playwright-report/` |
