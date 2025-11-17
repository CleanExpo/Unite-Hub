#!/usr/bin/env node

/**
 * Script to fix broken footer links in auth pages
 */

import { readFileSync, writeFileSync } from 'fs';

const AUTH_PAGES = [
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(auth)/signup/page.tsx',
];

console.log('🔧 Fixing auth page footer links...\n');

AUTH_PAGES.forEach((file) => {
  try {
    let content = readFileSync(file, 'utf8');

    // Replace broken links with proper routes
    const replacements = [
      { from: '<a href="#" className="hover:text-white transition-colors">Privacy</a>', to: '<Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>' },
      { from: '<a href="#" className="hover:text-white transition-colors">Terms</a>', to: '<Link href="/terms" className="hover:text-white transition-colors">Terms</Link>' },
      { from: '<a href="#" className="hover:text-white transition-colors">Help</a>', to: '<a href="https://help.unite-hub.com" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Help</a>' },
    ];

    let changesCount = 0;
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        changesCount++;
      }
    });

    if (changesCount > 0) {
      writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed ${changesCount} links in ${file}`);
    } else {
      console.log(`⏭️  No changes needed in ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✨ Auth page footer links fixed!');
