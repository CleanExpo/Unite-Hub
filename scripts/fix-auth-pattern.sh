#!/bin/bash

# Script to replace deprecated auth() pattern with authenticateRequest()
# This fixes implicit OAuth authentication issues across all API routes

echo "Starting authentication pattern replacement..."

# Find all route.ts files using the deprecated pattern
FILES=$(grep -r "const session = await auth()" "D:\Unite-Hub\src\app\api" --include="*.ts" -l)

COUNT=0
for FILE in $FILES; do
  echo "Processing: $FILE"

  # Replace import statement
  sed -i 's/import { auth }/import { authenticateRequest }/g' "$FILE"

  # Replace authentication check pattern
  sed -i 's/const session = await auth();/const authResult = await authenticateRequest(request);/g' "$FILE"

  # Replace the check and early return
  sed -i 's/if (!session\?\.user\?\.id) {/if (!authResult) {/g' "$FILE"

  # Add userId extraction after auth check (this needs manual verification)
  # sed -i '/if (!authResult) {/a\    const { userId, user } = authResult;' "$FILE"

  COUNT=$((COUNT + 1))
done

echo "Updated $COUNT files"
echo "IMPORTANT: Manual verification required for each file to ensure correct userId usage"
