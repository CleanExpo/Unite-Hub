#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Main setup script
print_header "🚀 NodeJS-Starter-V1 Setup"

echo "This script will set up your development environment."
echo "Estimated time: < 10 minutes"
echo ""

# Step 1: Check prerequisites
print_header "Step 1/7: Checking Prerequisites"

MISSING_DEPS=0

if check_command docker; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
    print_success "Docker installed (version $DOCKER_VERSION)"
else
    print_error "Docker is not installed"
    echo "   Install from: https://docker.com/get-started"
    MISSING_DEPS=1
fi

# Check if Docker daemon is running
if docker ps >/dev/null 2>&1; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    echo "   Start Docker Desktop or run: sudo systemctl start docker"
    MISSING_DEPS=1
fi

if check_command node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed (version $NODE_VERSION)"
else
    print_error "Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    MISSING_DEPS=1
fi

if check_command pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm installed (version $PNPM_VERSION)"
else
    print_error "pnpm is not installed"
    echo "   Install: npm install -g pnpm"
    MISSING_DEPS=1
fi

if check_command python || check_command python3; then
    if check_command python3; then
        PYTHON_CMD=python3
    else
        PYTHON_CMD=python
    fi
    PYTHON_VERSION=$($PYTHON_CMD --version | cut -d ' ' -f2)
    print_success "Python installed (version $PYTHON_VERSION)"
else
    print_error "Python is not installed"
    echo "   Install from: https://python.org/"
    MISSING_DEPS=1
fi

if check_command uv; then
    UV_VERSION=$(uv --version | cut -d ' ' -f2)
    print_success "uv installed (version $UV_VERSION)"
else
    print_error "uv is not installed"
    echo "   Install: pip install uv"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing required dependencies. Please install them and run setup again."
    exit 1
fi

print_success "All prerequisites installed!"

# Step 2: Install dependencies
print_header "Step 2/7: Installing Dependencies"

print_info "Installing root dependencies with pnpm..."
pnpm install --frozen-lockfile

print_success "Root dependencies installed"

print_info "Installing backend dependencies with uv..."
cd apps/backend
uv sync
cd ../..

print_success "Backend dependencies installed"

# Step 3: Configure environment
print_header "Step 3/7: Configuring Environment"

if [ -f .env ]; then
    print_warning ".env file already exists, skipping copy"
else
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_error ".env.example not found"
        exit 1
    fi
fi

# Step 4: Start Docker services
print_header "Step 4/7: Starting Docker Services"

print_info "Starting PostgreSQL and Redis containers..."
docker compose up -d postgres redis

print_success "Docker services started"

# Step 5: Wait for PostgreSQL
print_header "Step 5/7: Waiting for PostgreSQL"

print_info "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! docker compose exec -T postgres pg_isready -U starter_user -d starter_db >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        print_error "PostgreSQL failed to start after $MAX_RETRIES seconds"
        echo "   Check logs: docker compose logs postgres"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""
print_success "PostgreSQL is ready"

# Verify database tables exist
print_info "Verifying database schema..."
TABLE_COUNT=$(docker compose exec -T postgres psql -U starter_user -d starter_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    print_success "Database schema initialized ($TABLE_COUNT tables found)"
else
    print_warning "Database schema appears empty, but init-db.sql should run automatically"
fi

# Step 6: Setup Ollama
print_header "Step 6/7: Setting up Ollama"

if check_command ollama; then
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -n1)
    print_success "Ollama is installed ($OLLAMA_VERSION)"
else
    print_warning "Ollama is not installed"
    echo ""
    read -p "Would you like to install Ollama now? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        print_success "Ollama installed"
    else
        print_warning "Skipping Ollama installation"
        print_warning "You can install it later from: https://ollama.com/"
        echo ""
        print_info "Continuing setup..."
    fi
fi

# Check if Ollama is running
if check_command ollama && curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    print_success "Ollama service is running"

    print_info "Checking for required models..."

    # Check for llama3.1:8b
    if ollama list | grep -q "llama3.1:8b"; then
        print_success "Model llama3.1:8b is already downloaded"
    else
        print_info "Pulling llama3.1:8b model (this may take a few minutes)..."
        ollama pull llama3.1:8b
        print_success "Model llama3.1:8b downloaded"
    fi

    # Check for nomic-embed-text
    if ollama list | grep -q "nomic-embed-text"; then
        print_success "Model nomic-embed-text is already downloaded"
    else
        print_info "Pulling nomic-embed-text model..."
        ollama pull nomic-embed-text
        print_success "Model nomic-embed-text downloaded"
    fi
else
    if check_command ollama; then
        print_warning "Ollama is installed but not running"
        print_info "Starting Ollama service..."

        # Try to start Ollama in background
        nohup ollama serve > /tmp/ollama.log 2>&1 &
        sleep 3

        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            print_success "Ollama service started"

            print_info "Pulling llama3.1:8b model (this may take a few minutes)..."
            ollama pull llama3.1:8b
            print_success "Model llama3.1:8b downloaded"

            print_info "Pulling nomic-embed-text model..."
            ollama pull nomic-embed-text
            print_success "Model nomic-embed-text downloaded"
        else
            print_warning "Failed to start Ollama automatically"
            print_info "You can start it manually with: ollama serve"
            print_info "Then pull models with:"
            echo "   ollama pull llama3.1:8b"
            echo "   ollama pull nomic-embed-text"
        fi
    else
        print_warning "Ollama is not installed - skipping model download"
        print_info "Install Ollama from: https://ollama.com/"
    fi
fi

# Step 7: Final verification
print_header "Step 7/7: Final Verification"

print_info "Running health checks..."

# Check Docker services
if docker compose ps postgres | grep -q "healthy\|running"; then
    print_success "PostgreSQL is running"
else
    print_warning "PostgreSQL may not be healthy (check: docker compose ps)"
fi

if docker compose ps redis | grep -q "running"; then
    print_success "Redis is running"
else
    print_warning "Redis may not be running (check: docker compose ps)"
fi

# Check file structure
if [ -f "apps/backend/pyproject.toml" ] && [ -f "apps/web/package.json" ]; then
    print_success "Project structure is valid"
else
    print_error "Project structure appears incomplete"
fi

# Check .env file
if [ -f ".env" ]; then
    print_success "Environment file exists"
else
    print_warning "Environment file not found"
fi

# Setup complete
print_header "🎉 Setup Complete!"

echo ""
echo "Your development environment is ready!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start all services:"
echo "     pnpm dev"
echo ""
echo "  2. Open in browser:"
echo "     Frontend: http://localhost:3000"
echo "     Backend:  http://localhost:8000"
echo ""
echo "  3. Login with default credentials:"
echo "     Email:    admin@local.dev"
echo "     Password: admin123"
echo ""
echo "Documentation:"
echo "  - Local Setup:    docs/LOCAL_SETUP.md"
echo "  - AI Providers:   docs/AI_PROVIDERS.md"
echo "  - Optional:       docs/OPTIONAL_SERVICES.md"
echo ""
echo "Need help? Check the README.md or create an issue on GitHub."
echo ""

print_success "Happy coding! 🚀"
echo ""
