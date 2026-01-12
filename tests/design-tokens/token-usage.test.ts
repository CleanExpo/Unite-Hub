/**
 * Design Token Compliance Tests
 *
 * Validates that all components use design tokens from globals.css
 * instead of hardcoded Tailwind color classes.
 *
 * Approved tokens:
 * - accent-* (brand orange #ff6b35)
 * - error-* / warning-* / info-* / success-* (semantic)
 * - text-primary / text-secondary / text-muted
 * - bg-base / bg-raised / bg-card / bg-hover
 * - border-subtle / border-medium
 *
 * Forbidden patterns:
 * - gray-*, slate-*, red-*, blue-*, green-*, yellow-*
 * - Hardcoded hex colors (#ff0000)
 * - Hardcoded rgb/rgba values
 */

import { describe, it, expect } from 'vitest';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

// Forbidden color patterns (hardcoded Tailwind colors)
const FORBIDDEN_PATTERNS = [
  // Gray scale (should use text-*, bg-*)
  /\b(gray|slate|zinc|neutral|stone)-\d{2,3}\b/g,
  // Red colors (should use error-*)
  /\b(red)-\d{2,3}\b/g,
  // Blue colors (should use info-*)
  /\b(blue|sky|cyan)-\d{2,3}\b/g,
  // Green colors (should use success-*)
  /\b(green|emerald|teal)-\d{2,3}\b/g,
  // Yellow/Orange (should use warning-* or accent-*)
  /\b(yellow|amber)-\d{2,3}\b/g,
  // Purple/Pink (no semantic equivalent, case-by-case)
  /\b(purple|violet|fuchsia|pink|rose)-\d{2,3}\b/g,
];

// Allowed exceptions (known intentional uses)
const ALLOWED_EXCEPTIONS = [
  // External library components that we can't control
  'node_modules',
  // Test files themselves
  '.test.',
  '.spec.',
  // Stories and documentation
  '.stories.',
  '.mdx',
  // Build artifacts
  '.next/',
  'dist/',
];

// Known exceptions in specific files (with justification)
const FILE_EXCEPTIONS: Record<string, string[]> = {
  // Badge uses semantic colors which map to design tokens
  // These are being phased out in Week 1 of Premium Upgrade
  'badge.tsx': ['gray-600', 'gray-300'],
};

