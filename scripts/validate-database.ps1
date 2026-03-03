# Database Validation Script
# Verifies that all domain memory migrations have been applied correctly

param(
    [switch]$Verbose
)

Write-Host "`n[Validating Domain Memory Database Setup...]" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray

$validationErrors = @()
$validationWarnings = @()

# Check if Supabase is running
Write-Host "`n1. Checking Supabase status..." -ForegroundColor Yellow
try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        $validationErrors += "Supabase is not running. Run 'supabase start' first."
        Write-Host "   [ERROR] Supabase not running" -ForegroundColor Red
    } else {
        Write-Host "   [OK] Supabase is running" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "   $status" -ForegroundColor Gray
        }
    }
} catch {
    $validationErrors += "Failed to check Supabase status: $_"
    Write-Host "   [ERROR] Failed to check status" -ForegroundColor Red
}

# Check migration status
Write-Host "`n2. Checking migration status..." -ForegroundColor Yellow
try {
    $migrations = supabase migration list 2>&1
    # Count lines that contain timestamps (applied migrations)
    $appliedCount = ($migrations | Select-String -Pattern "\d{14}" | Measure-Object).Count

    if ($appliedCount -ge 7) {
        Write-Host "   [OK] All migrations applied ($appliedCount)" -ForegroundColor Green
    } else {
        $validationWarnings += "Only $appliedCount migrations applied (expected 7+)"
        Write-Host "   [WARNING] Only $appliedCount migrations applied" -ForegroundColor Yellow
    }

    if ($Verbose) {
        Write-Host "`n   Migration List:" -ForegroundColor Gray
        Write-Host "   $migrations" -ForegroundColor Gray
    }
} catch {
    $validationErrors += "Failed to check migrations: $_"
    Write-Host "   [ERROR] Failed to check migrations" -ForegroundColor Red
}

# Check vector extension
Write-Host "`n3. Checking pgvector extension..." -ForegroundColor Yellow
try {
    $vectorCheck = supabase db execute "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';" 2>&1

    if ($vectorCheck -match "vector") {
        Write-Host "   [OK] pgvector extension installed" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "   $vectorCheck" -ForegroundColor Gray
        }
    } else {
        $validationErrors += "pgvector extension not installed"
        Write-Host "   [ERROR] pgvector extension missing" -ForegroundColor Red
    }
} catch {
    $validationErrors += "Failed to check vector extension: $_"
    Write-Host "   [ERROR] Failed to check vector extension" -ForegroundColor Red
}

# Check domain memory tables
Write-Host "`n4. Checking domain memory tables..." -ForegroundColor Yellow
$requiredTables = @(
    "domain_memories",
    "domain_knowledge",
    "user_preferences",
    "test_failure_patterns",
    "test_results",
    "debugging_sessions"
)

foreach ($table in $requiredTables) {
    try {
        $tableCheck = supabase db execute "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>&1

        if ($tableCheck -match "t") {
            Write-Host "   [OK] Table '$table' exists" -ForegroundColor Green
        } else {
            $validationErrors += "Table '$table' does not exist"
            Write-Host "   [ERROR] Table '$table' missing" -ForegroundColor Red
        }
    } catch {
        $validationErrors += "Failed to check table '$table': $_"
        Write-Host "   [ERROR] Failed to check '$table'" -ForegroundColor Red
    }
}

# Check domain_memories table structure
Write-Host "`n5. Checking domain_memories table structure..." -ForegroundColor Yellow
try {
    $columns = supabase db execute "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'domain_memories' ORDER BY ordinal_position;" 2>&1

    $requiredColumns = @("id", "domain", "category", "key", "value", "user_id", "source", "tags", "embedding", "relevance_score", "access_count", "created_at", "updated_at")
    $columnCount = ($columns | Select-String -Pattern "column_name" | Measure-Object).Count

    if ($columnCount -gt 0) {
        Write-Host "   [OK] domain_memories has proper structure" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "`n   Columns:" -ForegroundColor Gray
            Write-Host "   $columns" -ForegroundColor Gray
        }
    } else {
        $validationWarnings += "Could not verify domain_memories structure"
        Write-Host "   [WARNING] Could not verify structure" -ForegroundColor Yellow
    }
} catch {
    $validationWarnings += "Failed to check table structure: $_"
    Write-Host "   [WARNING] Failed to check structure" -ForegroundColor Yellow
}

# Check indexes
Write-Host "`n6. Checking indexes..." -ForegroundColor Yellow
try {
    $indexes = supabase db execute "SELECT indexname FROM pg_indexes WHERE tablename = 'domain_memories';" 2>&1
    $indexCount = ($indexes | Select-String -Pattern "idx_" | Measure-Object).Count

    if ($indexCount -gt 0) {
        Write-Host "   [OK] Indexes created ($indexCount found)" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "   $indexes" -ForegroundColor Gray
        }
    } else {
        $validationWarnings += "No indexes found on domain_memories"
        Write-Host "   [WARNING] No indexes found" -ForegroundColor Yellow
    }
} catch {
    $validationWarnings += "Failed to check indexes: $_"
    Write-Host "   [WARNING] Failed to check indexes" -ForegroundColor Yellow
}

# Check RLS policies
Write-Host "`n7. Checking RLS policies..." -ForegroundColor Yellow
try {
    $policies = supabase db execute "SELECT policyname FROM pg_policies WHERE tablename = 'domain_memories';" 2>&1
    $policyCount = ($policies | Select-String -Pattern "policyname" | Measure-Object).Count

    if ($policyCount -gt 0) {
        Write-Host "   [OK] RLS policies configured" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "   $policies" -ForegroundColor Gray
        }
    } else {
        $validationWarnings += "No RLS policies found on domain_memories"
        Write-Host "   [WARNING] No RLS policies found" -ForegroundColor Yellow
    }
} catch {
    $validationWarnings += "Failed to check RLS policies: $_"
    Write-Host "   [WARNING] Failed to check RLS policies" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "`n[Validation Summary:]" -ForegroundColor Cyan

if ($validationErrors.Count -eq 0 -and $validationWarnings.Count -eq 0) {
    Write-Host "`n[OK] All checks passed! Database is properly configured." -ForegroundColor Green
    exit 0
} elseif ($validationErrors.Count -eq 0) {
    Write-Host "`n[WARNING] Validation passed with warnings:" -ForegroundColor Yellow
    foreach ($validationWarning in $validationWarnings) {
        Write-Host "   - $validationWarning" -ForegroundColor Yellow
    }
    exit 0
} else {
    Write-Host "`n[ERROR] Validation failed with errors:" -ForegroundColor Red
    foreach ($validationError in $validationErrors) {
        Write-Host "   - $validationError" -ForegroundColor Red
    }

    if ($validationWarnings.Count -gt 0) {
        Write-Host "`n[WARNING] Warnings:" -ForegroundColor Yellow
        foreach ($validationWarning in $validationWarnings) {
            Write-Host "   - $validationWarning" -ForegroundColor Yellow
        }
    }

    Write-Host "`nSuggested fix: Run 'supabase db reset' to reapply all migrations" -ForegroundColor Cyan
    exit 1
}
