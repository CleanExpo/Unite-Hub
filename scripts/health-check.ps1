# Comprehensive System Health Check Script
# Validates the entire monorepo: database, backend, frontend, and integration

param(
    [switch]$Verbose,
    [switch]$Quick,
    [switch]$SkipTests
)

$ErrorActionPreference = "Continue"
$startTime = Get-Date

# Statistics tracking
$script:totalChecks = 0
$script:passedChecks = 0
$script:failedChecks = 0
$script:warningChecks = 0
$script:errors = @()
$script:warnings = @()

# Color functions
function Write-Header {
    param([string]$Text)
    Write-Host "`n$("=" * 80)" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "$("=" * 80)`n" -ForegroundColor Cyan
}

function Write-Phase {
    param([string]$Phase, [int]$Current, [int]$Total)
    Write-Host "`n[Phase $Current/$Total] $Phase" -ForegroundColor Yellow
    Write-Host "$("-" * 80)" -ForegroundColor Gray
}

function Write-Check {
    param(
        [string]$Message,
        [bool]$Success,
        [string]$Details = "",
        [switch]$IsWarning
    )

    $script:totalChecks++

    if ($IsWarning) {
        $icon = "⚠️ "
        $color = "Yellow"
        $script:warningChecks++
        if ($Details) {
            $script:warnings += "$Message - $Details"
        }
    } elseif ($Success) {
        $icon = "✅"
        $color = "Green"
        $script:passedChecks++
    } else {
        $icon = "❌"
        $color = "Red"
        $script:failedChecks++
        if ($Details) {
            $script:errors += "$Message - $Details"
        }
    }

    Write-Host "  $icon $Message" -ForegroundColor $color
    if ($Details -and $Verbose) {
        Write-Host "     $Details" -ForegroundColor Gray
    }
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Get-VersionString {
    param([string]$Command, [string]$Arg = "--version")
    try {
        $output = & $Command $Arg 2>&1 | Select-Object -First 1
        return $output.ToString().Trim()
    } catch {
        return "unknown"
    }
}

# ============================================================================
# START
# ============================================================================

Write-Header "🔍 COMPREHENSIVE SYSTEM HEALTH CHECK"

if ($Quick) {
    Write-Host "  Running in QUICK mode (skipping build and E2E tests)" -ForegroundColor Cyan
}
if ($SkipTests) {
    Write-Host "  Running with SKIP TESTS mode (skipping all test suites)" -ForegroundColor Cyan
}
if ($Verbose) {
    Write-Host "  Running in VERBOSE mode (detailed output)" -ForegroundColor Cyan
}

# ============================================================================
# PHASE 1: Prerequisites & Environment
# ============================================================================

Write-Phase "Prerequisites and Environment" 1 6

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = Get-VersionString "node" "-v"
    $versionNum = [int]($nodeVersion -replace '[^0-9].*','')
    if ($versionNum -ge 20) {
        Write-Check "Node.js $nodeVersion" $true
    } else {
        Write-Check "Node.js $nodeVersion" $false "Requires version 20.0.0 or higher"
    }
} else {
    Write-Check "Node.js" $false "Not installed"
}

# Check pnpm
if (Test-Command "pnpm") {
    $pnpmVersion = Get-VersionString "pnpm"
    Write-Check "pnpm $pnpmVersion" $true
} else {
    Write-Check "pnpm" $false "Not installed"
}

# Check Python
if (Test-Command "python") {
    $pythonVersion = Get-VersionString "python"
    $versionMatch = $pythonVersion -match "(\d+)\.(\d+)"
    if ($versionMatch) {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        if ($major -eq 3 -and $minor -ge 12) {
            Write-Check "Python $pythonVersion" $true
        } else {
            Write-Check "Python $pythonVersion" $false "Requires version 3.12 or higher"
        }
    } else {
        Write-Check "Python" $true "Version detection failed" -IsWarning
    }
} else {
    Write-Check "Python" $false "Not installed"
}

# Check uv
if (Test-Command "uv") {
    $uvVersion = Get-VersionString "uv"
    Write-Check "uv $uvVersion" $true
} else {
    Write-Check "uv" $false "Not installed"
}

# Check Docker
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Check "Docker running" $true
    } else {
        Write-Check "Docker" $false "Not running"
    }
} catch {
    Write-Check "Docker" $false "Not installed or not running"
}

