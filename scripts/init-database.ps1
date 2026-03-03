# Database Initialization Script
# Applies all migrations and verifies domain memory setup

param(
    [switch]$Reset,
    [switch]$Verify = $true,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "`n=== Domain Memory Database Initialization ===" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Check if Docker is running
Write-Host "`n[Checking Docker...]" -ForegroundColor Yellow
try {
    $dockerRunning = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Docker is running" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Docker is not running" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop and try again" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "   [ERROR] Docker check failed: $_" -ForegroundColor Red
    Write-Host "   Please ensure Docker Desktop is installed and running" -ForegroundColor Cyan
    exit 1
}

# Check if Supabase is running
Write-Host "`n[Checking Supabase...]" -ForegroundColor Yellow
$supabaseRunning = $false
try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        $supabaseRunning = $true
        Write-Host "   [OK] Supabase is already running" -ForegroundColor Green
    }
} catch {
    # Supabase not running, will start it
}

if (-not $supabaseRunning) {
    Write-Host "   [Starting Supabase...]" -ForegroundColor Cyan
    try {
        supabase start
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Supabase started successfully" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] Failed to start Supabase" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "   [ERROR] Failed to start Supabase: $_" -ForegroundColor Red
        exit 1
    }
}

# Apply migrations
if ($Reset) {
    Write-Host "`n[Resetting database (clean slate)...]" -ForegroundColor Yellow
    Write-Host "   [WARNING] This will DROP all data and reapply migrations" -ForegroundColor Yellow

    $confirmation = Read-Host "`n   Are you sure? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "`n   [CANCELLED] Reset cancelled" -ForegroundColor Red
        exit 0
    }

    Write-Host "`n   [Running db reset...]" -ForegroundColor Cyan
    try {
        supabase db reset
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Database reset complete" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] Database reset failed" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "   [ERROR] Database reset failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[Applying new migrations...]" -ForegroundColor Yellow
    try {
        supabase db push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Migrations applied" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] Migration apply failed" -ForegroundColor Red
            Write-Host "   Try running with -Reset flag to start fresh" -ForegroundColor Cyan
            exit 1
        }
    } catch {
        Write-Host "   [ERROR] Migration apply failed: $_" -ForegroundColor Red
        Write-Host "   Try running with -Reset flag to start fresh" -ForegroundColor Cyan
        exit 1
    }
}

# Show migration list
Write-Host "`n[Migration Status:]" -ForegroundColor Cyan
try {
    supabase migration list
} catch {
    Write-Host "   [WARNING] Could not retrieve migration list" -ForegroundColor Yellow
}

# Run validation if requested
if ($Verify) {
    Write-Host "`n[Running validation...]" -ForegroundColor Cyan
    $scriptPath = Join-Path $PSScriptRoot "validate-database.ps1"

    if (Test-Path $scriptPath) {
        if ($Verbose) {
            & $scriptPath -Verbose
        } else {
            & $scriptPath
        }

        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[ERROR] Validation failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   [WARNING] Validation script not found at: $scriptPath" -ForegroundColor Yellow
        Write-Host "   Skipping validation..." -ForegroundColor Yellow
    }
}

# Show connection info
Write-Host "`n[Database Connection Info:]" -ForegroundColor Cyan
try {
    $statusOutput = supabase status 2>&1
    $apiUrl = $statusOutput | Select-String -Pattern "API URL:" | Select-Object -First 1
    $studioUrl = $statusOutput | Select-String -Pattern "Studio URL:" | Select-Object -First 1
    $dbUrl = $statusOutput | Select-String -Pattern "DB URL:" | Select-Object -First 1

    if ($apiUrl) { Write-Host "   $apiUrl" -ForegroundColor Gray }
    if ($studioUrl) { Write-Host "   $studioUrl" -ForegroundColor Gray }
    if ($dbUrl) { Write-Host "   $dbUrl" -ForegroundColor Gray }
} catch {
    Write-Host "   [WARNING] Could not retrieve connection info" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "[SUCCESS] Database initialization complete!" -ForegroundColor Green
Write-Host "`n>> Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify setup: cd apps\backend; uv run python scripts\setup-memory.py" -ForegroundColor Gray
Write-Host "   2. Run tests: cd apps\backend; uv run pytest tests\test_memory*.py -v" -ForegroundColor Gray
Write-Host "   3. Start dev server: pnpm dev" -ForegroundColor Gray
Write-Host ""

exit 0
