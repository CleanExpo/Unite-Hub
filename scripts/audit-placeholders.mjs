#!/usr/bin/env node

/**
 * Placeholder Audit CLI
 * Run: npm run audit:placeholders
 */

import fs from 'fs';
import path from 'path';

// Inline implementation since we can't import TypeScript directly
const PLACEHOLDER_PATTERNS = {
  text: [
    { pattern: /lorem ipsum/gi, severity: 'critical', description: 'Lorem ipsum placeholder text' },
    { pattern: /placeholder/gi, severity: 'high', description: 'Placeholder text' },
    { pattern: /coming soon/gi, severity: 'medium', description: 'Coming soon placeholder' },
    { pattern: /todo:/gi, severity: 'medium', description: 'TODO comment' },
    { pattern: /fixme:/gi, severity: 'high', description: 'FIXME comment' },
    { pattern: /your (?:text|title|description|content) here/gi, severity: 'critical', description: 'Generic placeholder text' },
    { pattern: /insert (?:text|title|description|content)/gi, severity: 'critical', description: 'Insert placeholder' },
    { pattern: /example (?:text|title|description|content)/gi, severity: 'high', description: 'Example placeholder' },
    { pattern: /sample (?:text|title|description|content)/gi, severity: 'high', description: 'Sample placeholder' },
    { pattern: /\[(?:insert|add|your|placeholder)[^\]]*\]/gi, severity: 'critical', description: 'Bracketed placeholder' },
  ],
  images: [
    { pattern: /placeholder\.(png|jpg|jpeg|svg|webp)/gi, severity: 'critical', description: 'Placeholder image file' },
    { pattern: /via\.placeholder\.com/gi, severity: 'critical', description: 'Via.placeholder.com URL' },
    { pattern: /placehold\.co/gi, severity: 'critical', description: 'Placehold.co URL' },
    { pattern: /placekitten/gi, severity: 'critical', description: 'Placekitten URL' },
    { pattern: /picsum\.photos/gi, severity: 'critical', description: 'Picsum.photos URL' },
    { pattern: /dummyimage/gi, severity: 'critical', description: 'Dummyimage URL' },
  ],
  links: [
    { pattern: /href=["']#["']/g, severity: 'high', description: 'Empty href (#)' },
    { pattern: /href=["']javascript:void/gi, severity: 'high', description: 'JavaScript void href' },
    { pattern: /to=["']#["']/g, severity: 'high', description: 'Empty Link to (#)' },
  ],
  data: [
    { pattern: /john(?:doe|smith)/gi, severity: 'high', description: 'Fake name' },
    { pattern: /jane(?:doe|smith)/gi, severity: 'high', description: 'Fake name' },
    { pattern: /test@(?:test|example)\.com/gi, severity: 'high', description: 'Test email' },
  ]
};

const SCANNABLE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.md', '.mdx'];
const SKIP_DIRECTORIES = ['node_modules', '.next', '.git', 'dist', 'build', '.vercel', '_disabled', 'logs'];

function getAllFiles(dirPath, files = []) {
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
  } catch (e) {
    // Skip
  }
  return files;
}

function scanFile(filePath) {
  const reports = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      for (const [type, patterns] of Object.entries(PLACEHOLDER_PATTERNS)) {
        for (const { pattern, severity, description } of patterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            reports.push({
              file: filePath,
              line: lineIndex + 1,
              type,
              content: match[0],
              severity,
              suggestion: description
            });
          }
        }
      }
    });
  } catch (e) {
    // Skip
  }
  return reports;
}

// Main
console.log('🔍 Scanning for placeholders...\n');

const basePath = path.resolve(process.cwd(), 'src');
const files = getAllFiles(basePath);

let allReports = [];
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

const summary = {
  critical: allReports.filter(r => r.severity === 'critical').length,
  high: allReports.filter(r => r.severity === 'high').length,
  medium: allReports.filter(r => r.severity === 'medium').length,
  low: allReports.filter(r => r.severity === 'low').length,
};

// Output
console.log('📊 Placeholder Audit Report');
console.log('===========================\n');
console.log(`Files Scanned: ${files.length}`);
console.log(`Files with Placeholders: ${filesWithPlaceholders}`);
console.log(`Total Issues: ${allReports.length}\n`);

console.log('By Severity:');
console.log(`  🔴 Critical: ${summary.critical}`);
console.log(`  🟠 High: ${summary.high}`);
console.log(`  🟡 Medium: ${summary.medium}`);
console.log(`  🟢 Low: ${summary.low}\n`);

if (summary.critical > 0) {
  console.log('🔴 CRITICAL ISSUES (Must Fix):');
  console.log('------------------------------');
  for (const r of allReports.filter(r => r.severity === 'critical').slice(0, 20)) {
    const relativePath = r.file.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`  ${relativePath}:${r.line}`);
    console.log(`    → ${r.suggestion}: "${r.content.substring(0, 40)}${r.content.length > 40 ? '...' : ''}"`);
  }
  if (summary.critical > 20) {
    console.log(`  ... and ${summary.critical - 20} more critical issues`);
  }
  console.log('');
}

if (summary.high > 0) {
  console.log('🟠 HIGH PRIORITY ISSUES:');
  console.log('------------------------');
  for (const r of allReports.filter(r => r.severity === 'high').slice(0, 10)) {
    const relativePath = r.file.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`  ${relativePath}:${r.line} - ${r.suggestion}`);
  }
  if (summary.high > 10) {
    console.log(`  ... and ${summary.high - 10} more high priority issues`);
  }
  console.log('');
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  summary,
  totalFiles: files.length,
  filesWithPlaceholders,
  reports: allReports
};

fs.writeFileSync('placeholder-report.json', JSON.stringify(report, null, 2));
console.log('📄 Full report saved to: placeholder-report.json');

// Exit with error if critical issues found
if (summary.critical > 0) {
  console.log('\n❌ Critical placeholders found! Fix these before deployment.');
  process.exit(1);
} else {
  console.log('\n✅ No critical placeholders found.');
  process.exit(0);
}
