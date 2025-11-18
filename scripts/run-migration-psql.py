#!/usr/bin/env python3
"""
Execute Migration 100: Multi-Agent System Infrastructure
Uses psycopg2 to connect directly to Supabase PostgreSQL
"""

import os
import sys
from pathlib import Path
import subprocess

# Read .env.local file
env_file = Path(__file__).parent.parent / '.env.local'
env_vars = {}

if env_file.exists():
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value.strip('"').strip("'")

# Extract Supabase URL components
supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL', '')
service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not supabase_url:
    print("❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local")
    sys.exit(1)

# Extract project ref from URL (e.g., lksfwktwtmyznckodsau)
project_ref = supabase_url.replace('https://', '').replace('.supabase.co', '')

print(f"🔍 Detected Supabase project: {project_ref}")
print(f"🔍 Supabase URL: {supabase_url}\n")

# Read migration file
migration_path = Path(__file__).parent.parent / 'supabase' / 'migrations' / '100_multi_agent_system.sql'

if not migration_path.exists():
    print(f"❌ Migration file not found: {migration_path}")
    sys.exit(1)

with open(migration_path, 'r', encoding='utf-8') as f:
    migration_sql = f.read()

print(f"✅ Read migration file: {migration_path}")
print(f"   Size: {len(migration_sql) / 1024:.2f} KB\n")

# Ask user for database password
print("=" * 60)
print("MANUAL EXECUTION REQUIRED")
print("=" * 60)
print("\nPlease execute this migration manually:\n")
print("Option 1: Supabase Dashboard (Recommended)")
print("-" * 60)
print(f"1. Go to: {supabase_url.replace('https://', 'https://supabase.com/dashboard/project/')}/editor/sql")
print("2. Click 'New Query'")
print("3. Copy and paste the contents of:")
print(f"   {migration_path}")
print("4. Click 'Run'\n")

print("Option 2: psql command line")
print("-" * 60)
print("1. Get your database password from Supabase Dashboard:")
print(f"   {supabase_url.replace('https://', 'https://supabase.com/dashboard/project/')}/settings/database")
print("2. Run:")
print(f"   psql -h aws-1-ap-southeast-2.pooler.supabase.com \\")
print(f"        -p 5432 \\")
print(f"        -d postgres \\")
print(f"        -U postgres.{project_ref} \\")
print(f"        -f supabase/migrations/100_multi_agent_system.sql\n")

print("=" * 60)
print("\nAfter running the migration, verify with:")
print(f"SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'agent_%';")
print("=" * 60)
