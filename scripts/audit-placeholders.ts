#!/usr/bin/env ts-node
/**
 * Placeholder Detection Script
 * Scans source files for placeholder content that needs to be replaced
 * with real Australian trade industry content.
 */

import * as fs from 'fs';
import * as path from 'path';

interface PlaceholderMatch {
  file: string;
  line: number;
  type: PlaceholderType;
  content: string;
  severity: Severity;
  pattern: string;
}

type PlaceholderType =
  | 'lorem_ipsum'
  | 'placeholder_text'
  | 'coming_soon'
  | 'todo'
  | 'fixme'
  | 'generic_text'
  | 'placeholder_image'
  | 'dead_link'
  | 'empty_handler'
  | 'test_email'
  | 'sample_name';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface PlaceholderPattern {
  pattern: RegExp;
  type: PlaceholderType;
  severity: Severity;
  description: string;
}

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS: PlaceholderPattern[] = [
  // Lorem ipsum and placeholder text
  {
    pattern: /lorem\s*ipsum/gi,
    type: 'lorem_ipsum',
    severity: 'critical',
    description: 'Lorem ipsum placeholder text',
  },
  {
    pattern: /\[placeholder\]/gi,
    type: 'placeholder_text',
    severity: 'critical',
    description: 'Placeholder marker text',
  },
  {
    pattern: /placeholder(?:\s+text)?(?![:=])/gi,
    type: 'placeholder_text',
    severity: 'high',
    description: 'Placeholder text reference',
  },
  {
    pattern: /coming\s+soon/gi,
    type: 'coming_soon',
    severity: 'critical',
    description: 'Coming soon placeholder',
  },
  {
    pattern: /your\s+text\s+here/gi,
    type: 'generic_text',
    severity: 'critical',
    description: 'Generic placeholder text',
  },
  {
    pattern: /\bxxx\b/gi,
    type: 'generic_text',
    severity: 'high',
    description: 'XXX placeholder marker',
  },
  {
    pattern: /\btbd\b/gi,
    type: 'generic_text',
    severity: 'medium',
    description: 'TBD marker',
  },

  // TODO and FIXME comments
  {
    pattern: /\/\/\s*todo:/gi,
    type: 'todo',
    severity: 'medium',
    description: 'TODO comment',
  },
  {
    pattern: /\/\/\s*fixme:/gi,
    type: 'fixme',
    severity: 'high',
    description: 'FIXME comment',
  },
  {
    pattern: /\/\*\s*todo:/gi,
    type: 'todo',
    severity: 'medium',
    description: 'TODO block comment',
  },
  {
    pattern: /\/\*\s*fixme:/gi,
    type: 'fixme',
    severity: 'high',
    description: 'FIXME block comment',
  },

  // Placeholder images
  {
    pattern: /via\.placeholder\.com/gi,
    type: 'placeholder_image',
    severity: 'high',
    description: 'Via.placeholder.com image URL',
  },
  {
    pattern: /placehold\.co/gi,
    type: 'placeholder_image',
    severity: 'high',
    description: 'Placehold.co image URL',
  },
  {
    pattern: /picsum\.photos/gi,
    type: 'placeholder_image',
    severity: 'high',
    description: 'Picsum.photos image URL',
  },
  {
    pattern: /placeholder\.com/gi,
    type: 'placeholder_image',
    severity: 'high',
    description: 'Placeholder.com image URL',
  },
  {
    pattern: /dummyimage\.com/gi,
    type: 'placeholder_image',
    severity: 'high',
    description: 'DummyImage.com URL',
  },

  // Dead links and empty handlers
  {
    pattern: /href\s*=\s*["']#["']/gi,
    type: 'dead_link',
    severity: 'medium',
    description: 'Dead link (href="#")',
  },
  {
    pattern: /href\s*=\s*["']['"](?!\s*\+)/gi,
    type: 'dead_link',
    severity: 'medium',
    description: 'Empty href',
  },
  {
    pattern: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/gi,
    type: 'empty_handler',
    severity: 'medium',
    description: 'Empty onClick handler',
  },
  {
    pattern: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*null\s*\}/gi,
    type: 'empty_handler',
    severity: 'medium',
    description: 'Null onClick handler',
  },

  // Test/sample data
  {
    pattern: /test@example\.com/gi,
    type: 'test_email',
    severity: 'low',
    description: 'Test email address',
  },
  {
    pattern: /example@(?:test|demo|sample)\.com/gi,
    type: 'test_email',
    severity: 'low',
    description: 'Sample email address',
  },
  {
    pattern: /john\s+doe/gi,
    type: 'sample_name',
    severity: 'low',
    description: 'Sample name (John Doe)',
  },
  {
    pattern: /jane\s+doe/gi,
    type: 'sample_name',
    severity: 'low',
    description: 'Sample name (Jane Doe)',
  },
  {
    pattern: /123-456-7890/g,
    type: 'sample_name',
    severity: 'low',
    description: 'Sample phone number',
  },
  {
    pattern: /123\s+main\s+st/gi,
    type: 'sample_name',
    severity: 'low',
    description: 'Sample address',
  },
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.json', '.md', '.html', '.css'];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.vercel',
  '.turbo',
];

