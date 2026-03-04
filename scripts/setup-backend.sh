#!/usr/bin/env bash
# Setup script for the FastAPI backend (apps/backend/)
# Usage: bash scripts/setup-backend.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../apps/backend"

echo "=== Unite-Group CRM — Backend Setup ==="

# Check prerequisites
if ! command -v uv &>/dev/null; then
  echo "ERROR: 'uv' is not installed."
  echo "Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
  echo "ERROR: Python 3.12+ is required."
  exit 1
fi

echo "[1/3] Installing dependencies..."
cd "$BACKEND_DIR"
uv sync --all-extras

echo "[2/3] Verifying installation..."
uv run python -c "import fastapi; print('  FastAPI', fastapi.__version__)"
uv run python -c "import sqlalchemy; print('  SQLAlchemy', sqlalchemy.__version__)"

echo "[3/3] Running tests..."
uv run pytest --tb=short -q || echo "  (some tests may require Docker services)"

echo ""
echo "=== Setup complete ==="
echo "  Dev server:  cd apps/backend && uv run uvicorn src.api.main:app --reload"
echo "  Run tests:   cd apps/backend && uv run pytest"
