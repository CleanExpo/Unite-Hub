/**
 * Guardian Documentation Completeness Checker
 *
 * Validates that all required FINAL documentation exists and is indexed.
 *
 * Usage: node -r esbuild-register scripts/guardian/check-docs.ts
 * Exit codes:
 *   0 = all required docs present and indexed
 *   1 = missing required docs (FAIL)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOCS_DIR = path.join(__dirname, '../../docs');
const MASTER_INDEX = path.join(DOCS_DIR, 'GUARDIAN_MASTER_INDEX.md');

interface DocCheck {
  name: string;
  path: string;
  exists: boolean;
  indexed: boolean;
  size_bytes?: number;
  error?: string;
}

const REQUIRED_DOCS = [
  {
    name: 'Guardian Master Index',
    file: 'GUARDIAN_MASTER_INDEX.md',
  },
  {
    name: 'Guardian Completion Record',
    file: 'GUARDIAN_COMPLETION_RECORD.md',
  },
  {
    name: 'Guardian Freeze Policy',
    file: 'GUARDIAN_FREEZE_POLICY.md',
  },
  {
    name: 'Guardian Freeze Checklist',
    file: 'GUARDIAN_FREEZE_CHECKLIST.md',
  },
  {
    name: 'Phase G52+ Documentation',
    patterns: ['PHASE_G52_', 'PHASE_G_FINAL'],
  },
  {
    name: 'Phase H06 Documentation',
    patterns: ['PHASE_H06_'],
  },
  {
    name: 'Phase I04 Documentation',
    patterns: ['PHASE_I04_'],
  },
  {
    name: 'Phase Z FINAL Documentation',
    patterns: ['PHASE_Z_', 'GUARDIAN_Z_FINAL'],
  },
];

function checkDocExists(file: string): DocCheck {
  const fullPath = path.join(DOCS_DIR, file);

  if (!fs.existsSync(fullPath)) {
    return {
      name: file,
      path: fullPath,
      exists: false,
      indexed: false,
      error: 'File not found',
    };
  }

  try {
    const stats = fs.statSync(fullPath);
    return {
      name: file,
      path: fullPath,
      exists: true,
      indexed: false,
      size_bytes: stats.size,
    };
  } catch (error) {
    return {
      name: file,
      path: fullPath,
      exists: false,
      indexed: false,
      error: String(error),
    };
  }
}

function checkDocIndexed(file: string, masterIndex: string): boolean {
  return masterIndex.includes(file) || masterIndex.includes(file.replace('.md', ''));
}

function findDocsByPattern(pattern: string): string[] {
  if (!fs.existsSync(DOCS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.includes(pattern) && f.endsWith('.md'))
    .sort();
}

async function checkDocs(): Promise<void> {
  console.log('📚 Guardian Documentation Completeness Checker v1.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!fs.existsSync(MASTER_INDEX)) {
    console.error('❌ CRITICAL: Guardian Master Index not found!');
    console.error(`   Expected: ${MASTER_INDEX}`);
    process.exit(1);
  }

  const masterIndexContent = fs.readFileSync(MASTER_INDEX, 'utf-8');

  const results: DocCheck[] = [];
  let allPassed = true;

  for (const doc of REQUIRED_DOCS) {
    console.log(`\n🔍 Checking: ${doc.name}`);

    if (doc.file) {
      // Single file check
      const check = checkDocExists(doc.file);
      check.indexed = checkDocIndexed(doc.file, masterIndexContent);

      if (!check.exists) {
        console.log(`  ❌ MISSING: ${doc.file}`);
        allPassed = false;
      } else {
        console.log(`  ✅ Found: ${doc.file} (${check.size_bytes} bytes)`);
        if (check.indexed) {
          console.log(`  ✅ Indexed in GUARDIAN_MASTER_INDEX.md`);
        } else {
          console.log(`  ⚠️  Not indexed in GUARDIAN_MASTER_INDEX.md`);
        }
      }

      results.push(check);
    } else if (doc.patterns) {
      // Pattern-based check
      console.log(`  Searching for: ${doc.patterns.join(' OR ')}`);

      const found: string[] = [];
      for (const pattern of doc.patterns) {
        const matches = findDocsByPattern(pattern);
        found.push(...matches);
      }

      if (found.length === 0) {
        console.log(`  ❌ MISSING: No files matching pattern`);
        allPassed = false;
        results.push({
          name: doc.name,
          path: `${doc.patterns.join(' or ')}`,
          exists: false,
          indexed: false,
          error: 'No matching files found',
        });
      } else {
        found.forEach((file) => {
          const check = checkDocExists(file);
          check.indexed = checkDocIndexed(file, masterIndexContent);

          console.log(`  ✅ Found: ${file}`);
          if (check.indexed) {
            console.log(`     ✅ Indexed`);
          } else {
            console.log(`     ⚠️  Not indexed`);
          }

          results.push(check);
        });
      }
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY\n');

  const summary = {
    total: results.length,
    present: results.filter((r) => r.exists).length,
    missing: results.filter((r) => !r.exists).length,
    indexed: results.filter((r) => r.exists && r.indexed).length,
    not_indexed: results.filter((r) => r.exists && !r.indexed).length,
  };

  console.log(`  Total expected documents: ${summary.total}`);
  console.log(`  Present: ${summary.present}`);
  console.log(`  Missing: ${summary.missing}`);
  console.log(`  Indexed: ${summary.indexed}`);
  console.log(`  Not indexed: ${summary.not_indexed}\n`);

  if (summary.missing > 0) {
    console.log('❌ Documentation check FAILED\n');
    process.exit(1);
  }

  if (summary.not_indexed > 0) {
    console.log('⚠️  Some documents not indexed in GUARDIAN_MASTER_INDEX.md\n');
    console.log('Consider adding links to GUARDIAN_MASTER_INDEX.md\n');
    process.exit(0);
  }

  console.log('✅ Documentation check PASSED\n');
  process.exit(0);
}

checkDocs().catch((error) => {
  console.error('Documentation check error:', error);
  process.exit(1);
});
