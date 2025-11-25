/**
 * Brand Registry
 *
 * Central registry of all Unite-Group brands with metadata, positioning,
 * and cross-linking rules. This is the source of truth for brand information
 * consumed by all Unite-Hub engines and intelligence systems.
 *
 * Data source: Unite-Group repository (synced via API)
 *
 * @module brands/brandRegistry
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/brands/registry' });

// ====================================
// Brand Types
// ====================================

export interface Brand {
  slug: string;
  domain: string;
  role: string;
  positioning: string[];
  cross_links?: string[];
  metadata?: {
    industry?: string;
    target_audience?: string[];
    primary_color?: string;
    secondary_color?: string;
    tone_of_voice?: string;
    content_themes?: string[];
  };
}

export interface BrandRegistry {
  brands: Brand[];
  last_sync: string;
  source: 'unite-group-api' | 'local-cache' | 'mock';
}

// ====================================
// Brand Registry Data (Synced from Unite-Group)
// ====================================

/**
 * Brand registry data
 * In production, this would be synced from Unite-Group API
 * For now, this is the local copy that matches Unite-Group Nexus
 */
const BRAND_REGISTRY_DATA: Brand[] = [
  {
    slug: 'disaster-recovery',
    domain: 'https://www.disasterrecovery.com.au',
    role: "Industry 'Who Do I Call' brand for homeowners, tenants, businesses and managers needing restoration help.",
    positioning: [
      'Client-first, not insurer-first.',
      'Education + empowerment around IICRC and AU standards.',
      'Gateway to NRPG-verified contractors.',
    ],
    cross_links: ['carsi', 'nrpg'],
    metadata: {
      industry: 'Restoration & Remediation',
      target_audience: ['Homeowners', 'Tenants', 'Property Managers', 'Businesses'],
      tone_of_voice: 'Helpful, Educational, Empowering',
      content_themes: ['IICRC Standards', 'AU Compliance', 'Client Rights', 'Contractor Vetting'],
    },
  },
  {
    slug: 'synthex',
    domain: 'https://synthex.social',
    role: 'Unite-Hub powered marketing agency.',
    positioning: [
      'Done-for-you + done-with-you marketing.',
      'Ethical performance-driven SEO, GEO and content.',
    ],
    cross_links: ['unite-group'],
    metadata: {
      industry: 'Marketing Agency',
      target_audience: ['Small Businesses', 'Service Providers', 'SaaS Companies'],
      tone_of_voice: 'Professional, Transparent, Results-Focused',
      content_themes: ['SEO', 'GEO', 'Content Marketing', 'AI-Powered Marketing'],
    },
  },
  {
    slug: 'unite-group',
    domain: 'https://unite-group.in',
    role: 'Nexus brand connecting all SaaS, training, and agency products.',
    positioning: [
      'Technology + AI + Industry Operations combined.',
      'Home of Unite-Hub and Nexus AI.',
    ],
    cross_links: ['synthex', 'carsi', 'nrpg', 'disaster-recovery'],
    metadata: {
      industry: 'Technology & SaaS',
      target_audience: ['Founders', 'Business Owners', 'Operations Teams'],
      tone_of_voice: 'Visionary, Technical, Innovative',
      content_themes: ['AI', 'Automation', 'SaaS', 'Industry Tech'],
    },
  },
  {
    slug: 'carsi',
    domain: 'https://carsi.com.au',
    role: 'Cleaning & Restoration Science Institute (training).',
    positioning: [
      'Online learning centre for the industry.',
      'Courses, CECs, technical updates.',
    ],
    cross_links: ['unite-group'],
    metadata: {
      industry: 'Education & Training',
      target_audience: ['Restoration Professionals', 'Cleaning Technicians', 'Industry Workers'],
      tone_of_voice: 'Educational, Authoritative, Practical',
      content_themes: ['Training', 'Certifications', 'Industry Standards', 'CECs'],
    },
  },
  {
    slug: 'nrpg',
    domain: 'https://nrpg.business',
    role: 'National Restoration Professionals Group.',
    positioning: [
      'Standards + vetting for contractors.',
      'Independent of insurers and builders.',
    ],
    cross_links: ['disaster-recovery', 'carsi'],
    metadata: {
      industry: 'Professional Association',
      target_audience: ['Restoration Contractors', 'Industry Professionals'],
      tone_of_voice: 'Professional, Standards-Focused, Independent',
      content_themes: ['Standards', 'Vetting', 'Industry Guidelines', 'Best Practices'],
    },
  },
];

// ====================================
// Brand Registry Singleton
// ====================================

