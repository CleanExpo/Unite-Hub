#!/usr/bin/env python3
"""
Pre-Bash Command Validator for Claude Code
Validates bash commands before execution, blocks dangerous ones,
and suggests better alternatives.
"""

import json
import re
import sys
from typing import List, Tuple

# Dangerous command patterns - these will be BLOCKED
DANGEROUS_PATTERNS = [
    (r"rm\s+-rf\s+/(?:\s|$)", "Blocked: 'rm -rf /' would delete entire filesystem"),
    (r"rm\s+-rf\s+\*", "Blocked: 'rm -rf *' is too destructive"),
    (r"rm\s+-rf\s+~", "Blocked: 'rm -rf ~' would delete home directory"),
    (r"sudo\s+rm\s+-rf", "Blocked: sudo rm -rf is extremely dangerous"),
    (r":\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}", "Blocked: Fork bomb detected"),
    (r">\s*/dev/sd[a-z]", "Blocked: Writing directly to disk device"),
    (r"mkfs\.", "Blocked: Filesystem formatting command"),
    (r"dd\s+if=.*of=/dev/", "Blocked: Direct disk write with dd"),
]

# Suggestions for better alternatives
SUGGESTIONS = [
    # Use ripgrep instead of grep
    (
        r"\bgrep\b(?!.*\|.*rg)",
        "Consider using 'rg' (ripgrep) instead of 'grep' for better performance and features"
    ),
    # Use fd instead of find
    (
        r"\bfind\s+\S+\s+-name\b",
        "Consider using 'fd' instead of 'find -name' for better performance"
    ),
    # Use bat instead of cat for viewing
    (
        r"\bcat\s+\S+\s*$",
        "Consider using 'bat' instead of 'cat' for syntax highlighting"
    ),
    # Use exa/eza instead of ls
    (
        r"\bls\s+-la\b",
        "Consider using 'eza -la' instead of 'ls -la' for better output"
    ),
]

# Warning patterns - allow but warn
WARNINGS = [
    (r"rm\s+-rf\s+\S+", "Warning: rm -rf can be destructive. Verify the path is correct."),
    (r"chmod\s+777", "Warning: chmod 777 is overly permissive. Consider more restrictive permissions."),
    (r"npm\s+install\s+--force", "Warning: --force bypasses security checks"),
    (r"git\s+push\s+--force", "Warning: force push can overwrite remote history"),
    (r"git\s+reset\s+--hard", "Warning: hard reset discards uncommitted changes"),
]


def validate_command(command: str) -> Tuple[bool, List[str]]:
    """
    Validate a bash command.
    Returns (should_block, messages)
    """
    messages = []
    should_block = False

    # Check for dangerous patterns (block these)
    for pattern, message in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            messages.append(message)
            should_block = True

    # Check for warnings (don't block, just warn)
    for pattern, message in WARNINGS:
        if re.search(pattern, command) and not should_block:
            messages.append(message)

    # Check for suggestions (don't block, suggest alternatives)
    for pattern, message in SUGGESTIONS:
        if re.search(pattern, command) and not should_block:
            messages.append(message)

    return should_block, messages


def main():
    # Read JSON input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")

    # Only validate Bash commands
    if tool_name != "Bash" or not command:
        sys.exit(0)

    # Validate the command
    should_block, messages = validate_command(command)

    if should_block:
        # Exit code 2 blocks the command and shows message to Claude
        for message in messages:
            print(f"BLOCKED: {message}", file=sys.stderr)
        sys.exit(2)
    elif messages:
        # Suggestions/warnings - don't block but add context
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "additionalContext": " | ".join(messages)
            }
        }
        print(json.dumps(output))
        sys.exit(0)
    else:
        # Command is safe
        sys.exit(0)


if __name__ == "__main__":
    main()
