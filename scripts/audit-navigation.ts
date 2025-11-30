#!/usr/bin/env ts-node
/**
 * Navigation Audit Script
 * Scans the codebase to identify:
 * 1. All defined routes (page.tsx files)
 * 2. All linked routes (href attributes)
 * 3. Missing pages (linked but don't exist)
 * 4. Dead links (href="#" or empty)
 * 5. Orphan pages (exist but never linked)
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  route: string;
  filePath: string;
  type: 'page' | 'api';
}

interface LinkInfo {
  route: string;
  sourceFile: string;
  line: number;
  context: string;
  isDeadLink: boolean;
}

interface NavigationReport {
  timestamp: string;
  definedRoutes: RouteInfo[];
  linkedRoutes: LinkInfo[];
  missingPages: {
    route: string;
    linkedFrom: { file: string; line: number }[];
  }[];
  deadLinks: LinkInfo[];
  orphanPages: RouteInfo[];
  summary: {
    totalPages: number;
    totalLinks: number;
    missingPagesCount: number;
    deadLinksCount: number;
    orphanPagesCount: number;
  };
}

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

function shouldScanDirectory(dirPath: string): boolean {
  const dirName = path.basename(dirPath);
  return !EXCLUDE_DIRS.includes(dirName);
}

/**
 * Find all page.tsx/page.ts files to identify defined routes
 */
function findDefinedRoutes(appDir: string): RouteInfo[] {
  const routes: RouteInfo[] = [];

  function scanDir(dir: string, routePrefix: string = ''): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldScanDirectory(fullPath)) continue;

        // Handle route groups (folders starting with parentheses)
        let newPrefix = routePrefix;
        if (!entry.name.startsWith('(') && !entry.name.startsWith('_')) {
          newPrefix = `${routePrefix}/${entry.name}`;
        }

        scanDir(fullPath, newPrefix);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        const route = routePrefix || '/';
        routes.push({
          route,
          filePath: fullPath,
          type: 'page',
        });
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        const route = routePrefix || '/';
        routes.push({
          route: `/api${route}`.replace('/api/', '/api/'),
          filePath: fullPath,
          type: 'api',
        });
      }
    }
  }

  scanDir(appDir);
  return routes;
}

/**
 * Scan files for href and Link references
 */
function findLinkedRoutes(srcDir: string): LinkInfo[] {
  const links: LinkInfo[] = [];

  // Patterns to match hrefs and Links
  const patterns = [
    // href="..." or href='...'
    /href\s*=\s*["']([^"']+)["']/g,
    // href={...} (dynamic, but we can capture template strings)
    /href\s*=\s*\{[`"]([^`"]+)[`"]\}/g,
    // to="..." or to='...' (React Router style)
    /to\s*=\s*["']([^"']+)["']/g,
    // router.push('...')
    /router\.push\s*\(\s*["']([^"']+)["']/g,
    // router.replace('...')
    /router\.replace\s*\(\s*["']([^"']+)["']/g,
    // redirect('...')
    /redirect\s*\(\s*["']([^"']+)["']/g,
    // Link component with href prop
    /<Link[^>]+href\s*=\s*["']([^"']+)["']/g,
  ];

  function scanFile(filePath: string): void {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.tsx', '.ts', '.jsx', '.js'].includes(ext)) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      patterns.forEach((pattern) => {
        // Reset regex
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(line)) !== null) {
          const route = match[1];

          // Skip external links, assets, and special protocols
          if (
            route.startsWith('http://') ||
            route.startsWith('https://') ||
            route.startsWith('mailto:') ||
            route.startsWith('tel:') ||
            route.startsWith('/api/') ||
            route.startsWith('/_next/') ||
            route.startsWith('/images/') ||
            route.startsWith('/assets/') ||
            route.includes('${') // Template literals
          ) {
            continue;
          }

          const isDeadLink =
            route === '#' || route === '' || route === 'undefined' || route === 'null';

          links.push({
            route: route.split('?')[0].split('#')[0], // Remove query params and hash
            sourceFile: filePath,
            line: index + 1,
            context: line.trim().substring(0, 200),
            isDeadLink,
          });
        }
      });
    });
  }

  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (shouldScanDirectory(fullPath)) {
          scanDir(fullPath);
        }
      } else {
        scanFile(fullPath);
      }
    }
  }

  scanDir(srcDir);
  return links;
}

/**
 * Normalize route for comparison
 */
function normalizeRoute(route: string): string {
  // Remove trailing slash
  let normalized = route.replace(/\/$/, '') || '/';

  // Handle dynamic segments [id] -> *
  normalized = normalized.replace(/\[[^\]]+\]/g, '*');

  return normalized;
}

