#!/bin/bash

# Media Upload API Testing Script
# Run this script to test the media upload endpoint

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3008}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
WORKSPACE_ID="${WORKSPACE_ID:-}"
ORG_ID="${ORG_ID:-}"

echo "=== Media Upload API Test Suite ==="
echo ""

# Check required variables
if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}ERROR: AUTH_TOKEN not set${NC}"
  echo "Usage: AUTH_TOKEN=your_token WORKSPACE_ID=your_workspace ORG_ID=your_org ./test-media-upload.sh"
  exit 1
fi

if [ -z "$WORKSPACE_ID" ]; then
  echo -e "${RED}ERROR: WORKSPACE_ID not set${NC}"
  exit 1
fi

if [ -z "$ORG_ID" ]; then
  echo -e "${RED}ERROR: ORG_ID not set${NC}"
  exit 1
fi

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Workspace: $WORKSPACE_ID"
echo "  Organization: $ORG_ID"
echo ""

# Create test files
echo "Creating test files..."
echo "This is a test document" > test-doc.txt
echo '{"type":"test"}' > test-sketch.json

# Test 1: Successful upload
echo -e "${YELLOW}Test 1: Successful document upload${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/media/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@test-doc.txt" \
  -F "workspace_id=$WORKSPACE_ID" \
  -F "org_id=$ORG_ID" \
  -F "file_type=document" \
  -F 'tags=["test","automated"]')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ PASSED${NC}"
  MEDIA_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Media ID: $MEDIA_ID"
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 2: Missing required field
echo -e "${YELLOW}Test 2: Missing required field (should fail)${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/media/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@test-doc.txt" \
  -F "workspace_id=$WORKSPACE_ID")

if echo "$RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✓ PASSED (correctly rejected)${NC}"
else
  echo -e "${RED}✗ FAILED (should have been rejected)${NC}"
fi
echo ""

# Test 3: Invalid file type
echo -e "${YELLOW}Test 3: Invalid file type (should fail)${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/media/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@test-doc.txt" \
  -F "workspace_id=$WORKSPACE_ID" \
  -F "org_id=$ORG_ID" \
  -F "file_type=invalid")

if echo "$RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✓ PASSED (correctly rejected)${NC}"
else
  echo -e "${RED}✗ FAILED (should have been rejected)${NC}"
fi
echo ""

# Test 4: Wrong file extension for type
echo -e "${YELLOW}Test 4: Wrong file extension (should fail)${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/media/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@test-doc.txt" \
  -F "workspace_id=$WORKSPACE_ID" \
  -F "org_id=$ORG_ID" \
  -F "file_type=video")

if echo "$RESPONSE" | grep -q '"error".*extension'; then
  echo -e "${GREEN}✓ PASSED (correctly rejected)${NC}"
else
  echo -e "${RED}✗ FAILED (should have been rejected)${NC}"
fi
echo ""

# Test 5: Unauthorized request
echo -e "${YELLOW}Test 5: Unauthorized request (should fail)${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/media/upload" \
  -F "file=@test-doc.txt" \
  -F "workspace_id=$WORKSPACE_ID" \
  -F "org_id=$ORG_ID" \
  -F "file_type=document")

if echo "$RESPONSE" | grep -q '"error":"Unauthorized"'; then
  echo -e "${GREEN}✓ PASSED (correctly rejected)${NC}"
else
  echo -e "${RED}✗ FAILED (should have been rejected)${NC}"
fi
echo ""

# Test 6: GET endpoint
echo -e "${YELLOW}Test 6: GET media files for workspace${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/api/media/upload?workspace_id=$WORKSPACE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ PASSED${NC}"
  COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
  echo "  Files found: $COUNT"
else
  echo -e "${RED}✗ FAILED${NC}"
fi
echo ""

# Test 7: Rate limiting (optional - requires 11 rapid requests)
echo -e "${YELLOW}Test 7: Rate limiting (11 rapid uploads)${NC}"
echo "  This may take 30-60 seconds..."
RATE_LIMIT_HIT=false

for i in {1..11}; do
  RESPONSE=$(curl -s -X POST "$API_URL/api/media/upload" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "file=@test-sketch.json" \
    -F "workspace_id=$WORKSPACE_ID" \
    -F "org_id=$ORG_ID" \
    -F "file_type=sketch" \
    -F "tags=[\"rate-test-$i\"]")

  if echo "$RESPONSE" | grep -q '429\|Too many'; then
    RATE_LIMIT_HIT=true
    echo -e "${GREEN}✓ PASSED (rate limit enforced at request $i)${NC}"
    break
  fi

  sleep 0.5  # Small delay between requests
done

if [ "$RATE_LIMIT_HIT" = false ]; then
  echo -e "${YELLOW}⚠ WARNING: Rate limit not hit in 11 requests${NC}"
  echo "  This could mean rate limiting is not working or IP tracking is incorrect"
fi
echo ""

# Cleanup
echo "Cleaning up test files..."
rm -f test-doc.txt test-sketch.json

echo ""
echo "=== Test Suite Complete ==="
echo "Review the results above to ensure all tests passed."
echo ""
echo "Next steps:"
echo "1. Check Supabase Storage for uploaded files"
echo "2. Check media_files table for database records"
echo "3. Check audit_logs table for audit trail"