// Files to exclude
const EXCLUDE_FILES = ['audit-placeholders.ts', 'audit-navigation.ts', 'demo-data.ts'];

function shouldScanFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  if (!SCAN_EXTENSIONS.includes(ext)) return false;
  if (EXCLUDE_FILES.includes(fileName)) return false;

  return true;
}

function shouldScanDirectory(dirPath: string): boolean {
  const dirName = path.basename(dirPath);
  return !EXCLUDE_DIRS.includes(dirName);
}

function scanFile(filePath: string): PlaceholderMatch[] {
  const matches: PlaceholderMatch[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    PLACEHOLDER_PATTERNS.forEach((patternDef) => {
      // Reset regex lastIndex for global patterns
      patternDef.pattern.lastIndex = 0;

      let match;
      while ((match = patternDef.pattern.exec(line)) !== null) {
        matches.push({
          file: filePath,
          line: index + 1,
          type: patternDef.type,
          content: line.trim().substring(0, 200),
          severity: patternDef.severity,
          pattern: patternDef.description,
        });

        // Prevent infinite loops for non-global regex
        if (!patternDef.pattern.global) break;
      }
    });
  });

  return matches;
}

function scanDirectory(dirPath: string): PlaceholderMatch[] {
  let matches: PlaceholderMatch[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (shouldScanDirectory(fullPath)) {
          matches = matches.concat(scanDirectory(fullPath));
        }
      } else if (entry.isFile()) {
        if (shouldScanFile(fullPath)) {
          matches = matches.concat(scanFile(fullPath));
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return matches;
}

interface AuditReport {
  timestamp: string;
  totalMatches: number;
  bySeverity: Record<Severity, number>;
  byType: Record<PlaceholderType, number>;
  matches: PlaceholderMatch[];
  summary: string;
}

function generateReport(matches: PlaceholderMatch[]): AuditReport {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const byType: Record<string, number> = {};

  matches.forEach((match) => {
    bySeverity[match.severity]++;
    byType[match.type] = (byType[match.type] || 0) + 1;
  });

  const hasCritical = bySeverity.critical > 0;
  const summary = hasCritical
    ? `CRITICAL: ${bySeverity.critical} critical placeholder(s) found that MUST be fixed before production.`
    : bySeverity.high > 0
    ? `WARNING: ${bySeverity.high} high-severity placeholder(s) found.`
    : matches.length > 0
    ? `INFO: ${matches.length} placeholder(s) found (non-critical).`
    : 'SUCCESS: No placeholders found.';

  return {
    timestamp: new Date().toISOString(),
    totalMatches: matches.length,
    bySeverity,
    byType: byType as Record<PlaceholderType, number>,
    matches,
    summary,
  };
}

function main(): void {
  const srcPath = path.resolve(__dirname, '../src');

  console.error('Scanning for placeholders in:', srcPath);
  console.error('');

  const matches = scanDirectory(srcPath);
  const report = generateReport(matches);

  // Output JSON to stdout for programmatic use
  console.log(JSON.stringify(report, null, 2));

  // Output summary to stderr for human readability
  console.error('');
  console.error('='.repeat(60));
  console.error('PLACEHOLDER AUDIT REPORT');
  console.error('='.repeat(60));
  console.error('');
  console.error(report.summary);
  console.error('');
  console.error('By Severity:');
  Object.entries(report.bySeverity).forEach(([severity, count]) => {
    if (count > 0) {
      console.error(`  ${severity.toUpperCase()}: ${count}`);
    }
  });
  console.error('');
  console.error('By Type:');
  Object.entries(report.byType).forEach(([type, count]) => {
    console.error(`  ${type}: ${count}`);
  });
  console.error('');

  // Exit with error code if critical issues found
  if (report.bySeverity.critical > 0) {
    process.exit(1);
  }
}

main();
