#!/usr/bin/env node

/**
 * Bulk Design System Migration Script
 * Replaces forbidden patterns with Synthex design tokens across the codebase
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// Pattern replacements: [search, replace]
const REPLACEMENTS = [
  // Text colors - dual mode
  ['text-gray-600 dark:text-gray-400', 'text-text-secondary'],
  ['text-gray-500 dark:text-gray-400', 'text-text-secondary'],
  ['text-gray-500 dark:text-gray-500', 'text-text-muted'],
  ['text-gray-700 dark:text-gray-300', 'text-text-secondary'],
  ['text-gray-900 dark:text-white', 'text-text-primary'],
  ['text-gray-800 dark:text-white', 'text-text-primary'],
  ['text-gray-800 dark:text-gray-200', 'text-text-primary'],
  ['text-gray-400 dark:text-gray-600', 'text-text-muted'],
  ['text-gray-400 dark:text-gray-500', 'text-text-muted'],
  ['text-gray-300 dark:text-gray-600', 'text-text-muted'],

  // Background colors - dual mode
  ['bg-white dark:bg-gray-800', 'bg-bg-card'],
  ['bg-white dark:bg-gray-900', 'bg-bg-card'],
  ['bg-white dark:bg-gray-700', 'bg-bg-input'],
  ['bg-gray-50 dark:bg-gray-900/30', 'bg-bg-raised'],
  ['bg-gray-50 dark:bg-gray-800', 'bg-bg-raised'],
  ['bg-gray-50 dark:bg-gray-900', 'bg-bg-raised'],
  ['bg-gray-50 dark:bg-gray-800/50', 'bg-bg-raised'],
  ['bg-gray-100 dark:bg-gray-900', 'bg-bg-raised'],
  ['bg-gray-100 dark:bg-gray-800', 'bg-bg-hover'],
  ['bg-gray-100 dark:bg-gray-700', 'bg-bg-hover'],
  ['bg-gray-200 dark:bg-gray-700', 'bg-bg-hover'],
  ['bg-gray-200 dark:bg-gray-800', 'bg-bg-hover'],

  // Border colors - dual mode
  ['border-gray-200 dark:border-gray-700', 'border-border-subtle'],
  ['border-gray-200 dark:border-gray-800', 'border-border-subtle'],
  ['border-gray-200 dark:border-gray-600', 'border-border-subtle'],
  ['border-gray-300 dark:border-gray-600', 'border-border-base'],
  ['border-gray-300 dark:border-gray-700', 'border-border-base'],
  ['border-gray-100 dark:border-gray-800', 'border-border-subtle'],
  ['border-gray-100 dark:border-gray-700', 'border-border-subtle'],

  // Hover states - dual mode
  ['hover:bg-gray-50 dark:hover:bg-gray-700/50', 'hover:bg-bg-hover'],
  ['hover:bg-gray-50 dark:hover:bg-gray-700', 'hover:bg-bg-hover'],
  ['hover:bg-gray-50 dark:hover:bg-gray-800', 'hover:bg-bg-hover'],
  ['hover:bg-gray-100 dark:hover:bg-gray-700', 'hover:bg-bg-hover'],
  ['hover:bg-gray-100 dark:hover:bg-gray-800', 'hover:bg-bg-hover'],
  ['hover:bg-gray-200 dark:hover:bg-gray-600', 'hover:bg-bg-hover'],
  ['hover:bg-gray-200 dark:hover:bg-gray-700', 'hover:bg-bg-hover'],

  // Divide colors
  ['divide-gray-200 dark:divide-gray-700', 'divide-border-subtle'],
  ['divide-gray-200 dark:divide-gray-800', 'divide-border-subtle'],

  // Ring colors
  ['ring-gray-200 dark:ring-gray-700', 'ring-border-subtle'],
  ['ring-gray-300 dark:ring-gray-600', 'ring-border-base'],
  ['focus:ring-gray-300', 'focus:ring-border-base'],
  ['focus:ring-gray-200', 'focus:ring-border-subtle'],
];

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    let replacementCount = 0;

    for (const [search, replace] of REPLACEMENTS) {
      if (content.includes(search)) {
        const count = (content.match(new RegExp(escapeRegExp(search), 'g')) || []).length;
        content = content.replaceAll(search, replace);
        replacementCount += count;
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      return { path: filePath, count: replacementCount };
    }

    return null;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  console.log('🎨 Applying Synthex Design System...\n');

  // Find all TSX files
  const files = await glob('src/**/*.tsx', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**'],
  });

  console.log(`Found ${files.length} TSX files to process\n`);

  let totalReplacements = 0;
  let modifiedFiles = 0;
  const results = [];

  for (const file of files) {
    const result = await processFile(file);
    if (result) {
      results.push(result);
      totalReplacements += result.count;
      modifiedFiles++;
    }
  }

  // Sort by replacement count
  results.sort((a, b) => b.count - a.count);

  console.log('📊 Results:\n');
  console.log(`Files modified: ${modifiedFiles}`);
  console.log(`Total replacements: ${totalReplacements}\n`);

  if (results.length > 0) {
    console.log('Top modified files:');
    results.slice(0, 20).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.path} (${r.count} replacements)`);
    });
  }

  console.log('\n✅ Design system migration complete!');
}

main().catch(console.error);
