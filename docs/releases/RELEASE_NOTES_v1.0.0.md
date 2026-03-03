# 🎉 NodeJS-Starter-V1 v1.0.0 - Self-Contained Starter Template

**The first production-ready release!** This template now works completely offline with zero mandatory API keys or external services.

## 🌟 What's New

### ✅ Self-Contained Infrastructure

- **Local PostgreSQL** with Docker Compose (no cloud database required)
- **Local AI** with Ollama (llama3.1:8b) - completely free and offline
- **Simple JWT Auth** - no external auth service needed
- **Redis caching** included out of the box

### 🚀 One-Command Setup

```bash
pnpm run setup
```

That's it! No API keys, no account creation, no configuration files to manage.

### 📦 What's Included

**Backend:**

- FastAPI with async support
- SQLAlchemy 2.0 ORM
- LangGraph agent orchestration
- Dual AI providers (Ollama + optional Claude)
- JWT authentication with bcrypt
- Vector embeddings with pgvector

**Frontend:**

- Next.js 15 with App Router
- React 19 with Server Components
- Tailwind CSS v4
- shadcn/ui components
- Optimized API client

**Infrastructure:**

- Docker Compose (PostgreSQL + Redis)
- Automated setup scripts (Unix/macOS + Windows)
- Comprehensive verification script
- GitHub Actions CI/CD (no external dependencies)

**Documentation:**

- Complete local setup guide
- AI provider comparison (Ollama vs Claude)
- Optional services and deployment guides
- Troubleshooting and FAQs

## 📊 Migration from Cloud-Dependent (Pre-1.0)

### What Changed

| Before                     | After                                |
| -------------------------- | ------------------------------------ |
| Supabase (cloud database)  | PostgreSQL (Docker)                  |
| Anthropic API (required)   | Ollama (default) + Claude (optional) |
| 6+ external services       | Zero external services               |
| 15-20 min setup + API keys | <10 min setup, zero API keys         |

### Breaking Changes

- **Database**: Supabase client replaced with SQLAlchemy
- **Authentication**: Supabase Auth replaced with JWT
- **AI**: Must install Ollama or provide Claude API key
- **Environment**: New `.env` format (see `.env.example`)

## 🎯 Quick Start

```bash
# 1. Clone
git clone https://github.com/CleanExpo/NodeJS-Starter-V1.git
cd NodeJS-Starter-V1

# 2. Setup (automated)
pnpm run setup

# 3. Develop
pnpm dev
```

## 📋 Prerequisites

**Required:**

- Docker Desktop (for PostgreSQL + Redis)
- Node.js 20+ (for frontend)
- pnpm 9+ (package manager)
- Python 3.11+ (for backend)
- uv (Python package manager)

**Optional:**

- Ollama (for local AI) - setup script can install
- Claude API key (for cloud AI)

## 🔧 Available Commands

```bash
# Setup
pnpm run setup              # Automated setup (Unix/macOS)
pnpm run setup:windows      # Automated setup (Windows)
pnpm run verify             # Verify installation

# Development
pnpm dev                    # Start all services
pnpm run docker:up          # Start Docker services
pnpm run docker:down        # Stop Docker services
pnpm run docker:reset       # Reset Docker volumes

# Testing
pnpm turbo run test         # Run all tests
pnpm turbo run type-check   # TypeScript checks
pnpm turbo run lint         # Linting
```

## 📚 Documentation

- **[README.md](README.md)** - Overview and quick start
- **[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)** - Complete local development guide
- **[docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md)** - Ollama vs Claude comparison
- **[docs/OPTIONAL_SERVICES.md](docs/OPTIONAL_SERVICES.md)** - Deployment and upgrades
- **[docs/new-project-checklist.md](docs/new-project-checklist.md)** - Setup checklist

## 🎁 Optional Upgrades

**Want to add cloud services later?**

- Claude API for better AI quality
- Vercel/Netlify for frontend hosting
- DigitalOcean/Railway for backend hosting
- Codecov for coverage tracking
- Snyk for security scanning
- Sentry for error monitoring

See [docs/OPTIONAL_SERVICES.md](docs/OPTIONAL_SERVICES.md) for guides.

## 📈 Stats

- **39 files changed**
- **+6,276 insertions**
- **-1,430 deletions**
- **Setup time:** <10 minutes
- **Cost:** $0 (completely free to run locally)

## 🙏 Credits

Built with:

- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [LangGraph](https://github.com/langchain-ai/langgraph) - Agent orchestration
- [Ollama](https://ollama.com/) - Local AI runtime
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching

## 📝 License

MIT License - feel free to use this template for any project!

---

**Ready to start building?** Clone the repo and run `pnpm run setup`! 🚀
