#!/usr/bin/env node
/**
 * SQL Migration Validation Script
 * Validates all SQL migration files for syntax errors and common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Validation rules
const validationRules = [
  {
    name: 'Missing semicolon at end',
    pattern: /(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)[^;]*$/i,
    severity: 'warning',
    message: 'SQL statement may be missing semicolon at end',
  },
  {
    name: 'Unbalanced parentheses',
    check: (content) => {
      const open = (content.match(/\(/g) || []).length;
      const close = (content.match(/\)/g) || []).length;
      return open !== close ? `Unbalanced: ${open} open, ${close} close` : null;
    },
    severity: 'error',
  },
  {
    name: 'Unbalanced quotes',
    check: (content) => {
      // Remove escaped quotes and comments
      let cleaned = content.replace(/\\'/g, '').replace(/--.*$/gm, '');
      const singleQuotes = (cleaned.match(/'/g) || []).length;
      const doubleQuotes = (cleaned.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        return `Unbalanced quotes: ${singleQuotes} single, ${doubleQuotes} double`;
      }
      return null;
    },
    severity: 'error',
  },
  {
    name: 'Invalid schema reference',
    pattern: /\bauth\.(users|profiles|sessions)\b/i,
    severity: 'error',
    message: 'Cannot access auth schema tables directly',
  },
  {
    name: 'Missing IF EXISTS in DROP',
    pattern: /DROP\s+(TABLE|FUNCTION|TRIGGER|INDEX|POLICY)\s+(?!IF\s+EXISTS)/i,
    severity: 'warning',
    message: 'DROP statement without IF EXISTS may fail on re-run',
  },
  {
    name: 'Missing workspace_id in RLS policy',
    check: (content) => {
      if (content.match(/CREATE\s+POLICY/i) && !content.match(/workspace_id/i)) {
        return 'RLS policy may be missing workspace_id isolation';
      }
      return null;
    },
    severity: 'warning',
  },
  {
    name: 'Duplicate policy names',
    check: (content) => {
      const policyNames = [...content.matchAll(/CREATE\s+POLICY\s+"?(\w+)"?/gi)];
      const names = policyNames.map(m => m[1].toLowerCase());
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      if (duplicates.length > 0) {
        return `Duplicate policy names: ${[...new Set(duplicates)].join(', ')}`;
      }
      return null;
    },
    severity: 'error',
  },
  {
    name: 'Using deprecated syntax',
    pattern: /\bNOW\s*\(\s*\)\s*AT\s+TIME\s+ZONE/i,
    severity: 'info',
    message: 'Consider using CURRENT_TIMESTAMP instead of NOW() AT TIME ZONE',
  },
  {
    name: 'Missing RLS enable',
    check: (content) => {
      if (content.match(/CREATE\s+TABLE/i) && !content.match(/ALTER\s+TABLE.*ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)) {
        return 'Table created without enabling RLS';
      }
      return null;
    },
    severity: 'warning',
  },
  {
    name: 'SQL injection risk',
    pattern: /\$\{[^}]+\}|\bEXECUTE\s+['"]/i,
    severity: 'error',
    message: 'Possible SQL injection vulnerability - dynamic SQL detected',
  },
];

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const issues = [];

  // Run validation rules
  for (const rule of validationRules) {
    if (rule.pattern) {
      const matches = content.match(rule.pattern);
      if (matches) {
        issues.push({
          rule: rule.name,
          severity: rule.severity,
          message: rule.message || `Matched pattern: ${rule.pattern}`,
          line: findLineNumber(content, matches[0]),
        });
      }
    } else if (rule.check) {
      const result = rule.check(content);
      if (result) {
        issues.push({
          rule: rule.name,
          severity: rule.severity,
          message: result,
        });
      }
    }
  }

  // Check file size (migrations over 10KB might be too large)
  const stats = fs.statSync(filePath);
  if (stats.size > 10240) {
    issues.push({
      rule: 'Large file size',
      severity: 'info',
      message: `File is ${(stats.size / 1024).toFixed(2)}KB - consider splitting`,
    });
  }

  // Check for empty or near-empty files
  if (content.trim().length < 10) {
    issues.push({
      rule: 'Empty or minimal content',
      severity: 'warning',
      message: 'File appears to be empty or has minimal content',
    });
  }

  return { fileName, filePath, issues, lineCount: content.split('\n').length };
}

function findLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return null;
}

function formatIssue(issue) {
  const severityColors = {
    error: colors.red,
    warning: colors.yellow,
    info: colors.cyan,
  };
  const color = severityColors[issue.severity] || colors.reset;
  const lineInfo = issue.line ? ` (line ${issue.line})` : '';
  return `${color}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.rule}${lineInfo}: ${issue.message}`;
}

function main() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     SQL Migration Validation - Unite-Hub                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Get all SQL files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => path.join(MIGRATIONS_DIR, f));

  console.log(`Found ${colors.magenta}${files.length}${colors.reset} migration files\n`);
  console.log(`${colors.blue}Starting validation...${colors.reset}\n`);

  const results = {
    total: files.length,
    passed: 0,
    withIssues: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    fileResults: [],
  };

  // Validate each file
  for (const file of files) {
    const result = validateFile(file);
    results.fileResults.push(result);

    if (result.issues.length === 0) {
      results.passed++;
    } else {
      results.withIssues++;
      result.issues.forEach(issue => {
        if (issue.severity === 'error') results.errors++;
        if (issue.severity === 'warning') results.warnings++;
        if (issue.severity === 'info') results.info++;
      });
    }
  }

  // Display results
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.green}✓ Clean files:${colors.reset} ${results.passed}/${results.total}`);
  console.log(`${colors.yellow}⚠ Files with issues:${colors.reset} ${results.withIssues}/${results.total}`);
  console.log(`${colors.red}✗ Total errors:${colors.reset} ${results.errors}`);
  console.log(`${colors.yellow}⚠ Total warnings:${colors.reset} ${results.warnings}`);
  console.log(`${colors.cyan}ℹ Total info:${colors.reset} ${results.info}\n`);

  // Show files with issues
  if (results.withIssues > 0) {
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}Files with Issues:${colors.reset}\n`);

    const filesWithErrors = results.fileResults
      .filter(r => r.issues.some(i => i.severity === 'error'))
      .sort((a, b) => {
        const aErrors = a.issues.filter(i => i.severity === 'error').length;
        const bErrors = b.issues.filter(i => i.severity === 'error').length;
        return bErrors - aErrors;
      });

    const filesWithWarnings = results.fileResults
      .filter(r => r.issues.some(i => i.severity === 'warning') && !r.issues.some(i => i.severity === 'error'));

    // Show errors first
    if (filesWithErrors.length > 0) {
      console.log(`${colors.red}━━━ Files with ERRORS (${filesWithErrors.length}) ━━━${colors.reset}\n`);
      filesWithErrors.forEach(result => {
        console.log(`${colors.magenta}${result.fileName}${colors.reset} (${result.lineCount} lines)`);
        result.issues.forEach(issue => {
          console.log(`  ${formatIssue(issue)}`);
        });
        console.log();
      });
    }

    // Show warnings (limit to top 20)
    if (filesWithWarnings.length > 0) {
      console.log(`${colors.yellow}━━━ Files with WARNINGS (showing first 20 of ${filesWithWarnings.length}) ━━━${colors.reset}\n`);
      filesWithWarnings.slice(0, 20).forEach(result => {
        console.log(`${colors.magenta}${result.fileName}${colors.reset}`);
        result.issues.filter(i => i.severity === 'warning').forEach(issue => {
          console.log(`  ${formatIssue(issue)}`);
        });
        console.log();
      });
      if (filesWithWarnings.length > 20) {
        console.log(`${colors.yellow}... and ${filesWithWarnings.length - 20} more files with warnings${colors.reset}\n`);
      }
    }
  }

  // Summary
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Summary:${colors.reset}`);
  console.log(`  • ${results.passed} files are clean`);
  console.log(`  • ${results.errors} critical errors need fixing`);
  console.log(`  • ${results.warnings} warnings to review`);
  console.log(`  • ${results.info} informational notices\n`);

  // Exit code based on errors
  if (results.errors > 0) {
    console.log(`${colors.red}❌ Validation failed with ${results.errors} errors${colors.reset}\n`);
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log(`${colors.yellow}⚠️  Validation passed with ${results.warnings} warnings${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ All migrations validated successfully!${colors.reset}\n`);
    process.exit(0);
  }
}

main();
