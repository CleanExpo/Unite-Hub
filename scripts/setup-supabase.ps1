# Supabase Setup and Verification Script
# PowerShell script to guide through Supabase setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Supabase Setup & Verification Tool  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "[1/8] Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "✗ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Supabase CLI:" -ForegroundColor White
    Write-Host "  npm install -g supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After installing, run this script again." -ForegroundColor White
    exit 1
} else {
    $version = supabase --version
    Write-Host "✓ Supabase CLI installed: $version" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check if logged in
Write-Host "[2/8] Checking Supabase login..." -ForegroundColor Yellow
Write-Host "Attempting to verify login status..." -ForegroundColor Gray

$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Not logged in to Supabase" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please login to Supabase:" -ForegroundColor White
    Write-Host "  supabase login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "This will open a browser for authentication." -ForegroundColor White

    $login = Read-Host "Press Enter to login now, or 'skip' to continue"
    if ($login -ne "skip") {
        supabase login
    }
} else {
    Write-Host "✓ Logged in to Supabase" -ForegroundColor Green
}

Write-Host ""

# Step 3: Check for project link
Write-Host "[3/8] Checking project link..." -ForegroundColor Yellow

if (Test-Path ".\.git\config") {
    $gitConfig = Get-Content ".\.git\config" -Raw
    if ($gitConfig -match "supabase") {
        Write-Host "✓ Project appears to be linked" -ForegroundColor Green
    } else {
        Write-Host "✗ Project not linked to Supabase" -ForegroundColor Red
        Write-Host ""
        Write-Host "You need to link this project to your Supabase project:" -ForegroundColor White
        Write-Host ""
        Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor Gray
        Write-Host "2. Create a new project (or select existing)" -ForegroundColor Gray
        Write-Host "3. Get your project reference (from Project URL: https://xxxxx.supabase.co)" -ForegroundColor Gray
        Write-Host "4. Run: supabase link --project-ref xxxxx" -ForegroundColor Gray
        Write-Host ""

        $projectRef = Read-Host "Enter your Supabase project reference (or 'skip')"
        if ($projectRef -ne "skip" -and $projectRef -ne "") {
            Write-Host "Linking project..." -ForegroundColor Yellow
            supabase link --project-ref $projectRef
        }
    }
}

Write-Host ""

# Step 4: Check migrations
Write-Host "[4/8] Checking migration files..." -ForegroundColor Yellow

$migrations = Get-ChildItem ".\supabase\migrations\*.sql" -ErrorAction SilentlyContinue
if ($migrations.Count -eq 0) {
    Write-Host "✗ No migration files found!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ Found $($migrations.Count) migration files:" -ForegroundColor Green
    foreach ($migration in $migrations) {
        Write-Host "  - $($migration.Name)" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 5: Push migrations
Write-Host "[5/8] Pushing migrations to Supabase..." -ForegroundColor Yellow
Write-Host ""

$pushMigrations = Read-Host "Do you want to push migrations now? (yes/no)"
if ($pushMigrations -eq "yes" -or $pushMigrations -eq "y") {
    Write-Host "Pushing migrations..." -ForegroundColor Yellow
    supabase db push

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migrations pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to push migrations" -ForegroundColor Red
        Write-Host "Check the error messages above." -ForegroundColor White
    }
} else {
    Write-Host "⊘ Skipped migration push" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Check environment file
Write-Host "[6/8] Checking environment configuration..." -ForegroundColor Yellow

$envFile = ".\apps\backend\.env.local"
if (Test-Path $envFile) {
    Write-Host "✓ Found .env.local" -ForegroundColor Green

    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=https://") {
        Write-Host "  ✓ SUPABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ SUPABASE_URL not configured" -ForegroundColor Red
    }

    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ") {
        Write-Host "  ✓ SUPABASE_ANON_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ SUPABASE_ANON_KEY not configured" -ForegroundColor Red
    }
} else {
    Write-Host "✗ .env.local not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create .env.local file:" -ForegroundColor White
    Write-Host "  cd apps\backend" -ForegroundColor Gray
    Write-Host "  cp .env.example .env.local" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then add your Supabase credentials:" -ForegroundColor White
    Write-Host "  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
}

Write-Host ""

# Step 7: Check Python dependencies
Write-Host "[7/8] Checking Python dependencies..." -ForegroundColor Yellow

Push-Location ".\apps\backend"

# Check if uv is installed
$uvInstalled = Get-Command uv -ErrorAction SilentlyContinue
if (-not $uvInstalled) {
    Write-Host "✗ uv not found!" -ForegroundColor Red
    Write-Host "Install uv: https://docs.astral.sh/uv/getting-started/installation/" -ForegroundColor White
    Pop-Location
    exit 1
}

# Check if supabase package is installed
$pyprojectContent = Get-Content "pyproject.toml" -Raw
if ($pyprojectContent -match "supabase") {
    Write-Host "✓ supabase-py dependency found" -ForegroundColor Green
} else {
    Write-Host "✗ supabase-py not installed" -ForegroundColor Red
    Write-Host "Installing supabase-py..." -ForegroundColor Yellow
    uv add supabase
}

Pop-Location

Write-Host ""

# Step 8: Run tests
Write-Host "[8/8] Running integration tests..." -ForegroundColor Yellow
Write-Host ""

$runTests = Read-Host "Do you want to run Supabase integration tests? (yes/no)"
if ($runTests -eq "yes" -or $runTests -eq "y") {
    Write-Host "Starting tests..." -ForegroundColor Yellow
    Write-Host ""

    Push-Location ".\apps\backend"
    uv run pytest tests/test_supabase_integration.py -v
    Pop-Location

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Some tests failed" -ForegroundColor Red
        Write-Host "Check the output above for details." -ForegroundColor White
    }
} else {
    Write-Host "⊘ Skipped tests" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can run tests manually:" -ForegroundColor White
    Write-Host "  cd apps\backend" -ForegroundColor Gray
    Write-Host "  uv run pytest tests/test_supabase_integration.py -v" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Setup Complete!                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Start backend: cd apps\backend && uv run uvicorn src.api.main:app --reload" -ForegroundColor Gray
Write-Host "2. Test API: curl http://localhost:8000/api/contractors/" -ForegroundColor Gray
Write-Host "3. Start frontend: cd apps\web && pnpm dev" -ForegroundColor Gray
Write-Host "4. Open: http://localhost:3000/demo-live" -ForegroundColor Gray
Write-Host ""
Write-Host "See SUPABASE-SETUP.md for complete documentation." -ForegroundColor White
Write-Host ""
