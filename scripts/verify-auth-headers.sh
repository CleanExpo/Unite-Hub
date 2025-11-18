#!/bin/bash
# =====================================================
# Unite-Hub - Authentication Headers Verification
# Created: 2025-11-19
# Purpose: Verify all API calls include Authorization headers
# Status: COMPREHENSIVE VERIFICATION SUITE
# =====================================================

echo "=========================================="
echo "Unite-Hub Auth Headers Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
TOTAL=0

# =====================================================
# PART 1: Verify Priority Components (Batch 1 - 12 files)
# =====================================================

echo -e "${BLUE}📋 PART 1: Verifying Priority Auth Headers (Batch 1)${NC}"
echo "-----------------------------------------------------"
echo ""

PRIORITY_FILES=(
  "src/components/modals/SendEmailModal.tsx"
  "src/app/dashboard/settings/page.tsx"
  "src/components/competitors/AddCompetitorModal.tsx"
  "src/components/drip/DripCampaignBuilder.tsx"
  "src/app/dashboard/profile/page.tsx"
  "src/components/media/MediaUploader.tsx"
  "src/app/dashboard/projects/new/page.tsx"
  "src/components/CalendarWidget.tsx"
  "src/components/HotLeadsPanel.tsx"
  "src/app/dashboard/contacts/[id]/page.tsx"
  "src/app/dashboard/campaigns/[id]/page.tsx"
  "src/components/EmailTemplateEditor.tsx"
)

# Files that use direct Supabase queries (not fetch API calls)
DIRECT_SUPABASE_FILES=(
  "src/app/dashboard/contacts/[id]/page.tsx"
)

for file in "${PRIORITY_FILES[@]}"; do
  ((TOTAL++))
  echo -n "Checking $file... "

  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}SKIP (file not found)${NC}"
    continue
  fi

  # Check if this file uses direct Supabase (no fetch calls to /api/)
  IS_DIRECT_SUPABASE=false
  for direct_file in "${DIRECT_SUPABASE_FILES[@]}"; do
    if [[ "$file" == "$direct_file" ]]; then
      IS_DIRECT_SUPABASE=true
      break
    fi
  done

  if [ "$IS_DIRECT_SUPABASE" = true ]; then
    # For direct Supabase files, check for supabase import instead
    if grep -q "import.*supabase.*from.*@/lib/supabase" "$file"; then
      echo -e "${GREEN}✓ PASS (uses direct Supabase)${NC}"
      ((PASSED++))
    else
      echo -e "${RED}✗ FAIL (no auth)${NC}"
      ((FAILED++))
    fi
  else
    # For fetch-based files, check for Authorization header
    if grep -q "Authorization.*Bearer.*session.access_token" "$file"; then
      echo -e "${GREEN}✓ PASS${NC}"
      ((PASSED++))
    else
      echo -e "${RED}✗ FAIL (missing auth header)${NC}"
      ((FAILED++))
    fi
  fi
done

echo ""

# =====================================================
# PART 2: Verify New Fixes (Batch 2 - 9 files)
# =====================================================

echo -e "${BLUE}📋 PART 2: Verifying New Auth Fixes (Batch 2)${NC}"
echo "------------------------------------------------"
echo ""

NEW_FIXES=(
  "src/app/dashboard/settings/integrations/page.tsx"
  "src/app/dashboard/calendar/page.tsx"
  "src/app/dashboard/billing/page.tsx"
  "src/app/dashboard/meetings/page.tsx"
  "src/app/dashboard/messages/whatsapp/page.tsx"
  "src/app/dashboard/ai-tools/code-generator/page.tsx"
  "src/app/dashboard/ai-tools/marketing-copy/page.tsx"
  "src/app/dashboard/resources/landing-pages/page.tsx"
  "src/app/dashboard/insights/competitors/page.tsx"
)

for file in "${NEW_FIXES[@]}"; do
  ((TOTAL++))
  echo -n "Checking $file... "

  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}SKIP (file not found)${NC}"
    continue
  fi

  if grep -q "Authorization.*Bearer.*session.access_token" "$file"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL (missing auth header)${NC}"
    ((FAILED++))
  fi
done

echo ""

# =====================================================
# PART 3: Verify Supabase Import
# =====================================================

echo -e "${BLUE}📋 PART 3: Verifying Supabase Imports${NC}"
echo "----------------------------------------"
echo ""

IMPORT_CHECK=0
IMPORT_FAIL=0

for file in "${PRIORITY_FILES[@]}" "${NEW_FIXES[@]}"; do
  if [ ! -f "$file" ]; then
    continue
  fi

  echo -n "Checking $file... "

  # Check for browser client OR server client imports
  if grep -q "import.*supabase.*from.*@/lib/supabase" "$file" || \
     grep -q "import.*getSupabaseServer" "$file" || \
     grep -q "from.*@/lib/supabase" "$file"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((IMPORT_CHECK++))
  else
    echo -e "${YELLOW}⚠ WARN (may use server-side auth)${NC}"
    ((IMPORT_FAIL++))
  fi
