#!/usr/bin/env bash
# NotebookLM Sync Hook — Unix wrapper
# Delegates to the PowerShell script logic but as a native bash script.
# Triggered by PostToolUse (Bash). Only acts on verify/build commands.

set -euo pipefail

# Read stdin (tool input JSON)
STDIN_CONTENT=""
if [ ! -t 0 ]; then
    STDIN_CONTENT=$(cat)
fi

[ -z "$STDIN_CONTENT" ] && exit 0

# Extract command from tool input JSON
COMMAND=$(echo "$STDIN_CONTENT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cmd = ''
    if 'tool_input' in data and 'command' in data['tool_input']:
        cmd = data['tool_input']['command']
    elif 'command' in data:
        cmd = data['command']
    print(cmd)
except:
    pass
" 2>/dev/null)

[ -z "$COMMAND" ] && exit 0

# Only proceed for verify or build commands
if ! echo "$COMMAND" | grep -qE '\b(verify|build)\b'; then
    exit 0
fi

# Check nlm is installed
if ! command -v nlm &>/dev/null; then
    exit 0
fi

# Check authentication
if ! nlm login --check &>/dev/null; then
    echo "notebooklm-sync: not authenticated (run 'nlm login')" >&2
    exit 0
fi

# Read notebook config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/../../notebooklm/notebooks.json"

[ ! -f "$CONFIG_PATH" ] && exit 0

NOTEBOOK_ID=$(python3 -c "
import json
with open('$CONFIG_PATH') as f:
    config = json.load(f)
print(config.get('notebooks', {}).get('project_sot', {}).get('id', ''))
" 2>/dev/null)

[ -z "$NOTEBOOK_ID" ] && exit 0

# Build implementation note
DATE=$(date '+%d/%m/%Y %H:%M')
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --format="%s" 2>/dev/null || echo "unknown")
DIFF_STAT=$(git diff HEAD~1 --stat 2>/dev/null || echo "No diff available")

NOTE_CONTENT="## Implementation Note — $DATE [$COMMIT_HASH]

**What changed**: $COMMIT_MSG

**Files**:
$DIFF_STAT

**Follow-ups**:
None detected"

# Handle dry-run flag
if [ "${1:-}" = "--dry-run" ]; then
    echo "=== DRY RUN — NotebookLM Sync ==="
    echo "Notebook: $NOTEBOOK_ID"
    echo "Note title: Sync $DATE"
    echo ""
    echo "$NOTE_CONTENT"
    echo "=== END DRY RUN ==="
    exit 0
fi

# Sync
NOTE_TITLE="Sync $DATE"
echo "$NOTE_CONTENT" | nlm note create "$NOTEBOOK_ID" "$NOTE_TITLE" --text - 2>/dev/null

if [ $? -eq 0 ]; then
    echo "notebooklm-sync: synced to project_sot [$COMMIT_HASH]"
else
    echo "notebooklm-sync: failed to sync" >&2
fi

exit 0
