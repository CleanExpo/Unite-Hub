#!/usr/bin/env node

/**
 * Navigation Audit CLI
 * Run: npm run audit:navigation
 */

import fs from 'fs';
import path from 'path';

const LINK_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const SKIP_DIRECTORIES = ['node_modules', '.next', '.git', 'dist', 'build', '.vercel', '_disabled', 'logs'];

function getAllFiles(dirPath, extensions) {
  const files = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.includes(entry.name)) {
          files.push(...getAllFiles(fullPath, extensions));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (e) {
    // Skip
  }
  return files;
}

function getDefinedRoutes(appDir) {
  const routes = [];

  function scanDir(dir, currentPath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const segment = entry.name.startsWith('(') && entry.name.endsWith(')')
            ? ''
            : entry.name;
          scanDir(path.join(dir, entry.name), currentPath + (segment ? '/' + segment : ''));
        } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
          routes.push(currentPath || '/');
        }
      }
    } catch (e) {
      // Skip
    }
  }

  scanDir(appDir);
  return [...new Set(routes)].sort();
}

function extractLinks(files) {
  const linked = [];
  const deadLinks = [];

  const linkPatterns = [
    /href=["']([^"']+)["']/g,
    /to=["']([^"']+)["']/g,
    /push\(["']([^"']+)["']\)/g,
    /replace\(["']([^"']+)["']\)/g,
  ];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, lineIndex) => {
        for (const pattern of linkPatterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            const href = match[1];
            if (href === '#' || href === '') {
              deadLinks.push({
                file,
                line: lineIndex + 1,
                href: href || '(empty)',
                type: href === '#' ? 'hash' : 'empty'
              });
            } else if (href.startsWith('javascript:')) {
              deadLinks.push({
                file,
                line: lineIndex + 1,
                href,
                type: 'javascript'
              });
            } else if (href.startsWith('/') && !href.startsWith('/api')) {
              const cleanHref = href.split('?')[0].split('#')[0];
              linked.push(cleanHref);
            }
          }
        }
      });
    } catch (e) {
      // Skip
    }
  }

  return { linked: [...new Set(linked)].sort(), deadLinks };
}

// Main
console.log('🔍 Auditing navigation...\n');

const appDir = path.join(process.cwd(), 'src', 'app');
const srcDir = path.join(process.cwd(), 'src');

const definedRoutes = getDefinedRoutes(appDir);
const sourceFiles = getAllFiles(srcDir, LINK_EXTENSIONS);
const { linked, deadLinks } = extractLinks(sourceFiles);

// Find missing pages
const missingPages = linked.filter(route => {
  return !definedRoutes.some(defined => {
    if (route === defined) return true;
    if (defined.includes('[')) {
      const pattern = defined.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(route);
    }
    return false;
  });
});

// Find orphan pages
const orphanPages = definedRoutes.filter(route => {
  if (route === '/') return false;
  return !linked.some(link => link === route || link.startsWith(route + '/'));
});

// Output
console.log('📊 Navigation Audit Report');
console.log('==========================\n');
console.log(`Defined Routes: ${definedRoutes.length}`);
console.log(`Linked Routes: ${linked.length}`);
console.log(`Missing Pages: ${missingPages.length}`);
console.log(`Dead Links: ${deadLinks.length}`);
console.log(`Orphan Pages: ${orphanPages.length}\n`);

if (missingPages.length > 0) {
  console.log('❌ MISSING PAGES (routes linked but no page exists):');
  console.log('----------------------------------------------------');
  for (const page of missingPages.slice(0, 20)) {
    console.log(`  ${page}`);
  }
  if (missingPages.length > 20) {
    console.log(`  ... and ${missingPages.length - 20} more`);
  }
  console.log('');
}

if (deadLinks.length > 0) {
  console.log('⚠️ DEAD LINKS:');
  console.log('--------------');
  for (const link of deadLinks.slice(0, 20)) {
    const relativePath = link.file.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`  ${relativePath}:${link.line} → "${link.href}" (${link.type})`);
  }
  if (deadLinks.length > 20) {
    console.log(`  ... and ${deadLinks.length - 20} more`);
  }
  console.log('');
}

if (orphanPages.length > 0) {
  console.log('📄 ORPHAN PAGES (exist but never linked):');
  console.log('------------------------------------------');
  for (const page of orphanPages.slice(0, 30)) {
    console.log(`  ${page}`);
  }
  if (orphanPages.length > 30) {
    console.log(`  ... and ${orphanPages.length - 30} more`);
  }
  console.log('');
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  definedRoutes,
  linkedRoutes: linked,
  missingPages,
  deadLinks,
  orphanPages
};

fs.writeFileSync('navigation-report.json', JSON.stringify(report, null, 2));
console.log('📄 Full report saved to: navigation-report.json');

// Exit status
if (missingPages.length > 0 || deadLinks.length > 0) {
  console.log('\n⚠️ Navigation issues found!');
  process.exit(1);
} else {
  console.log('\n✅ Navigation looks healthy.');
  process.exit(0);
}
