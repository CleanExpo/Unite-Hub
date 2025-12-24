#!/usr/bin/env node
/**
 * Migration hygiene check (CI-safe)
 *
 * Enforces:
 * - Only timestamped migration filenames in `supabase/migrations/`
 * - No `.bak`, `.BROKEN`, `.ts`, `.tsx`, etc in migrations root
 *
 * Valid filename pattern: `YYYYMMDDHHMMSS_name.sql`
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const quarantineDirName = '_quarantine_invalid_names';

const VALID_MIGRATION_RE = /^\d{14}_[a-z0-9_]+\.sql$/i;
const FORBIDDEN_EXT_RE = /\.(bak|broken|ts|tsx|js|jsx|map)$/i;

function main() {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });

  const errors = [];
  const warnings = [];

  for (const entry of entries) {
    if (entry.name === quarantineDirName) {
      if (!entry.isDirectory()) {
        errors.push(`Expected ${quarantineDirName} to be a directory`);
      }
      continue;
    }

    if (entry.isDirectory()) {
      errors.push(`Unexpected directory in migrations root: ${entry.name}`);
      continue;
    }

    const fileName = entry.name;

    if (FORBIDDEN_EXT_RE.test(fileName)) {
      errors.push(`Forbidden file type in migrations root: ${fileName}`);
      continue;
    }

    if (!fileName.toLowerCase().endsWith('.sql')) {
      errors.push(`Non-SQL file in migrations root: ${fileName}`);
      continue;
    }

    if (!VALID_MIGRATION_RE.test(fileName)) {
      errors.push(
        `Invalid migration filename (expected YYYYMMDDHHMMSS_name.sql): ${fileName}`,
      );
    }
  }

  const validSqlFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.sql'))
    .filter((e) => VALID_MIGRATION_RE.test(e.name))
    .map((e) => e.name)
    .sort();

  if (validSqlFiles.length === 0) {
    warnings.push('No timestamped migrations found in supabase/migrations/');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Migration hygiene warnings:');
    for (const w of warnings) console.log(`- ${w}`);
    console.log();
  }

  if (errors.length > 0) {
    console.error('❌ Migration hygiene check failed:');
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log(
    `✅ Migration hygiene OK (${validSqlFiles.length} timestamped migration(s))`,
  );
}

main();

