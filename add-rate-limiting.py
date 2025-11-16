#!/usr/bin/env python3
"""
Script to add rate limiting to all API routes that don't have it
"""

import os
import re
from pathlib import Path

# Rate limiter mappings
RATE_LIMITERS = {
    'strict': {
        'import': 'strictRateLimit',
        'patterns': [
            r'/auth/',
            r'/email/oauth/',
            r'/integrations/.*/callback',
            r'/integrations/.*/authorize',
            r'/integrations/.*/connect',
            r'/demo/',
        ]
    },
    'ai': {
        'import': 'aiAgentRateLimit',
        'patterns': [
            r'/ai/',
            r'/agents/',
            r'/generate',
            r'/analyze',
            r'/regenerate',
        ]
    },
    'public': {
        'import': 'publicRateLimit',
        'patterns': [
            r'/health',
            r'/webhook',
            r'/pixel/',
        ]
    },
    'api': {
        'import': 'apiRateLimit',
        'patterns': [
            r'.*',  # Default for everything else
        ]
    }
}

def get_rate_limiter_for_path(file_path):
    """Determine which rate limiter to use based on file path"""
    rel_path = str(file_path).replace('\\', '/')

    # Check in priority order
    for limiter_type in ['strict', 'ai', 'public', 'api']:
        for pattern in RATE_LIMITERS[limiter_type]['patterns']:
            if re.search(pattern, rel_path):
                return limiter_type

    return 'api'  # Default

def has_rate_limiting(content):
    """Check if file already has rate limiting"""
    return "from '@/lib/rate-limit'" in content or 'from "@/lib/rate-limit"' in content

def add_rate_limiting(file_path):
    """Add rate limiting to a route file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if already has rate limiting
        if has_rate_limiting(content):
            return 'skipped', 'already_has_rate_limiting'

        # Skip if NextAuth route
        if '[...nextauth]' in str(file_path):
            return 'skipped', 'nextauth_route'

        # Determine rate limiter
        limiter_type = get_rate_limiter_for_path(file_path)
        limiter_name = RATE_LIMITERS[limiter_type]['import']

        # Find the import section (before first export)
        import_match = re.search(r'(import.*?from.*?["\'];?\n)+', content, re.MULTILINE | re.DOTALL)
        if not import_match:
            return 'failed', 'no_imports_found'

        import_end = import_match.end()

        # Add rate limit import
        rate_limit_import = f'import {{ {limiter_name} }} from "@/lib/rate-limit";\n'

        # Insert import after existing imports
        new_content = content[:import_end] + rate_limit_import + content[import_end:]

        # Find first function export (GET, POST, PATCH, DELETE, PUT)
        function_match = re.search(
            r'export\s+async\s+function\s+(GET|POST|PATCH|DELETE|PUT)\s*\([^)]*\)\s*\{',
            new_content
        )

        if not function_match:
            return 'failed', 'no_export_function_found'

        function_start = function_match.end()

        # Add rate limiting check after opening brace
        # Count indentation
        indent_match = re.search(r'\n(\s+)', new_content[function_start:function_start+100])
        indent = indent_match.group(1) if indent_match else '  '

        rate_limit_code = f'''
{indent}// Apply rate limiting
{indent}const rateLimitResult = await {limiter_name}(req || request);
{indent}if (rateLimitResult) {{
{indent}  return rateLimitResult;
{indent}}}
'''

        # Insert rate limiting code
        # Find the try block if it exists
        try_match = re.search(r'\n\s*try\s*\{', new_content[function_start:function_start+200])
        if try_match:
            insert_pos = function_start + try_match.end()
        else:
            insert_pos = function_start

        final_content = new_content[:insert_pos] + rate_limit_code + new_content[insert_pos:]

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(final_content)

        return 'success', limiter_name

    except Exception as e:
        return 'error', str(e)

def main():
    """Main function"""
    api_dir = Path('D:/Unite-Hub/src/app/api')

    if not api_dir.exists():
        print(f"Error: API directory not found: {api_dir}")
        return

    # Find all route.ts files
    route_files = list(api_dir.rglob('route.ts'))

    print(f"Found {len(route_files)} route files\n")

    results = {
        'success': [],
        'skipped': [],
        'failed': [],
        'error': []
    }

    for file_path in sorted(route_files):
        rel_path = file_path.relative_to(api_dir.parent.parent.parent)
        status, detail = add_rate_limiting(file_path)

        results[status].append((str(rel_path), detail))

        if status == 'success':
            print(f"[OK] {rel_path} [{detail}]")
        elif status == 'skipped':
            print(f"[SKIP] {rel_path} [{detail}]")
        elif status == 'failed':
            print(f"[FAIL] {rel_path} [FAILED: {detail}]")
        elif status == 'error':
            print(f"[ERROR] {rel_path} [ERROR: {detail}]")

    # Print summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"Total routes: {len(route_files)}")
    print(f"Successfully added rate limiting: {len(results['success'])}")
    print(f"Skipped (already have rate limiting): {len(results['skipped'])}")
    print(f"Failed: {len(results['failed'])}")
    print(f"Errors: {len(results['error'])}")

    if results['failed']:
        print(f"\nFailed routes:")
        for path, reason in results['failed']:
            print(f"  - {path}: {reason}")

    if results['error']:
        print(f"\nError routes:")
        for path, reason in results['error']:
            print(f"  - {path}: {reason}")

if __name__ == '__main__':
    main()
