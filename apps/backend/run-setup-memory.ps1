# Run setup-memory.py with environment variables loaded from .env

# Load .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "Loaded: $name" -ForegroundColor Gray
        }
    }
}

# Change to the backend directory
Set-Location $PSScriptRoot

# Run the Python script
Write-Host "`nRunning setup-memory.py..." -ForegroundColor Cyan
uv run python scripts/setup-memory.py
