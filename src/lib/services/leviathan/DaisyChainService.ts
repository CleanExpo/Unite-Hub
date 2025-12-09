/**
 * DaisyChainService - Daisy Chain Link Pattern Generator
 * Phase 13 Week 3-4: Quad-cloud deployment engine
 *
 * Handles:
 * - Link structure generation (ring, chain, full network)
 * - Anchor text variation
 * - Rel attribute assignment
 * - Money site link placement
 * - Natural link timing
 */

import * as crypto from 'crypto';

export interface DaisyChainConfig {
  deploymentType: 'single' | 'ring' | 'daisy_chain' | 'full_network';
  targetUrl: string;
  variantCount: number;
  anchorTextVariants?: string[];
  maxLinksPerPage?: number;
  moneySiteLinkRatio?: number;
}

export interface ChainLink {
  sourceVariantIndex: number;
  targetVariantIndex: number | null; // null = money site
  linkType: 'direct' | 'redirect' | 'canonical' | 'backlink' | 'citation';
  anchorText: string;
  relAttribute: string;
  chainPosition: number;
  isMoneySiteLink: boolean;
  linkOrder: number;
}

export interface LinkStructure {
  links: ChainLink[];
  statistics: {
    totalLinks: number;
    internalLinks: number;
    moneySiteLinks: number;
    avgLinksPerVariant: number;
  };
}

// Natural anchor text patterns
const ANCHOR_TEXT_PATTERNS = {
  branded: [
    '{brand}',
    '{brand} website',
    'Visit {brand}',
    'Learn more at {brand}',
  ],
  generic: [
    'click here',
    'learn more',
    'read more',
    'find out more',
    'discover more',
    'see details',
    'view website',
  ],
  keyword: [
    '{keyword}',
    '{keyword} services',
    'best {keyword}',
    'top {keyword}',
    '{keyword} solutions',
    'professional {keyword}',
  ],
  naked: [
    '{url}',
    'www.{domain}',
    '{domain}',
  ],
  partial: [
    '{partial} here',
    'this {partial}',
    '{partial} page',
  ],
};

// Rel attribute options
const REL_ATTRIBUTES = {
  follow: '',
  nofollow: 'nofollow',
  sponsored: 'sponsored',
  ugc: 'ugc',
  noopener: 'noopener noreferrer',
};

export class DaisyChainService {
  private random: () => number;

  constructor(seed?: number) {
    this.random = this.createSeededRandom(seed || Date.now());
  }

  /**
   * Generate link structure based on deployment type
   */
  generateLinkStructure(config: DaisyChainConfig): LinkStructure {
    switch (config.deploymentType) {
      case 'single':
        return this.generateSingleLinks(config);
      case 'ring':
        return this.generateRingLinks(config);
      case 'daisy_chain':
        return this.generateDaisyChainLinks(config);
      case 'full_network':
        return this.generateFullNetworkLinks(config);
      default:
        return this.generateSingleLinks(config);
    }
  }

  /**
   * Single deployment - just money site links
   */
  private generateSingleLinks(config: DaisyChainConfig): LinkStructure {
    const links: ChainLink[] = [];

    // Each variant links directly to money site
    for (let i = 0; i < config.variantCount; i++) {
      links.push({
        sourceVariantIndex: i,
        targetVariantIndex: null,
        linkType: 'direct',
        anchorText: this.generateAnchorText(config, 'keyword'),
        relAttribute: this.selectRelAttribute('follow'),
        chainPosition: 0,
        isMoneySiteLink: true,
        linkOrder: 0,
      });
    }

    return this.buildLinkStructure(links, config);
  }

  /**
   * Ring pattern - circular linking + money site
   */
  private generateRingLinks(config: DaisyChainConfig): LinkStructure {
    const links: ChainLink[] = [];
    const { variantCount } = config;

    for (let i = 0; i < variantCount; i++) {
      // Link to next in ring
      const nextIndex = (i + 1) % variantCount;

      links.push({
        sourceVariantIndex: i,
        targetVariantIndex: nextIndex,
        linkType: 'direct',
        anchorText: this.generateAnchorText(config, 'generic'),
        relAttribute: this.selectRelAttribute('follow'),
        chainPosition: i,
        isMoneySiteLink: false,
        linkOrder: 0,
      });

      // Some variants link to money site
      if (this.shouldLinkToMoneySite(i, config)) {
        links.push({
          sourceVariantIndex: i,
          targetVariantIndex: null,
          linkType: 'direct',
          anchorText: this.generateAnchorText(config, 'keyword'),
          relAttribute: this.selectRelAttribute('follow'),
          chainPosition: i,
          isMoneySiteLink: true,
          linkOrder: 1,
        });
      }
    }

    return this.buildLinkStructure(links, config);
  }

