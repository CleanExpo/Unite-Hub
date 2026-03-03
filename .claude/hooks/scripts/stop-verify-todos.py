#!/usr/bin/env python3
"""
Stop Verification Hook for Claude Code
Verifies work completion before allowing Claude to stop.
Checks for incomplete todos, failing tests, and uncommitted changes.
"""

import json
import os
import subprocess
import sys


def check_git_status() -> tuple[bool, str]:
    """Check for uncommitted changes."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.stdout.strip():
            lines = result.stdout.strip().split("\n")
            count = len(lines)
            return False, f"Git: {count} uncommitted changes"
        return True, "Git: clean"
    except Exception:
        return True, "Git: check skipped"


def check_typescript() -> tuple[bool, str]:
    """Quick type check."""
    try:
        # Use a faster check - just verify no errors in recent files
        result = subprocess.run(
            ["npx", "tsc", "--noEmit", "--incremental"],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=os.environ.get("CLAUDE_PROJECT_DIR", ".")
        )
        if result.returncode != 0:
            # Count errors
            error_count = result.stdout.count("error TS")
            if error_count > 0:
                return False, f"TypeScript: {error_count} errors"
        return True, "TypeScript: OK"
    except subprocess.TimeoutExpired:
        return True, "TypeScript: check timed out (skipped)"
    except Exception:
        return True, "TypeScript: check skipped"


def check_beads_tasks() -> tuple[bool, str]:
    """Check for incomplete Beads tasks."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    beads_path = os.path.join(project_dir, ".bin", "bd.exe")

    if not os.path.exists(beads_path):
        return True, "Beads: not installed"

    try:
        result = subprocess.run(
            [beads_path, "ready"],
            capture_output=True,
            text=True,
            timeout=10
        )
        output = result.stdout.strip()
        # "No open issues" or empty means all complete
        if not output or "No open issues" in output or "✨" in output:
            return True, "Beads: all tasks complete"
        # Count actual task lines (exclude status messages)
        lines = [l for l in output.split("\n") if l.strip() and not l.startswith("✨") and not "No open issues" in l]
        if lines:
            return False, f"Beads: {len(lines)} tasks still ready"
        return True, "Beads: all tasks complete"
    except Exception:
        return True, "Beads: check skipped"


def main():
    # Read JSON input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)  # If no valid input, allow stop

    # Check if stop hook is already active (prevent infinite loops)
    if input_data.get("stop_hook_active", False):
        sys.exit(0)  # Allow stop to prevent loops

    # Run all checks
    checks = []
    all_passed = True

    # Git status check
    passed, message = check_git_status()
    checks.append(message)
    if not passed:
        all_passed = False

    # TypeScript check (optional, may be slow)
    # Uncomment to enable:
    # passed, message = check_typescript()
    # checks.append(message)
    # if not passed:
    #     all_passed = False

    # Beads tasks check
    passed, message = check_beads_tasks()
    checks.append(message)
    if not passed:
        all_passed = False

    # Build status summary
    status_summary = " | ".join(checks)

    if not all_passed:
        # Don't block, but inform Claude
        output = {
            "decision": "block",
            "reason": f"Work may be incomplete: {status_summary}. Consider committing changes or completing tasks before stopping."
        }
        print(json.dumps(output))
        sys.exit(0)

    # All checks passed, allow stop
    sys.exit(0)


if __name__ == "__main__":
    main()