# Check Supabase CLI
if (Test-Command "supabase") {
    $supabaseVersion = Get-VersionString "supabase"
    Write-Check "Supabase CLI $supabaseVersion" $true
} else {
    Write-Check "Supabase CLI" $false "Not installed"
}

# Check environment variables
Write-Host "`n  Checking environment variables..." -ForegroundColor Gray
$envVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY"
)

$envPath = "apps\backend\.env"
$envConfigured = 0
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    foreach ($var in $envVars) {
        if ($envContent -match "$var=.+") {
            $envConfigured++
        }
    }
}

if ($envConfigured -eq $envVars.Count) {
    Write-Check "Environment variables ($envConfigured/$($envVars.Count))" $true
} elseif ($envConfigured -gt 0) {
    Write-Check "Environment variables ($envConfigured/$($envVars.Count))" $false "Some variables missing" -IsWarning
} else {
    Write-Check "Environment variables" $false "Not configured"
}

# Stop if prerequisites failed
if ($script:failedChecks -gt 0) {
    Write-Host "`n⛔ Prerequisites failed. Cannot continue." -ForegroundColor Red
    Write-Host "   Fix the issues above and try again." -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# PHASE 2: Database Health
# ============================================================================

Write-Phase "Database Health" 2 6

# Check if Supabase is running
try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Check "Supabase running" $true

        # Run existing validation script
        if (Test-Path "scripts\validate-database.ps1") {
            Write-Host "`n  Running database validation script..." -ForegroundColor Gray

            if ($Verbose) {
                & ".\scripts\validate-database.ps1" -Verbose
            } else {
                & ".\scripts\validate-database.ps1" | Out-Null
            }

            if ($LASTEXITCODE -eq 0) {
                Write-Check "Database validation passed" $true
            } else {
                Write-Check "Database validation" $false "See validation script output"
            }
        } else {
            Write-Check "Database validation script" $false "Script not found" -IsWarning
        }

    } else {
        Write-Check "Supabase" $false "Not running - run 'supabase start'"
        Write-Host "   Skipping database checks..." -ForegroundColor Yellow
    }
} catch {
    Write-Check "Supabase" $false "Error checking status: $_"
}

# ============================================================================
# PHASE 3: Backend Health
# ============================================================================

Write-Phase "Backend Health" 3 6

# Check Python dependencies
Write-Host "  Checking Python environment..." -ForegroundColor Gray
Push-Location "apps\backend"

try {
    $pythonCheck = uv run python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Check "Python environment" $true
    } else {
        Write-Check "Python environment" $false "Dependencies not installed"
    }
} catch {
    Write-Check "Python environment" $false "Error: $_"
}

# Run memory system validation
if (Test-Path "scripts\setup-memory.py") {
    Write-Host "`n  Running memory system validation..." -ForegroundColor Gray

    try {
        if ($Verbose) {
            uv run python scripts\setup-memory.py
        } else {
            uv run python scripts\setup-memory.py | Out-Null
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Check "Memory system validated" $true
        } else {
            Write-Check "Memory system" $false "Validation failed"
        }
    } catch {
        Write-Check "Memory system" $false "Error running validation: $_"
    }
}

# Run tests
if (-not $SkipTests) {
    Write-Host "`n  Running backend tests..." -ForegroundColor Gray

    # Unit tests
    try {
        if ($Verbose) {
            uv run pytest -v --tb=short
        } else {
            $testOutput = uv run pytest --tb=short 2>&1
            $testCount = ($testOutput | Select-String "passed" | Select-Object -First 1).ToString()
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Check "Unit tests passed" $true $testCount
        } else {
            Write-Check "Unit tests" $false "Some tests failed"
        }
    } catch {
        Write-Check "Unit tests" $false "Error running tests: $_"
    }

    # Integration tests
    try {
        if ($Verbose) {
            uv run pytest tests\integration\ -v -m integration
        } else {
            $integrationOutput = uv run pytest tests\integration\ -m integration 2>&1
            $integrationCount = ($integrationOutput | Select-String "passed" | Select-Object -First 1).ToString()
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Check "Integration tests passed" $true $integrationCount
        } else {
            Write-Check "Integration tests" $false "Some tests failed" -IsWarning
        }
    } catch {
        Write-Check "Integration tests" $false "Error running tests: $_"
    }
} else {
    Write-Check "Backend tests" $true "Skipped" -IsWarning
}

