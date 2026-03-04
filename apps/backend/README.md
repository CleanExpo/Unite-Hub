# Unite-Group CRM — FastAPI Backend

LangGraph Agent Backend with PostgreSQL + pgvector.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (fast Python package manager)
- PostgreSQL + Redis running (`pnpm run docker:up` from repo root)

## Setup

```bash
cd apps/backend

# Install all dependencies (core + dev)
uv sync --all-extras

# Verify installation
uv run python -c "import fastapi; print('FastAPI', fastapi.__version__)"
```

## Development

```bash
# Start the dev server (hot-reload)
uv run uvicorn src.api.main:app --reload --port 8000

# Or from repo root:
pnpm dev --filter=backend
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

## Testing

```bash
# Run all unit tests
uv run pytest

# With coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/test_example.py -v
```

## Linting & Type Checking

```bash
# Lint with ruff
uv run ruff check src/

# Type check with mypy
uv run mypy src/
```

## Project Structure

```
apps/backend/
├── src/
│   ├── api/
│   │   ├── main.py          # FastAPI entry point
│   │   └── routes/          # API route handlers
│   ├── agents/              # LangGraph AI agents
│   ├── auth/
│   │   └── jwt.py           # JWT authentication
│   ├── models/
│   │   └── selector.py      # AI provider selector
│   └── state/               # LangGraph state management
├── tests/                   # pytest test suite
├── pyproject.toml            # Dependencies + tool config
└── README.md                 # This file
```

## Environment Variables

Copy `.env.example` from the repo root (or create `.env` in `apps/backend/`):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL (defaults to `redis://localhost:6379`) |
| `AI_PROVIDER` | No | `ollama` (default) or `anthropic` |
| `OLLAMA_MODEL` | No | Ollama model (default: `llama3.1:8b`) |
| `ANTHROPIC_API_KEY` | No | Required if `AI_PROVIDER=anthropic` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |

## Quick Reference

```bash
uv sync              # Install/update deps
uv run pytest        # Run tests
uv run uvicorn src.api.main:app --reload  # Dev server
uv run ruff check .  # Lint
uv run mypy src/     # Type check
```
