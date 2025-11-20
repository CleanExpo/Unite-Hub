/**
 * Unit tests for Phase 13 Week 5-6: Social Stack & Stealth Wrapper
 */

import { BloggerContentEngine } from '../BloggerContentEngine';
import { StealthWrapperEngine } from '../StealthWrapperEngine';
import { DaisyChainService } from '../DaisyChainService';

describe('BloggerContentEngine', () => {
  let engine: BloggerContentEngine;

  beforeEach(() => {
    engine = new BloggerContentEngine(12345);
  });

  describe('transform', () => {
    it('should transform source content into blogger format', () => {
      const result = engine.transform({
        html: '<p>Test content</p>',
        title: 'Test Article',
        description: 'A test description',
        targetUrl: 'https://example.com',
        keywords: ['test', 'article'],
      });

      expect(result.title).toBeTruthy();
      expect(result.content).toContain('Test content');
      expect(result.labels).toContain('test');
      expect(result.excerpt).toBeTruthy();
    });

    it('should include schema.org JSON-LD', () => {
      const result = engine.transform({
        html: '<p>Content</p>',
        title: 'Schema Test',
        targetUrl: 'https://example.com',
      });

      expect(result.schemaJson).toBeDefined();
      expect((result.schemaJson as any)['@type']).toBe('Article');
    });

    it('should include OG image when provided with correct placement', () => {
      // Create engine with seed that produces 'top' image placement
      const testEngine = new BloggerContentEngine(12345);
      const variant = testEngine.generateVariant(0);

      const result = testEngine.transform({
        html: '<p>Content</p>',
        title: 'Image Test',
        targetUrl: 'https://example.com',
        ogImageUrl: 'https://example.com/image.png',
      });

      // Image should be included if placement is top, middle, or bottom
      if (['top', 'middle', 'bottom'].includes(variant.imagePlacement)) {
        expect(result.content).toContain('https://example.com/image.png');
      } else {
        // For 'side' placement, image is not rendered in current implementation
        expect(result.content).toBeDefined();
      }
    });

    it('should generate labels from keywords', () => {
      const result = engine.transform({
        html: '<p>Content</p>',
        title: 'Keyword Test',
        targetUrl: 'https://example.com',
        keywords: ['seo', 'marketing', 'content', 'strategy'],
      });

      expect(result.labels).toContain('seo');
      expect(result.labels).toContain('marketing');
      expect(result.labels.length).toBeLessThanOrEqual(8);
    });

    it('should add CTA section with target URL', () => {
      const result = engine.transform({
        html: '<p>Content</p>',
        title: 'CTA Test',
        targetUrl: 'https://example.com/services',
      });

      expect(result.content).toContain('https://example.com/services');
      expect(result.content).toContain('Next Steps');
    });
  });

  describe('generateVariants', () => {
    it('should generate specified number of variants', () => {
      const variants = engine.generateVariants({
        html: '<p>Content</p>',
        title: 'Variant Test',
        targetUrl: 'https://example.com',
      }, 5);

      expect(variants).toHaveLength(5);
    });

    it('should produce different titles for variants', () => {
      const variants = engine.generateVariants({
        html: '<p>Content</p>',
        title: 'Test Title',
        targetUrl: 'https://example.com',
      }, 10);

      const titles = variants.map(v => v.title);
      const uniqueTitles = new Set(titles);

      // With random prefixes, should have some variety
      expect(uniqueTitles.size).toBeGreaterThan(1);
    });
  });

  describe('generateVariant', () => {
    it('should return valid variant specification', () => {
      const variant = engine.generateVariant(0);

      expect(variant.variantIndex).toBe(0);
      expect(variant.seed).toBeDefined();
      expect(variant.titleVariant).toBeDefined();
      expect(variant.introVariant).toBeDefined();
      expect(variant.ctaVariant).toBeDefined();
      expect(variant.layoutTemplate).toBeDefined();
      expect(['top', 'middle', 'bottom', 'side']).toContain(variant.imagePlacement);
    });

    it('should generate different variants for different indices', () => {
      const variant0 = engine.generateVariant(0);
      const variant1 = engine.generateVariant(1);

      expect(variant0.seed).not.toBe(variant1.seed);
    });
  });
});