# Type checking
Write-Host "`n  Running type check..." -ForegroundColor Gray
try {
    if ($Verbose) {
        uv run mypy src
    } else {
        uv run mypy src 2>&1 | Out-Null
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Check "Type checking passed" $true
    } else {
        Write-Check "Type checking" $false "Type errors found"
    }
} catch {
    Write-Check "Type checking" $false "Error: $_"
}

# Linting
Write-Host "  Running linting..." -ForegroundColor Gray
try {
    if ($Verbose) {
        uv run ruff check src
    } else {
        uv run ruff check src 2>&1 | Out-Null
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Check "Linting passed" $true
    } else {
        Write-Check "Linting" $false "Linting errors found"
    }
} catch {
    Write-Check "Linting" $false "Error: $_"
}

Pop-Location

# ============================================================================
# PHASE 4: Frontend Health
# ============================================================================

Write-Phase "Frontend Health" 4 6

Push-Location "apps\web"

# Check Node dependencies
Write-Host "  Checking Node.js environment..." -ForegroundColor Gray
try {
    pnpm list --depth=0 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Check "Node dependencies installed" $true
    } else {
        Write-Check "Node dependencies" $false "Dependencies missing or outdated"
    }
} catch {
    Write-Check "Node dependencies" $false "Error: $_"
}

Pop-Location

# Type checking
Write-Host "`n  Running type check..." -ForegroundColor Gray
try {
    if ($Verbose) {
        pnpm --filter=web type-check
    } else {
        pnpm --filter=web type-check 2>&1 | Out-Null
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Check "TypeScript compilation passed" $true
    } else {
        Write-Check "TypeScript compilation" $false "Type errors found"
    }
} catch {
    Write-Check "TypeScript compilation" $false "Error: $_"
}

# Linting
Write-Host "  Running linting..." -ForegroundColor Gray
try {
    if ($Verbose) {
        pnpm --filter=web lint
    } else {
        pnpm --filter=web lint 2>&1 | Out-Null
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Check "Linting passed" $true
    } else {
        Write-Check "Linting" $false "Linting errors found"
    }
} catch {
    Write-Check "Linting" $false "Error: $_"
}

# Build
if (-not $Quick) {
    Write-Host "`n  Building frontend..." -ForegroundColor Gray
    try {
        if ($Verbose) {
            pnpm --filter=web build
        } else {
            pnpm --filter=web build 2>&1 | Out-Null
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Check "Build succeeded" $true
        } else {
            Write-Check "Build" $false "Build failed"
        }
    } catch {
        Write-Check "Build" $false "Error: $_"
    }
} else {
    Write-Check "Build" $true "Skipped (Quick mode)" -IsWarning
}

# Run tests
if (-not $SkipTests) {
    Write-Host "`n  Running frontend tests..." -ForegroundColor Gray

    # Unit tests
    try {
        if ($Verbose) {
            pnpm --filter=web test
        } else {
            $testOutput = pnpm --filter=web test 2>&1
            $testCount = ($testOutput | Select-String "Test Files" | Select-Object -First 1).ToString()
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Check "Unit tests passed" $true $testCount
        } else {
            Write-Check "Unit tests" $false "Some tests failed"
        }
    } catch {
        Write-Check "Unit tests" $false "Error: $_"
    }

    # Coverage
    if (-not $Quick) {
        try {
            if ($Verbose) {
                pnpm --filter=web test:coverage
            } else {
                $coverageOutput = pnpm --filter=web test:coverage 2>&1
                $coverageLines = ($coverageOutput | Select-String "All files" | Select-Object -First 1).ToString()
            }

            if ($LASTEXITCODE -eq 0) {
                Write-Check "Coverage meets thresholds" $true $coverageLines
            } else {
                Write-Check "Coverage" $false "Below thresholds" -IsWarning
            }
        } catch {
            Write-Check "Coverage" $false "Error: $_"
        }
    }
} else {
    Write-Check "Frontend tests" $true "Skipped" -IsWarning
}

# ============================================================================
# PHASE 5: Integration Tests
# ============================================================================

Write-Phase "Integration Tests" 5 6

