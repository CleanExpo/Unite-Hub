#!/usr/bin/env python3
"""
Script to add authentication to remaining routes that lack it
"""

import os
import re
from pathlib import Path

# Remaining routes that need authentication
REMAINING_ROUTES_TO_FIX = [
    # Approvals
    "src/app/api/approvals/route.ts",
    "src/app/api/approvals/[id]/approve/route.ts",
    "src/app/api/approvals/[id]/decline/route.ts",
    "src/app/api/approvals/[id]/route.ts",

    # Calendar
    "src/app/api/calendar/availability/route.ts",
    "src/app/api/calendar/create-meeting/route.ts",
    "src/app/api/calendar/detect-meeting/route.ts",
    "src/app/api/calendar/events/route.ts",
    "src/app/api/calendar/suggest-times/route.ts",
    "src/app/api/calendar/generate/route.ts",
    "src/app/api/calendar/[postId]/route.ts",
    "src/app/api/calendar/[postId]/approve/route.ts",
    "src/app/api/calendar/[postId]/regenerate/route.ts",

    # Campaigns
    "src/app/api/campaigns/drip/route.ts",
    "src/app/api/campaigns/from-template/route.ts",

    # Competitors
    "src/app/api/competitors/route.ts",
    "src/app/api/competitors/[id]/route.ts",
    "src/app/api/competitors/analyze/route.ts",
    "src/app/api/competitors/analysis/latest/route.ts",
    "src/app/api/competitors/compare/route.ts",

    # Contacts
    "src/app/api/contacts/[contactId]/route.ts",
    "src/app/api/contacts/[contactId]/emails/route.ts",
    "src/app/api/contacts/[contactId]/emails/[emailId]/route.ts",
    "src/app/api/contacts/[contactId]/emails/[emailId]/primary/route.ts",
    "src/app/api/contacts/analyze/route.ts",
    "src/app/api/contacts/delete/route.ts",

    # Email
    "src/app/api/email/link/route.ts",
    "src/app/api/email/oauth/authorize/route.ts",
    "src/app/api/email/oauth/callback/route.ts",
    "src/app/api/email/parse/route.ts",
    "src/app/api/email/send/route.ts",
    "src/app/api/email/sync/route.ts",

    # Emails (different from email)
    "src/app/api/emails/process/route.ts",

    # Images
    "src/app/api/images/generate/route.ts",
    "src/app/api/images/regenerate/route.ts",

    # Sequences
    "src/app/api/sequences/[id]/route.ts",
    "src/app/api/sequences/generate/route.ts",

    # Subscription
    "src/app/api/subscription/[orgId]/route.ts",
    "src/app/api/subscription/cancel/route.ts",
    "src/app/api/subscription/downgrade/route.ts",
    "src/app/api/subscription/invoices/route.ts",
    "src/app/api/subscription/portal/route.ts",
    "src/app/api/subscription/reactivate/route.ts",
    "src/app/api/subscription/upgrade/route.ts",

    # Landing pages (already created but might need fixes)
    "src/app/api/clients/[id]/landing-pages/route.ts",
    "src/app/api/clients/[id]/social-templates/route.ts",
    "src/app/api/clients/[id]/social-templates/seed/route.ts",
]

def add_auth_to_route(content: str) -> tuple[str, bool]:
    """
    Add authentication to route that has rate limiting but no auth
    Returns: (modified_content, was_modified)
    """
    original = content

    # Check if already has authenticateRequest
    if 'authenticateRequest' in content:
        return content, False

    # Add import for authenticateRequest
    if 'import { authenticateRequest }' not in content:
        # Find import from rate-limit and add auth import after it
        import_pattern = r'(import.*from "@/lib/rate-limit";)'
        replacement = r'\1\nimport { authenticateRequest } from "@/lib/auth";'
        content = re.sub(import_pattern, replacement, content)

    # Add authentication check after rate limiting
    auth_block = '''
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;
'''

    # Pattern 1: After rate limiting block in try statement
    pattern1 = r'(  const rateLimitResult = await (?:apiRateLimit|aiAgentRateLimit)\(request\);\s*if \(rateLimitResult\) \{\s*return rateLimitResult;\s*\}\s*)\n'

    if re.search(pattern1, content):
        content = re.sub(pattern1, r'\1' + auth_block + '\n', content, flags=re.MULTILINE | re.DOTALL)

    # Also handle routes with 'req' instead of 'request'
    pattern2 = r'(  const rateLimitResult = await (?:apiRateLimit|aiAgentRateLimit)\(req\);\s*if \(rateLimitResult\) \{\s*return rateLimitResult;\s*\}\s*)\n'

    if re.search(pattern2, content) and 'const { userId } = authResult;' not in content:
        auth_block_req = auth_block.replace('request', 'req')
        content = re.sub(pattern2, r'\1' + auth_block_req + '\n', content, flags=re.MULTILINE | re.DOTALL)

    return content, (content != original)

def main():
    base_path = Path("D:/Unite-Hub")
    updated_count = 0
    skipped_count = 0
    not_found_count = 0
    error_count = 0

    for file_path_str in REMAINING_ROUTES_TO_FIX:
        file_path = base_path / file_path_str

        if not file_path.exists():
            print(f"[WARN] NOT FOUND: {file_path_str}")
            not_found_count += 1
            continue

        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Add auth
            new_content, was_modified = add_auth_to_route(content)

            if was_modified:
                # Write back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"[OK] ADDED AUTH: {file_path_str}")
                updated_count += 1
            else:
                print(f"[--] HAS AUTH/NO CHANGE: {file_path_str}")
                skipped_count += 1

        except Exception as e:
            print(f"[ERR] ERROR: {file_path_str} - {e}")
            error_count += 1

    print("\n" + "="*60)
    print(f"Summary:")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped (already has auth): {skipped_count}")
    print(f"  Not found: {not_found_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total attempted: {len(REMAINING_ROUTES_TO_FIX)}")
    print("="*60)
    print("\nIMPORTANT: Manual verification recommended for each updated file")

if __name__ == "__main__":
    main()