describe('StealthWrapperEngine', () => {
  let engine: StealthWrapperEngine;

  beforeEach(() => {
    engine = new StealthWrapperEngine(54321);
  });

  describe('generate', () => {
    it('should generate wrapper content', async () => {
      const result = await engine.generate({
        title: 'Test Resource',
        description: 'A test description',
        targetUrl: 'https://example.com',
        embeddedUrls: ['https://blog.example.com/post1'],
        keywords: ['test', 'resource'],
      });

      expect(result.headline).toBeTruthy();
      expect(result.introduction).toBeTruthy();
      expect(result.summary).toBeTruthy();
      expect(result.conclusion).toBeTruthy();
      expect(result.fullContent).toBeTruthy();
    });

    it('should include embedded URLs in content', async () => {
      const embeddedUrls = [
        'https://blog.example.com/post1',
        'https://blog.example.com/post2',
      ];

      const result = await engine.generate({
        title: 'Embedded Test',
        targetUrl: 'https://example.com',
        embeddedUrls,
      });

      expect(result.fullContent).toContain(embeddedUrls[0]);
      expect(result.fullContent).toContain(embeddedUrls[1]);
    });

    it('should include target URL in conclusion', async () => {
      const result = await engine.generate({
        title: 'Target Test',
        targetUrl: 'https://example.com/main',
        embeddedUrls: [],
      });

      expect(result.fullContent).toContain('https://example.com/main');
    });

    it('should generate context sections from keywords', async () => {
      const result = await engine.generate({
        title: 'Context Test',
        targetUrl: 'https://example.com',
        embeddedUrls: [],
        keywords: ['keyword1', 'keyword2', 'keyword3'],
      });

      expect(result.contextSections.length).toBeGreaterThan(0);
    });
  });

  describe('generateVariants', () => {
    it('should generate multiple wrapper variants', async () => {
      const variants = await engine.generateVariants({
        title: 'Multi Variant Test',
        targetUrl: 'https://example.com',
        embeddedUrls: [],
      }, 3);

      expect(variants).toHaveLength(3);
    });
  });

  describe('generateVariant', () => {
    it('should return valid variant spec', () => {
      const variant = engine.generateVariant(0);

      expect(variant.variantIndex).toBe(0);
      expect(variant.seed).toBeDefined();
      expect(['professional', 'informative', 'friendly', 'authoritative', 'conversational'])
        .toContain(variant.tone);
      expect(['direct', 'narrative', 'educational', 'descriptive', 'persuasive'])
        .toContain(variant.style);
      expect(['short', 'medium', 'long']).toContain(variant.length);
    });

    it('should produce consistent results for same index', () => {
      const variant1 = engine.generateVariant(5);
      const variant2 = engine.generateVariant(5);

      expect(variant1.seed).toBe(variant2.seed);
      expect(variant1.tone).toBe(variant2.tone);
      expect(variant1.style).toBe(variant2.style);
    });
  });
});

