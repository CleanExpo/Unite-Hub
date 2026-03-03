# NodeJS-Starter-V1 Setup Script for Windows
# Requires PowerShell 5.1 or higher

param(
    [switch]$SkipOllama = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Helper functions
function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================`n" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$CommandName)
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# Main setup script
Write-Header "🚀 NodeJS-Starter-V1 Setup"

Write-Host "This script will set up your development environment."
Write-Host "Estimated time: < 10 minutes"
Write-Host ""

# Step 1: Check prerequisites
Write-Header "Step 1/7: Checking Prerequisites"

$MissingDeps = $false

# Check Docker
if (Test-Command docker) {
    $dockerVersion = (docker --version) -replace '.*version (\d+\.\d+\.\d+).*', '$1'
    Write-Success "Docker installed (version $dockerVersion)"
} else {
    Write-Error "Docker is not installed"
    Write-Host "   Install from: https://docker.com/get-started"
    $MissingDeps = $true
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Success "Docker daemon is running"
} catch {
    Write-Error "Docker daemon is not running"
    Write-Host "   Start Docker Desktop"
    $MissingDeps = $true
}

# Check Node.js
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Success "Node.js installed (version $nodeVersion)"
} else {
    Write-Error "Node.js is not installed"
    Write-Host "   Install from: https://nodejs.org/"
    $MissingDeps = $true
}

# Check pnpm
if (Test-Command pnpm) {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm installed (version $pnpmVersion)"
} else {
    Write-Error "pnpm is not installed"
    Write-Host "   Install: npm install -g pnpm"
    $MissingDeps = $true
}

# Check Python
if (Test-Command python) {
    $pythonVersion = (python --version) -replace 'Python ', ''
    Write-Success "Python installed (version $pythonVersion)"
} else {
    Write-Error "Python is not installed"
    Write-Host "   Install from: https://python.org/"
    $MissingDeps = $true
}

# Check uv
if (Test-Command uv) {
    $uvVersion = (uv --version) -replace '.*uv (\d+\.\d+\.\d+).*', '$1'
    Write-Success "uv installed (version $uvVersion)"
} else {
    Write-Error "uv is not installed"
    Write-Host "   Install: pip install uv"
    $MissingDeps = $true
}

if ($MissingDeps) {
    Write-Error "Missing required dependencies. Please install them and run setup again."
    exit 1
}

Write-Success "All prerequisites installed!"

# Step 2: Install dependencies
Write-Header "Step 2/7: Installing Dependencies"

Write-Info "Installing root dependencies with pnpm..."
try {
    pnpm install --frozen-lockfile
    Write-Success "Root dependencies installed"
} catch {
    Write-Error "Failed to install root dependencies"
    throw
}

Write-Info "Installing backend dependencies with uv..."
try {
    Push-Location apps\backend
    uv sync
    Pop-Location
    Write-Success "Backend dependencies installed"
} catch {
    Pop-Location
    Write-Error "Failed to install backend dependencies"
    throw
}

# Step 3: Configure environment
Write-Header "Step 3/7: Configuring Environment"

if (Test-Path .env) {
    Write-Warning ".env file already exists, skipping copy"
} else {
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Success "Created .env file from .env.example"
    } else {
        Write-Error ".env.example not found"
        exit 1
    }
}

# Step 4: Start Docker services
Write-Header "Step 4/7: Starting Docker Services"

Write-Info "Starting PostgreSQL and Redis containers..."
try {
    docker compose up -d postgres redis
    Write-Success "Docker services started"
} catch {
    Write-Error "Failed to start Docker services"
    throw
}

# Step 5: Wait for PostgreSQL
Write-Header "Step 5/7: Waiting for PostgreSQL"

Write-Info "Waiting for PostgreSQL to be ready..."
$maxRetries = 30
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    try {
        docker compose exec -T postgres pg_isready -U starter_user -d starter_db 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            break
        }
    } catch {
        # Ignore error
    }

    $retryCount++
    if ($retryCount -ge $maxRetries) {
        Write-Host ""
        Write-Error "PostgreSQL failed to start after $maxRetries seconds"
        Write-Host "   Check logs: docker compose logs postgres"
        exit 1
    }

    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Success "PostgreSQL is ready"

# Verify database tables exist
Write-Info "Verifying database schema..."
try {
    $tableCount = docker compose exec -T postgres psql -U starter_user -d starter_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | Out-String
    $tableCount = $tableCount.Trim()

    if ([int]$tableCount -gt 0) {
        Write-Success "Database schema initialized ($tableCount tables found)"
    } else {
        Write-Warning "Database schema appears empty, but init-db.sql should run automatically"
    }
} catch {
    Write-Warning "Could not verify database schema"
}

# Step 6: Setup Ollama
Write-Header "Step 6/7: Setting up Ollama"

if (-not $SkipOllama) {
    if (Test-Command ollama) {
        $ollamaVersion = ollama --version 2>&1 | Select-Object -First 1
        Write-Success "Ollama is installed ($ollamaVersion)"
    } else {
        Write-Warning "Ollama is not installed"
        Write-Host ""
        $response = Read-Host "Would you like to install Ollama now? (y/N)"

        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Info "Please download and install Ollama from: https://ollama.com/"
            Write-Info "After installation, re-run this script."
            exit 0
        } else {
            Write-Warning "Skipping Ollama installation"
            Write-Warning "You can install it later from: https://ollama.com/"
            Write-Host ""
            Write-Info "Continuing setup..."
        }
    }

    # Check if Ollama is running
    if (Test-Command ollama) {
        try {
            $response = Invoke-WebRequest -Uri http://localhost:11434/api/tags -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "Ollama service is running"

                Write-Info "Checking for required models..."

                # Check for llama3.1:8b
                $models = ollama list
                if ($models -match "llama3.1:8b") {
                    Write-Success "Model llama3.1:8b is already downloaded"
                } else {
                    Write-Info "Pulling llama3.1:8b model (this may take a few minutes)..."
                    ollama pull llama3.1:8b
                    Write-Success "Model llama3.1:8b downloaded"
                }

                # Check for nomic-embed-text
                if ($models -match "nomic-embed-text") {
                    Write-Success "Model nomic-embed-text is already downloaded"
                } else {
                    Write-Info "Pulling nomic-embed-text model..."
                    ollama pull nomic-embed-text
                    Write-Success "Model nomic-embed-text downloaded"
                }
            }
        } catch {
            Write-Warning "Ollama is installed but not running"
            Write-Info "Please start Ollama and pull models manually:"
            Write-Host "   ollama serve"
            Write-Host "   ollama pull llama3.1:8b"
            Write-Host "   ollama pull nomic-embed-text"
        }
    } else {
        Write-Warning "Ollama is not installed - skipping model download"
        Write-Info "Install Ollama from: https://ollama.com/"
    }
} else {
    Write-Info "Skipping Ollama setup (-SkipOllama flag provided)"
}

# Step 7: Final verification
Write-Header "Step 7/7: Final Verification"

Write-Info "Running health checks..."

# Check Docker services
try {
    $postgresStatus = docker compose ps postgres | Out-String
    if ($postgresStatus -match "running" -or $postgresStatus -match "healthy") {
        Write-Success "PostgreSQL is running"
    } else {
        Write-Warning "PostgreSQL may not be healthy (check: docker compose ps)"
    }
} catch {
    Write-Warning "Could not check PostgreSQL status"
}

try {
    $redisStatus = docker compose ps redis | Out-String
    if ($redisStatus -match "running") {
        Write-Success "Redis is running"
    } else {
        Write-Warning "Redis may not be running (check: docker compose ps)"
    }
} catch {
    Write-Warning "Could not check Redis status"
}

# Check file structure
if ((Test-Path "apps\backend\pyproject.toml") -and (Test-Path "apps\web\package.json")) {
    Write-Success "Project structure is valid"
} else {
    Write-Error "Project structure appears incomplete"
}

# Check .env file
if (Test-Path ".env") {
    Write-Success "Environment file exists"
} else {
    Write-Warning "Environment file not found"
}

# Setup complete
Write-Header "🎉 Setup Complete!"

Write-Host ""
Write-Host "Your development environment is ready!"
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "  1. Start all services:"
Write-Host "     pnpm dev" -ForegroundColor Green
Write-Host ""
Write-Host "  2. Open in browser:"
Write-Host "     Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "     Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Login with default credentials:"
Write-Host "     Email:    admin@local.dev" -ForegroundColor Cyan
Write-Host "     Password: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:"
Write-Host "  - Local Setup:    docs\LOCAL_SETUP.md"
Write-Host "  - AI Providers:   docs\AI_PROVIDERS.md"
Write-Host "  - Optional:       docs\OPTIONAL_SERVICES.md"
Write-Host ""
Write-Host "Need help? Check the README.md or create an issue on GitHub."
Write-Host ""

Write-Success "Happy coding! 🚀"
Write-Host ""
