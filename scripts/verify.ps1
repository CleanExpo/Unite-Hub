#!/usr/bin/env pwsh
# NodeJS-Starter-V1 Verification Script (PowerShell)
# Windows equivalent of verify.sh with feature parity
# Usage: .\scripts\verify.ps1 [-Fix]

[CmdletBinding()]
param(
    [switch]$Fix
)

# ============================================================================
# Setup & Configuration
# ============================================================================
$ErrorActionPreference = "Continue"
$script:TOTAL_CHECKS = 0
$script:PASSED_CHECKS = 0
$script:FAILED_CHECKS = 0
$script:WARNINGS = 0

# Color codes
$script:Colors = @{
    Reset   = "`e[0m"
    Red     = "`e[31m"
    Green   = "`e[32m"
    Yellow  = "`e[33m"
    Blue    = "`e[34m"
}

# ============================================================================
# Helper Functions
# ============================================================================
function Write-Header {
    param([string]$Text)
    Write-Host "`n$($script:Colors.Blue)========================================$($script:Colors.Reset)"
    Write-Host "$($script:Colors.Blue)$Text$($script:Colors.Reset)"
    Write-Host "$($script:Colors.Blue)========================================`n$($script:Colors.Reset)"
}

function Write-Pass {
    param([string]$Text)
    $script:TOTAL_CHECKS++
    $script:PASSED_CHECKS++
    Write-Host "$($script:Colors.Green)✅ PASS:$($script:Colors.Reset) $Text"
}

function Write-Fail {
    param([string]$Text)
    $script:TOTAL_CHECKS++
    $script:FAILED_CHECKS++
    Write-Host "$($script:Colors.Red)❌ FAIL:$($script:Colors.Reset) $Text"
}

function Write-Warn {
    param([string]$Text)
    $script:TOTAL_CHECKS++
    $script:WARNINGS++
    Write-Host "$($script:Colors.Yellow)⚠️  WARN:$($script:Colors.Reset) $Text"
}

function Write-Info {
    param([string]$Text)
    Write-Host "$($script:Colors.Blue)ℹ️  INFO:$($script:Colors.Reset) $Text"
}

function Test-Command {
    param([string]$Command)
    try {
        $null = & $Command --version 2>&1
        return $true
    }
    catch {
        return $false
    }
}

# ============================================================================
# Main Verification
# ============================================================================
Write-Header "🔍 NodeJS-Starter-V1 Verification"
Write-Host "Checking system configuration and service status...`n"

# Check 1: Prerequisites
Write-Header "1. Prerequisites"

if (Test-Command docker) {
    $dockerVersion = & docker --version | ForEach-Object { $_ -replace "Docker version ", "" -replace ",.*", "" }
    Write-Pass "Docker installed (version $dockerVersion)"
}
else {
    Write-Fail "Docker is not installed"
}

if (& docker ps *>&1 | Select-String "CONTAINER") {
    Write-Pass "Docker daemon is running"
}
else {
    Write-Fail "Docker daemon is not running or inaccessible"
}

if (Test-Command node) {
    $nodeVersion = & node --version
    Write-Pass "Node.js installed ($nodeVersion)"
}
else {
    Write-Fail "Node.js is not installed"
}

if (Test-Command pnpm) {
    $pnpmVersion = & pnpm --version
    Write-Pass "pnpm installed (version $pnpmVersion)"
}
else {
    Write-Fail "pnpm is not installed"
}

if ((Test-Command python) -or (Test-Command python3)) {
    $pythonCmd = if (Test-Command python3) { "python3" } else { "python" }
    $pythonVersion = & $pythonCmd --version | ForEach-Object { $_ -replace "Python ", "" }
    Write-Pass "Python installed (version $pythonVersion)"
}
else {
    Write-Fail "Python is not installed"
}

if (Test-Command uv) {
    $uvVersion = & uv --version | ForEach-Object { $_ -replace "uv ", "" }
    Write-Pass "uv installed (version $uvVersion)"
}
else {
    Write-Fail "uv is not installed"
}

# Check 2: Docker Services
Write-Header "2. Docker Services"

try {
    $postgresStatus = & docker compose ps postgres 2>&1 | Select-String "healthy|running"
    if ($postgresStatus) {
        Write-Pass "PostgreSQL container is running"

        # Check connection
        try {
            $null = & docker compose exec -T postgres pg_isready -U starter_user -d starter_db 2>&1
            Write-Pass "PostgreSQL is accepting connections"

            # Check tables
            $tableCount = & docker compose exec -T postgres psql -U starter_user -d starter_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | ForEach-Object { $_.Trim() }
            if ($tableCount -gt 0) {
                Write-Pass "Database schema is initialized ($tableCount tables)"
            }
            else {
                Write-Fail "Database schema is empty (no tables found)"
            }
        }
        catch {
            Write-Fail "PostgreSQL connection check failed"
        }
    }
    else {
        Write-Fail "PostgreSQL container is not running"
    }
}
catch {
    Write-Fail "Error checking PostgreSQL: $_"
}

