#!/usr/bin/env python3
"""
Script to make Synthex migrations 412-427 idempotent by adding DROP statements.
Handles both uppercase and lowercase SQL keywords.
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path("D:/Unite-Hub/supabase/migrations")

def process_migration_file(filepath):
    """Process a single migration file."""
    print(f"Processing {filepath.name}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    modified_lines = []
    i = 0
    changes_made = 0

    while i < len(lines):
        line = lines[i]

        # Handle CREATE INDEX
        if re.match(r'^\s*(create|CREATE) index if not exists (idx_[a-z_0-9]+)', line, re.IGNORECASE):
            match = re.search(r'(idx_[a-z_0-9]+)', line)
            if match:
                idx_name = match.group(1)
                # Add DROP INDEX before CREATE INDEX
                indent = len(line) - len(line.lstrip())
                modified_lines.append(' ' * indent + f'drop index if exists {idx_name};\n')
                changes_made += 1

        # Handle CREATE TRIGGER (need to find table name from same line or next line)
        elif re.match(r'^\s*(create|CREATE) trigger ([a-z_0-9]+)', line, re.IGNORECASE):
            match = re.search(r'trigger ([a-z_0-9]+)', line, re.IGNORECASE)
            if match:
                trigger_name = match.group(1)
                # Look for table name in this line or next few lines
                table_name = None
                for j in range(i, min(i+5, len(lines))):
                    table_match = re.search(r' on ([a-z_0-9]+)', lines[j], re.IGNORECASE)
                    if table_match:
                        table_name = table_match.group(1)
                        break
                if table_name:
                    indent = len(line) - len(line.lstrip())
                    modified_lines.append(' ' * indent + f'drop trigger if exists {trigger_name} on {table_name};\n')
                    changes_made += 1

        # Handle CREATE POLICY
        elif re.match(r'^\s*(create|CREATE) policy "([^"]+)"', line, re.IGNORECASE):
            match = re.search(r'policy "([^"]+)"', line, re.IGNORECASE)
            if match:
                policy_name = match.group(1)
                # Look for table name in this line or next few lines
                table_name = None
                for j in range(i, min(i+5, len(lines))):
                    table_match = re.search(r' on ([a-z_0-9]+)', lines[j], re.IGNORECASE)
                    if table_match:
                        table_name = table_match.group(1)
                        break
                if table_name:
                    indent = len(line) - len(line.lstrip())
                    modified_lines.append(' ' * indent + f'drop policy if exists "{policy_name}" on {table_name};\n')
                    changes_made += 1

        modified_lines.append(line)
        i += 1

    if changes_made > 0:
        # Backup
        backup_path = filepath.with_suffix('.sql.bak')
        with open(backup_path, 'w', encoding='utf-8') as f:
            with open(filepath, 'r', encoding='utf-8') as orig:
                f.write(orig.read())

        # Write modified content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(modified_lines)

        print(f"  -> Updated with {changes_made} DROP statements (backup saved)")
        return True
    else:
        print(f"  -> No changes needed")
        return False

def main():
    """Main function."""
    print("Making Synthex migrations 412-427 idempotent...")
    print("=" * 70)

    files_to_process = [
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
            print(f"  X File not found: {filename}")

    print("=" * 70)
    print(f"Complete! Updated {updated_count} of {len(files_to_process)} files.")
    if updated_count > 0:
        print(f"Backups saved with .sql.bak extension.")

if __name__ == "__main__":
    main()