  /**
   * Daisy chain - linear linking to money site
   */
  private generateDaisyChainLinks(config: DaisyChainConfig): LinkStructure {
    const links: ChainLink[] = [];
    const { variantCount } = config;

    for (let i = 0; i < variantCount; i++) {
      if (i < variantCount - 1) {
        // Link to next in chain
        links.push({
          sourceVariantIndex: i,
          targetVariantIndex: i + 1,
          linkType: 'direct',
          anchorText: this.generateAnchorText(config, 'partial'),
          relAttribute: this.selectRelAttribute('follow'),
          chainPosition: i,
          isMoneySiteLink: false,
          linkOrder: 0,
        });
      }

      // Last in chain links to money site
      if (i === variantCount - 1) {
        links.push({
          sourceVariantIndex: i,
          targetVariantIndex: null,
          linkType: 'direct',
          anchorText: this.generateAnchorText(config, 'keyword'),
          relAttribute: this.selectRelAttribute('follow'),
          chainPosition: i,
          isMoneySiteLink: true,
          linkOrder: 0,
        });
      }

      // Optional: intermediate money site links
      if (i > 0 && i < variantCount - 1 && this.shouldLinkToMoneySite(i, config)) {
        links.push({
          sourceVariantIndex: i,
          targetVariantIndex: null,
          linkType: 'citation',
          anchorText: this.generateAnchorText(config, 'branded'),
          relAttribute: this.selectRelAttribute('follow'),
          chainPosition: i,
          isMoneySiteLink: true,
          linkOrder: 1,
        });
      }
    }

    return this.buildLinkStructure(links, config);
  }

  /**
   * Full network - interconnected with money site
   */
  private generateFullNetworkLinks(config: DaisyChainConfig): LinkStructure {
    const links: ChainLink[] = [];
    const { variantCount, maxLinksPerPage = 3 } = config;

    for (let i = 0; i < variantCount; i++) {
      const linkCount = Math.min(
        maxLinksPerPage,
        Math.ceil(this.random() * maxLinksPerPage)
      );

      // Generate internal links
      const targets = this.selectRandomTargets(i, variantCount, linkCount - 1);

      targets.forEach((targetIndex, order) => {
        links.push({
          sourceVariantIndex: i,
          targetVariantIndex: targetIndex,
          linkType: this.selectLinkType(),
          anchorText: this.generateAnchorText(config, 'generic'),
          relAttribute: this.selectRelAttribute('follow'),
          chainPosition: i,
          isMoneySiteLink: false,
          linkOrder: order,
        });
      });

      // Money site link
      if (this.shouldLinkToMoneySite(i, config)) {
        const anchorType = this.random() > 0.5 ? 'keyword' : 'branded';
        links.push({
          sourceVariantIndex: i,
          targetVariantIndex: null,
          linkType: 'direct',
          anchorText: this.generateAnchorText(config, anchorType),
          relAttribute: this.selectRelAttribute('follow'),
          chainPosition: i,
          isMoneySiteLink: true,
          linkOrder: targets.length,
        });
      }
    }

    return this.buildLinkStructure(links, config);
  }

  /**
   * Generate anchor text based on type
   */
  private generateAnchorText(
    config: DaisyChainConfig,
    type: keyof typeof ANCHOR_TEXT_PATTERNS
  ): string {
    const patterns = ANCHOR_TEXT_PATTERNS[type];
    const pattern = patterns[Math.floor(this.random() * patterns.length)];

    // Get custom variants if provided
    const customAnchors = config.anchorTextVariants || [];
    if (customAnchors.length > 0 && this.random() > 0.7) {
      return customAnchors[Math.floor(this.random() * customAnchors.length)];
    }

    // Replace placeholders
    const url = new URL(config.targetUrl);
    return pattern
      .replace('{brand}', this.extractBrand(url.hostname))
      .replace('{keyword}', this.extractKeyword(url.pathname))
      .replace('{url}', config.targetUrl)
      .replace('{domain}', url.hostname)
      .replace('{partial}', this.extractPartial(url.pathname));
  }

