#!/usr/bin/env python3
"""Validate NotebookLM notebooks.json configuration.

Usage:
    python scripts/validate-notebooks.py              # Schema validation only
    python scripts/validate-notebooks.py --check-ids   # Also verify IDs are populated
    python scripts/validate-notebooks.py --dry-run-sync # Preview what a sync note would contain
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / ".claude" / "notebooklm" / "notebooks.json"
REQUIRED_NOTEBOOKS = ["project_sot", "debug_kb", "security_handbook", "repo_onboarding"]


def load_config() -> dict:
    """Load and parse notebooks.json."""
    if not CONFIG_PATH.exists():
        print(f"FAIL: Config file not found: {CONFIG_PATH}")
        sys.exit(1)

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"FAIL: Invalid JSON in {CONFIG_PATH}: {e}")
        sys.exit(1)


def validate_schema(config: dict) -> list[str]:
    """Validate config structure. Returns list of errors."""
    errors = []

    if "project" not in config:
        errors.append("Missing required field: 'project'")
    elif not isinstance(config["project"], str):
        errors.append("Field 'project' must be a string")

    if "notebooks" not in config:
        errors.append("Missing required field: 'notebooks'")
        return errors

    notebooks = config["notebooks"]
    if not isinstance(notebooks, dict):
        errors.append("Field 'notebooks' must be an object")
        return errors

    for key in REQUIRED_NOTEBOOKS:
        if key not in notebooks:
            errors.append(f"Missing required notebook: '{key}'")
            continue

        nb = notebooks[key]
        if not isinstance(nb, dict):
            errors.append(f"Notebook '{key}' must be an object")
            continue

        if "id" not in nb:
            errors.append(f"Notebook '{key}' missing required field: 'id'")
        elif not isinstance(nb["id"], str):
            errors.append(f"Notebook '{key}' field 'id' must be a string")

        if "name" not in nb:
            errors.append(f"Notebook '{key}' missing required field: 'name'")
        elif not isinstance(nb["name"], str):
            errors.append(f"Notebook '{key}' field 'name' must be a string")

    return errors


def check_ids(config: dict) -> list[str]:
    """Verify all notebook IDs are non-empty. Returns list of errors."""
    errors = []
    notebooks = config.get("notebooks", {})

    for key in REQUIRED_NOTEBOOKS:
        nb = notebooks.get(key, {})
        nb_id = nb.get("id", "")
        if not nb_id:
            errors.append(f"Notebook '{key}' has empty ID (run /notebooklm-bootstrap to populate)")

    return errors


def dry_run_sync() -> None:
    """Print a sample sync note without calling nlm."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    try:
        commit_hash = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=5
        ).stdout.strip() or "unknown"
    except Exception:
        commit_hash = "unknown"

    try:
        commit_msg = subprocess.run(
            ["git", "log", "-1", "--format=%s"],
            capture_output=True, text=True, timeout=5
        ).stdout.strip() or "unknown"
    except Exception:
        commit_msg = "unknown"

    try:
        diff_stat = subprocess.run(
            ["git", "diff", "HEAD~1", "--stat"],
            capture_output=True, text=True, timeout=10
        ).stdout.strip() or "No diff available"
    except Exception:
        diff_stat = "No diff available"

    note = f"""## Implementation Note — {now} [{commit_hash}]

**What changed**: {commit_msg}

**Files**:
{diff_stat}

**Follow-ups**:
None detected"""

    print("=== DRY RUN — NotebookLM Sync ===")
    print(f"Target notebook: project_sot")
    print(f"Note title: Sync {now}")
    print()
    print(note)
    print("=== END DRY RUN ===")


def main() -> None:
    args = set(sys.argv[1:])

    if "--dry-run-sync" in args:
        dry_run_sync()
        return

    config = load_config()

    # Schema validation
    errors = validate_schema(config)
    if errors:
        print("FAIL: Schema validation errors:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print(f"OK: Schema valid — project '{config['project']}', {len(REQUIRED_NOTEBOOKS)} notebooks defined")

    # ID check (optional)
    if "--check-ids" in args:
        id_errors = check_ids(config)
        if id_errors:
            print("FAIL: ID validation errors:")
            for e in id_errors:
                print(f"  - {e}")
            sys.exit(1)
        print("OK: All notebook IDs populated")

    print("PASS: All validations succeeded")


if __name__ == "__main__":
    main()
