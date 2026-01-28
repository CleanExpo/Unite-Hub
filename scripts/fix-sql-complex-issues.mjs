#!/usr/bin/env node
/**
 * Advanced SQL Migration Fix Script
 * Fixes complex issues: unbalanced quotes, duplicate policies, auth references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Files with known complex issues to fix manually
const complexFixes = {
  '047_web_scraping_tables.sql': {
    issue: 'Unbalanced quotes',
    fix: (content) => {
      // Fix common quote imbalance issues
      let fixed = content;

      // Escape quotes in text fields properly
      fixed = fixed.replace(/DEFAULT '([^']*)'s([^']*)'(?!\s*,|\s*\))/g, "DEFAULT '$1''s$2'");

      return fixed;
    },
  },

  '054_delta_history_columns.sql': {
    issue: 'Unbalanced quotes',
    fix: (content) => {
      let fixed = content;

      // Find and fix improperly escaped quotes
      const lines = fixed.split('\n');
      const fixedLines = lines.map(line => {
        if (line.includes("'") && !line.trim().startsWith('--')) {
          // Count quotes
          const quotes = (line.match(/'/g) || []).length;
          if (quotes % 2 !== 0) {
            // Try to fix common patterns
            if (line.includes("it's") || line.includes("user's")) {
              return line.replace(/(\w)'s/g, "$1''s");
            }
          }
        }
        return line;
      });

      return fixedLines.join('\n');
    },
  },

  '069_enterprise_billing.sql': {
    issue: 'Unbalanced quotes and duplicate policies',
    fix: (content) => {
      let fixed = content;

      // Fix quotes
      fixed = fixed.replace(/(\w)'s/g, "$1''s");

      // Rename duplicate policies
      const policyMatches = [...fixed.matchAll(/CREATE POLICY "(\w+)" ON "?(\w+)"?/gi)];
      const seen = new Set();

      policyMatches.forEach(match => {
        const policyName = match[1];
        const tableName = match[2];

        if (seen.has(policyName.toLowerCase())) {
          const uniqueName = `${policyName}_${tableName}`;
          fixed = fixed.replace(
            new RegExp(`CREATE POLICY "${policyName}" ON "${tableName}"`, 'i'),
            `CREATE POLICY "${uniqueName}" ON "${tableName}"`
          );
        } else {
          seen.add(policyName.toLowerCase());
        }
      });

      return fixed;
    },
  },
};

function fixComplexFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  if (complexFixes[fileName]) {
    const { issue, fix } = complexFixes[fileName];
    const fixedContent = fix(content);

    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf-8');
      return { fixed: true, issue };
    }
  }

  return { fixed: false };
}

function fixDuplicatePoliciesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let fixed = content;
  let count = 0;

  // Extract all policies with their full context
  const policyPattern = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+"?(\w+)"?/gi;
  const policies = [];
  let match;

  while ((match = policyPattern.exec(content)) !== null) {
    policies.push({
      name: match[1],
      table: match[2],
      fullMatch: match[0],
      index: match.index,
    });
  }

  // Find duplicates
  const nameCount = {};
  policies.forEach(policy => {
    const key = policy.name.toLowerCase();
    nameCount[key] = (nameCount[key] || 0) + 1;
  });

  // Rename duplicates
  const renamed = {};
  Object.entries(nameCount).forEach(([name, cnt]) => {
    if (cnt > 1) {
      let occurrence = 0;
      policies.forEach(policy => {
        if (policy.name.toLowerCase() === name) {
          occurrence++;
          if (occurrence > 1) {
            const newName = `${policy.name}_${policy.table}_v${occurrence}`;
            const pattern = new RegExp(
              `CREATE\\s+POLICY\\s+"${policy.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+ON\\s+"?${policy.table}"?`,
              'i'
            );
            fixed = fixed.replace(pattern, `CREATE POLICY "${newName}" ON "${policy.table}"`);
            count++;
          }
        }
      });
    }
  });

  if (count > 0) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
  }

  return count;
}

function fixAuthReferencesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let fixed = content;
  let count = 0;

  // Remove the comment wrappers we added and replace with proper patterns
  const authUserPattern = /-- FIXME: Cannot access auth\.users directly.*\n\s*-- (.*auth\.users.*)/gi;

  fixed = fixed.replace(authUserPattern, (match, line) => {
    count++;
    // Extract the actual reference and provide a proper alternative
    if (line.includes('REFERENCES auth.users')) {
      return '-- Keep FK reference to auth.users (allowed in migrations)\n' + line.replace('-- ', '');
    } else if (line.includes('auth.users')) {
      return '-- Use auth.uid() in RLS policies instead of direct auth.users reference\n' + line.replace('-- ', '');
    }
    return match;
  });

  if (count > 0) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
  }

  return count;
}

function main() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Advanced SQL Fix Script - Complex Issues               ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => path.join(MIGRATIONS_DIR, f));

  console.log(`Found ${colors.magenta}${files.length}${colors.reset} migration files\n`);

  const stats = {
    complexFixed: 0,
    duplicatesFixed: 0,
    authRefsFixed: 0,
  };

  // Fix complex files
  console.log(`${colors.cyan}Fixing complex quote/policy issues...${colors.reset}\n`);
  files.forEach(file => {
    const result = fixComplexFile(file);
    if (result.fixed) {
      stats.complexFixed++;
      console.log(`${colors.green}✓${colors.reset} ${path.basename(file)} - ${result.issue}`);
    }
  });

  // Fix duplicate policies across all files
  console.log(`\n${colors.cyan}Fixing duplicate policy names...${colors.reset}\n`);
  files.forEach(file => {
    const count = fixDuplicatePoliciesInFile(file);
    if (count > 0) {
      stats.duplicatesFixed += count;
      console.log(`${colors.green}✓${colors.reset} ${path.basename(file)} - ${count} policies renamed`);
    }
  });

  // Fix auth references
  console.log(`\n${colors.cyan}Cleaning up auth references...${colors.reset}\n`);
  files.forEach(file => {
    const count = fixAuthReferencesInFile(file);
    if (count > 0) {
      stats.authRefsFixed += count;
      console.log(`${colors.green}✓${colors.reset} ${path.basename(file)} - ${count} references cleaned`);
    }
  });

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Summary:${colors.reset}\n`);
  console.log(`  • ${colors.green}${stats.complexFixed}${colors.reset} complex files fixed`);
  console.log(`  • ${colors.green}${stats.duplicatesFixed}${colors.reset} duplicate policies renamed`);
  console.log(`  • ${colors.green}${stats.authRefsFixed}${colors.reset} auth references cleaned`);

  const total = stats.complexFixed + stats.duplicatesFixed + stats.authRefsFixed;
  console.log(`\n${colors.green}✅ ${total} total fixes applied${colors.reset}\n`);
}

main();
