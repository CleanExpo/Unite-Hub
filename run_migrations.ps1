# Supabase Migration Runner (PowerShell)
# Quick script to apply all migrations using Supabase CLI

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "SUPABASE MIGRATION RUNNER" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install with:"
    Write-Host "  npm install -g supabase"
    Write-Host ""
    Write-Host "Or use the SQL Editor method instead:"
    Write-Host "  https://supabase.com/dashboard/project/ywxwcrmyfovqnquglynh/sql/new"
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Link to project
Write-Host "Linking to Supabase project..." -ForegroundColor Yellow
supabase link --project-ref ywxwcrmyfovqnquglynh

# Push migrations
Write-Host ""
Write-Host "Pushing migrations to Supabase..." -ForegroundColor Yellow
supabase db push

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "MIGRATION COMPLETE" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Restart your backend server" -ForegroundColor Green
Write-Host "  cd apps\backend"
Write-Host "  python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000"
