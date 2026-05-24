# /minion — One-Shot Task Execution Command

> Implements a task from natural language description to PR, with zero mid-flight interaction.
> Inspired by Stripe's Minions system: hybrid Blueprint DAGs with hard iteration caps.

## Usage

```
/minion <task description>
```

**Examples:**

```
/minion "add rate limiting to the /api/auth/login endpoint"
/minion "fix the null pointer error in the user profile component"
/minion "migrate the contractors table to use UUID primary keys"
/minion "refactor the auth middleware to use a shared validation helper"
```

## Execution Protocol (Ordered — No Deviation)

### Step 1 — Pre-Hydration (Deterministic)

Run the pre-hydration pipeline to build a context manifest:

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/hooks/scripts/pre-hydration.ps1" -TaskText "$ARGUMENTS"
```

Parse the JSON manifest. Read ALL files listed in `manifest.always` and `manifest.domain`. These are the ONLY files you may read during this invocation. No additional file reads permitted.

Print the manifest to confirm context loaded:

```
MINION CONTEXT LOADED
task_id: {manifest.task_id}
blueprint: {manifest.blueprint}
toolshed: {manifest.toolshed}
files loaded: {count of files read}
```

### Step 2 — Initialise Iteration Counter

Create `.claude/data/minion-state.json`:

```json
{
  "active": true,
  "task_id": "{manifest.task_id}",
  "created": "{DD/MM/YYYY HH:MM} AEST",
  "iterations": {
    "total": 0,
    "implement": 0,
    "fix_ci": 0,
    "fix_lint": 0
  }
}
```

### Step 3 — Blueprint Selection

Read `.claude/blueprints/{manifest.blueprint}.blueprint.md`. This defines the DAG to execute.

### Step 4 — Toolshed Load

Read `.claude/data/toolsheds.json`, extract `toolsheds[manifest.toolshed].skills`. Load only those skills (max 5–6). All 57 other skills are unavailable in this invocation.

### Step 5 — Blueprint DAG Execution

Execute the DAG defined in the blueprint file. For every agentic node:

1. Increment `iterations.total` and `iterations.{node_type}` in `minion-state.json`
2. Check if cap exceeded — if `total >= 3` → output `BLUEPRINT_ESCALATION` and halt
3. Execute the node
4. Run the next deterministic check
5. Continue to next node

**CRITICAL RULES — Non-Negotiable:**

- **Do NOT ask clarifying questions**. If ambiguous → escalate immediately with `BLUEPRINT_ESCALATION`
- **Do NOT exceed 3 total agentic iterations** across all nodes
- **Do NOT read files outside the pre-hydration manifest**
- **Do NOT merge PRs** — the human review gate is mandatory
- **Do NOT retry the same agentic node** after it fails — escalate

### Step 6 — Git Operations (Deterministic)

```bash
# Create branch
git checkout -b minion/{manifest.task_id}

# After implementation passes lint + type-check + test:
git add -A
git commit -m "$(cat <<'EOF'
minion: {one-line task summary}

Blueprint: {manifest.blueprint} v1.0.0
Toolshed: {manifest.toolshed}
Task ID: {manifest.task_id}
Agentic iterations: {n}/3

Generated: {DD/MM/YYYY} AEST

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 7 — PR Creation

```bash
gh pr create \
  --title "minion: {task summary}" \
  --body "$(cat <<'EOF'
{blueprint PR template content — pulled from blueprint file}
EOF
)" \
  --label "minion-generated"
```

### Step 8 — State Write

Append to `.claude/memory/current-state.md`:

```markdown
## Minion Completed — {DD/MM/YYYY HH:MM} AEST

- task_id: {manifest.task_id}
- blueprint: {manifest.blueprint}
- toolshed: {manifest.toolshed}
- iterations used: {n}/3
- PR: {pr_url}
- status: AWAITING HUMAN REVIEW
```

Append to `.claude/memory/architectural-decisions.md`:

```
[{DD/MM/YYYY}] DECISION: Implemented {task summary} via minion/{manifest.task_id} | REASON: Automated via Blueprint DAG | ALTERNATIVES REJECTED: Manual multi-turn interaction
```

Delete `.claude/data/minion-state.json` (runtime state — not committed).

### Step 9 — Completion Report

Print final summary:

```
MINION COMPLETE
task_id: {manifest.task_id}
blueprint: {manifest.blueprint}
toolshed: {manifest.toolshed}
agentic iterations: {n}/3
pr: {pr_url}
status: AWAITING HUMAN REVIEW

Next action: Review the PR at the URL above. Do not merge without review.
```

---

## Escalation Protocol

When a `BLUEPRINT_ESCALATION` occurs (cap exceeded, blocking error, HIGH risk detected):

1. Output the escalation block:

```
BLUEPRINT_ESCALATION
task_id: {manifest.task_id}
node: {failing-node}
iteration: {n}/{max}
reason: {what failed in one line}
evidence: {last 5 lines of error output}
next_action: Human review required — do not retry automatically
```

2. Write escalation to `.claude/memory/current-state.md`
3. Do NOT create a PR
4. Do NOT clean up the branch (leave it for human inspection)
5. Print: "Minion halted. Human review required. Branch `minion/{task_id}` preserved."

---

## Requirements

- `gh` CLI (GitHub CLI) must be installed and authenticated
- Docker must be running (for database-related blueprints)
- Git must be clean (no uncommitted changes) before starting

---

## Locale

All output uses Australian English: colour, behaviour, optimisation, organised, licence (noun).
All dates: DD/MM/YYYY. All times: AEST/AEDT.

---

## What Minion Does NOT Do

- Ask clarifying questions (escalates instead)
- Merge PRs (human review gate is mandatory)
- Exceed 3 total agentic iterations
- Read files outside the pre-hydration manifest
- Replace the existing interactive multi-turn workflow (additive only)
