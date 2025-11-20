/**
 * IndexingHealthService - SEO Health Monitoring
 * Phase 13 Week 7-8: Indexing and health checks
 *
 * Handles:
 * - Google indexing status checks
 * - Schema.org validation
 * - OG image verification
 * - Page performance metrics
 */

import * as crypto from 'crypto';

export interface HealthCheckConfig {
  url: string;
  urlType: 'cloud' | 'blogger' | 'gsite' | 'money_site';
  checkIndexing?: boolean;
  checkSchema?: boolean;
  checkOgImage?: boolean;
  checkPerformance?: boolean;
}

export interface HealthCheckResult {
  url: string;
  urlType: string;
  checkedAt: Date;

  // Indexing
  isIndexed: boolean | null;
  indexedAt?: Date;
  cacheDate?: Date;

  // Schema
  hasSchema: boolean;
  schemaValid: boolean;
  schemaErrors: string[];
  schemaTypes: string[];

  // OG Image
  hasOgImage: boolean;
  ogImageUrl?: string;
  ogImageHash?: string;
  ogImageValid: boolean;

  // Performance
  loadTimeMs: number;
  pageSizeBytes: number;
  mobileFriendly: boolean;

  // Overall score
  healthScore: number;
  recommendations: string[];
}

export interface BatchHealthCheckResult {
  results: HealthCheckResult[];
  averageScore: number;
  totalChecked: number;
  failedChecks: number;
  timestamp: Date;
}

export class IndexingHealthService {
  private userAgent: string;

  constructor() {
    this.userAgent = 'Mozilla/5.0 (compatible; LeviathanHealthBot/1.0)';
  }

  /**
   * Check health of a single URL
   */
  async checkHealth(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      url: config.url,
      urlType: config.urlType,
      checkedAt: new Date(),
      isIndexed: null,
      hasSchema: false,
      schemaValid: false,
      schemaErrors: [],
      schemaTypes: [],
      hasOgImage: false,
      ogImageValid: false,
      loadTimeMs: 0,
      pageSizeBytes: 0,
      mobileFriendly: false,
      healthScore: 0,
      recommendations: [],
    };

    try {
      // Fetch page content
      const startTime = Date.now();
      const response = await this.fetchPage(config.url);
      result.loadTimeMs = Date.now() - startTime;
      result.pageSizeBytes = response.content.length;

      // Check schema
      if (config.checkSchema !== false) {
        const schemaResult = this.checkSchema(response.content);
        result.hasSchema = schemaResult.hasSchema;
        result.schemaValid = schemaResult.isValid;
        result.schemaErrors = schemaResult.errors;
        result.schemaTypes = schemaResult.types;
      }

      // Check OG image
      if (config.checkOgImage !== false) {
        const ogResult = this.checkOgImage(response.content);
        result.hasOgImage = ogResult.hasOgImage;
        result.ogImageUrl = ogResult.ogImageUrl;
        result.ogImageHash = ogResult.ogImageHash;
        result.ogImageValid = ogResult.isValid;
      }

      // Check indexing (simulated - would use Google Search Console API)
      if (config.checkIndexing !== false) {
        const indexResult = await this.checkIndexing(config.url);
        result.isIndexed = indexResult.isIndexed;
        result.indexedAt = indexResult.indexedAt;
        result.cacheDate = indexResult.cacheDate;
      }

      // Check mobile friendliness
      if (config.checkPerformance !== false) {
        result.mobileFriendly = this.checkMobileFriendly(response.content);
      }

      // Calculate health score
      result.healthScore = this.calculateHealthScore(result);

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.recommendations = [`Error checking URL: ${errorMessage}`];
      result.healthScore = 0;
    }

