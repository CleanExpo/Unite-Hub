#!/bin/bash
# Skills Installation Script for Unix/macOS
# Installs skills to Claude Code user directory

set -e

echo "Skills Installation Script"
echo "========================="

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_SKILLS_DIR="$HOME/.claude/skills"

# Create Claude skills directory if it doesn't exist
if [ ! -d "$CLAUDE_SKILLS_DIR" ]; then
    echo "Creating Claude skills directory..."
    mkdir -p "$CLAUDE_SKILLS_DIR"
fi

# Install Vercel skills
echo ""
echo "Installing Vercel skills..."
VERCEL_SKILLS_PATH="$SCRIPT_DIR/vercel-labs-agent-skills/skills"
if [ -d "$VERCEL_SKILLS_PATH" ]; then
    for skill in "$VERCEL_SKILLS_PATH"/*/; do
        skill_name=$(basename "$skill")
        echo "  - $skill_name"
        cp -r "$skill" "$CLAUDE_SKILLS_DIR/"
    done
    echo "  Vercel skills installed!"
else
    echo "  Vercel skills not found. Run: git clone https://github.com/vercel-labs/agent-skills.git .skills/vercel-labs-agent-skills"
fi

# Install custom skills
echo ""
echo "Installing custom skills..."
CUSTOM_SKILLS_PATH="$SCRIPT_DIR/custom"
if [ -d "$CUSTOM_SKILLS_PATH" ]; then
    for skill in "$CUSTOM_SKILLS_PATH"/*/; do
        skill_name=$(basename "$skill")
        echo "  - $skill_name"
        cp -r "$skill" "$CLAUDE_SKILLS_DIR/"
    done
    echo "  Custom skills installed!"
else
    echo "  Custom skills directory not found."
fi

echo ""
echo "========================================"
echo "Skills installed to: $CLAUDE_SKILLS_DIR"
echo "========================================"

# List installed skills
echo ""
echo "Installed skills:"
for skill in "$CLAUDE_SKILLS_DIR"/*/; do
    echo "  - $(basename "$skill")"
done

echo ""
echo "Done!"
