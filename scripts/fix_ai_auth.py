#!/usr/bin/env python3
"""
Script to add authentication to AI routes that currently lack it
"""

import os
import re
from pathlib import Path

# List of AI routes that need authentication added
AI_ROUTES_TO_FIX = [
    "src/app/api/ai/campaign/route.ts",
    "src/app/api/ai/generate-code/route.ts",
    "src/app/api/ai/generate-marketing/route.ts",
    "src/app/api/ai/hooks/route.ts",
    "src/app/api/ai/mindmap/route.ts",
    "src/app/api/ai/strategy/route.ts",
    "src/app/api/ai/persona/route.ts",
    "src/app/api/ai/test-models/route.ts",
    "src/app/api/ai/analyze-stripe/route.ts",
]

def add_auth_to_ai_route(content: str) -> tuple[str, bool]:
    """
    Add authentication to AI route
    Returns: (modified_content, was_modified)
    """
    original = content

    # Check if already has authenticateRequest
    if 'authenticateRequest' in content:
        return content, False

    # Add import for authenticateRequest if not present
    if 'import { authenticateRequest }' not in content:
        # Find the import section and add authenticateRequest
        import_pattern = r'(import.*from "@/lib/rate-limit";)'
        replacement = r'\1\nimport { authenticateRequest } from "@/lib/auth";'
        content = re.sub(import_pattern, replacement, content)

    # Find the rate limiting block and add auth right after
    # Pattern: rate limiting check followed by await rateLimiter.checkLimit()
    auth_insertion = '''
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;
'''

    # Insert auth after rate limiting but before rateLimiter.checkLimit()
    pattern = r'(  const rateLimitResult = await aiAgentRateLimit\(req\);\s*if \(rateLimitResult\) \{\s*return rateLimitResult;\s*\}\s*)\n\s*(// Rate limiting\s*await rateLimiter\.checkLimit\(\);)'

    replacement = r'\1\n' + auth_insertion + r'\n    \2'

    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

    # Also handle routes without rateLimiter.checkLimit()
    if 'const { userId } = authResult;' not in content:
        pattern2 = r'(  const rateLimitResult = await aiAgentRateLimit\(req\);\s*if \(rateLimitResult\) \{\s*return rateLimitResult;\s*\}\s*)\n\s*(const body[^=]*= await req\.json\(\);)'

        replacement2 = r'\1\n' + auth_insertion + r'\n    \2'

        content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE | re.DOTALL)

    return content, (content != original)

def main():
    base_path = Path("D:/Unite-Hub")
    updated_count = 0
    skipped_count = 0
    error_count = 0

    for file_path_str in AI_ROUTES_TO_FIX:
        file_path = base_path / file_path_str

        if not file_path.exists():
            print(f"[WARN] SKIPPED (not found): {file_path_str}")
            skipped_count += 1
            continue

        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Add auth pattern
            new_content, was_modified = add_auth_to_ai_route(content)

            if was_modified:
                # Write back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"[OK] ADDED AUTH: {file_path_str}")
                updated_count += 1
            else:
                print(f"[--] ALREADY HAS AUTH: {file_path_str}")
                skipped_count += 1

        except Exception as e:
            print(f"[ERR] ERROR: {file_path_str} - {e}")
            error_count += 1

    print("\n" + "="*60)
    print(f"Summary:")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total: {len(AI_ROUTES_TO_FIX)}")
    print("="*60)
    print("\nIMPORTANT: Manual verification recommended for each updated file")

if __name__ == "__main__":
    main()
