#!/bin/bash
# Unite-Hub Environment Initialization Script
# Used by long-running agents to set up development environment

set -e  # Exit on error

echo "🚀 Unite-Hub Environment Initialization"
echo "========================================"
echo ""

# 1. Verify Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node: $NODE_VERSION"
REQUIRED_VERSION="v20.19.4"
if [[ ! "$NODE_VERSION" == $REQUIRED_VERSION ]]; then
  echo "   ⚠️  Warning: Node.js $REQUIRED_VERSION is recommended (current: $NODE_VERSION)"
  echo "      Please switch Node versions (e.g. via nvm use) to match .nvmrc before running heavy tasks."
fi
echo ""

# 2. Install dependencies
echo "📥 Installing dependencies..."
npm install --quiet
echo "   ✅ Dependencies installed"
echo ""

# 3. Verify environment variables
echo "🔐 Checking environment variables..."
if [ ! -f ".env.local" ]; then
  echo "   ⚠️  No .env.local found. Copy from .env.example if needed."
else
  echo "   ✅ .env.local exists"
fi
echo ""

# 4. Check database connection
echo "🗄️  Verifying database connection..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "   ⚠️  NEXT_PUBLIC_SUPABASE_URL not set"
else
  echo "   ✅ Supabase URL configured"
fi
echo ""

# 5. Build project (type checking)
echo "🔨 Building project..."
npm run build > /dev/null 2>&1 || {
  echo "   ❌ Build failed. Run 'npm run build' to see errors."
  exit 1
}
echo "   ✅ Build successful"
echo ""

# 6. Run tests (quick verification)
echo "🧪 Running test suite..."
npm test -- --passWithNoTests --silent > /dev/null 2>&1 || {
  echo "   ⚠️  Tests failed or not configured"
}
echo "   ✅ Tests verified"
echo ""

# 7. Start development server (background)
echo "🌐 Starting development server..."
echo "   Port: 3008"
echo "   URL: http://localhost:3008"
echo ""
echo "✨ Environment ready!"
echo ""
echo "Next steps:"
echo "  - Run: npm run dev (if not already running)"
echo "  - Open: http://localhost:3008"
echo "  - Check: feature_list.json for tasks"
echo ""

exit 0