class BrandRegistryService {
  private registry: BrandRegistry | null = null;
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all brands from registry
   */
  async getAllBrands(): Promise<Brand[]> {
    await this.ensureLoaded();
    return this.registry?.brands || [];
  }

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string): Promise<Brand | null> {
    await this.ensureLoaded();
    return this.registry?.brands.find((b) => b.slug === slug) || null;
  }

  /**
   * Get brands by domain
   */
  async getBrandByDomain(domain: string): Promise<Brand | null> {
    await this.ensureLoaded();
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '');
    return (
      this.registry?.brands.find((b) =>
        b.domain.toLowerCase().replace(/^https?:\/\//, '').includes(normalizedDomain)
      ) || null
    );
  }

  /**
   * Get cross-linked brands for a given brand
   */
  async getCrossLinkedBrands(brandSlug: string): Promise<Brand[]> {
    const brand = await this.getBrandBySlug(brandSlug);
    if (!brand || !brand.cross_links) return [];

    const linkedBrands: Brand[] = [];
    for (const linkedSlug of brand.cross_links) {
      const linkedBrand = await this.getBrandBySlug(linkedSlug);
      if (linkedBrand) {
        linkedBrands.push(linkedBrand);
      }
    }

    return linkedBrands;
  }

  /**
   * Check if brand A can reference brand B (based on cross-link rules)
   */
  async canCrossLink(sourceBrandSlug: string, targetBrandSlug: string): Promise<boolean> {
    const sourceBrand = await this.getBrandBySlug(sourceBrandSlug);
    if (!sourceBrand) return false;

    // unite-group (nexus) can reference all brands
    if (sourceBrandSlug === 'unite-group') return true;

    // Check if target is in source's cross_links
    return sourceBrand.cross_links?.includes(targetBrandSlug) || false;
  }

  /**
   * Get brands by industry
   */
  async getBrandsByIndustry(industry: string): Promise<Brand[]> {
    await this.ensureLoaded();
    return (
      this.registry?.brands.filter(
        (b) => b.metadata?.industry?.toLowerCase() === industry.toLowerCase()
      ) || []
    );
  }

  /**
   * Get hub brand (unite-group)
   */
  async getHubBrand(): Promise<Brand | null> {
    return this.getBrandBySlug('unite-group');
  }

  /**
   * Ensure registry is loaded and fresh
   */
  private async ensureLoaded(): Promise<void> {
    const now = Date.now();

    // If registry is loaded and cache is fresh, return
    if (this.registry && now - this.lastFetch < this.cacheDuration) {
      return;
    }

    // Attempt to fetch from Unite-Group API
    try {
      const registry = await this.fetchFromUniteGroupAPI();
      this.registry = registry;
      this.lastFetch = now;
      logger.info('Brand registry synced from Unite-Group API', {
        brands: registry.brands.length,
      });
    } catch (error) {
      logger.warn('Failed to fetch from Unite-Group API, using local cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to local cache
      this.registry = {
        brands: BRAND_REGISTRY_DATA,
        last_sync: new Date().toISOString(),
        source: 'local-cache',
      };
      this.lastFetch = now;
    }
  }

  /**
   * Fetch brand registry from Unite-Group API
   */
  private async fetchFromUniteGroupAPI(): Promise<BrandRegistry> {
    // TODO: Implement actual Unite-Group API integration
    // For now, return local data as if it came from API

    if (process.env.UNITE_GROUP_API_URL && process.env.UNITE_GROUP_API_KEY) {
      const response = await fetch(`${process.env.UNITE_GROUP_API_URL}/v1/brands`, {
        headers: {
          Authorization: `Bearer ${process.env.UNITE_GROUP_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();

      return {
        brands: data.brands,
        last_sync: new Date().toISOString(),
        source: 'unite-group-api',
      };
    }

    // Development mode: use local data
    return {
      brands: BRAND_REGISTRY_DATA,
      last_sync: new Date().toISOString(),
      source: 'mock',
    };
  }

  /**
   * Manually refresh registry (force sync)
   */
  async refresh(): Promise<void> {
    this.lastFetch = 0; // Reset cache
    await this.ensureLoaded();
  }

  /**
   * Get registry metadata
   */
  async getRegistryMetadata(): Promise<{
    last_sync: string;
    source: string;
    brand_count: number;
  }> {
    await this.ensureLoaded();

    return {
      last_sync: this.registry?.last_sync || new Date().toISOString(),
      source: this.registry?.source || 'unknown',
      brand_count: this.registry?.brands.length || 0,
    };
  }
}

// Export singleton instance
export const brandRegistry = new BrandRegistryService();

/**
 * Validate brand slug
 */
export function isValidBrandSlug(slug: string): boolean {
  return BRAND_REGISTRY_DATA.some((b) => b.slug === slug);
}

/**
 * Get all valid brand slugs
 */
export function getAllBrandSlugs(): string[] {
  return BRAND_REGISTRY_DATA.map((b) => b.slug);
}