  /**
   * Select rel attribute based on link position
   */
  private selectRelAttribute(type: keyof typeof REL_ATTRIBUTES): string {
    return REL_ATTRIBUTES[type];
  }

  /**
   * Select link type
   */
  private selectLinkType(): 'direct' | 'redirect' | 'canonical' | 'backlink' | 'citation' {
    const types: ('direct' | 'redirect' | 'canonical' | 'backlink' | 'citation')[] = [
      'direct',
      'direct',
      'direct',
      'citation',
      'backlink',
    ];
    return types[Math.floor(this.random() * types.length)];
  }

  /**
   * Determine if variant should link to money site
   */
  private shouldLinkToMoneySite(index: number, config: DaisyChainConfig): boolean {
    const ratio = config.moneySiteLinkRatio || 0.3;
    return this.random() < ratio;
  }

  /**
   * Select random target indices
   */
  private selectRandomTargets(
    sourceIndex: number,
    totalCount: number,
    count: number
  ): number[] {
    const available = [];
    for (let i = 0; i < totalCount; i++) {
      if (i !== sourceIndex) {
        available.push(i);
      }
    }

    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    return available.slice(0, Math.min(count, available.length));
  }

  /**
   * Extract brand name from hostname
   */
  private extractBrand(hostname: string): string {
    const parts = hostname.replace('www.', '').split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  /**
   * Extract keyword from pathname
   */
  private extractKeyword(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
return 'services';
}
    return parts[parts.length - 1].replace(/-/g, ' ');
  }