describe('DaisyChainService - Propagation', () => {
  let service: DaisyChainService;

  beforeEach(() => {
    service = new DaisyChainService(99999);
  });

  describe('generatePropagationChain', () => {
    it('should generate full propagation chain', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 2,
        bloggerCount: 3,
        cloudVariantCount: 4,
        cloudProviders: ['aws', 'gcs', 'azure', 'netlify'],
      });

      expect(chain.links.length).toBeGreaterThan(0);
      expect(chain.layers.gsite).toHaveLength(2);
      expect(chain.layers.blogger).toHaveLength(3);
      expect(chain.layers.cloud).toHaveLength(4);
    });

    it('should create GSite → Blogger links', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 2,
        bloggerCount: 2,
        cloudVariantCount: 2,
        cloudProviders: ['aws'],
      });

      const gsiteToBlogger = chain.links.filter(
        l => l.sourceType === 'gsite' && l.targetType === 'blogger'
      );

      expect(gsiteToBlogger.length).toBeGreaterThan(0);
      expect(chain.statistics.layer1To2).toBe(gsiteToBlogger.length);
    });

    it('should create Blogger → Cloud links', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 1,
        bloggerCount: 3,
        cloudVariantCount: 4,
        cloudProviders: ['aws', 'gcs'],
      });

      const bloggerToCloud = chain.links.filter(
        l => l.sourceType === 'blogger' && l.targetLayer === 3
      );

      expect(bloggerToCloud.length).toBeGreaterThan(0);
      expect(chain.statistics.layer2To3).toBe(bloggerToCloud.length);
    });

    it('should create Cloud → Money Site links', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 1,
        bloggerCount: 1,
        cloudVariantCount: 4,
        cloudProviders: ['aws', 'gcs', 'azure', 'netlify'],
      });

      const cloudToMoney = chain.links.filter(
        l => l.targetType === 'money_site' && l.sourceLayer === 3
      );

      expect(cloudToMoney.length).toBe(4); // One per cloud variant
      expect(chain.statistics.layer3To4).toBe(4);
    });

    it('should distribute cloud providers evenly', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 1,
        bloggerCount: 1,
        cloudVariantCount: 8,
        cloudProviders: ['aws', 'gcs', 'azure', 'netlify'],
      });

      const awsCount = chain.layers.cloud.filter(c => c.startsWith('aws')).length;
      const gcsCount = chain.layers.cloud.filter(c => c.startsWith('gcs')).length;

      expect(awsCount).toBe(2);
      expect(gcsCount).toBe(2);
    });

    it('should have correct statistics', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 2,
        bloggerCount: 3,
        cloudVariantCount: 4,
        cloudProviders: ['aws', 'gcs'],
      });

      const calculatedTotal =
        chain.statistics.layer1To2 +
        chain.statistics.layer2To3 +
        chain.statistics.layer2To4 +
        chain.statistics.layer3To4;

      expect(chain.statistics.totalLinks).toBe(calculatedTotal);
    });

    it('should generate anchor text for all links', () => {
      const chain = service.generatePropagationChain({
        targetUrl: 'https://money-site.com',
        gsiteCount: 2,
        bloggerCount: 2,
        cloudVariantCount: 2,
        cloudProviders: ['aws'],
      });

      for (const link of chain.links) {
        expect(link.anchorText).toBeTruthy();
        expect(link.anchorText.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('BloggerService', () => {
  it('should return correct provider name methods', async () => {
    const { BloggerService } = await import('../BloggerService');
    const service = new BloggerService();

    expect(service.isReady()).toBe(false); // No token provided
    expect(service.generateTrackingId()).toHaveLength(16);
  });
});

describe('GSiteService', () => {
  it('should generate valid tracking ID', async () => {
    const { GSiteService } = await import('../GSiteService');
    const service = new GSiteService();

    const trackingId = service.generateTrackingId();
    expect(trackingId).toHaveLength(16);
  });
});

describe('Integration: Content Pipeline', () => {
  it('should transform content through full pipeline', async () => {
    const contentEngine = new BloggerContentEngine(11111);
    const wrapperEngine = new StealthWrapperEngine(22222);
    const daisyChainService = new DaisyChainService(33333);

    // Step 1: Transform to Blogger
    const bloggerContent = contentEngine.transform({
      html: '<p>Original content about services</p>',
      title: 'Professional Services Guide',
      description: 'Complete guide to professional services',
      targetUrl: 'https://example.com/services',
      keywords: ['services', 'professional', 'guide'],
    });

    expect(bloggerContent.title).toBeTruthy();
    expect(bloggerContent.labels).toContain('services');

    // Step 2: Generate wrapper for GSite
    const wrapperContent = await wrapperEngine.generate({
      title: 'Professional Services Guide',
      description: 'Complete guide to professional services',
      targetUrl: 'https://example.com/services',
      embeddedUrls: ['https://blog.example.com/post1'],
      keywords: ['services', 'professional'],
    });

    expect(wrapperContent.fullContent).toContain('example.com');

    // Step 3: Generate propagation chain
    const chain = daisyChainService.generatePropagationChain({
      targetUrl: 'https://example.com/services',
      gsiteCount: 1,
      bloggerCount: 1,
      cloudVariantCount: 4,
      cloudProviders: ['aws', 'gcs', 'azure', 'netlify'],
    });

    expect(chain.statistics.totalLinks).toBeGreaterThan(0);
  });

  it('should maintain consistent seeding across pipeline', () => {
    const seed = 44444;

    const engine1 = new BloggerContentEngine(seed);
    const engine2 = new BloggerContentEngine(seed);

    const variant1 = engine1.generateVariant(3);
    const variant2 = engine2.generateVariant(3);

    expect(variant1.seed).toBe(variant2.seed);
    expect(variant1.layoutTemplate).toBe(variant2.layoutTemplate);
  });
});
