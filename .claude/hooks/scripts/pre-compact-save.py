#!/usr/bin/env python3
"""
Pre-Compact State Saver for Claude Code
Triggered before every context compaction event.
Saves current state to disk and guides compaction on what to preserve.
"""

import json
import os
import sys
from datetime import datetime


def get_project_dir() -> str:
    """Get the project directory from environment."""
    return os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())


def write_current_state(project_dir: str, session_id: str) -> None:
    """Write a compaction snapshot to current-state.md."""
    memory_dir = os.path.join(project_dir, ".claude", "memory")
    state_path = os.path.join(memory_dir, "current-state.md")

    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M AEST")

    content = f"""# Current State
> Updated by PreCompact hook. Session: {session_id[:8] if session_id else "unknown"}

## Active Task
Compaction triggered — context was saved at {timestamp}.
Re-read CONSTITUTION.md if rules feel unclear after compaction.

## Recent Architectural Choices
See architectural-decisions.md for logged decisions.

## In-Progress Work
Check recent git status: `git status` and `git log --oneline -5`

## Next Steps
Re-read .claude/memory/CONSTITUTION.md to restore rule context.

## Last Updated
{timestamp} (PreCompact hook)
"""

    try:
        os.makedirs(memory_dir, exist_ok=True)
        with open(state_path, "w", encoding="utf-8") as f:
            f.write(content)
    except OSError:
        pass  # Graceful degradation — never fail compaction


def build_compaction_guidance() -> str:
    """Build the additionalContext guidance for compaction."""
    return (
        "PRESERVE_VERBATIM: All CLAUDE.md instructions | Agent routing rules | "
        "Australian locale rules (en-AU, DD/MM/YYYY, AUD) | Design system rules (OLED Black, Scientific Luxury) | "
        "Retrieval-First protocol | No cross-layer imports rule | "
        "PRESERVE_SUMMARY: Recent architectural decisions | Current task state | "
        "Active agent dispatches | Key file paths modified | "
        "DISCARD: Old file read contents | Resolved debug output | Completed tool outputs | "
        "Repeated search results already acted upon"
    )


def main():
    # Read JSON input from stdin
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    session_id = input_data.get("session_id", "")
    project_dir = get_project_dir()

    # Save state snapshot
    write_current_state(project_dir, session_id)

    # Output compaction guidance
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreCompact",
            "additionalContext": build_compaction_guidance()
        }
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
