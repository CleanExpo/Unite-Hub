# Run tests with environment variables loaded from .env

param(
    [string]$TestPattern = "test_memory",
    [switch]$Integration,
    [switch]$Performance,
    [switch]$All
)

# Load .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "Environment variables loaded.`n" -ForegroundColor Green
}

# Change to the backend directory
Set-Location $PSScriptRoot

# Determine which tests to run
if ($All) {
    Write-Host "Running all tests..." -ForegroundColor Cyan
    uv run pytest tests/ -v
} elseif ($Integration) {
    Write-Host "Running integration tests..." -ForegroundColor Cyan
    uv run pytest tests/integration/ -v -m integration
} elseif ($Performance) {
    Write-Host "Running performance tests..." -ForegroundColor Cyan
    uv run pytest tests/performance/ -v -m performance -s
} else {
    Write-Host "Running unit tests matching '$TestPattern'..." -ForegroundColor Cyan
    uv run pytest tests/$TestPattern*.py -v
}

$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed (exit code: $exitCode)" -ForegroundColor Red
}

exit $exitCode