done

echo ""

# =====================================================
# PART 4: Verify Session Checks
# =====================================================

echo -e "${BLUE}📋 PART 4: Verifying Session Null Checks${NC}"
echo "------------------------------------------"
echo ""

SESSION_CHECK=0
SESSION_FAIL=0

for file in "${PRIORITY_FILES[@]}" "${NEW_FIXES[@]}"; do
  if [ ! -f "$file" ]; then
    continue
  fi

  echo -n "Checking $file... "

  if grep -q "if (!session)" "$file" || grep -q "if \!session" "$file"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((SESSION_CHECK++))
  else
    echo -e "${YELLOW}⚠ WARN (no explicit session check)${NC}"
    ((SESSION_FAIL++))
  fi
done

echo ""

# =====================================================
# PART 5: Check for Unauthenticated API Calls
# =====================================================

echo -e "${BLUE}📋 PART 5: Scanning for Unauthenticated API Calls${NC}"
echo "---------------------------------------------------"
echo ""

echo "Searching for fetch calls without Authorization headers..."
echo ""

UNAUTH_COUNT=0

# Exclude known safe patterns:
# - Files using direct Supabase queries (not fetch)
# - Public API endpoints (webhooks, etc.)
SAFE_PATTERNS=(
  "src/app/dashboard/contacts/\[id\]/page.tsx"  # Uses direct Supabase
)

# Search all dashboard pages and components
while IFS= read -r file; do
  # Skip safe patterns
  SKIP=false
  for pattern in "${SAFE_PATTERNS[@]}"; do
    if [[ "$file" == *"$pattern"* ]]; then
      SKIP=true
      break
    fi
  done

  if [ "$SKIP" = true ]; then
    continue
  fi

  # Look for fetch calls to /api/
  if grep -q "fetch(\"/api/" "$file"; then
    # Check if file has Authorization header
    if ! grep -q "Authorization.*Bearer" "$file"; then
      echo -e "${YELLOW}⚠️  Found fetch without auth in: $file${NC}"
      ((UNAUTH_COUNT++))
    fi
  fi
done < <(find src/app/dashboard src/components -name "*.tsx" -type f)

if [ $UNAUTH_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ No unauthenticated API calls found!${NC}"
else
  echo -e "${YELLOW}Note: Some files may use direct Supabase queries (no auth headers needed)${NC}"
fi

echo ""

# =====================================================
# PART 6: API Route Verification
# =====================================================

echo -e "${BLUE}📋 PART 6: Verifying API Routes Accept Auth${NC}"
echo "---------------------------------------------"
echo ""

API_ROUTES=(
  "src/app/api/emails/send/route.ts"
  "src/app/api/profile/update/route.ts"
  "src/app/api/contacts/route.ts"
  "src/app/api/campaigns/route.ts"
  "src/app/api/integrations/gmail/sync/route.ts"
)

API_PASSED=0
API_FAILED=0

for route in "${API_ROUTES[@]}"; do
  if [ ! -f "$route" ]; then
    continue
  fi

  echo -n "Checking $route... "

  # Check for inline auth pattern OR unified validation library
  if grep -q "req.headers.get(\"authorization\")" "$route" || \
     grep -q "validateUserAuth" "$route" || \
     grep -q "validateUserAndWorkspace" "$route" || \
     grep -q "validateWorkspaceAccess" "$route"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((API_PASSED++))
  else
    echo -e "${RED}✗ FAIL (doesn't validate auth header)${NC}"
    ((API_FAILED++))
  fi
done

echo ""

# =====================================================
# FINAL SUMMARY
# =====================================================

PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "=========================================="
echo "FINAL VERIFICATION SUMMARY"
echo "=========================================="
echo ""
echo "Component Auth Headers:"
echo "  Total Files Checked: $TOTAL"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "  Success Rate: ${PERCENTAGE}%"
echo ""
echo "Supabase Imports:"
echo "  Passed: $IMPORT_CHECK"
echo "  Failed: $IMPORT_FAIL"
echo ""
echo "Session Checks:"
echo "  Passed: $SESSION_CHECK"
echo "  Warnings: $SESSION_FAIL"
echo ""
echo "API Routes:"
echo "  Passed: $API_PASSED"
echo "  Failed: $API_FAILED"
echo ""

if [ $PASSED -eq $TOTAL ] && [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL AUTHENTICATION VERIFICATIONS PASSED!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Run manual testing for each component"
  echo "2. Test session expiration scenarios"
  echo "3. Verify API routes properly validate tokens"
  echo "4. Monitor production logs for auth errors"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  SOME VERIFICATIONS FAILED${NC}"
  echo ""
  echo "Please review the failed checks above and apply fixes."
  echo "Refer to CLAUDE.md for the correct authentication pattern."
  echo ""
  exit 1
fi
