# Local Development Setup

Complete guide for setting up and running NodeJS-Starter-V1 locally.

---

## 📋 Prerequisites

### Required Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Docker** | Latest | PostgreSQL + Redis containers | [docker.com](https://docker.com/get-started) |
| **Node.js** | 20+ | Frontend runtime | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 9+ | Package manager | `npm install -g pnpm` |
| **Python** | 3.12+ | Backend runtime | [python.org](https://python.org/) |
| **uv** | Latest | Python package manager | `pip install uv` |
| **Ollama** | Latest | Local AI models | [ollama.com](https://ollama.com/) |

### Verify Installation

```bash
# Check versions
docker --version          # Should be 24.0+
node --version           # Should be v20+
pnpm --version           # Should be 9+
python --version         # Should be 3.12+
uv --version            # Should be latest
ollama --version        # Should be latest

# Verify Docker is running
docker ps               # Should show running containers (or empty list)
```

---

## 🚀 Quick Setup

### Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/CleanExpo/NodeJS-Starter-V1.git
cd NodeJS-Starter-V1

# Run automated setup
pnpm run setup          # Unix/macOS
pnpm run setup:windows  # Windows

# Start development
pnpm dev
```

The setup script will:
1. Install dependencies (pnpm, uv)
2. Copy .env.example to .env
3. Start Docker services (PostgreSQL, Redis)
4. Pull Ollama models (llama3.1:8b, nomic-embed-text)
5. Run database migrations
6. Verify all services are running

---

## 🔧 Manual Setup

If you prefer manual setup or automated setup fails:

### 1. Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd apps/backend
uv sync
cd ../..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# No changes needed for local development!
# The defaults work out of the box
```

### 3. Start Docker Services

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Verify services are running
docker compose ps

# Check logs if needed
docker compose logs postgres
docker compose logs redis
```

### 4. Setup Ollama

```bash
# Install Ollama (if not already installed)
# macOS/Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/

# Pull required models
ollama pull llama3.1:8b         # ~4.7GB, generation model
ollama pull nomic-embed-text    # ~274MB, embeddings model

# Start Ollama service (if not running)
ollama serve
```

### 5. Initialize Database

```bash
# Database is automatically initialized via init-db.sql
# Check if it worked:
docker compose exec postgres psql -U starter_user -d starter_db -c "\dt"

# You should see tables: users, contractors, availability_slots, documents
```

### 6. Start Development Servers

```bash
# Start all services
pnpm dev

# Or start individually:
pnpm dev --filter=web                                           # Frontend only
cd apps/backend && uv run uvicorn src.api.main:app --reload    # Backend only
```

---

## 🐳 Docker Services

### PostgreSQL

**Container**: `nodejs-starter-postgres`
**Port**: 5432
**Database**: starter_db
**User**: starter_user
**Password**: local_dev_password

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U starter_user -d starter_db

# Run SQL commands
\dt                              # List tables
\d users                         # Describe users table
SELECT * FROM users;             # Query users

# Exit psql
\q
```

### Redis

**Container**: `nodejs-starter-redis`
**Port**: 6379

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Redis commands
PING                    # Should return PONG
KEYS *                  # List all keys
GET mykey              # Get value
SET mykey "value"      # Set value
```

### Managing Docker Services

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f              # All services
docker compose logs -f postgres     # PostgreSQL only

# Reset database (DANGER: destroys all data)
docker compose down -v
docker compose up -d
```

---

## 🧪 Ollama Configuration

### Default Models

| Model | Size | Purpose | Pull Command |
|-------|------|---------|--------------|
| llama3.1:8b | 4.7GB | Text generation | `ollama pull llama3.1:8b` |
| nomic-embed-text | 274MB | Embeddings | `ollama pull nomic-embed-text` |

### Using Different Models

Edit `.env` to change models:

```env
# Faster but less capable
OLLAMA_MODEL=llama3.1:8b

# Larger, more capable (requires 16GB RAM)
OLLAMA_MODEL=llama3.1:70b

# Smaller, faster (good for testing)
OLLAMA_MODEL=phi3:mini
```

### List Available Models

```bash
# List downloaded models
ollama list

# List all available models
ollama search llama

# Pull a specific model
ollama pull <model-name>

# Remove a model
ollama rm <model-name>
```

### Test Ollama

```bash
# Run a test query
ollama run llama3.1:8b "Hello, how are you?"

# Generate embeddings
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "Hello world"}'
```

---

## 🔍 Verification

### Health Checks

```bash
# Check all services
curl http://localhost:8000/health          # Backend
curl http://localhost:3000                 # Frontend
curl http://localhost:11434/api/tags       # Ollama

# Check database connection
docker compose exec postgres pg_isready -U starter_user -d starter_db

# Check Redis
docker compose exec redis redis-cli PING
```

### Test Authentication

```bash
# Login with default admin user
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"admin123"}'

# Should return JWT token
```

### Test AI Provider

```bash
# Test Ollama provider
curl -X POST http://localhost:8000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello","provider":"ollama"}'
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Error**: `Address already in use`

```bash
# Find what's using the port
lsof -i :3000   # Frontend
lsof -i :8000   # Backend
lsof -i :5432   # PostgreSQL

# Kill the process
kill -9 <PID>

# Or change ports in .env
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:8001
```

### Docker Issues

**Error**: `Cannot connect to Docker daemon`

```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker

# Verify Docker is running
docker ps
```

**Error**: `Container name already in use`

```bash
# Remove old containers
docker compose down
docker compose rm -f

# Start fresh
docker compose up -d
```

### PostgreSQL Connection Failed

**Error**: `could not connect to server`

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Wait for health check
docker compose ps
# STATUS should show "healthy"
```

### Ollama Not Responding

**Error**: `Connection refused on port 11434`

```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama service
ollama serve

# Or restart Ollama
pkill ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### Models Not Found

**Error**: `model 'llama3.1:8b' not found`

```bash
# List downloaded models
ollama list

# Pull missing model
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# Verify download
ollama list
```

### Database Schema Missing

**Error**: `relation "users" does not exist`

```bash
# Check if init-db.sql ran
docker compose logs postgres | grep "Initialization Complete"

# If not, recreate database
docker compose down -v
docker compose up -d

# Wait for initialization
docker compose logs -f postgres
```

### Python Package Issues

**Error**: `ModuleNotFoundError`

```bash
# Sync Python dependencies
cd apps/backend
uv sync

# Clear cache and reinstall
rm -rf .venv
uv sync
```

### Frontend Build Errors

**Error**: Type errors during build

```bash
# Clear cache
rm -rf .next node_modules
pnpm install

# Run type check
pnpm type-check --filter=web

# Check for errors
pnpm lint --filter=web
```

---

## 📊 Performance Tips

### Development Mode

```bash
# Use fast refresh for frontend
# Already enabled in Next.js 15

# Use --reload for backend hot reload
# Already in pnpm dev script

# Disable type checking for faster builds (development only)
# Edit next.config.js: typescript: { ignoreBuildErrors: true }
```

### Resource Usage

**Typical Resource Requirements:**
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB for models + dependencies
- **CPU**: 4 cores minimum

**Reduce Resource Usage:**

```bash
# Use smaller Ollama model
OLLAMA_MODEL=phi3:mini  # Only 2.3GB

# Limit Docker memory
# Edit docker-compose.yml, add under postgres:
deploy:
  resources:
    limits:
      memory: 512M

# Close unused services
docker compose stop redis  # If not using caching
```

---

## 🔄 Daily Workflow

### Starting Development

```bash
# 1. Start Docker services
docker compose up -d

# 2. Start Ollama (if not running)
ollama serve &

# 3. Start dev servers
pnpm dev
```

### Stopping Development

```bash
# 1. Stop dev servers (Ctrl+C)

# 2. Stop Docker services
docker compose down

# 3. Ollama keeps running (optional)
# pkill ollama  # Stop Ollama
```

### Resetting Everything

```bash
# Nuclear option: reset everything
docker compose down -v      # Destroy database
rm -rf node_modules         # Remove frontend deps
rm -rf apps/backend/.venv   # Remove backend deps
pnpm install               # Reinstall
pnpm run setup             # Re-setup
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [PostgreSQL Documentation](https://postgresql.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Need Help?** Check the main README or create an issue on GitHub.
