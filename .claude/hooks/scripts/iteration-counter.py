"""
Minion Iteration Counter — PreToolUse Hook for Task tool
Enforces hard agentic iteration caps per the Blueprint Engine specification.

Reads .claude/data/minion-state.json. If total >= 3, injects BLUEPRINT_ESCALATION
into the hook context to prevent execution.

Only active when minion-state.json exists (i.e., a /minion invocation is active).
"""

import json
import os
import sys
from pathlib import Path


def main() -> None:
    # Read hook input from stdin (Claude Code PreToolUse hook protocol)
    try:
        hook_input = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        # Not a valid hook call — pass through silently
        sys.exit(0)

    # Only intercept Task tool calls
    tool_name = hook_input.get("tool_name", "")
    if tool_name != "Task":
        sys.exit(0)

    # Locate minion-state.json
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    state_path = Path(project_dir) / ".claude" / "data" / "minion-state.json"

    # No active minion session — pass through
    if not state_path.exists():
        sys.exit(0)

    try:
        state = json.loads(state_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        sys.exit(0)

    # Not an active minion run — pass through
    if not state.get("active", False):
        sys.exit(0)

    iterations = state.get("iterations", {})
    total = iterations.get("total", 0)
    task_id = state.get("task_id", "unknown")

    # Hard cap: 3 total agentic iterations
    MAX_TOTAL = 3

    if total >= MAX_TOTAL:
        # Inject BLUEPRINT_ESCALATION — block the Task tool call
        escalation = {
            "decision": "block",
            "reason": (
                f"BLUEPRINT_ESCALATION\n"
                f"task_id: {task_id}\n"
                f"node: Task (agentic)\n"
                f"iteration: {total}/{MAX_TOTAL}\n"
                f"reason: Hard iteration cap reached — maximum {MAX_TOTAL} agentic iterations per blueprint\n"
                f"evidence: minion-state.json reports {total} total agentic iterations used\n"
                f"next_action: Human review required — do not retry automatically"
            )
        }
        print(json.dumps(escalation))
        sys.exit(0)

    # Under cap — allow the tool call and increment counter
    iterations["total"] = total + 1

    # Detect node type from task description to track per-node counts
    tool_input = hook_input.get("tool_input", {})
    task_prompt = str(tool_input.get("prompt", "")).lower()

    if "implement" in task_prompt and "fix" not in task_prompt:
        iterations["implement"] = iterations.get("implement", 0) + 1
    elif "fix-ci" in task_prompt or ("fix" in task_prompt and "test" in task_prompt):
        iterations["fix_ci"] = iterations.get("fix_ci", 0) + 1
    elif "fix-lint" in task_prompt or ("fix" in task_prompt and "lint" in task_prompt):
        iterations["fix_lint"] = iterations.get("fix_lint", 0) + 1

    state["iterations"] = iterations

    try:
        state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
    except OSError:
        pass  # Non-fatal — let the tool call proceed

    # Allow the tool call
    sys.exit(0)


if __name__ == "__main__":
    main()
