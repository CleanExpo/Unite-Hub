#!/usr/bin/env node
/**
 * SQL Migration Fix Script
 * Automatically fixes common issues in SQL migration files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');
const BACKUP_DIR = path.join(__dirname, '../supabase/migrations_backup');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const fixes = {
  authSchemaReferences: {
    name: 'Fix auth schema references',
    apply: (content) => {
      let fixed = content;
      let count = 0;

      // Replace auth.users references with proper pattern
      const authUsersPattern = /\bauth\.users\b/gi;
      if (authUsersPattern.test(fixed)) {
        // Comment out the line and add proper alternative
        fixed = fixed.replace(
          /(\s*)(.*\bauth\.users\b.*)/gi,
          (match, indent, line) => {
            count++;
            return `${indent}-- FIXME: Cannot access auth.users directly - use auth.uid() in RLS policies\n${indent}-- ${line}`;
          }
        );
      }

      // Replace direct auth.users FK references
      fixed = fixed.replace(
        /REFERENCES\s+auth\.users\s*\(/gi,
        () => {
          count++;
          return 'REFERENCES auth.users('; // Keep but add comment above
        }
      );

      // Add warning comment before any remaining auth schema references
      const authSchemaPattern = /\bauth\.(profiles|sessions|refresh_tokens)\b/gi;
      if (authSchemaPattern.test(fixed)) {
        fixed = fixed.replace(
          /(\s*)(.*\bauth\.(profiles|sessions|refresh_tokens)\b.*)/gi,
          (match, indent, line) => {
            count++;
            return `${indent}-- WARNING: Accessing auth schema - ensure this is necessary\n${indent}${line}`;
          }
        );
      }

      return { content: fixed, count };
    },
  },

  duplicatePolicyNames: {
    name: 'Fix duplicate policy names',
    apply: (content) => {
      let fixed = content;
      let count = 0;

      // Find all policy names
      const policyRegex = /CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+"?(\w+)"?/gi;
      const policies = [];
      let match;

      while ((match = policyRegex.exec(content)) !== null) {
        policies.push({
          name: match[1],
          table: match[2],
          fullMatch: match[0],
          index: match.index,
        });
      }

      // Group policies by name
      const policyGroups = {};
      policies.forEach(policy => {
        if (!policyGroups[policy.name.toLowerCase()]) {
          policyGroups[policy.name.toLowerCase()] = [];
        }
        policyGroups[policy.name.toLowerCase()].push(policy);
      });

      // Find duplicates and rename
      Object.entries(policyGroups).forEach(([name, group]) => {
        if (group.length > 1) {
          group.forEach((policy, index) => {
            if (index > 0) {
              // Rename duplicates with table name and counter
              const newName = `${policy.name}_${policy.table}_${index}`;
              const oldPattern = new RegExp(
                `CREATE\\s+POLICY\\s+"?${policy.name}"?\\s+ON\\s+"?${policy.table}"?`,
                'i'
              );
              fixed = fixed.replace(oldPattern, `CREATE POLICY "${newName}" ON "${policy.table}"`);
              count++;
            }
          });
        }
      });

      return { content: fixed, count };
    },
  },

  missingSemicolons: {
    name: 'Add missing semicolons',
    apply: (content) => {
      let fixed = content;
      let count = 0;

      // Add semicolon to end of file if missing
      if (content.trim() && !content.trim().endsWith(';')) {
        fixed = fixed.trim() + ';\n';
        count++;
      }

      return { content: fixed, count };
    },
  },

  missingIfExists: {
    name: 'Add IF EXISTS to DROP statements',
    apply: (content) => {
      let fixed = content;
      let count = 0;

      // Add IF EXISTS to DROP statements that don't have it
      fixed = fixed.replace(
        /\bDROP\s+(TABLE|FUNCTION|TRIGGER|INDEX|POLICY)\s+(?!IF\s+EXISTS)/gi,
        (match, type) => {
          count++;
          return `DROP ${type} IF EXISTS `;
        }
      );

      return { content: fixed, count };
    },
  },

  rlsEnforcement: {
    name: 'Add RLS enable for tables',
    apply: (content) => {
      let fixed = content;
      let count = 0;

      // Find CREATE TABLE statements without corresponding RLS enable
      const tableMatches = [...content.matchAll(/CREATE\s+TABLE\s+"?(\w+)"?\s*\(/gi)];

      tableMatches.forEach(match => {
        const tableName = match[1];
        const rlsPattern = new RegExp(
          `ALTER\\s+TABLE\\s+"?${tableName}"?.*ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          'i'
        );

        if (!rlsPattern.test(content)) {
          // Add RLS enable after table creation
          const tablePattern = new RegExp(
            `(CREATE\\s+TABLE\\s+"?${tableName}"?[^;]+;)`,
            'i'
          );

          fixed = fixed.replace(tablePattern, (tableMatch) => {
            count++;
            return `${tableMatch}\n\n-- Enable RLS\nALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;\n`;
          });
        }
      });

      return { content: fixed, count };
    },
  },

  workspaceIsolation: {
    name: 'Add workspace_id to RLS policies',
    apply: (content) => {
      let fixed = content;
      let count = 0;

      // Find RLS policies without workspace_id check
      const policyPattern = /CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+"?(\w+)"?[^;]+;/gi;
      const policies = [...content.matchAll(policyPattern)];

      policies.forEach(match => {
        const policyDef = match[0];
        const tableName = match[2];

        // Skip if policy already has workspace_id or if it's a system table
        if (
          policyDef.includes('workspace_id') ||
          ['audit_logs', 'system_logs', 'migrations'].includes(tableName.toLowerCase())
        ) {
          return;
        }

        // Add workspace_id check to policy
        const updatedPolicy = policyDef.replace(
          /(USING\s*\()/i,
          (match) => {
            count++;
            return `${match}workspace_id = current_setting('app.current_workspace_id')::uuid AND `;
          }
        );

        if (updatedPolicy !== policyDef) {
          fixed = fixed.replace(policyDef, updatedPolicy);
        }
      });

      return { content: fixed, count };
    },
  },
};

function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));

  files.forEach(file => {
    const source = path.join(MIGRATIONS_DIR, file);
    const dest = path.join(BACKUP_DIR, file);
    fs.copyFileSync(source, dest);
  });

  console.log(`${colors.green}✓${colors.reset} Backed up ${files.length} files to ${BACKUP_DIR}\n`);
}

function fixFile(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let fixedContent = content;
  const appliedFixes = [];

  // Apply each fix
  Object.entries(fixes).forEach(([key, fix]) => {
    const result = fix.apply(fixedContent);
    if (result.count > 0) {
      fixedContent = result.content;
      appliedFixes.push({ name: fix.name, count: result.count });
    }
  });

  if (appliedFixes.length > 0 && !dryRun) {
    fs.writeFileSync(filePath, fixedContent, 'utf-8');
  }

  return { changed: appliedFixes.length > 0, fixes: appliedFixes };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipBackup = args.includes('--skip-backup');

  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     SQL Migration Fix Script - Unite-Hub                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  if (dryRun) {
    console.log(`${colors.yellow}Running in DRY RUN mode - no files will be modified${colors.reset}\n`);
  }

  // Create backup unless skipped
  if (!dryRun && !skipBackup) {
    console.log(`${colors.blue}Creating backup...${colors.reset}`);
    createBackup();
  }

  // Get all SQL files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => path.join(MIGRATIONS_DIR, f));

  console.log(`Found ${colors.magenta}${files.length}${colors.reset} migration files\n`);
  console.log(`${colors.blue}Applying fixes...${colors.reset}\n`);

  const stats = {
    total: files.length,
    modified: 0,
    unchanged: 0,
    totalFixes: 0,
    fixCounts: {},
  };

  // Fix each file
  files.forEach(file => {
    const result = fixFile(file, dryRun);

    if (result.changed) {
      stats.modified++;
      const fileName = path.basename(file);
      console.log(`${colors.yellow}➜${colors.reset} ${colors.magenta}${fileName}${colors.reset}`);

      result.fixes.forEach(fix => {
        console.log(`  ${colors.green}✓${colors.reset} ${fix.name}: ${fix.count} fixes`);
        stats.fixCounts[fix.name] = (stats.fixCounts[fix.name] || 0) + fix.count;
        stats.totalFixes += fix.count;
      });

      console.log();
    } else {
      stats.unchanged++;
    }
  });

  // Summary
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Summary:${colors.reset}\n`);
  console.log(`  • ${colors.green}${stats.modified}${colors.reset} files modified`);
  console.log(`  • ${stats.unchanged} files unchanged`);
  console.log(`  • ${colors.magenta}${stats.totalFixes}${colors.reset} total fixes applied\n`);

  console.log(`${colors.cyan}Fixes by type:${colors.reset}`);
  Object.entries(stats.fixCounts).forEach(([name, count]) => {
    console.log(`  • ${name}: ${colors.green}${count}${colors.reset}`);
  });

  if (dryRun) {
    console.log(`\n${colors.yellow}This was a dry run. Run without --dry-run to apply changes.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}✅ All fixes applied successfully!${colors.reset}`);
    console.log(`${colors.cyan}Backup saved to: ${BACKUP_DIR}${colors.reset}\n`);
  }
}

main();
