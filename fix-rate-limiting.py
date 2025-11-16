#!/usr/bin/env python3
"""
Script to fix rate limiting parameter issues
"""

import os
import re
from pathlib import Path

def fix_rate_limiting_param(file_path):
    """Fix rate limiting parameter reference"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if doesn't have the problematic pattern
        if 'req || request' not in content:
            return 'skipped', 'no_issue'

        # Find the function signature to get actual parameter name
        function_match = re.search(
            r'export\s+async\s+function\s+(GET|POST|PATCH|DELETE|PUT)\s*\(([^)]*)\)',
            content
        )

        if not function_match:
            return 'failed', 'no_function_found'

        params = function_match.group(2).strip()

        # Determine parameter name
        if not params or params == '':
            # No parameters - need to add NextRequest parameter
            actual_param = 'request: NextRequest'
            param_name = 'request'
            need_to_add_param = True
        else:
            # Has parameters - extract first param name
            param_match = re.search(r'(\w+)\s*:', params)
            if param_match:
                param_name = param_match.group(1)
                need_to_add_param = False
            else:
                # Fallback
                param_name = 'request'
                need_to_add_param = False

        # Replace req || request with actual parameter name
        new_content = content.replace('req || request', param_name)

        # If we need to add parameter, do it
        if need_to_add_param:
            # Add NextRequest import if not present
            if 'import { NextRequest' not in new_content and 'import {NextRequest' not in new_content:
                # Find NextResponse import and add NextRequest
                import_match = re.search(
                    r'import\s*\{\s*NextResponse\s*\}\s*from\s*["\']next/server["\'];?',
                    new_content
                )
                if import_match:
                    new_import = import_match.group(0).replace('NextResponse', 'NextRequest, NextResponse')
                    new_content = new_content.replace(import_match.group(0), new_import)

            # Add parameter to function
            func_sig = function_match.group(0)
            new_func_sig = func_sig.replace('()', f'({actual_param})')
            new_content = new_content.replace(func_sig, new_func_sig)

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return 'fixed', param_name

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

    print(f"Checking {len(route_files)} route files for parameter issues\n")

    results = {
        'fixed': [],
        'skipped': [],
        'failed': [],
        'error': []
    }

    for file_path in sorted(route_files):
        rel_path = file_path.relative_to(api_dir.parent.parent.parent)
        status, detail = fix_rate_limiting_param(file_path)

        results[status].append((str(rel_path), detail))

        if status == 'fixed':
            print(f"[FIXED] {rel_path} [param: {detail}]")
        elif status == 'skipped':
            continue  # Don't print skipped
        elif status == 'failed':
            print(f"[FAIL] {rel_path} [FAILED: {detail}]")
        elif status == 'error':
            print(f"[ERROR] {rel_path} [ERROR: {detail}]")

    # Print summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"Total routes checked: {len(route_files)}")
    print(f"Fixed: {len(results['fixed'])}")
    print(f"Skipped (no issue): {len(results['skipped'])}")
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
