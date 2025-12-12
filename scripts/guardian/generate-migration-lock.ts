/**
 * Guardian Migration Lock Generator
 *
 * Generates a lockfile capturing the state of all Guardian-related migrations.
 * Run this at release cut time to lock the current state.
 *
 * Usage: node -r esbuild-register scripts/guardian/generate-migration-lock.ts
 * Output: docs/guardian-migrations.lock.json
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

const MIGRATIONS_DIR = path.join(__dirname, '../../supabase/migrations');
const LOCK_FILE = path.join(__dirname, '../../docs/guardian-migrations.lock.json');

function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getAllMigrations(): Array<{ filename: string; path: string }> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
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

async function generateLock(): Promise<void> {
  console.log('🔐 Guardian Migration Lock Generator v1.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const migrations = getAllMigrations();
  console.log(`Found ${migrations.length} migrations\n`);

  if (migrations.length === 0) {
    console.error('No migrations found! Cannot generate lock.');
    process.exit(1);
  }

  const lockEntries = migrations.map(({ filename, path: filePath }) => {
    const hash = getFileHash(filePath);
    const size = fs.statSync(filePath).size;

    console.log(`  ${filename} (${size} bytes)`);
    console.log(`    SHA256: ${hash}\n`);

    return {
      filename,
      sha256: hash,
      size_bytes: size,
    };
  });

  const lastMigration = migrations[migrations.length - 1];
  const lastNumber = extractMigrationNumber(lastMigration.filename);

  const lock: MigrationLock = {
    generated_at: new Date().toISOString(),
    last_migration_number: lastNumber,
    migrations: lockEntries,
  };

  // Write lock file
  fs.writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2));

  console.log(`✅ Lock file generated: ${LOCK_FILE}`);
  console.log(`   Last migration: ${lastMigration.filename} (${lastNumber})`);
  console.log(`   Total migrations locked: ${lockEntries.length}\n`);

  console.log('📋 Next steps:');
  console.log('  1. Commit docs/guardian-migrations.lock.json');
  console.log('  2. Tag release (e.g., git tag v1.0.0-FINAL)');
  console.log('  3. Add to GUARDIAN_FREEZE_CHECKLIST.md as completed');
  console.log('  4. Lock this file in docs/GUARDIAN_FREEZE_CHECKLIST.md\n');
}

generateLock().catch((error) => {
  console.error('Error generating lock:', error);
  process.exit(1);
});