    return result;
  }

  /**
   * Check health of multiple URLs
   */
  async checkHealthBatch(configs: HealthCheckConfig[]): Promise<BatchHealthCheckResult> {
    const results: HealthCheckResult[] = [];
    let failedChecks = 0;

    for (const config of configs) {
      try {
        const result = await this.checkHealth(config);
        results.push(result);
        if (result.healthScore < 50) {
          failedChecks++;
        }
      } catch (error) {
        failedChecks++;
      }
    }

    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.healthScore, 0) / results.length
      : 0;

    return {
      results,
      averageScore,
      totalChecked: configs.length,
      failedChecks,
      timestamp: new Date(),
    };
  }

  /**
   * Fetch page content
   */
  private async fetchPage(url: string): Promise<{ content: string; headers: Record<string, string> }> {
    // In production, this would make actual HTTP requests
    // For now, return simulated content
    return {
      content: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page</title>
          <meta property="og:image" content="https://example.com/image.png" />
          <script type="application/ld+json">
            {"@context": "https://schema.org", "@type": "Article", "headline": "Test"}
          </script>
        </head>
        <body>
          <h1>Test Content</h1>
        </body>
        </html>
      `,
      headers: {
        'content-type': 'text/html',
        'content-length': '500',
      },
    };
  }

  /**
   * Check schema.org markup
   */
  private checkSchema(html: string): {
    hasSchema: boolean;
    isValid: boolean;
    errors: string[];
    types: string[];
  } {
    const errors: string[] = [];
    const types: string[] = [];

    // Find JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    const matches = html.matchAll(jsonLdRegex);

    let hasSchema = false;
    let isValid = true;

    for (const match of matches) {
      hasSchema = true;
      try {
        const schema = JSON.parse(match[1]);
        if (schema['@type']) {
          types.push(schema['@type']);
        }

        // Basic validation
        if (!schema['@context']) {
          errors.push('Missing @context');
          isValid = false;
        }
        if (!schema['@type']) {
          errors.push('Missing @type');
          isValid = false;
        }
      } catch (e) {
        errors.push('Invalid JSON in schema');
        isValid = false;
      }
    }

    if (!hasSchema) {
      errors.push('No schema.org markup found');
    }

    return { hasSchema, isValid, errors, types };
  }

  /**
   * Check Open Graph image
   */
  private checkOgImage(html: string): {
    hasOgImage: boolean;
    ogImageUrl?: string;
    ogImageHash?: string;
    isValid: boolean;
  } {
    // Find og:image meta tag
    const ogImageRegex = /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i;
    const match = html.match(ogImageRegex);

    if (!match) {
      return { hasOgImage: false, isValid: false };
    }

    const ogImageUrl = match[1];
    const ogImageHash = crypto.createHash('md5').update(ogImageUrl).digest('hex');

    // Basic validation
    const isValid = ogImageUrl.startsWith('http') &&
                   (ogImageUrl.endsWith('.png') ||
                    ogImageUrl.endsWith('.jpg') ||
                    ogImageUrl.endsWith('.jpeg') ||
                    ogImageUrl.endsWith('.webp'));

    return {
      hasOgImage: true,
      ogImageUrl,
      ogImageHash,
      isValid,
    };
  }

  /**
   * Check indexing status (simulated)
   */
  private async checkIndexing(url: string): Promise<{
    isIndexed: boolean;
    indexedAt?: Date;
    cacheDate?: Date;
  }> {
    // In production, would use Google Search Console API
    // or site:url search query

    // Simulated response
    return {
      isIndexed: false, // New content not yet indexed
      indexedAt: undefined,
      cacheDate: undefined,
    };
  }

  /**
   * Check mobile friendliness
   */
  private checkMobileFriendly(html: string): boolean {
    // Check for viewport meta tag
    const hasViewport = /<meta[^>]*name="viewport"[^>]*>/i.test(html);

    // Check for responsive indicators
    const hasResponsive = /(@media|max-width|min-width)/i.test(html);

    return hasViewport || hasResponsive;
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(result: HealthCheckResult): number {
    let score = 0;

    // Schema (25 points)
    if (result.hasSchema) {
      score += 15;
      if (result.schemaValid) {
        score += 10;
      }
    }

    // OG Image (20 points)
    if (result.hasOgImage) {
      score += 10;
      if (result.ogImageValid) {
        score += 10;
      }
    }

    // Indexing (30 points)
    if (result.isIndexed) {
      score += 30;
    }

    // Performance (15 points)
    if (result.loadTimeMs < 1000) {
      score += 15;
    } else if (result.loadTimeMs < 2000) {
      score += 10;
    } else if (result.loadTimeMs < 3000) {
      score += 5;
    }

    // Mobile (10 points)
    if (result.mobileFriendly) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(result: HealthCheckResult): string[] {
    const recommendations: string[] = [];

    if (!result.hasSchema) {
      recommendations.push('Add schema.org JSON-LD markup');
    } else if (!result.schemaValid) {
      recommendations.push(`Fix schema errors: ${result.schemaErrors.join(', ')}`);
    }

    if (!result.hasOgImage) {
      recommendations.push('Add Open Graph image meta tag');
    } else if (!result.ogImageValid) {
      recommendations.push('Ensure OG image URL is valid and uses proper format');
    }

    if (!result.isIndexed) {
      recommendations.push('Submit URL to Google Search Console for indexing');
    }

    if (result.loadTimeMs > 2000) {
      recommendations.push('Optimize page load time (currently > 2s)');
    }

    if (!result.mobileFriendly) {
      recommendations.push('Add viewport meta tag for mobile responsiveness');
    }

    if (recommendations.length === 0) {
      recommendations.push('Page health looks good!');
    }

    return recommendations;
  }

  /**
   * Verify content hash matches
   */
  verifyContentHash(content: string, expectedHash: string): boolean {
    const actualHash = crypto.createHash('sha256').update(content).digest('hex');
    return actualHash === expectedHash;
  }

  /**
   * Generate content hash
   */
  generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

export default IndexingHealthService;