  /**
   * Extract partial match text
   */
  private extractPartial(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
return 'article';
}
    const last = parts[parts.length - 1].replace(/-/g, ' ');
    const words = last.split(' ');
    return words.slice(0, Math.min(2, words.length)).join(' ');
  }

  /**
   * Build final link structure with statistics
   */
  private buildLinkStructure(
    links: ChainLink[],
    config: DaisyChainConfig
  ): LinkStructure {
    const moneySiteLinks = links.filter(l => l.isMoneySiteLink).length;
    const internalLinks = links.length - moneySiteLinks;

    return {
      links,
      statistics: {
        totalLinks: links.length,
        internalLinks,
        moneySiteLinks,
        avgLinksPerVariant: links.length / config.variantCount,
      },
    };
  }

  /**
   * Create seeded random function
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  /**
   * Generate HTML link element
   */
  generateLinkHTML(
    link: ChainLink,
    targetUrl: string
  ): string {
    const rel = link.relAttribute ? ` rel="${link.relAttribute}"` : '';
    return `<a href="${targetUrl}"${rel}>${link.anchorText}</a>`;
  }

  /**
   * Generate full propagation chain: GSite → Blogger → Cloud → Money Site
   */
  generatePropagationChain(config: {
    targetUrl: string;
    gsiteCount: number;
    bloggerCount: number;
    cloudVariantCount: number;
    cloudProviders: ('aws' | 'gcs' | 'azure' | 'netlify')[];
  }): PropagationChain {
    const links: PropagationLink[] = [];
    let linkId = 0;

    // Layer 1: GSite pages
    const gsiteIds = Array.from({ length: config.gsiteCount }, (_, i) => `gsite-${i}`);

    // Layer 2: Blogger posts
    const bloggerIds = Array.from({ length: config.bloggerCount }, (_, i) => `blogger-${i}`);

    // Layer 3: Cloud deployments
    const cloudIds: string[] = [];
    const providersPerVariant = Math.ceil(config.cloudVariantCount / config.cloudProviders.length);

    for (let i = 0; i < config.cloudVariantCount; i++) {
      const provider = config.cloudProviders[i % config.cloudProviders.length];
      cloudIds.push(`${provider}-${Math.floor(i / config.cloudProviders.length)}`);
    }

    // GSite → Blogger links
    for (const gsiteId of gsiteIds) {
      // Each GSite embeds/links to 1-2 Blogger posts
      const targetCount = Math.min(2, bloggerIds.length);
      for (let i = 0; i < targetCount; i++) {
        const targetBlogger = bloggerIds[Math.floor(this.random() * bloggerIds.length)];
        links.push({
          id: `link-${linkId++}`,
          sourceLayer: 1,
          sourceType: 'gsite',
          sourceId: gsiteId,
          targetLayer: 2,
          targetType: 'blogger',
          targetId: targetBlogger,
          linkType: 'embed',
          anchorText: this.generateAnchorText({ deploymentType: 'full_network', targetUrl: config.targetUrl, variantCount: 1 }, 'generic'),
        });
      }
    }

    // Blogger → Cloud links
    for (const bloggerId of bloggerIds) {
      // Each Blogger post links to 1-3 cloud deployments
      const targetCount = Math.min(3, cloudIds.length);
      for (let i = 0; i < targetCount; i++) {
        const targetCloud = cloudIds[Math.floor(this.random() * cloudIds.length)];
        links.push({
          id: `link-${linkId++}`,
          sourceLayer: 2,
          sourceType: 'blogger',
          sourceId: bloggerId,
          targetLayer: 3,
          targetType: targetCloud.split('-')[0] as any,
          targetId: targetCloud,
          linkType: 'direct',
          anchorText: this.generateAnchorText({ deploymentType: 'full_network', targetUrl: config.targetUrl, variantCount: 1 }, 'partial'),
        });
      }

      // Some Blogger posts link directly to money site
      if (this.random() > 0.5) {
        links.push({
          id: `link-${linkId++}`,
          sourceLayer: 2,
          sourceType: 'blogger',
          sourceId: bloggerId,
          targetLayer: 4,
          targetType: 'money_site',
          targetId: 'money-site',
          linkType: 'direct',
          anchorText: this.generateAnchorText({ deploymentType: 'full_network', targetUrl: config.targetUrl, variantCount: 1 }, 'branded'),
        });
      }
    }

    // Cloud → Money Site links
    for (const cloudId of cloudIds) {
      links.push({
        id: `link-${linkId++}`,
        sourceLayer: 3,
        sourceType: cloudId.split('-')[0] as any,
        sourceId: cloudId,
        targetLayer: 4,
        targetType: 'money_site',
        targetId: 'money-site',
        linkType: 'direct',
        anchorText: this.generateAnchorText({ deploymentType: 'full_network', targetUrl: config.targetUrl, variantCount: 1 }, 'keyword'),
      });
    }

    return {
      links,
      layers: {
        gsite: gsiteIds,
        blogger: bloggerIds,
        cloud: cloudIds,
        moneySite: [config.targetUrl],
      },
      statistics: {
        totalLinks: links.length,
        layer1To2: links.filter(l => l.sourceLayer === 1 && l.targetLayer === 2).length,
        layer2To3: links.filter(l => l.sourceLayer === 2 && l.targetLayer === 3).length,
        layer2To4: links.filter(l => l.sourceLayer === 2 && l.targetLayer === 4).length,
        layer3To4: links.filter(l => l.sourceLayer === 3 && l.targetLayer === 4).length,
      },
    };
  }
}

export interface PropagationLink {
  id: string;
  sourceLayer: number;
  sourceType: 'gsite' | 'blogger' | 'aws' | 'gcs' | 'azure' | 'netlify' | 'money_site';
  sourceId: string;
  targetLayer: number;
  targetType: 'gsite' | 'blogger' | 'aws' | 'gcs' | 'azure' | 'netlify' | 'money_site';
  targetId: string;
  linkType: 'embed' | 'direct' | 'citation';
  anchorText: string;
}

export interface PropagationChain {
  links: PropagationLink[];
  layers: {
    gsite: string[];
    blogger: string[];
    cloud: string[];
    moneySite: string[];
  };
  statistics: {
    totalLinks: number;
    layer1To2: number;
    layer2To3: number;
    layer2To4: number;
    layer3To4: number;
  };
}

export default DaisyChainService;
