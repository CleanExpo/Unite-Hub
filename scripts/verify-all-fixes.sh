#!/bin/bash
# =====================================================
# Unite-Hub - System Verification Script
# Created: 2025-11-19
# Purpose: Verify all P0 critical fixes are working
# =====================================================

echo "=================================="
echo "Unite-Hub P0 Fixes Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# =====================================================
# 1. CODE FIXES VERIFICATION
# =====================================================

echo "📋 PART 1: Verifying Code Fixes"
echo "--------------------------------"
echo ""

# Fix 1: Contact Creation (.single → .maybeSingle)
echo -n "1. Contact creation fix (.maybeSingle)... "
if grep -q "maybeSingle()" src/components/modals/AddContactModal.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 2: Contact status (new → prospect)
echo -n "2. Contact status fix (prospect)... "
if grep -q 'status: "prospect"' src/components/modals/AddContactModal.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 3: Billing checkout path
echo -n "3. Billing checkout path fix... "
if grep -q '"/api/stripe/checkout"' src/app/dashboard/billing/page.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 4: Billing portal path
echo -n "4. Billing portal path fix... "
if grep -q '"/api/subscription/portal"' src/app/dashboard/billing/page.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 5: ai_score type fix
echo -n "5. ai_score type fix (50)... "
if grep -q "ai_score: 50" src/lib/db.ts; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 6: SIGNED_OUT handler
echo -n "6. SIGNED_OUT event handler... "
if grep -q "if (event === 'SIGNED_OUT')" src/contexts/AuthContext.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 7: Email sending implementation
echo -n "7. Email sending implementation... "
if grep -q 'import { sendEmail }' src/app/api/emails/send/route.ts; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 8: Organization loading timeout
echo -n "8. Organization loading timeout fix... "
if grep -q "loadingTimeout" src/app/dashboard/layout.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 9: SendEmailModal auth header
echo -n "9. SendEmailModal auth header... "
if grep -q "Authorization.*Bearer" src/components/modals/SendEmailModal.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Fix 10: Settings page auth headers
echo -n "10. Settings page auth headers... "
if grep -q "Authorization.*Bearer" src/app/dashboard/settings/page.tsx; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

echo ""
echo "Code Fixes: ${PASSED}/10 passed"
echo ""

# =====================================================
# 2. MIGRATION FILES VERIFICATION
# =====================================================

echo "📋 PART 2: Verifying Migration Files"
echo "-------------------------------------"
echo ""

MIGRATION_PASSED=0
MIGRATION_FAILED=0

# Check Migration 044
echo -n "1. Migration 044 exists... "
if [ -f "supabase/migrations/044_add_missing_columns.sql" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((MIGRATION_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((MIGRATION_FAILED++))
fi

# Check Migration 045
echo -n "2. Migration 045 exists... "
if [ -f "supabase/migrations/045_fix_rls_policies.sql" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((MIGRATION_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((MIGRATION_FAILED++))
fi

# Check Cleanup Script
echo -n "3. Cleanup script exists... "
if [ -f "scripts/database-cleanup-default-org.sql" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((MIGRATION_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((MIGRATION_FAILED++))
fi

echo ""
echo "Migration Files: ${MIGRATION_PASSED}/3 passed"
echo ""

# =====================================================
# 3. DOCUMENTATION VERIFICATION
# =====================================================

echo "📋 PART 3: Verifying Documentation"
echo "-----------------------------------"
echo ""

DOC_PASSED=0
DOC_FAILED=0

# Check execution guide
echo -n "1. Fix execution guide exists... "
if [ -f "FIX_EXECUTION_GUIDE.md" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((DOC_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((DOC_FAILED++))
fi

echo ""
echo "Documentation: ${DOC_PASSED}/1 passed"
echo ""

# =====================================================
# 4. FINAL SUMMARY
# =====================================================

TOTAL_PASSED=$((PASSED + MIGRATION_PASSED + DOC_PASSED))
TOTAL_TESTS=$((10 + 3 + 1))
PERCENTAGE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))

echo "=================================="
echo "FINAL VERIFICATION SUMMARY"
echo "=================================="
echo ""
echo "Total Tests: ${TOTAL_TESTS}"
echo "Passed: ${TOTAL_PASSED}"
echo "Failed: $((TOTAL_TESTS - TOTAL_PASSED))"
echo "Success Rate: ${PERCENTAGE}%"
echo ""

if [ $TOTAL_PASSED -eq $TOTAL_TESTS ]; then
  echo -e "${GREEN}✅ ALL VERIFICATIONS PASSED!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Run database cleanup script in Supabase SQL Editor"
  echo "   (Already created: scripts/database-cleanup-default-org.sql)"
  echo ""
  echo "2. Test critical flows:"
  echo "   - Create a contact"
  echo "   - Send an email"
  echo "   - Test billing upgrade"
  echo "   - Test session expiry (delete localStorage)"
  echo ""
  echo "3. Monitor logs for any errors"
  exit 0
else
  echo -e "${RED}⚠️  SOME VERIFICATIONS FAILED${NC}"
  echo ""
  echo "Please review the failed checks above and ensure all code fixes were applied."
  echo "Refer to FIX_EXECUTION_GUIDE.md for detailed instructions."
  exit 1
fi