# Check if services are running for integration tests
Write-Host "  Note: Integration tests require services to be running" -ForegroundColor Gray
Write-Host "        Start services with 'pnpm dev' in separate terminal" -ForegroundColor Gray

# E2E tests
if (-not $Quick -and -not $SkipTests) {
    Write-Host "`n  Running E2E tests (this may take a while)..." -ForegroundColor Gray

    try {
        if ($Verbose) {
            pnpm --filter=web test:e2e
        } else {
            $e2eOutput = pnpm --filter=web test:e2e 2>&1
            $e2eCount = ($e2eOutput | Select-String "passed" | Select-Object -First 1).ToString()
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Check "E2E tests passed" $true $e2eCount
        } else {
            Write-Check "E2E tests" $false "Some tests failed or services not running" -IsWarning
        }
    } catch {
        Write-Check "E2E tests" $false "Error: $_" -IsWarning
    }
} else {
    Write-Check "E2E tests" $true "Skipped (Quick/SkipTests mode)" -IsWarning
}

# ============================================================================
# PHASE 6: Summary Report
# ============================================================================

Write-Phase "Summary Report" 6 6

$executionTime = (Get-Date) - $startTime
$executionTimeStr = "{0}m {1}s" -f [int]$executionTime.TotalMinutes, $executionTime.Seconds

Write-Header "HEALTH CHECK RESULTS"

# Determine overall status
$overallStatus = "HEALTHY"
$statusColor = "Green"
$statusIcon = "✅"

if ($script:failedChecks -gt 0) {
    $overallStatus = "UNHEALTHY"
    $statusColor = "Red"
    $statusIcon = "❌"
} elseif ($script:warningChecks -gt 0) {
    $overallStatus = "DEGRADED"
    $statusColor = "Yellow"
    $statusIcon = "⚠️ "
}

Write-Host "  $statusIcon $overallStatus" -ForegroundColor $statusColor
Write-Host ""
Write-Host "  Total Checks:     $script:totalChecks" -ForegroundColor White
Write-Host "  Passed:           $script:passedChecks ✅" -ForegroundColor Green
Write-Host "  Failed:           $script:failedChecks ❌" -ForegroundColor $(if ($script:failedChecks -gt 0) { "Red" } else { "Gray" })
Write-Host "  Warnings:         $script:warningChecks ⚠️ " -ForegroundColor $(if ($script:warningChecks -gt 0) { "Yellow" } else { "Gray" })
Write-Host ""
Write-Host "  Execution Time:   $executionTimeStr" -ForegroundColor White
Write-Host ""

# Show errors and warnings
if ($script:errors.Count -gt 0) {
    Write-Host "  ❌ Errors:" -ForegroundColor Red
    foreach ($error in $script:errors) {
        Write-Host "     - $error" -ForegroundColor Red
    }
    Write-Host ""
}

if ($script:warnings.Count -gt 0) {
    Write-Host "  ⚠️  Warnings:" -ForegroundColor Yellow
    foreach ($warning in $script:warnings) {
        Write-Host "     - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Recommendations
if ($script:failedChecks -gt 0) {
    Write-Host "  💡 Suggested Actions:" -ForegroundColor Cyan
    Write-Host "     1. Fix errors listed above" -ForegroundColor Gray
    Write-Host "     2. Run with -Verbose flag for detailed output" -ForegroundColor Gray
    Write-Host "     3. Check individual services manually" -ForegroundColor Gray
    Write-Host "     4. Ensure all services are running (supabase start, pnpm dev)" -ForegroundColor Gray
} elseif ($script:warningChecks -gt 0) {
    Write-Host "  💡 System Status:" -ForegroundColor Cyan
    Write-Host "     System is functional but has warnings" -ForegroundColor Gray
    Write-Host "     Review warnings above for potential improvements" -ForegroundColor Gray
} else {
    Write-Host "  🎉 System Status:" -ForegroundColor Cyan
    Write-Host "     All systems operational!" -ForegroundColor Green
    Write-Host "     Ready for: Development, Testing, Deployment" -ForegroundColor Green
}

Write-Host ""
Write-Host "$("=" * 80)" -ForegroundColor Cyan
Write-Host ""

# Exit with appropriate code
if ($script:failedChecks -gt 0) {
    exit 1
} else {
    exit 0
}
