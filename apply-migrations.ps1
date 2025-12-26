#!/usr/bin/env pwsh
# Apply AI Authority Migrations to Supabase
# Opens migration files and Supabase SQL Editor for easy copy-paste

Write-Host "`n🚀 AI Authority Migration Helper`n" -ForegroundColor Cyan

# Migration files
$migration1 = "supabase\migrations\20251226120000_ai_authority_substrate.sql"
$migration2 = "supabase\migrations\20251226120100_authority_supporting_tables.sql"

# Supabase SQL Editor URL
$supabaseUrl = "https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql"

Write-Host "📋 This script will help you apply 2 migrations:`n"
Write-Host "  1. $migration1" -ForegroundColor Yellow
Write-Host "  2. $migration2`n" -ForegroundColor Yellow

Write-Host "Opening Supabase SQL Editor in browser..." -ForegroundColor Green
Start-Process $supabaseUrl

Start-Sleep -Seconds 2

Write-Host "`n📄 Opening Migration 1 in default editor..." -ForegroundColor Green
Start-Process $migration1

Write-Host "`n📖 INSTRUCTIONS:`n"
Write-Host "  1. In Supabase SQL Editor, click '+ New Query'" -ForegroundColor Cyan
Write-Host "  2. In the opened migration file, press Ctrl+A (Select All)" -ForegroundColor Cyan
Write-Host "  3. Press Ctrl+C (Copy)" -ForegroundColor Cyan
Write-Host "  4. Switch to Supabase browser tab" -ForegroundColor Cyan
Write-Host "  5. Press Ctrl+V (Paste)" -ForegroundColor Cyan
Write-Host "  6. Click 'Run' button" -ForegroundColor Cyan
Write-Host "  7. Wait for completion (~10 seconds)`n" -ForegroundColor Cyan

Read-Host "Press Enter when Migration 1 is complete"

Write-Host "`n📄 Opening Migration 2 in default editor..." -ForegroundColor Green
Start-Process $migration2

Write-Host "`n📖 Repeat for Migration 2:`n"
Write-Host "  1. In Supabase, click '+ New Query' (new tab)" -ForegroundColor Cyan
Write-Host "  2. In migration 2 file, Ctrl+A, Ctrl+C" -ForegroundColor Cyan
Write-Host "  3. Switch to Supabase, Ctrl+V" -ForegroundColor Cyan
Write-Host "  4. Click 'Run'" -ForegroundColor Cyan
Write-Host "  5. Wait for completion (~30 seconds)`n" -ForegroundColor Cyan

Read-Host "Press Enter when Migration 2 is complete"

Write-Host "`n✅ Migrations should now be applied!`n" -ForegroundColor Green
Write-Host "📦 Creating Storage Bucket..." -ForegroundColor Yellow
Write-Host "`nGo to: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/storage" -ForegroundColor Cyan
Write-Host "  1. Click 'New Bucket'" -ForegroundColor Cyan
Write-Host "  2. Name: visual-audits" -ForegroundColor Cyan
Write-Host "  3. Check 'Public bucket'" -ForegroundColor Cyan
Write-Host "  4. Click 'Create bucket'`n" -ForegroundColor Cyan

Read-Host "Press Enter when storage bucket is created"

Write-Host "`n🧪 Running test suite..." -ForegroundColor Green
npm run authority:test

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. npm run authority:mcp  (start MCP server)" -ForegroundColor White
Write-Host "  2. npm run authority:workers  (start workers)" -ForegroundColor White
Write-Host "  3. Open dashboard: http://localhost:3008/client/dashboard/market-intelligence`n" -ForegroundColor White
