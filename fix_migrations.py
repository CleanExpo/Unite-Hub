#!/usr/bin/env python3
"""
Script to make Synthex migrations 411-427 idempotent by adding DROP statements
before CREATE INDEX, CREATE TRIGGER, and CREATE POLICY statements.
"""

import re
import os
from pathlib import Path

MIGRATIONS_DIR = Path("D:/Unite-Hub/supabase/migrations")

def add_drop_indexes(content):
    """Add DROP INDEX IF EXISTS before CREATE INDEX statements."""
    # Pattern: CREATE INDEX IF NOT EXISTS idx_name
    pattern = r'CREATE INDEX IF NOT EXISTS (idx_[a-z_0-9]+)'

    def replace_func(match):
        idx_name = match.group(1)
        return f'DROP INDEX IF EXISTS {idx_name};\nCREATE INDEX IF NOT EXISTS {idx_name}'

    return re.sub(pattern, replace_func, content)

def add_drop_triggers(content):
    """Add DROP TRIGGER IF EXISTS before CREATE TRIGGER statements."""
    # Pattern: CREATE TRIGGER trigger_name
    #          BEFORE/AFTER ... ON table_name

    # Find all CREATE TRIGGER blocks
    pattern = r'CREATE TRIGGER ([a-z_0-9]+)\s+(?:BEFORE|AFTER).*?ON ([a-z_0-9]+)'

    def replace_func(match):
        trigger_name = match.group(1)
        table_name = match.group(2)
        return f'DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};\nCREATE TRIGGER {trigger_name} {match.group(0)[len("CREATE TRIGGER " + trigger_name):]}'

    return re.sub(pattern, replace_func, content, flags=re.MULTILINE | re.DOTALL)

def add_drop_policies(content):
    """Add DROP POLICY IF EXISTS before CREATE POLICY statements."""
    # Pattern: CREATE POLICY "policy name"
    #          ON table_name

    pattern = r'CREATE POLICY "([^"]+)"\s+ON ([a-z_0-9]+)'

    def replace_func(match):
        policy_name = match.group(1)
        table_name = match.group(2)
        return f'DROP POLICY IF EXISTS "{policy_name}" ON {table_name};\nCREATE POLICY "{policy_name}" ON {table_name}'

    return re.sub(pattern, replace_func, content)

def process_migration_file(filepath):
    """Process a single migration file."""
    print(f"Processing {filepath.name}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Add DROP statements
    content = add_drop_indexes(content)
    content = add_drop_triggers(content)
    content = add_drop_policies(content)

    if content != original_content:
        # Backup original file
        backup_path = filepath.with_suffix('.sql.bak')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)

        # Write updated content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  ✓ Updated {filepath.name} (backup saved)")
        return True
    else:
        print(f"  - No changes needed for {filepath.name}")
        return False

def main():
    """Main function."""
    print("Making Synthex migrations 411-427 idempotent...")
    print("=" * 60)

    # Process files 411-427
    files_to_process = [
        "411_synthex_agent_memory.sql",
        "412_synthex_campaign_schedule.sql",
        "413_synthex_delivery_log.sql",
        "414_synthex_attribution.sql",
        "415_synthex_channel_events.sql",
        "416_synthex_predictive_models.sql",
        "417_synthex_audience_core.sql",
        "418_synthex_audience_scoring.sql",
        "419_synthex_lead_churn_ltv.sql",
        "420_synthex_automation_core.sql",
        "421_synthex_cohort_journey.sql",
        "422_synthex_revenue_attribution.sql",
        "423_synthex_lead_routing.sql",
        "424_synthex_conversation_intel.sql",
        "425_synthex_brand_intelligence.sql",
        "426_synthex_integrations_core.sql",
        "427_synthex_reputation.sql",
    ]

    updated_count = 0
    for filename in files_to_process:
        filepath = MIGRATIONS_DIR / filename
        if filepath.exists():
            if process_migration_file(filepath):
                updated_count += 1
        else:
            print(f"  ✗ File not found: {filename}")

    print("=" * 60)
    print(f"Complete! Updated {updated_count} files.")
    print(f"Backups saved with .sql.bak extension.")

if __name__ == "__main__":
    main()