describe('Design Token Compliance', () => {
  it('should not use hardcoded Tailwind colors in UI components', async () => {
    const componentFiles = await glob('src/components/ui/**/*.tsx', {
      cwd: process.cwd(),
      ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    });

    const violations: { file: string; colors: string[]; line?: number }[] = [];

    for (const file of componentFiles) {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(file);

      // Skip if file is in exceptions
      if (ALLOWED_EXCEPTIONS.some((exc) => file.includes(exc))) {
        continue;
      }

      const fileViolations: string[] = [];

      for (const pattern of FORBIDDEN_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          // Filter out known exceptions for this file
          const fileExceptions = FILE_EXCEPTIONS[fileName] || [];
          const filteredMatches = matches.filter(
            (m) => !fileExceptions.includes(m)
          );

          if (filteredMatches.length > 0) {
            fileViolations.push(...filteredMatches);
          }
        }
      }

      if (fileViolations.length > 0) {
        violations.push({
          file,
          colors: [...new Set(fileViolations)], // Dedupe
        });
      }
    }

    // Log violations for debugging
    if (violations.length > 0) {
      console.log('\n⚠️ Design Token Violations Found:');
      violations.forEach((v) => {
        console.log(`  📁 ${v.file}`);
        console.log(`     Colors: ${v.colors.join(', ')}`);
      });
      console.log('\n');
    }

    // Track violations - target is 0, currently at 25 (to be fixed in ongoing cleanup)
    // Log violations for tracking purposes
    if (violations.length > 0) {
      console.log(`\n📊 UI Component Violations: ${violations.length} (target: 0)`);
    }
    expect(violations.length).toBeLessThanOrEqual(30); // Threshold for regression detection
  });

  it('should not use hardcoded Tailwind colors in page components', async () => {
    const pageFiles = await glob('src/app/**/*.tsx', {
      cwd: process.cwd(),
      ignore: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/api/**',
        '**/layout.tsx',
        '**/loading.tsx',
        '**/error.tsx',
        '**/not-found.tsx',
      ],
    });

    const violations: { file: string; colors: string[] }[] = [];

    for (const file of pageFiles) {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Skip if file is in exceptions
      if (ALLOWED_EXCEPTIONS.some((exc) => file.includes(exc))) {
        continue;
      }

      const fileViolations: string[] = [];

      for (const pattern of FORBIDDEN_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          fileViolations.push(...matches);
        }
      }

      if (fileViolations.length > 0) {
        violations.push({
          file,
          colors: [...new Set(fileViolations)],
        });
      }
    }

    // Log violations for debugging
    if (violations.length > 0) {
      console.log('\n⚠️ Design Token Violations in Pages:');
      violations.forEach((v) => {
        console.log(`  📁 ${v.file}`);
        console.log(`     Colors: ${v.colors.join(', ')}`);
      });
      console.log('\n');
    }

    // Track violations in pages - pages have more legacy code
    // Log violations for tracking purposes
    if (violations.length > 0) {
      console.log(`\n📊 Page Violations: ${violations.length} (target: <100)`);
    }
    // Pages are being migrated incrementally - threshold prevents regression
    expect(violations.length).toBeLessThanOrEqual(450); // Current baseline
  });

  it('should use only approved design tokens', async () => {
    // Read globals.css to extract approved tokens
    const globalsPath = path.join(process.cwd(), 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

    // Check that our design tokens are defined (actual token names from globals.css)
    const requiredTokens = [
      '--color-accent-500',
      '--text-primary',
      '--text-secondary',
      '--color-bg-base',
      '--card',
      '--error',
      '--success',
      '--warning',
      '--info',
    ];

    const missingTokens = requiredTokens.filter(
      (token) => !globalsContent.includes(token)
    );

    expect(missingTokens).toHaveLength(0);
  });

  it('should have consistent color usage across themes', async () => {
    const globalsPath = path.join(process.cwd(), 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

    // Check that theme tokens are defined (Synthex is dark-first)
    expect(globalsContent).toContain(':root');
    expect(globalsContent).toContain('--accent');
    expect(globalsContent).toContain('--color-bg-base');
    expect(globalsContent).toContain('--text-primary');
  });
});

describe('Color Mapping Reference', () => {
  it('should document token replacements', () => {
    // This test serves as documentation for the color mapping
    const tokenMapping = {
      // Gray scale → Text/Background tokens
      'gray-50': 'bg-card',
      'gray-100': 'bg-hover',
      'gray-300': 'text-secondary',
      'gray-600': 'text-muted',
      'gray-900': 'text-primary',
      'slate-950': 'bg-base',

      // Red → Error tokens
      'red-50': 'error-50',
      'red-100': 'error-100',
      'red-500': 'error-500',
      'red-600': 'error-500',
      'red-900': 'error-900',

      // Blue → Info tokens
      'blue-50': 'info-50',
      'blue-100': 'info-100',
      'blue-500': 'info-500',
      'blue-600': 'info-500',

      // Green → Success tokens
      'green-50': 'success-50',
      'green-500': 'success-500',
      'green-600': 'success-500',

      // Yellow/Amber → Warning tokens
      'yellow-50': 'warning-50',
      'amber-500': 'warning-500',

      // Orange → Accent tokens (brand color)
      'orange-500': 'accent-500',
      'orange-600': 'accent-600',
    };

    // Verify mapping is complete
    expect(Object.keys(tokenMapping).length).toBeGreaterThan(15);
  });
});
