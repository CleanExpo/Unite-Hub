# Automate Browser — Higher-Order Browser Command

> **Usage**: `/automate-browser [workflow-description] [--engine playwright|chrome]`

Wraps browser automation tasks with consistent pre/post steps including screenshot capture, result saving, and engine selection.

---

## Engine Selection

| Engine | Agent | Use Case |
|--------|-------|----------|
| `playwright` (default) | `playwright-browser` | Headless, CI-safe, parallel-capable |
| `chrome` | Claude Chrome tools | Personal browser, logged-in sessions |

---

## Execution Wrapper

Regardless of engine, every automation run follows this structure:

### Pre-Steps
1. Select engine (default: playwright)
2. Capture initial state (screenshot or snapshot)
3. Log start time and target URL

### User Workflow
Execute the described workflow steps.

### Post-Steps
1. Capture final state screenshot
2. Check for console errors
3. Save results to `ai-review/results/`
4. Report execution summary

---

## Usage Examples

### Headless (Playwright)

```
/automate-browser Navigate to localhost:3000, log in as admin, screenshot the dashboard
```

Uses the `playwright-browser` agent. Headless, no user browser needed.

### Personal Browser (Chrome)

```
/automate-browser --engine chrome Fill out the expense report form on the open tab
```

Uses Claude Chrome extension tools. Requires `--chrome` flag on Claude Code launch.

---

## Workflow Description

The workflow can be described in natural language:

```
/automate-browser Check that the login page loads, enter admin credentials, verify redirect to dashboard, and screenshot each step
```

The command will:
1. Parse the natural language into discrete browser steps
2. Execute each step with the selected engine
3. Screenshot between steps
4. Report pass/fail for each step

---

## Output

Results are saved to `ai-review/results/automate-{timestamp}.md` with:
- Engine used
- Steps executed
- Screenshots captured
- Errors encountered
- Execution duration