try {
    $redisStatus = & docker compose ps redis 2>&1 | Select-String "running"
    if ($redisStatus) {
        Write-Pass "Redis container is running"

        # Check response
        try {
            $ping = & docker compose exec -T redis redis-cli PING 2>&1
            if ($ping -like "*PONG*") {
                Write-Pass "Redis is responding to commands"
            }
            else {
                Write-Fail "Redis is not responding to commands"
            }
        }
        catch {
            Write-Fail "Redis ping check failed"
        }
    }
    else {
        Write-Fail "Redis container is not running"
    }
}
catch {
    Write-Fail "Error checking Redis: $_"
}

# Check 3: Ollama
Write-Header "3. Ollama (Local AI)"

if (Test-Command ollama) {
    $ollamaVersion = & ollama --version 2>&1 | Select-Object -First 1
    Write-Pass "Ollama is installed ($ollamaVersion)"

    # Check service
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -ErrorAction SilentlyContinue
        Write-Pass "Ollama service is running"

        # Check models
        $models = & ollama list 2>&1
        if ($models -like "*llama3.1:8b*") {
            Write-Pass "Model llama3.1:8b is installed"
        }
        else {
            Write-Warn "Model llama3.1:8b is not installed (run: ollama pull llama3.1:8b)"
        }

        if ($models -like "*nomic-embed-text*") {
            Write-Pass "Model nomic-embed-text is installed"
        }
        else {
            Write-Warn "Model nomic-embed-text is not installed (run: ollama pull nomic-embed-text)"
        }
    }
    catch {
        Write-Warn "Ollama service is not running (start: ollama serve)"
    }
}
else {
    Write-Warn "Ollama is not installed (optional: https://ollama.com/)"
}

# Check 4: Project Structure
Write-Header "4. Project Structure"

if (Test-Path "package.json") {
    Write-Pass "Root package.json exists"
}
else {
    Write-Fail "Root package.json not found"
}

if ((Test-Path "apps/web") -and (Test-Path "apps/web/package.json")) {
    Write-Pass "Frontend app exists (apps/web)"
}
else {
    Write-Fail "Frontend app not found"
}

if ((Test-Path "apps/backend") -and (Test-Path "apps/backend/pyproject.toml")) {
    Write-Pass "Backend app exists (apps/backend)"
}
else {
    Write-Fail "Backend app not found"
}

if (Test-Path "docker-compose.yml") {
    Write-Pass "docker-compose.yml exists"
}
else {
    Write-Fail "docker-compose.yml not found"
}

if (Test-Path "scripts/init-db.sql") {
    Write-Pass "Database initialization script exists"
}
else {
    Write-Fail "scripts/init-db.sql not found"
}

# Check 5: Configuration
Write-Header "5. Configuration"