/**
 * Check if a linked route matches any defined route
 */
function routeExists(
  linkedRoute: string,
  definedRoutes: RouteInfo[]
): boolean {
  const normalizedLink = normalizeRoute(linkedRoute);

  return definedRoutes.some((defined) => {
    const normalizedDefined = normalizeRoute(defined.route);

    // Exact match
    if (normalizedLink === normalizedDefined) return true;

    // Dynamic route match
    if (normalizedDefined.includes('*')) {
      const regex = new RegExp(
        '^' + normalizedDefined.replace(/\*/g, '[^/]+') + '$'
      );
      if (regex.test(normalizedLink)) return true;
    }

    return false;
  });
}

function generateReport(
  definedRoutes: RouteInfo[],
  linkedRoutes: LinkInfo[]
): NavigationReport {
  // Find dead links
  const deadLinks = linkedRoutes.filter((link) => link.isDeadLink);

  // Find unique non-dead links
  const validLinks = linkedRoutes.filter((link) => !link.isDeadLink);

  // Find missing pages (linked but don't exist)
  const missingPagesMap = new Map<
    string,
    { file: string; line: number }[]
  >();

  validLinks.forEach((link) => {
    if (!routeExists(link.route, definedRoutes)) {
      const existing = missingPagesMap.get(link.route) || [];
      existing.push({ file: link.sourceFile, line: link.line });
      missingPagesMap.set(link.route, existing);
    }
  });

  const missingPages = Array.from(missingPagesMap.entries()).map(
    ([route, linkedFrom]) => ({
      route,
      linkedFrom,
    })
  );

  // Find orphan pages (exist but never linked)
  const pageRoutes = definedRoutes.filter((r) => r.type === 'page');
  const linkedRouteSet = new Set(
    validLinks.map((l) => normalizeRoute(l.route))
  );

  // Common routes that don't need to be linked
  const commonRoutes = ['/', '/login', '/signup', '/auth/callback'];

  const orphanPages = pageRoutes.filter((page) => {
    const normalized = normalizeRoute(page.route);
    if (commonRoutes.includes(normalized)) return false;
    if (normalized.includes('*')) return false; // Dynamic routes are usually accessed via params

    return !linkedRouteSet.has(normalized);
  });

  return {
    timestamp: new Date().toISOString(),
    definedRoutes,
    linkedRoutes,
    missingPages,
    deadLinks,
    orphanPages,
    summary: {
      totalPages: pageRoutes.length,
      totalLinks: validLinks.length,
      missingPagesCount: missingPages.length,
      deadLinksCount: deadLinks.length,
      orphanPagesCount: orphanPages.length,
    },
  };
}

function main(): void {
  const appDir = path.resolve(__dirname, '../src/app');
  const srcDir = path.resolve(__dirname, '../src');

  console.error('Scanning for navigation issues...');
  console.error('App directory:', appDir);
  console.error('');

  const definedRoutes = findDefinedRoutes(appDir);
  const linkedRoutes = findLinkedRoutes(srcDir);
  const report = generateReport(definedRoutes, linkedRoutes);

  // Output JSON to stdout
  console.log(JSON.stringify(report, null, 2));

  // Output summary to stderr
  console.error('');
  console.error('='.repeat(60));
  console.error('NAVIGATION AUDIT REPORT');
  console.error('='.repeat(60));
  console.error('');
  console.error(`Total Pages: ${report.summary.totalPages}`);
  console.error(`Total Links: ${report.summary.totalLinks}`);
  console.error(`Missing Pages: ${report.summary.missingPagesCount}`);
  console.error(`Dead Links: ${report.summary.deadLinksCount}`);
  console.error(`Orphan Pages: ${report.summary.orphanPagesCount}`);
  console.error('');

  if (report.missingPages.length > 0) {
    console.error('Missing Pages:');
    report.missingPages.forEach((mp) => {
      console.error(`  ${mp.route} (linked from ${mp.linkedFrom.length} file(s))`);
    });
    console.error('');
  }

  if (report.deadLinks.length > 0) {
    console.error('Dead Links (first 10):');
    report.deadLinks.slice(0, 10).forEach((dl) => {
      console.error(`  ${dl.sourceFile}:${dl.line}`);
    });
    console.error('');
  }

  if (report.orphanPages.length > 0) {
    console.error('Orphan Pages:');
    report.orphanPages.forEach((op) => {
      console.error(`  ${op.route}`);
    });
    console.error('');
  }

  // Exit with error if critical issues
  if (report.missingPages.length > 0 || report.deadLinks.length > 0) {
    process.exit(1);
  }
}

main();
