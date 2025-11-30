/**
 * Placeholder Detection System
 * Automatically scans codebase for placeholder content
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PlaceholderReport {
  file: string;
  line: number;
  type: 'text' | 'image' | 'link' | 'data';
  content: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface PlaceholderScanResult {
  totalFiles: number;
  filesWithPlaceholders: number;
  reports: PlaceholderReport[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const PLACEHOLDER_PATTERNS = {
  text: [
    { pattern: /lorem ipsum/gi, severity: 'critical' as const, description: 'Lorem ipsum placeholder text' },
    { pattern: /placeholder/gi, severity: 'high' as const, description: 'Placeholder text' },
    { pattern: /coming soon/gi, severity: 'medium' as const, description: 'Coming soon placeholder' },
    { pattern: /todo:/gi, severity: 'medium' as const, description: 'TODO comment' },
    { pattern: /fixme:/gi, severity: 'high' as const, description: 'FIXME comment' },
    { pattern: /your (?:text|title|description|content) here/gi, severity: 'critical' as const, description: 'Generic placeholder text' },
    { pattern: /insert (?:text|title|description|content)/gi, severity: 'critical' as const, description: 'Insert placeholder' },
    { pattern: /example (?:text|title|description|content)/gi, severity: 'high' as const, description: 'Example placeholder' },
    { pattern: /sample (?:text|title|description|content)/gi, severity: 'high' as const, description: 'Sample placeholder' },
    { pattern: /\[(?:insert|add|your|placeholder)[^\]]*\]/gi, severity: 'critical' as const, description: 'Bracketed placeholder' },
    { pattern: /xxx+/gi, severity: 'high' as const, description: 'XXX placeholder' },
    { pattern: /\btbd\b/gi, severity: 'medium' as const, description: 'TBD placeholder' },
  ],
  images: [
    { pattern: /placeholder\.(png|jpg|jpeg|svg|webp)/gi, severity: 'critical' as const, description: 'Placeholder image file' },
    { pattern: /via\.placeholder\.com/gi, severity: 'critical' as const, description: 'Via.placeholder.com URL' },
    { pattern: /placehold\.co/gi, severity: 'critical' as const, description: 'Placehold.co URL' },
    { pattern: /placekitten/gi, severity: 'critical' as const, description: 'Placekitten URL' },
    { pattern: /picsum\.photos/gi, severity: 'critical' as const, description: 'Picsum.photos URL' },
    { pattern: /unsplash\.it/gi, severity: 'high' as const, description: 'Unsplash.it placeholder' },
    { pattern: /dummyimage/gi, severity: 'critical' as const, description: 'Dummyimage URL' },
    { pattern: /fakeimg/gi, severity: 'critical' as const, description: 'Fakeimg URL' },
    { pattern: /\/placeholder-/gi, severity: 'high' as const, description: 'Placeholder image path' },
    { pattern: /avatar-placeholder/gi, severity: 'high' as const, description: 'Avatar placeholder' },
    { pattern: /image-placeholder/gi, severity: 'high' as const, description: 'Image placeholder' },
    { pattern: /no-image/gi, severity: 'medium' as const, description: 'No-image placeholder' },
  ],
  links: [
    { pattern: /href=["']#["']/g, severity: 'high' as const, description: 'Empty href (#)' },
    { pattern: /href=["']javascript:void/gi, severity: 'high' as const, description: 'JavaScript void href' },
    { pattern: /href=["']\/\?["']/g, severity: 'medium' as const, description: 'Query-only href' },
    { pattern: /onClick=\{?\(\)\s*=>\s*\{\s*\}\}?/g, severity: 'medium' as const, description: 'Empty onClick handler' },
    { pattern: /to=["']#["']/g, severity: 'high' as const, description: 'Empty Link to (#)' },
  ],
  data: [
    { pattern: /john(?:doe|smith)/gi, severity: 'high' as const, description: 'Fake name (John Doe/Smith)' },
    { pattern: /jane(?:doe|smith)/gi, severity: 'high' as const, description: 'Fake name (Jane Doe/Smith)' },
    { pattern: /test@(?:test|example)\.com/gi, severity: 'high' as const, description: 'Test email address' },
    { pattern: /123-456-7890/g, severity: 'high' as const, description: 'Fake phone number' },
    { pattern: /555-\d{4}/g, severity: 'medium' as const, description: 'Fake 555 phone number' },
    { pattern: /example\.com/gi, severity: 'low' as const, description: 'Example.com domain' },
  ]
};

// File extensions to scan
const SCANNABLE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.md', '.mdx', '.json'];

// Directories to skip
const SKIP_DIRECTORIES = ['node_modules', '.next', '.git', 'dist', 'build', '.vercel', '_disabled'];

// Files to skip (patterns that are expected to have placeholders)
const SKIP_FILES = [
  'placeholder-detector.ts',  // This file itself contains patterns
  '.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx',  // Test files
  'mock', 'fixture', '__mocks__',  // Mock files
];

// False positive patterns - code constructs that look like placeholders but aren't
const FALSE_POSITIVE_PATTERNS = [
  /\[\s*[\w]+\s*,\s*set[\w]+\s*\]/,  // React useState: [value, setValue]
  /\[\s*[\w]+\s*,\s*[\w]+\s*\]/,     // Array destructuring: [a, b]
  /\[placeholder/i,                  // CSS attribute selector: [placeholder*="name"]
  /data-\[placeholder\]/i,           // Tailwind data attribute: data-[placeholder]:
  /placeholder[:=]\s*["'{]/i,        // JSX attribute: placeholder="..." or placeholder={
  /placehold(?:er|\.co).*(?:fallback|error|dev|mock|comment)/i,  // Intentional fallbacks
  /\/\/ .*placeholder/i,             // Comments about placeholders
  /\* .*placeholder/i,               // Multi-line comment about placeholders
  /pattern.*placeholder/i,           // Pattern definitions containing "placeholder"
  /description.*placeholder/i,       // Description containing "placeholder"
  /<Select.*placeholder/i,           // Select component with placeholder prop
  /const\s+\[\s*\w+\s*,?\s*\w*\]/,   // Const destructuring: const [a, b] or const [a]
  /useState\s*[(<]/,                 // useState hook: useState( or useState<
  /\bconst\s+\[/,                    // Any const with array destructuring
  /\blet\s+\[/,                      // Any let with array destructuring
  /document\.querySelector.*\[/,     // querySelector with attribute selector
  /input\[placeholder/i,             // Input placeholder selector
  /^\s*\/\//,                        // Lines starting with comments
  /^\s*\*/,                          // Lines starting with block comment
  /Fallback to placeholder/i,        // Comment about fallback behavior
  /copyText.*\[/,                    // Social media template copyText
  /Provide.*format.*\[/i,            // AI prompt format instructions
  /template.*\[Your/i,               // Template placeholders for users
  /\[Pattern \d+\]/,                 // AI format patterns like [Pattern 1]
  /\[Issue \d+/,                     // AI format patterns like [Issue 1]
  /\[Recommendation \d+/,            // AI format patterns like [Recommendation 1]
  /placeholderUrl/i,                 // Variable named placeholderUrl (intentional)
  /\[Your (?:detailed|Name|answer)/i,// AI prompt/template patterns
  /\[Main content/i,                 // Content template
  /\[Compelling headline/i,          // Content template
  /DALL-E.*fail/i,                   // DALL-E fallback comments
  /if.*fail.*placehold/i,            // Fallback logic
];

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.includes(entry.name)) {
          getAllFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SCANNABLE_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Check if a line is a false positive
 */
function isFalsePositive(line: string): boolean {
  return FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(line));
}

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return SKIP_FILES.some(skip => fileName.includes(skip));
}

/**
 * Scan a single file for placeholders
 */
function scanFile(filePath: string): PlaceholderReport[] {
  const reports: PlaceholderReport[] = [];

  // Skip certain files
  if (shouldSkipFile(filePath)) {
    return reports;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Skip false positives
      if (isFalsePositive(line)) {
        return;
      }

      // Check each pattern type
      for (const [type, patterns] of Object.entries(PLACEHOLDER_PATTERNS)) {
        for (const { pattern, severity, description } of patterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;

          while ((match = regex.exec(line)) !== null) {
            reports.push({
              file: filePath,
              line: lineIndex + 1,
              type: type as 'text' | 'image' | 'link' | 'data',
              content: match[0],
              severity,
              suggestion: description
            });
          }
        }
      }
    });
  } catch {
    // Skip files we can't read
  }

  return reports;
}

/**
 * Scan entire directory for placeholders
 */
export function scanForPlaceholders(directory: string = 'src'): PlaceholderScanResult {
  const basePath = path.resolve(process.cwd(), directory);
  const files = getAllFiles(basePath);

  let allReports: PlaceholderReport[] = [];
  let filesWithPlaceholders = 0;

  for (const file of files) {
    const reports = scanFile(file);
    if (reports.length > 0) {
      filesWithPlaceholders++;
      allReports = allReports.concat(reports);
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allReports.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    totalFiles: files.length,
    filesWithPlaceholders,
    reports: allReports,
    summary: {
      critical: allReports.filter(r => r.severity === 'critical').length,
      high: allReports.filter(r => r.severity === 'high').length,
      medium: allReports.filter(r => r.severity === 'medium').length,
      low: allReports.filter(r => r.severity === 'low').length,
    }
  };
}

/**
 * Generate markdown report
 */
export function generatePlaceholderReport(result: PlaceholderScanResult): string {
  const lines: string[] = [];

  lines.push('# Placeholder Detection Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Files Scanned:** ${result.totalFiles}`);
  lines.push(`- **Files with Placeholders:** ${result.filesWithPlaceholders}`);
  lines.push(`- **Total Issues Found:** ${result.reports.length}`);
  lines.push('');
  lines.push('### By Severity');
  lines.push('');
  lines.push(`- 🔴 **Critical:** ${result.summary.critical}`);
  lines.push(`- 🟠 **High:** ${result.summary.high}`);
  lines.push(`- 🟡 **Medium:** ${result.summary.medium}`);
  lines.push(`- 🟢 **Low:** ${result.summary.low}`);
  lines.push('');

  if (result.summary.critical > 0) {
    lines.push('## 🔴 Critical Issues');
    lines.push('');
    lines.push('These must be fixed before deployment:');
    lines.push('');
    for (const report of result.reports.filter(r => r.severity === 'critical')) {
      const relativePath = report.file.replace(process.cwd(), '').replace(/\\/g, '/');
      lines.push(`- \`${relativePath}:${report.line}\` - ${report.suggestion}`);
      lines.push(`  - Content: \`${report.content.substring(0, 50)}${report.content.length > 50 ? '...' : ''}\``);
    }
    lines.push('');
  }

  if (result.summary.high > 0) {
    lines.push('## 🟠 High Priority Issues');
    lines.push('');
    for (const report of result.reports.filter(r => r.severity === 'high')) {
      const relativePath = report.file.replace(process.cwd(), '').replace(/\\/g, '/');
      lines.push(`- \`${relativePath}:${report.line}\` - ${report.suggestion}`);
    }
    lines.push('');
  }

  if (result.summary.medium > 0) {
    lines.push('## 🟡 Medium Priority Issues');
    lines.push('');
    for (const report of result.reports.filter(r => r.severity === 'medium')) {
      const relativePath = report.file.replace(process.cwd(), '').replace(/\\/g, '/');
      lines.push(`- \`${relativePath}:${report.line}\` - ${report.suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Check if there are critical placeholders (for CI/CD)
 */
export function hasCriticalPlaceholders(result: PlaceholderScanResult): boolean {
  return result.summary.critical > 0;
}
