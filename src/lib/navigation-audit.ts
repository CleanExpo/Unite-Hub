/**
 * Navigation Audit System
 * Finds missing pages, dead links, and orphan pages
 */

import * as fs from 'fs';
import * as path from 'path';

export interface NavigationAudit {
  definedRoutes: string[];
  linkedRoutes: string[];
  missingPages: string[];
  deadLinks: DeadLink[];
  orphanPages: string[];
}

export interface DeadLink {
  file: string;
  line: number;
  href: string;
  type: 'empty' | 'hash' | 'javascript' | 'invalid';
}

// File extensions to scan for links
const LINK_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Directories to skip
const SKIP_DIRECTORIES = ['node_modules', '.next', '.git', 'dist', 'build', '.vercel', '_disabled'];

/**
 * Recursively get all files
 */
function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = [];

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
  } catch {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Get all defined routes from app directory
 */
function getDefinedRoutes(appDir: string): string[] {
  const routes: string[] = [];

  function scanDir(dir: string, currentPath: string = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Skip route groups (parentheses)
          const segment = entry.name.startsWith('(') && entry.name.endsWith(')')
            ? ''
            : entry.name;

          scanDir(path.join(dir, entry.name), currentPath + (segment ? '/' + segment : ''));
        } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
          routes.push(currentPath || '/');
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  scanDir(appDir);
  return [...new Set(routes)].sort();
}

/**
 * Extract all links from source files
 */
function extractLinks(files: string[]): { linked: string[]; deadLinks: DeadLink[] } {
  const linked: string[] = [];
  const deadLinks: DeadLink[] = [];

  const linkPatterns = [
    /href=["']([^"']+)["']/g,
    /to=["']([^"']+)["']/g,
    /push\(["']([^"']+)["']\)/g,
    /replace\(["']([^"']+)["']\)/g,
    /redirect\(["']([^"']+)["']\)/g,
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

            // Check for dead links
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
              // Internal route
              const cleanHref = href.split('?')[0].split('#')[0];
              linked.push(cleanHref);
            }
          }
        }
      });
    } catch {
      // Skip files we can't read
    }
  }

  return { linked: [...new Set(linked)].sort(), deadLinks };
}

/**
 * Run full navigation audit
 */
export function runNavigationAudit(rootDir: string = '.'): NavigationAudit {
  const appDir = path.join(rootDir, 'src', 'app');
  const srcDir = path.join(rootDir, 'src');

  // Get defined routes
  const definedRoutes = getDefinedRoutes(appDir);

  // Get all source files
  const sourceFiles = getAllFiles(srcDir, LINK_EXTENSIONS);

  // Extract links
  const { linked, deadLinks } = extractLinks(sourceFiles);

  // Find missing pages (linked but don't exist)
  const missingPages = linked.filter(route => {
    // Check if any defined route matches
    return !definedRoutes.some(defined => {
      // Exact match
      if (route === defined) {
return true;
}
      // Dynamic route match (e.g., /projects/[id] matches /projects/123)
      if (defined.includes('[')) {
        const pattern = defined.replace(/\[.*?\]/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(route);
      }
      return false;
    });
  });

  // Find orphan pages (defined but never linked)
  const orphanPages = definedRoutes.filter(route => {
    // Skip root
    if (route === '/') {
return false;
}
    // Check if linked anywhere
    return !linked.some(link => link === route || link.startsWith(route + '/'));
  });

  return {
    definedRoutes,
    linkedRoutes: linked,
    missingPages,
    deadLinks,
    orphanPages
  };
}

/**
 * Generate audit report
 */
export function generateNavigationReport(audit: NavigationAudit): string {
  const lines: string[] = [];

  lines.push('# Navigation Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Defined Routes:** ${audit.definedRoutes.length}`);
  lines.push(`- **Linked Routes:** ${audit.linkedRoutes.length}`);
  lines.push(`- **Missing Pages:** ${audit.missingPages.length}`);
  lines.push(`- **Dead Links:** ${audit.deadLinks.length}`);
  lines.push(`- **Orphan Pages:** ${audit.orphanPages.length}`);
  lines.push('');

  if (audit.missingPages.length > 0) {
    lines.push('## ❌ Missing Pages');
    lines.push('');
    lines.push('These routes are linked but no page exists:');
    lines.push('');
    for (const page of audit.missingPages) {
      lines.push(`- \`${page}\``);
    }
    lines.push('');
  }

  if (audit.deadLinks.length > 0) {
    lines.push('## ⚠️ Dead Links');
    lines.push('');
    lines.push('These links go nowhere:');
    lines.push('');
    for (const link of audit.deadLinks) {
      const relativePath = link.file.replace(process.cwd(), '').replace(/\\/g, '/');
      lines.push(`- \`${relativePath}:${link.line}\` - \`${link.href}\` (${link.type})`);
    }
    lines.push('');
  }

  if (audit.orphanPages.length > 0) {
    lines.push('## 📄 Orphan Pages');
    lines.push('');
    lines.push('These pages exist but are never linked:');
    lines.push('');
    for (const page of audit.orphanPages) {
      lines.push(`- \`${page}\``);
    }
    lines.push('');
  }

  lines.push('## ✅ Defined Routes');
  lines.push('');
  for (const route of audit.definedRoutes) {
    lines.push(`- \`${route}\``);
  }

  return lines.join('\n');
}

/**
 * Check if navigation is healthy (for CI/CD)
 */
export function hasNavigationIssues(audit: NavigationAudit): boolean {
  return audit.missingPages.length > 0 || audit.deadLinks.length > 0;
}
