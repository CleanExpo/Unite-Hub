#!/bin/bash

# Supabase Migration Runner
# Quick script to apply all migrations using Supabase CLI

echo "=================================="
echo "SUPABASE MIGRATION RUNNER"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo ""
    echo "Install with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or use the SQL Editor method instead:"
    echo "  https://supabase.com/dashboard/project/ywxwcrmyfovqnquglynh/sql/new"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Link to project
echo "Linking to Supabase project..."
supabase link --project-ref ywxwcrmyfovqnquglynh

# Push migrations
echo ""
echo "Pushing migrations to Supabase..."
supabase db push

echo ""
echo "=================================="
echo "MIGRATION COMPLETE"
echo "=================================="
echo ""
echo "Next step: Restart your backend server"
echo "  cd apps/backend"
echo "  python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000"
