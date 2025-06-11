// Dynamic Sitemap Generator
// Automatically generates and updates sitemap based on app routes

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  category?: string;
}

export interface SitemapConfig {
  baseUrl: string;
  excludePatterns?: string[];
  includeApi?: boolean;
  defaultChangeFrequency?: SitemapEntry['changeFrequency'];
  defaultPriority?: number;
}

export class SitemapGenerator {
  private config: Required<SitemapConfig>;
  private entries: SitemapEntry[] = [];

  constructor(config: SitemapConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      excludePatterns: config.excludePatterns || [],
      includeApi: config.includeApi || false,
      defaultChangeFrequency: config.defaultChangeFrequency || 'weekly',
      defaultPriority: config.defaultPriority || 0.5
    };
  }

  async generateSitemap(): Promise<string> {
    // Clear previous entries
    this.entries = [];

    // Scan app routes
    await this.scanAppRoutes();

    // Add static pages
    this.addStaticPages();

    // Generate XML
    return this.generateXML();
  }

  async generateVisualSitemap(): Promise<any> {
    // Clear previous entries
    this.entries = [];

    // Scan app routes
    await this.scanAppRoutes();

    // Add static pages
    this.addStaticPages();

    // Generate hierarchical structure
    return this.generateHierarchy();
  }

  private async scanAppRoutes() {
    const appDir = path.join(process.cwd(), 'src/app');
    const pageFiles = await glob('**/page.{tsx,ts,jsx,js}', {
      cwd: appDir,
      ignore: this.config.includeApi ? [] : ['api/**']
    });

    for (const pageFile of pageFiles) {
      const route = this.pageFileToRoute(pageFile);
      
      // Check if route should be excluded
      if (this.shouldExcludeRoute(route)) {
        continue;
      }

      // Get file stats for last modified date
      const filePath = path.join(appDir, pageFile);
      const stats = await fs.promises.stat(filePath);

      // Determine priority and change frequency based on route
      const { priority, changeFrequency } = this.getRouteConfig(route);
      const category = this.categorizeRoute(route);

      this.entries.push({
        url: `${this.config.baseUrl}${route}`,
        lastModified: stats.mtime,
        changeFrequency,
        priority,
        category
      });
    }
  }

  private pageFileToRoute(pageFile: string): string {
    // Remove page.tsx/ts/jsx/js
    let route = pageFile.replace(/\/page\.(tsx|ts|jsx|js)$/, '');
    
    // Handle root
    if (route === 'page') {
      return '/';
    }

    // Handle dynamic routes
    route = route.replace(/\[([^\]]+)\]/g, ':$1');

    // Ensure route starts with /
    return route.startsWith('/') ? route : `/${route}`;
  }

  private shouldExcludeRoute(route: string): boolean {
    // Always exclude certain routes
    const alwaysExclude = [
      '/404',
      '/500',
      '/_error',
      '/api',
      '/admin/site-health'
    ];

    if (alwaysExclude.some(pattern => route.startsWith(pattern))) {
      return true;
    }

    // Check custom exclude patterns
    return this.config.excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(route);
      }
      return route === pattern;
    });
  }

  private getRouteConfig(route: string): { priority: number; changeFrequency: SitemapEntry['changeFrequency'] } {
    // Homepage
    if (route === '/') {
      return { priority: 1.0, changeFrequency: 'daily' };
    }

    // Main sections
    if (['/services', '/about', '/contact', '/pricing'].includes(route)) {
      return { priority: 0.9, changeFrequency: 'weekly' };
    }

    // Blog posts
    if (route.startsWith('/blog/')) {
      return { priority: 0.7, changeFrequency: 'monthly' };
    }

    // Service pages
    if (route.startsWith('/services/')) {
      return { priority: 0.8, changeFrequency: 'monthly' };
    }

    // Dashboard pages (lower priority for public sitemap)
    if (route.startsWith('/dashboard')) {
      return { priority: 0.3, changeFrequency: 'weekly' };
    }

    // Default
    return {
      priority: this.config.defaultPriority,
      changeFrequency: this.config.defaultChangeFrequency
    };
  }

  private categorizeRoute(route: string): string {
    if (route === '/') return 'Home';
    if (route.startsWith('/services')) return 'Services';
    if (route.startsWith('/blog')) return 'Blog';
    if (route.startsWith('/about')) return 'About';
    if (route.startsWith('/contact')) return 'Contact';
    if (route.startsWith('/dashboard')) return 'Dashboard';
    if (route.startsWith('/resources')) return 'Resources';
    if (route.startsWith('/case-studies')) return 'Case Studies';
    return 'Other';
  }

  private addStaticPages() {
    // Add any static pages that might not be in the app directory
    const staticPages = [
      { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
      { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
      { url: '/sitemap', priority: 0.5, changeFrequency: 'monthly' as const }
    ];

    staticPages.forEach(page => {
      if (!this.entries.find(entry => entry.url.endsWith(page.url))) {
        this.entries.push({
          url: `${this.config.baseUrl}${page.url}`,
          lastModified: new Date(),
          changeFrequency: page.changeFrequency,
          priority: page.priority,
          category: 'Legal'
        });
      }
    });
  }

  private generateXML(): string {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...this.entries.map(entry => this.entryToXML(entry)),
      '</urlset>'
    ].join('\n');

    return xml;
  }

  private entryToXML(entry: SitemapEntry): string {
    return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  }

  private generateHierarchy() {
    const hierarchy: any = {
      name: 'Unite Group',
      url: this.config.baseUrl,
      children: []
    };

    // Group by category
    const categories = new Map<string, any[]>();
    
    this.entries.forEach(entry => {
      const category = entry.category || 'Other';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push({
        name: this.getPageName(entry.url),
        url: entry.url,
        lastModified: entry.lastModified,
        priority: entry.priority
      });
    });

    // Convert to hierarchy
    categories.forEach((pages, category) => {
      hierarchy.children.push({
        name: category,
        children: pages.sort((a, b) => b.priority - a.priority)
      });
    });

    return hierarchy;
  }

  private getPageName(url: string): string {
    const path = url.replace(this.config.baseUrl, '');
    if (path === '/' || path === '') return 'Home';
    
    // Extract last segment and format
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    // Handle dynamic routes
    if (lastSegment.startsWith(':')) {
      return `${segments[segments.length - 2]} (Dynamic)`;
    }
    
    // Format name
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async saveSitemap(outputPath: string) {
    const xml = await this.generateSitemap();
    await fs.promises.writeFile(outputPath, xml, 'utf-8');
  }

  async saveVisualSitemap(outputPath: string) {
    const hierarchy = await this.generateVisualSitemap();
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(hierarchy, null, 2),
      'utf-8'
    );
  }
}

// Helper function to generate sitemap on demand
export async function generateSitemap(baseUrl: string): Promise<string> {
  const generator = new SitemapGenerator({
    baseUrl,
    excludePatterns: [
      '/dashboard/*',
      '/admin/*',
      '/api/*',
      '/:path*' // Exclude all dynamic routes from public sitemap
    ]
  });

  return generator.generateSitemap();
}
