#!/bin/bash
set -e

echo "========================================"
echo "  Environment Initialization"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [[ ! $OVERWRITE =~ ^[Yy]$ ]]; then
        echo "Skipping environment initialization"
        exit 0
    fi
fi

# Copy template
cp .env.example .env.local

echo ""
echo "Environment file created. Please configure the following:"
echo ""

# Function to prompt for value
prompt_value() {
    local key=$1
    local description=$2
    local default=$3

    if [ -n "$default" ]; then
        read -p "$description [$default]: " value
        value=${value:-$default}
    else
        read -p "$description: " value
    fi

    if [ -n "$value" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|$key=.*|$key=$value|" .env.local
        else
            sed -i "s|$key=.*|$key=$value|" .env.local
        fi
    fi
}

echo "=== Supabase Configuration ==="
prompt_value "NEXT_PUBLIC_SUPABASE_URL" "Supabase URL"
prompt_value "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon Key"
prompt_value "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key"

echo ""
echo "=== AI Model Configuration ==="
prompt_value "ANTHROPIC_API_KEY" "Anthropic API Key"
prompt_value "GOOGLE_AI_API_KEY" "Google AI API Key (optional)"
prompt_value "OPENROUTER_API_KEY" "OpenRouter API Key (optional)"

echo ""
echo "=== MCP Tools Configuration ==="
prompt_value "EXA_API_KEY" "Exa API Key (optional)"

echo ""
echo -e "${GREEN}Environment configuration complete!${NC}"
echo ""
echo "You can manually edit .env.local to add or update values."
echo ""
