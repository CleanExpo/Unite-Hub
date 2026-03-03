# New Project Setup Checklist

Quick setup guide for NodeJS-Starter-V1 - your self-contained AI starter template.

**Total Time:** < 10 minutes (zero API keys required)

---

## Prerequisites

Install these tools before starting:

| Tool | Version | Installation |
|------|---------|--------------|
| **Docker** | Latest | [docker.com](https://docker.com/get-started) |
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **Python** | 3.12+ | [python.org](https://python.org/) |
| **uv** | Latest | `pip install uv` |
| **Ollama** | Latest | [ollama.com](https://ollama.com/) |

### Verify Installation

```bash
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

## Quick Setup (3 Steps)

### 1. Clone Repository

```bash
git clone https://github.com/CleanExpo/NodeJS-Starter-V1.git
cd NodeJS-Starter-V1
```

### 2. Run Automated Setup

```bash
# macOS/Linux
pnpm run setup

# Windows
pnpm run setup:windows
```

**What this does:**
- ✅ Installs dependencies (pnpm, uv)
- ✅ Copies `.env.example` to `.env`
- ✅ Starts Docker services (PostgreSQL, Redis)
- ✅ Pulls Ollama models (llama3.1:8b, nomic-embed-text)
- ✅ Runs database migrations
- ✅ Verifies all services are running

**Expected output:**
```
✅ Setup complete! Run 'pnpm dev' to start.
```

### 3. Start Development

```bash
pnpm dev
```

**Services will start on:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Ollama: http://localhost:11434

---

## Verification

Open your browser and verify:

- [ ] **Frontend loads**: http://localhost:3000
- [ ] **API responds**: http://localhost:8000/health
- [ ] **Ollama running**: http://localhost:11434/api/tags

**Test authentication:**
```bash
# Login with default admin user
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"admin123"}'

# Should return JWT token
```

**Test AI provider:**
```bash
curl -X POST http://localhost:8000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello","provider":"ollama"}'
```

---

## What You Get

### Working Out of the Box

- ✅ **Local Database**: PostgreSQL 15 + pgvector in Docker
- ✅ **Local AI**: Ollama with llama3.1:8b (completely free)
- ✅ **Authentication**: JWT-based (no external auth service)
- ✅ **Caching**: Redis for sessions and cache
- ✅ **Development Server**: Frontend + Backend with hot reload
- ✅ **Testing**: Full test suite (unit + integration + E2E)

### Zero External Dependencies

- ❌ No Supabase account needed
- ❌ No Anthropic API key needed
- ❌ No Vercel account needed
- ❌ No cloud services required

### Optional Upgrades (Later)

Want to enhance your app? See `docs/OPTIONAL_SERVICES.md` for:
- Deploying to Vercel/Netlify/DigitalOcean
- Upgrading to Claude API (better quality)
- Adding Sentry, PostHog, Stripe, etc.

---

## Troubleshooting

### Setup Script Fails

**Problem:** Setup script encounters errors

**Solution:**
```bash
# Check prerequisites are installed
docker --version
node --version
pnpm --version
python --version
uv --version
ollama --version

# If missing, install from links in Prerequisites section
```

### Port Already in Use

**Problem:** `Address already in use` error

**Solution:**
```bash
# Find what's using the port
lsof -i :3000   # Frontend
lsof -i :8000   # Backend
lsof -i :5432   # PostgreSQL

# Kill the process
kill -9 <PID>

# Or change ports in .env
```

### Docker Not Running

**Problem:** `Cannot connect to Docker daemon`

**Solution:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker

# Verify Docker is running
docker ps
```

### Ollama Models Not Found

**Problem:** `model 'llama3.1:8b' not found`

**Solution:**
```bash
# List downloaded models
ollama list

# Pull missing models
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# Verify download
ollama list
```

### Database Connection Failed

**Problem:** `could not connect to server`

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Wait for health check
docker compose ps  # STATUS should show "healthy"
```

**More troubleshooting**: See `docs/LOCAL_SETUP.md`

---

## Daily Workflow

### Starting Work

```bash
# 1. Start Docker services
docker compose up -d

# 2. Start Ollama (if not running)
ollama serve &

# 3. Start dev servers
pnpm dev
```

### Stopping Work

```bash
# 1. Stop dev servers (Ctrl+C)

# 2. Stop Docker services
docker compose down

# 3. Ollama keeps running (optional)
# pkill ollama  # Stop Ollama if needed
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

## Essential Commands

### Development

```bash
# Start all services
pnpm dev

# Frontend only
pnpm dev --filter=web

# Backend only
cd apps/backend && uv run uvicorn src.api.main:app --reload
```

### Quality Checks

```bash
# Run all checks (linting, type-check, tests)
pnpm turbo run lint type-check test

# Backend checks
cd apps/backend
uv run ruff check src/      # Linting
uv run mypy src/            # Type checking
uv run pytest --cov         # Tests with coverage

# Frontend checks
pnpm lint --filter=web      # Linting
pnpm type-check --filter=web # Type checking
pnpm test --filter=web      # Tests with coverage
```

### Docker Management

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

### Database Operations

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U starter_user -d starter_db

# Inside psql:
\dt                              # List tables
\d users                         # Describe users table
SELECT * FROM users;             # Query users
\q                              # Exit
```

---

## Next Steps

After setup is complete:

### 1. Explore the Codebase

```
📦 NodeJS-Starter-V1
├── 📂 apps
│   ├── 📂 web                # Next.js frontend
│   │   ├── 📂 app            # App router pages
│   │   ├── 📂 components     # React components
│   │   └── 📂 lib/api        # API client
│   └── 📂 backend            # Python backend
│       ├── 📂 src/agents     # AI agent implementations
│       ├── 📂 src/api        # FastAPI routes
│       └── 📂 src/models     # AI provider layer
├── 📂 scripts                # Setup & utility scripts
└── 📂 docs                   # Documentation
```

### 2. Read Documentation

- `README.md` - Project overview
- `docs/LOCAL_SETUP.md` - Local development guide
- `docs/AI_PROVIDERS.md` - Ollama vs Claude comparison
- `docs/OPTIONAL_SERVICES.md` - Deployment & upgrades

### 3. Customize for Your Project

```bash
# Update project name
# Edit package.json, README.md, etc.

# Customize environment
# Edit .env file (change JWT_SECRET_KEY for production!)

# Add your features
# Modify apps/web/ and apps/backend/ as needed
```

### 4. Optional: Upgrade to Cloud AI

If you want better AI quality:

```bash
# 1. Get Claude API key from https://console.anthropic.com/
# 2. Update .env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# 3. Restart backend
pnpm dev
```

See `docs/AI_PROVIDERS.md` for details.

---

## IDE Setup (Optional)

### VS Code

**Recommended Extensions:**
- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense

**Settings:**
```json
{
  "python.defaultInterpreterPath": "apps/backend/.venv/bin/python",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### PyCharm/IntelliJ

**Configure Python Interpreter:**
- Go to Settings → Project → Python Interpreter
- Point to `apps/backend/.venv/`

---

## Git Hooks (Optional)

**Pre-commit hook** to run checks before committing:

```bash
# Create .git/hooks/pre-commit
#!/bin/sh
pnpm turbo run type-check lint test
```

```bash
# Make it executable
chmod +x .git/hooks/pre-commit
```

---

## Success Checklist

You're ready to start building when:

- [ ] ✅ `pnpm dev` starts all services without errors
- [ ] ✅ Frontend loads at http://localhost:3000
- [ ] ✅ Backend API responds at http://localhost:8000/health
- [ ] ✅ Can login with admin@local.dev / admin123
- [ ] ✅ AI requests work with Ollama
- [ ] ✅ Docker shows healthy containers (`docker compose ps`)
- [ ] ✅ All tests pass (`pnpm turbo run test`)

**Congratulations!** You now have a fully working AI starter template.

---

## Questions?

- **Local Setup Issues**: See `docs/LOCAL_SETUP.md`
- **AI Configuration**: See `docs/AI_PROVIDERS.md`
- **Deployment**: See `docs/OPTIONAL_SERVICES.md`
- **GitHub Issues**: Create an issue on the repository

**Setup time:** ~10 minutes • **Last updated:** January 2026
