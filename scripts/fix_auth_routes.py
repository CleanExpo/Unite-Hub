#!/usr/bin/env python3
"""
Script to automatically fix authentication patterns in API routes
Replaces deprecated auth() with authenticateRequest()
"""

import os
import re
from pathlib import Path

# List of files to update (from grep results)
FILES_TO_UPDATE = [
    "src/app/api/clients/[id]/assets/route.ts",
    "src/app/api/clients/[id]/assets/upload/route.ts",
    "src/app/api/clients/[id]/assets/[assetId]/route.ts",
    "src/app/api/clients/[id]/campaigns/duplicate/route.ts",
    "src/app/api/clients/[id]/campaigns/route.ts",
    "src/app/api/clients/[id]/campaigns/[cid]/route.ts",
    "src/app/api/clients/[id]/hooks/route.ts",
    "src/app/api/clients/[id]/mindmap/export/route.ts",
    "src/app/api/clients/[id]/mindmap/route.ts",
    "src/app/api/clients/[id]/mindmap/update/route.ts",
    "src/app/api/clients/[id]/persona/export/route.ts",
    "src/app/api/clients/[id]/persona/history/route.ts",
    "src/app/api/clients/[id]/persona/route.ts",
    "src/app/api/clients/[id]/strategy/export/route.ts",
    "src/app/api/clients/[id]/strategy/platforms/route.ts",
    "src/app/api/clients/[id]/strategy/route.ts",
    "src/app/api/hooks/favorite/route.ts",
    "src/app/api/hooks/search/route.ts",
    "src/app/api/integrations/gmail/callback/route.ts",
    "src/app/api/integrations/gmail/callback-multi/route.ts",
    "src/app/api/integrations/gmail/connect/route.ts",
    "src/app/api/integrations/gmail/connect-multi/route.ts",
    "src/app/api/integrations/gmail/disconnect/route.ts",
    "src/app/api/integrations/gmail/list/route.ts",
    "src/app/api/integrations/gmail/set-primary/route.ts",
    "src/app/api/integrations/gmail/sync-all/route.ts",
    "src/app/api/integrations/gmail/toggle-sync/route.ts",
    "src/app/api/integrations/gmail/update-label/route.ts",
    "src/app/api/integrations/list/route.ts",
    "src/app/api/integrations/outlook/accounts/route.ts",
    "src/app/api/integrations/outlook/calendar/create/route.ts",
    "src/app/api/integrations/outlook/calendar/events/route.ts",
    "src/app/api/integrations/outlook/callback/route.ts",
    "src/app/api/integrations/outlook/connect/route.ts",
    "src/app/api/integrations/outlook/disconnect/route.ts",
    "src/app/api/integrations/outlook/send/route.ts",
    "src/app/api/integrations/outlook/sync/route.ts",
    "src/app/api/organization/clients/route.ts",
    "src/app/api/organizations/create/route.ts",
]

def fix_auth_pattern(content: str) -> tuple[str, bool]:
    """
    Fix authentication pattern in the file content
    Returns: (modified_content, was_modified)
    """
    original = content

    # Replace import statement
    content = re.sub(
        r'import \{ auth \}',
        'import { authenticateRequest }',
        content
    )

    # Replace authentication check pattern
    # Pattern 1: const session = await auth();
    content = re.sub(
        r'const session = await auth\(\);',
        'const authResult = await authenticateRequest(request);',
        content
    )

    # Pattern 2: if (!session?.user?.id) {
    # Replace with if (!authResult) { and add userId extraction
    pattern = r'if \(!session\?\.user\?\.id\) \{\s*return NextResponse\.json\(\s*\{ error: "Unauthorized" \},\s*\{ status: 401 \}\s*\);\s*\}'

    replacement = '''if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = authResult;'''

    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

    # Also handle simpler if statement format
    simple_pattern = r'if \(!session\?\.user\?\.id\) \{'
    if simple_pattern in content and '{ userId }' not in content:
        # Find the closing brace of the if block
        content = re.sub(
            r'(if \(!session\?\.user\?\.id\) \{)',
            r'if (!authResult) {',
            content
        )

    # Check if request parameter exists (sometimes it's "req" instead of "request")
    if 'authenticateRequest(request)' in content and 'request: NextRequest' not in content:
        if 'req: NextRequest' in content:
            content = content.replace('authenticateRequest(request)', 'authenticateRequest(req)')

    return content, (content != original)

def main():
    base_path = Path("D:/Unite-Hub")
    updated_count = 0
    skipped_count = 0
    error_count = 0

    for file_path_str in FILES_TO_UPDATE:
        file_path = base_path / file_path_str

        if not file_path.exists():
            print(f"[WARN] SKIPPED (not found): {file_path_str}")
            skipped_count += 1
            continue

        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Fix auth pattern
            new_content, was_modified = fix_auth_pattern(content)

            if was_modified:
                # Write back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"[OK] UPDATED: {file_path_str}")
                updated_count += 1
            else:
                print(f"[--] NO CHANGE: {file_path_str}")
                skipped_count += 1

        except Exception as e:
            print(f"[ERR] ERROR: {file_path_str} - {e}")
            error_count += 1

    print("\n" + "="*60)
    print(f"Summary:")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total: {len(FILES_TO_UPDATE)}")
    print("="*60)
    print("\nIMPORTANT: Manual verification recommended for each updated file")

if __name__ == "__main__":
    main()
