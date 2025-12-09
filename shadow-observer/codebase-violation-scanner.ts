/**
 * Codebase Violation Scanner
 * Finds architecture violations (CLAUDE.md patterns)
 */

import fs from 'fs';
import path from 'path';
import { Grep } from 'grep'; // Would use built-in grep via Bash in real implementation
import { shadowConfig } from './shadow-config';

export interface Violation {
  file: string;
  line: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fix: string;
  pattern?: string;
}

export interface ScanResult {
  violations: Violation[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  autoFixable: string[];
  manualReview: string[];
  timestamp: string;
}

const VIOLATION_PATTERNS = [
  {
    type: 'workspace_filter_missing',
    severity: 'critical' as const,
    pattern: /\.from\(['"]\w+['"];?\)\.select\(\)/,
    description: 'Query missing .eq("workspace_id", workspaceId)',
    fix: 'Add .eq("workspace_id", workspaceId) after select()',
    autoFixable: false
  },
  {
    type: 'wrong_supabase_client',
    severity: 'critical' as const,
    pattern: /import\s*{.*createClient.*}\s*from\s*['"]@\/lib\/supabase['"]/,
    description: 'Wrong Supabase client for context (use server/client/admin)',
    fix: 'Replace with correct client based on context (RSC=server, hook=client)',
    autoFixable: false
  },
  {
    type: 'missing_await_params',
    severity: 'critical' as const,
    pattern: /context\.params(?!\s*=\s*await)/,
    description: 'Missing await on context.params (Next.js 15+)',
    fix: 'Wrap with await: const { id } = await context.params;',
    autoFixable: true
  },
  {
    type: 'unused_imports',
    severity: 'medium' as const,
    pattern: /import\s+{\s*\w+\s*}\s+from/,
    description: 'Unused import declaration',
    fix: 'Delete unused import line',
    autoFixable: true
  },
  {
    type: 'missing_jsoc',
    severity: 'medium' as const,
    pattern: /export\s+(async\s+)?function\s+\w+\s*\(/,
    description: 'Exported function missing JSDoc',
    fix: 'Add JSDoc block above function',
    autoFixable: true
  },
  {
    type: 'generic_ui_patterns',
    severity: 'medium' as const,
    pattern: /className\s*=\s*["'].*(?:bg-white|text-gray-600|grid grid-cols)/,
    description: 'Using generic UI patterns instead of design tokens',
    fix: 'Replace with design tokens: bg-bg-card, text-text-primary, accent-500',
    autoFixable: false
  },
  {
    type: 'any_type_used',
    severity: 'high' as const,
    pattern: /:\s*any(?:\s|;|,|\))/,
    description: 'Using TypeScript any type (strict mode violation)',
    fix: 'Replace with explicit type annotation',
    autoFixable: false
  },
  {
    type: 'no_error_handling',
    severity: 'high' as const,
    pattern: /async\s+function\s+\w+\s*\([^)]*\)\s*{(?![\s\S]*try)/,
    description: 'Async function missing error handling',
    fix: 'Wrap logic in try/catch block',
    autoFixable: false
  }
];

/**
 * Scan codebase for violations
 */
export async function scanViolations(targetDir: string = shadowConfig.sourceDir): Promise<ScanResult> {
  const violations: Violation[] = [];

  // Recursively scan TypeScript files
  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (['node_modules', '.next', 'dist', 'build'].includes(file)) continue;
        scanDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (const pattern of VIOLATION_PATTERNS) {
          let match;
          for (let i = 0; i < lines.length; i++) {
            if (pattern.pattern.test(lines[i])) {
              violations.push({
                file: fullPath.replace(process.cwd(), '.'),
                line: i + 1,
                type: pattern.type,
                severity: pattern.severity,
                description: pattern.description,
                fix: pattern.fix,
                pattern: pattern.pattern.source
              });
            }
          }
        }
      }
    }
  }

  scanDir(targetDir);

  // Calculate summary
  const summary = {
    total: violations.length,
    critical: violations.filter(v => v.severity === 'critical').length,
    high: violations.filter(v => v.severity === 'high').length,
    medium: violations.filter(v => v.severity === 'medium').length,
    low: violations.filter(v => v.severity === 'low').length
  };

  const autoFixable = Array.from(
    new Set(violations.filter(v => !VIOLATION_PATTERNS.find(p => p.type === v.type && !p.autoFixable)).map(v => v.type))
  );

  const manualReview = Array.from(
    new Set(violations.filter(v => VIOLATION_PATTERNS.find(p => p.type === v.type && !p.autoFixable)).map(v => v.type))
  );

  return {
    violations: violations.slice(0, shadowConfig.audit.maxFilesAnalyzed),
    summary,
    autoFixable,
    manualReview,
    timestamp: new Date().toISOString()
  };
}

/**
 * Save violation report
 */
export async function saveViolationReport(result: ScanResult): Promise<void> {
  const reportPath = path.join(shadowConfig.reportDir, 'violations.json');

  if (!fs.existsSync(shadowConfig.reportDir)) {
    fs.mkdirSync(shadowConfig.reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`✓ Violation report saved: ${reportPath}`);
}

export async function main() {
  try {
    console.log('🔍 Scanning codebase for violations...');
    const result = await scanViolations();
    await saveViolationReport(result);

    console.log(`✓ Scan complete: ${result.summary.total} violations found`);
    console.log(`  Critical: ${result.summary.critical} | High: ${result.summary.high} | Medium: ${result.summary.medium}`);
    console.log(`  Auto-fixable: ${result.autoFixable.join(', ')}`);

    return result;
  } catch (error) {
    console.error('❌ Scan failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
