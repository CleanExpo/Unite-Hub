/**
 * Guardian Migration Guard
 *
 * Prevents accidental modification of locked (applied) migrations and
 * enforces additive-only migration policy after v1.0 FINAL.
 *
 * Usage: node -r esbuild-register scripts/guardian/guard-migrations.ts
 * Exit codes:
 *   0 = all checks passed
 *   1 = locked migration modified (FAIL)
 *   2 = new migration doesn't meet standards (FAIL)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface MigrationLock {
  generated_at: string;
  last_migration_number: number;
  migrations: Array<{
    filename: string;
    sha256: string;
    size_bytes: number;
  }>;
}

interface GuardResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  checks_run: number;
}

const MIGRATIONS_DIR = path.join(__dirname, '../../supabase/migrations');
const LOCK_FILE = path.join(__dirname, '../../docs/guardian-migrations.lock.json');
const OVERRIDE_FILE = path.join(__dirname, '../../docs/guardian-freeze-override.txt');
const OVERRIDE_ENV = process.env.GUARDIAN_FREEZE_OVERRIDE === '1';

function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readLockFile(): MigrationLock | null {
  if (!fs.existsSync(LOCK_FILE)) {
    return null;
  }
  try {
    const content = fs.readFileSync(LOCK_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to read lock file: ${error}`);
    return null;
  }
}

function getAllMigrations(): Array<{ filename: string; path: string }> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((filename) => ({
      filename,
      path: path.join(MIGRATIONS_DIR, filename),
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function extractMigrationNumber(filename: string): number {
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : -1;
}

function checkLockedMigrations(result: GuardResult): void {
  const lock = readLockFile();
  if (!lock) {
    result.warnings.push('No migration lock file found. Freeze enforcement requires lock file.');
    return;
  }

  result.checks_run++;

  const locked = new Map(lock.migrations.map((m) => [m.filename, m]));
  const current = getAllMigrations();

  for (const { filename, path: filePath } of current) {
    if (locked.has(filename)) {
      const lockedEntry = locked.get(filename)!;
      const currentHash = getFileHash(filePath);

      if (currentHash !== lockedEntry.sha256) {
        const error = `LOCKED MIGRATION MODIFIED: ${filename}\n` +
          `Expected SHA256: ${lockedEntry.sha256}\n` +
          `Got: ${currentHash}\n\n` +
          `Locked migrations cannot be edited. For emergency fixes:\n` +
          `1. Create a NEW migration with the fix\n` +
          `2. Set GUARDIAN_FREEZE_OVERRIDE=1 and reference ticket\n` +
          `3. Add GUARDIAN_FREEZE_OVERRIDE: TICKET_ID to commit message`;

        result.errors.push(error);
      }
    }
  }
}

function checkNewMigrations(result: GuardResult): void {
  const lock = readLockFile();
  const lastLockedNumber = lock ? lock.last_migration_number : 0;

  result.checks_run++;

  const current = getAllMigrations();
  const newMigrations = current.filter(
    (m) => extractMigrationNumber(m.filename) > lastLockedNumber
  );

  for (const { filename, path: filePath } of newMigrations) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for ADD-ONLY marker
    if (!content.includes('ADD-ONLY: true') && !content.includes('-- ADD-ONLY')) {
      result.warnings.push(
        `New migration ${filename} missing ADD-ONLY marker. Recommend adding: -- ADD-ONLY: true`
      );
    }

    // Check for TENANT_RLS requirement
    if (!content.includes('TENANT_RLS') && !content.includes('get_current_workspace_id')) {
      // Only warn if it looks like a table definition
      if (content.includes('CREATE TABLE')) {
        result.warnings.push(
          `New migration ${filename} creates table but lacks TENANT_RLS/workspace isolation comment`
        );
      }
    }

    // Check for unsafe operations
    const unsafePatterns = [
      { pattern: /ALTER\s+TABLE.*DROP\s+COLUMN/i, msg: 'drops column' },
      { pattern: /ALTER\s+TABLE.*RENAME\s+COLUMN/i, msg: 'renames column' },
      { pattern: /DROP\s+TABLE/i, msg: 'drops table' },
      { pattern: /DROP\s+POLICY/i, msg: 'drops RLS policy' },
    ];

    for (const { pattern, msg } of unsafePatterns) {
      if (pattern.test(content)) {
        result.errors.push(`New migration ${filename} ${msg} — this breaks frozen policy`);
      }
    }
  }
}

function checkOverrideEligibility(result: GuardResult): void {
  result.checks_run++;

  if (OVERRIDE_ENV) {
    // Check for override file or commit message (in CI context)
    const hasOverrideFile = fs.existsSync(OVERRIDE_FILE);
    const commitMsg = process.env.COMMIT_MESSAGE || '';

    if (!hasOverrideFile && !commitMsg.includes('GUARDIAN_FREEZE_OVERRIDE:')) {
      result.warnings.push(
        'GUARDIAN_FREEZE_OVERRIDE set but no ticket reference found. ' +
          'Add GUARDIAN_FREEZE_OVERRIDE: TICKET_ID to commit message or create docs/guardian-freeze-override.txt'
      );
    }

    if (hasOverrideFile) {
      const override = fs.readFileSync(OVERRIDE_FILE, 'utf-8').trim();
      if (!override.includes('|')) {
        result.warnings.push(
          'guardian-freeze-override.txt missing proper format: TICKET_ID | reason'
        );
      }
    }
  }
}

function printBanner(message: string): void {
  const lines = message.split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length));
  const border = '█'.repeat(maxLen + 4);

  console.log('\n' + border);
  lines.forEach((line) => {
    console.log(`█ ${line.padEnd(maxLen)} █`);
  });
  console.log(border + '\n');
}

async function main(): Promise<void> {
  const result: GuardResult = {
    passed: true,
    errors: [],
    warnings: [],
    checks_run: 0,
  };

  console.log('🔒 Guardian Migration Guard v1.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Run checks
  checkLockedMigrations(result);
  checkNewMigrations(result);
  checkOverrideEligibility(result);

  console.log(`✓ Ran ${result.checks_run} checks\n`);

  // Report results
  if (result.errors.length > 0) {
    result.passed = false;
    console.log('❌ ERRORS:\n');
    result.errors.forEach((e) => console.log(`  ${e}\n`));
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    result.warnings.forEach((w) => console.log(`  ${w}`));
    console.log();
  }

  if (OVERRIDE_ENV && result.errors.length === 0) {
    printBanner('⚠️  GUARDIAN_FREEZE_OVERRIDE ENABLED\n  Frozen migration checks bypassed\n  Ensure ticket ID is documented');
  }

  if (result.passed && result.errors.length === 0) {
    console.log('✅ Migration guard passed\n');
    process.exit(0);
  } else {
    console.log('❌ Migration guard FAILED\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Migration guard error:', error);
  process.exit(1);
});
