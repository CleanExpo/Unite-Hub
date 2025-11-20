/**
 * Leviathan Tests
 * Phase 13 Week 1-2: Entity extraction, rewrite, schema, OG-image tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
  supabaseBrowser: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { EntityGraphService } from '@/lib/services/leviathan/EntityGraphService';
import { RewriteEngine } from '@/lib/services/leviathan/RewriteEngine';
import { FabricatorService } from '@/lib/services/leviathan/FabricatorService';
import { OGImageGenerator } from '@/lib/services/leviathan/OGImageGenerator';

describe('EntityGraphService', () => {
  describe('Entity Extraction', () => {
    const service = new EntityGraphService();

    it('should extract URLs from content', () => {
      const content = 'Visit https://example.com for more info';
      const entities = service.extractEntities(content);

      const urlEntities = entities.filter(e => e.type === 'webpage');
      expect(urlEntities.length).toBe(1);
      expect(urlEntities[0].url).toBe('https://example.com');
    });

    it('should extract multiple URLs', () => {
      const content = 'Check https://site1.com and https://site2.org';
      const entities = service.extractEntities(content);

      const urlEntities = entities.filter(e => e.type === 'webpage');
      expect(urlEntities.length).toBe(2);
    });

    it('should extract emails', () => {
      const content = 'Contact us at hello@example.com';
      const entities = service.extractEntities(content);

      const emailEntities = entities.filter(e => e.attributes.email);
      expect(emailEntities.length).toBe(1);
      expect(emailEntities[0].attributes.email).toBe('hello@example.com');
    });

    it('should extract phone numbers', () => {
      const content = 'Call us at +1 555-123-4567';
      const entities = service.extractEntities(content);

      const phoneEntities = entities.filter(e => e.attributes.phone);
      expect(phoneEntities.length).toBe(1);
    });

    it('should extract brand names', () => {
      const content = 'We partnered with Global Tech Solutions';
      const entities = service.extractEntities(content);

      const brandEntities = entities.filter(e => e.type === 'brand');
      expect(brandEntities.length).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const entities = service.extractEntities('');
      expect(entities).toEqual([]);
    });

    it('should handle content without entities', () => {
      const entities = service.extractEntities('simple text without entities');
      const urlEntities = entities.filter(e => e.type === 'webpage');
      expect(urlEntities.length).toBe(0);
    });
  });
});

describe('RewriteEngine', () => {
  describe('Content Rewriting', () => {
    const engine = new RewriteEngine('test-api-key');

    it('should build rewrite prompt with tone', () => {
      const options = { tone: 'professional' as const };
      const prompt = (engine as any).buildRewritePrompt('Test content', options, 123);

      expect(prompt).toContain('professional tone');
    });

    it('should build prompt with keywords', () => {
      const options = { keywords: ['SEO', 'marketing'] };
      const prompt = (engine as any).buildRewritePrompt('Test content', options, 123);

      expect(prompt).toContain('SEO');
      expect(prompt).toContain('marketing');
    });

    it('should build prompt for shorter content', () => {
      const options = { length: 'shorter' as const };
      const prompt = (engine as any).buildRewritePrompt('Test content', options, 123);

      expect(prompt).toContain('concise');
    });

    it('should build prompt for longer content', () => {
      const options = { length: 'longer' as const };
      const prompt = (engine as any).buildRewritePrompt('Test content', options, 123);

      expect(prompt).toContain('expanding');
    });

    it('should include avoid words in prompt', () => {
      const options = { avoidWords: ['bad', 'wrong'] };
      const prompt = (engine as any).buildRewritePrompt('Test content', options, 123);

      expect(prompt).toContain('Avoid using');
      expect(prompt).toContain('bad');
    });

    it('should fallback rewrite with synonyms', () => {
      const result = (engine as any).fallbackRewrite('This is good content', {}, 1);
      expect(result).not.toBe('This is good content');
    });

    it('should estimate tokens correctly', () => {
      const tokens = (engine as any).estimateTokens('Test content here');
      expect(tokens).toBe(Math.ceil(17 / 4));
    });
  });

  describe('Block Generation', () => {
    const engine = new RewriteEngine('test-api-key');

    it('should generate fallback heading', () => {
      const result = (engine as any).generateFallbackBlock('SEO', 'heading');
      expect(result).toContain('SEO');
    });

    it('should generate fallback paragraph', () => {
      const result = (engine as any).generateFallbackBlock('SEO', 'paragraph');
      expect(result).toContain('SEO');
    });

    it('should generate fallback list', () => {
      const result = (engine as any).generateFallbackBlock('SEO', 'list');
      expect(result).toContain('•');
    });

    it('should generate fallback CTA', () => {
      const result = (engine as any).generateFallbackBlock('SEO', 'cta');
      expect(result).toContain('SEO');
    });
  });
});

describe('FabricatorService', () => {
  describe('Schema Generation', () => {
    const fabricator = new FabricatorService(12345);

    it('should generate valid JSON-LD schema', () => {
      const input = {
        entity: {
          id: 'node-1',
          graph_id: 'graph-1',
          entity_type: 'organization' as const,
          name: 'Test Company',
          canonical_url: 'https://test.com',
          description: 'A test company',
          authority_score: 0.8,
          relevance_score: 0.7,
          freshness_score: 0.9,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        attributes: [],
        sameAsUrls: ['https://twitter.com/test', 'https://linkedin.com/test'],
      };

      const schema = fabricator.generateSchema(input);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Test Company');
      expect(schema.sameAs).toEqual(['https://twitter.com/test', 'https://linkedin.com/test']);
    });

    it('should map entity types correctly', () => {
      const mapping = (fabricator as any).mapEntityTypeToSchema;
      expect(mapping.call(fabricator, 'brand')).toBe('Brand');
      expect(mapping.call(fabricator, 'person')).toBe('Person');
      expect(mapping.call(fabricator, 'product')).toBe('Product');
      expect(mapping.call(fabricator, 'location')).toBe('Place');
    });

    it('should include @id for canonical URL', () => {
      const input = {
        entity: {
          id: 'node-1',
          graph_id: 'graph-1',
          entity_type: 'webpage' as const,
          name: 'Test Page',
          canonical_url: 'https://example.com/page',
          authority_score: 0,
          relevance_score: 0,
          freshness_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        attributes: [],
      };

      const schema = fabricator.generateSchema(input);
      expect(schema['@id']).toBe('https://example.com/page');
    });

    it('should add type-specific properties for organization', () => {
      const input = {
        entity: {
          id: 'node-1',
          graph_id: 'graph-1',
          entity_type: 'organization' as const,
          name: 'Test Org',
          authority_score: 0,
          relevance_score: 0,
          freshness_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        attributes: [
          {
            id: 'attr-1',
            node_id: 'node-1',
            attribute_key: 'email',
            attribute_value: 'test@test.com',
            attribute_type: 'email',
            confidence: 1,
            created_at: new Date().toISOString(),
          },
        ],
      };

      const schema = fabricator.generateSchema(input);
      expect(schema.email).toBe('test@test.com');
    });
  });

  describe('Schema Validation', () => {
    const fabricator = new FabricatorService();

    it('should validate complete schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test',
        url: 'https://test.com',
      };

      const result = fabricator.validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing @context', () => {
      const schema = {
        '@type': 'Organization',
        name: 'Test',
      } as any;

      const result = fabricator.validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing @context');
    });

    it('should detect missing name', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
      } as any;

      const result = fabricator.validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing name');
    });

    it('should detect invalid URL', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test',
        url: 'not-a-url',
      };

      const result = fabricator.validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid url format');
    });

    it('should validate sameAs URLs', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test',
        sameAs: ['https://valid.com', 'invalid-url'],
      };

      const result = fabricator.validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sameAs'))).toBe(true);
    });
  });

  describe('HTML Generation', () => {
    const fabricator = new FabricatorService();

    it('should generate HTML with title', () => {
      const input = {
        entity: {
          id: 'node-1',
          graph_id: 'graph-1',
          entity_type: 'webpage' as const,
          name: 'Test Page',
          description: 'Test description',
          authority_score: 0,
          relevance_score: 0,
          freshness_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        attributes: [],
      };

      const schema = fabricator.generateSchema(input);
      const html = (fabricator as any).generateHTMLTemplate(input, schema);

      expect(html.head).toContain('<title>Test Page</title>');
      expect(html.head).toContain('og:title');
    });

    it('should escape HTML entities', () => {
      const escaped = (fabricator as any).escapeHtml('<script>alert("xss")</script>');
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });
});

describe('OGImageGenerator', () => {
  const generator = new OGImageGenerator();

  describe('Image Generation', () => {
    it('should generate SVG with correct dimensions', () => {
      const result = generator.generate({
        title: 'Test Title',
        seed: 12345,
      });

      expect(result.width).toBe(1200);
      expect(result.height).toBe(630);
      expect(result.svg).toContain('width="1200"');
      expect(result.svg).toContain('height="630"');
    });

    it('should use provided seed', () => {
      const result = generator.generate({
        title: 'Test',
        seed: 12345,
      });

      expect(result.seed).toBe(12345);
    });

    it('should include title in SVG', () => {
      const result = generator.generate({
        title: 'My Title',
      });

      expect(result.svg).toContain('My Title');
    });

    it('should include subtitle when provided', () => {
      const result = generator.generate({
        title: 'Title',
        subtitle: 'My Subtitle',
      });

      expect(result.svg).toContain('My Subtitle');
    });

    it('should generate unique output for different seeds', () => {
      const result1 = generator.generate({ title: 'Test', seed: 1 });
      const result2 = generator.generate({ title: 'Test', seed: 2 });

      expect(result1.svg).not.toBe(result2.svg);
    });

    it('should use custom colors when provided', () => {
      const result = generator.generate({
        title: 'Test',
        backgroundColor: '#ff0000',
        textColor: '#00ff00',
        accentColor: '#0000ff',
      });

      expect(result.metadata.colors.background).toBe('#ff0000');
      expect(result.metadata.colors.text).toBe('#00ff00');
      expect(result.metadata.colors.accent).toBe('#0000ff');
    });

    it('should generate deterministic hash', () => {
      const hash1 = generator.generateHash({ title: 'Test', seed: 123 });
      const hash2 = generator.generateHash({ title: 'Test', seed: 123 });

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = generator.generateHash({ title: 'Test1', seed: 123 });
      const hash2 = generator.generateHash({ title: 'Test2', seed: 123 });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Pattern Generation', () => {
    it('should support dots pattern', () => {
      const result = generator.generate({
        title: 'Test',
        pattern: 'dots',
      });

      expect(result.svg).toContain('pattern');
      expect(result.svg).toContain('circle');
    });

    it('should support lines pattern', () => {
      const result = generator.generate({
        title: 'Test',
        pattern: 'lines',
      });

      expect(result.svg).toContain('pattern');
      expect(result.svg).toContain('line');
    });

    it('should support grid pattern', () => {
      const result = generator.generate({
        title: 'Test',
        pattern: 'grid',
      });

      expect(result.svg).toContain('pattern');
    });

    it('should support no pattern', () => {
      const result = generator.generate({
        title: 'Test',
        pattern: 'none',
      });

      expect(result.svg).not.toContain('fill="url(#pattern)"');
    });
  });

  describe('Text Handling', () => {
    it('should escape XML entities', () => {
      const result = generator.generate({
        title: 'Test & <Company>',
      });

      expect(result.svg).toContain('&amp;');
      expect(result.svg).toContain('&lt;');
      expect(result.svg).toContain('&gt;');
    });

    it('should handle long titles', () => {
      const longTitle = 'This is a very long title that should be wrapped to multiple lines for better readability';
      const result = generator.generate({
        title: longTitle,
      });

      expect(result.svg).toContain('tspan');
    });
  });
});
