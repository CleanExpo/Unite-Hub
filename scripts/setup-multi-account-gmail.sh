#!/bin/bash
# Setup script for Multi-Account Gmail Integration

echo "🚀 Setting up Multi-Account Gmail Integration for Unite-Hub"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if migration file exists
echo "📋 Step 1: Checking database migration..."
if [ -f "supabase/migrations/004_email_integrations.sql" ]; then
    echo -e "${GREEN}✓ Migration file found${NC}"
else
    echo -e "${RED}✗ Migration file not found!${NC}"
    exit 1
fi

# Step 2: Check if service files exist
echo ""
echo "📋 Step 2: Checking service files..."
if [ -f "src/lib/integrations/gmail-multi-account.ts" ]; then
    echo -e "${GREEN}✓ Gmail multi-account service found${NC}"
else
    echo -e "${RED}✗ Gmail multi-account service not found!${NC}"
    exit 1
fi

# Step 3: Check if API routes exist
echo ""
echo "📋 Step 3: Checking API routes..."
ROUTES=(
    "src/app/api/integrations/gmail/connect-multi/route.ts"
    "src/app/api/integrations/gmail/callback-multi/route.ts"
    "src/app/api/integrations/gmail/list/route.ts"
    "src/app/api/integrations/gmail/update-label/route.ts"
    "src/app/api/integrations/gmail/set-primary/route.ts"
    "src/app/api/integrations/gmail/toggle-sync/route.ts"
    "src/app/api/integrations/gmail/disconnect/route.ts"
    "src/app/api/integrations/gmail/sync-all/route.ts"
)

MISSING=0
for route in "${ROUTES[@]}"; do
    if [ -f "$route" ]; then
        echo -e "${GREEN}✓${NC} $route"
    else
        echo -e "${RED}✗${NC} $route"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo -e "${RED}✗ Missing $MISSING API routes!${NC}"
    exit 1
fi

# Step 4: Check if UI exists
echo ""
echo "📋 Step 4: Checking UI components..."
if [ -f "src/app/dashboard/settings/integrations/page.tsx" ]; then
    echo -e "${GREEN}✓ Integrations settings page found${NC}"
else
    echo -e "${RED}✗ Integrations settings page not found!${NC}"
    exit 1
fi

# Step 5: Apply database migration
echo ""
echo "📋 Step 5: Database migration"
echo -e "${YELLOW}⚠ Manual step required:${NC}"
echo ""
echo "Please apply the database migration using one of these methods:"
echo ""
echo "Option A - Supabase Dashboard:"
echo "  1. Go to https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to SQL Editor"
echo "  4. Copy contents of: supabase/migrations/004_email_integrations.sql"
echo "  5. Paste and run"
echo ""
echo "Option B - Supabase CLI:"
echo "  $ supabase db push"
echo ""
read -p "Press ENTER when migration is complete..."

# Step 6: Update db.ts
echo ""
echo "📋 Step 6: Update database wrapper (db.ts)"
echo -e "${YELLOW}⚠ Manual step required:${NC}"
echo ""
echo "Please update src/lib/db.ts with the following changes:"
echo ""
echo "1. Add new methods from: src/lib/db-email-integrations-patch.ts"
echo "2. Replace all uses of 'supabaseServer' with:"
echo "   const supabaseServer = getSupabaseServer();"
echo ""
echo "Key methods to add:"
echo "  - emailIntegrations.getByEmail(workspaceId, provider, emailAddress)"
echo "  - emailIntegrations.getPrimary(workspaceId)"
echo "  - sentEmails.getByWorkspace(workspaceId, limit)"
echo ""
read -p "Press ENTER when db.ts is updated..."

# Step 7: Update OAuth callback route
echo ""
echo "📋 Step 7: OAuth callback configuration"
echo -e "${YELLOW}⚠ Decision required:${NC}"
echo ""
echo "Choose one option:"
echo ""
echo "A) Use NEW multi-account routes (recommended)"
echo "   - Update settings page to use /api/integrations/gmail/connect-multi"
echo "   - Set OAuth redirect to: /api/integrations/gmail/callback-multi"
echo ""
echo "B) Update EXISTING routes to support multi-account"
echo "   - Modify existing callback to handle workspaceId"
echo ""
read -p "Press ENTER when callback configuration is done..."

# Step 8: Test installation
echo ""
echo "📋 Step 8: Testing"
echo -e "${YELLOW}⚠ Manual testing required:${NC}"
echo ""
echo "Please test the following:"
echo ""
echo "✓ Connect first Gmail account"
echo "✓ Connect second Gmail account"
echo "✓ Edit account label"
echo "✓ Set primary account"
echo "✓ Toggle sync on/off"
echo "✓ Sync all accounts"
echo "✓ Disconnect an account"
echo ""
read -p "Press ENTER when testing is complete..."

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Multi-Account Gmail Integration Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "  - Full guide: MULTI_ACCOUNT_GMAIL_IMPLEMENTATION.md"
echo "  - Database patch: src/lib/db-email-integrations-patch.ts"
echo ""
echo "🎯 Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Navigate to: http://localhost:3008/dashboard/settings/integrations"
echo "  3. Click 'Connect Gmail Account'"
echo "  4. Authorize and test!"
echo ""
echo "🐛 Troubleshooting:"
echo "  - Check Supabase logs for RLS policy issues"
echo "  - Verify migration applied: Check email_integrations table exists"
echo "  - Review implementation guide for common issues"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