if (Test-Path ".env") {
    Write-Pass ".env file exists"

    $envContent = Get-Content ".env" -Raw

    if ($envContent -like "*DATABASE_URL*") {
        Write-Pass "DATABASE_URL is configured"
    }
    else {
        Write-Fail "DATABASE_URL not found in .env"
    }

    if ($envContent -like "*JWT_SECRET_KEY*") {
        Write-Pass "JWT_SECRET_KEY is configured"
    }
    else {
        Write-Fail "JWT_SECRET_KEY not found in .env"
    }

    if ($envContent -like "*AI_PROVIDER*") {
        $aiProvider = ($envContent | Select-String "AI_PROVIDER=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim('"')
        Write-Pass "AI_PROVIDER is configured ($aiProvider)"
    }
    else {
        Write-Warn "AI_PROVIDER not found in .env (will default to ollama)"
    }
}
else {
    Write-Fail ".env file not found (copy from .env.example)"
}

if (Test-Path ".env.example") {
    Write-Pass ".env.example file exists"
}
else {
    Write-Warn ".env.example file not found"
}

# Check 6: Dependencies
Write-Header "6. Dependencies"

if (Test-Path "node_modules") {
    Write-Pass "Root node_modules exists"
}
else {
    Write-Fail "Root node_modules not found (run: pnpm install)"
}

if (Test-Path "apps/web/node_modules") {
    Write-Pass "Frontend node_modules exists"
}
else {
    Write-Fail "Frontend node_modules not found (run: pnpm install)"
}

if (Test-Path "apps/backend/.venv") {
    Write-Pass "Backend virtual environment exists"
}
else {
    Write-Fail "Backend .venv not found (run: cd apps/backend && uv sync)"
}

# Check 6.5: Dependency Integrity
Write-Header "6.5 Dependency Integrity"

if (Test-Path "scripts/dependency-checks.ps1") {
    . .\scripts\dependency-checks.ps1

    # Check lockfile integrity
    Write-Info "Checking pnpm-lock.yaml integrity..."
    $lockfileResult = Test-LockfileIntegrity

    if ($lockfileResult.Success) {
        Write-Pass "Lockfile is valid and synchronized"
    }
    else {
        if ($lockfileResult.Severity -eq "Error") {
            Write-Fail $lockfileResult.Message
            Write-Host "   Fix: pnpm install" -ForegroundColor Yellow
        }
        else {
            Write-Warn $lockfileResult.Message
            Write-Host "   Recommended: pnpm install" -ForegroundColor Yellow
        }
    }

    # Check each workspace
    $workspaces = @(".", "apps/web", "packages/shared", "packages/config")
    foreach ($workspace in $workspaces) {
        if (-not (Test-Path "$workspace/package.json")) {
            continue
        }

        Write-Info "Verifying: $workspace"

        # Check dependency sync
        $syncResult = Test-DependencySync -Workspace $workspace

        if ($syncResult.Success) {
            Write-Pass "$workspace`: Dependencies synchronized"
        }
        else {
            if ($syncResult.Missing.Count -gt 0) {
                Write-Fail "$workspace`: $($syncResult.Missing.Count) missing dependencies"
                $syncResult.Missing | Select-Object -First 3 | ForEach-Object {
                    Write-Host "     - $($_.Name)@$($_.Version) not installed"
                }
                if ($syncResult.Missing.Count -gt 3) {
                    Write-Host "     ... and $($syncResult.Missing.Count - 3) more"
                }
                Write-Host "   Fix: pnpm install --filter=$workspace" -ForegroundColor Yellow
            }

            if ($syncResult.Mismatched.Count -gt 0) {
                Write-Warn "$workspace`: $($syncResult.Mismatched.Count) version mismatches"
                $syncResult.Mismatched | Select-Object -First 3 | ForEach-Object {
                    Write-Host "     - $($_.Name): declared=$($_.Declared), installed=$($_.Installed)"
                }
                if ($syncResult.Mismatched.Count -gt 3) {
                    Write-Host "     ... and $($syncResult.Mismatched.Count - 3) more"
                }
                Write-Host "   Fix: pnpm install" -ForegroundColor Yellow
            }
        }

        # Check orphaned
        $orphanResult = Test-OrphanedDependencies -Workspace $workspace
        if ($orphanResult.Orphaned.Count -gt 0) {
            Write-Warn "$workspace`: $($orphanResult.Orphaned.Count) orphaned dependencies"
            $orphanResult.Orphaned | Select-Object -First 3 | ForEach-Object {
                Write-Host "     - $($_.Name)@$($_.Version) (not in package.json)"
            }
            if ($orphanResult.Orphaned.Count -gt 3) {
                Write-Host "     ... and $($orphanResult.Orphaned.Count - 3) more"
            }
            Write-Host "   Fix: pnpm prune" -ForegroundColor Yellow
        }
    }

    # Check workspace consistency
    Write-Info "Checking workspace consistency..."
    $consistencyResult = Test-WorkspaceConsistency

    if ($consistencyResult.Success) {
        Write-Pass "Workspace dependencies are consistent"
    }
    else {
        Write-Warn "Found $($consistencyResult.Conflicts.Count) dependency conflicts"
        $consistencyResult.Conflicts | ForEach-Object {
            Write-Host "  CONFLICT: $($_.Package)"
            $_.Usages | ForEach-Object {
                Write-Host "    $($_.Workspace): $($_.Version)"
            }
        }
        Write-Host "   Recommended: Align dependency versions across workspaces" -ForegroundColor Yellow
    }
}
else {
    Write-Fail "scripts/dependency-checks.ps1 not found"
}

# Check 7: Service Health
Write-Header "7. Service Health"

try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue -TimeoutSec 2
    Write-Pass "Frontend is accessible (http://localhost:3000)"
}
catch {
    Write-Info "Frontend is not running (start: pnpm dev)"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue -TimeoutSec 2
    Write-Pass "Backend is accessible (http://localhost:8000)"

    if ($response.Content -like "*status*") {
        Write-Pass "Backend health check responds correctly"
    }
}
catch {
    Write-Info "Backend is not running (start: pnpm dev)"
}

# Summary
Write-Header "📊 Verification Summary"

Write-Host "Total checks:   $script:TOTAL_CHECKS"
Write-Host "$($script:Colors.Green)Passed:         $script:PASSED_CHECKS$($script:Colors.Reset)"
if ($script:FAILED_CHECKS -gt 0) {
    Write-Host "$($script:Colors.Red)Failed:         $script:FAILED_CHECKS$($script:Colors.Reset)"
}
if ($script:WARNINGS -gt 0) {
    Write-Host "$($script:Colors.Yellow)Warnings:       $script:WARNINGS$($script:Colors.Reset)"
}

Write-Host ""

if ($script:FAILED_CHECKS -eq 0) {
    Write-Host "$($script:Colors.Green)✅ All critical checks passed!$($script:Colors.Reset)" -NoNewline
    Write-Host " Ready to develop.`n"
    exit 0
}
else {
    Write-Host "$($script:Colors.Red)❌ $script:FAILED_CHECKS critical check(s) failed.$($script:Colors.Reset)`n"
    exit 1
}
