/**
 * Migration Hygiene Verifier (CI)
 *
 * Enforces a single allowed migration filename pattern in `supabase/migrations/`:
 *   `YYYYMMDDHHMMSS_name.sql`
 *
 * Anything else must be moved under:
 *   `supabase/migrations/_quarantine_invalid_names/`
 */

import * as fs from 'fs';
import * as path from 'path';

const VALID_MIGRATION_RE = /^\d{14}_[a-z0-9_]+\.sql$/i;
const quarantineDirName = '_quarantine_invalid_names';

interface HygieneResult {
  passed: boolean;
  invalidSqlFiles: string[];
  nonSqlFiles: string[];
  unexpectedDirs: string[];
  timestampedMigrations: string[];
}

function main() {
  console.log('ÐY"? Migration Hygiene Verifier\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('ƒ?O Migrations directory not found');
    process.exit(1);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });

  const result: HygieneResult = {
    passed: true,
    invalidSqlFiles: [],
    nonSqlFiles: [],
    unexpectedDirs: [],
    timestampedMigrations: [],
  };

  for (const entry of entries) {
    if (entry.name === quarantineDirName) {
      if (!entry.isDirectory()) {
        result.passed = false;
        result.unexpectedDirs.push(`${quarantineDirName} (not a directory)`);
      }
      continue;
    }

    if (entry.isDirectory()) {
      result.passed = false;
      result.unexpectedDirs.push(entry.name);
      continue;
    }

    const fileName = entry.name;
    if (!fileName.toLowerCase().endsWith('.sql')) {
      result.passed = false;
      result.nonSqlFiles.push(fileName);
      continue;
    }

    if (!VALID_MIGRATION_RE.test(fileName)) {
      result.passed = false;
      result.invalidSqlFiles.push(fileName);
      continue;
    }

    result.timestampedMigrations.push(fileName);
  }

  result.timestampedMigrations.sort();

  console.log(`ÐY"< Timestamped migrations: ${result.timestampedMigrations.length}`);
  console.log(`ÐY"? Invalid .sql filenames: ${result.invalidSqlFiles.length}`);
  console.log(`ÐY"? Non-.sql files: ${result.nonSqlFiles.length}`);
  console.log(`ÐY"? Unexpected directories: ${result.unexpectedDirs.length}\n`);

  if (result.unexpectedDirs.length > 0) {
    console.log('ƒ?O Unexpected directories in migrations root:');
    for (const d of result.unexpectedDirs) console.log(`   - ${d}`);
    console.log();
  }

  if (result.nonSqlFiles.length > 0) {
    console.log('ƒ?O Non-.sql files in migrations root:');
    for (const f of result.nonSqlFiles) console.log(`   - ${f}`);
    console.log();
  }

  if (result.invalidSqlFiles.length > 0) {
    console.log('ƒ?O Invalid migration filenames (expected YYYYMMDDHHMMSS_name.sql):');
    for (const f of result.invalidSqlFiles) console.log(`   - ${f}`);
    console.log();
  }

  console.log(`Status: ${result.passed ? 'PASS ƒo.' : 'FAIL ƒ?O'}`);
  if (!result.passed) {
    process.exit(1);
  }
}

main();

