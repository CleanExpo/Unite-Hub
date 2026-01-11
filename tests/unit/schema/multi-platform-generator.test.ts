import { describe, it, expect } from 'vitest';
import {
  generateMultiPlatformSchema,
  type SchemaGenerationConfig,
} from '@/lib/schema/multi-platform-generator';

describe('Multi-Platform Schema Generator', () => {
  const mockConfig: SchemaGenerationConfig = {
    platform: 'google',
    contentType: 'review',
    clientMedia: {
      id: 'contrib-1',
      workspace_id: 'workspace-1',
      contribution_type: 'video',
      content_text:
        'I had an amazing experience with this plumbing company. They arrived on time, were very professional, and fixed my issue quickly.',
      media_file_id: 'media-1',
      public_url: 'https://example.com/video.mp4',
      transcript:
        'I had an amazing experience with this plumbing company. They arrived on time, were very professional, and fixed my issue quickly.',
      analysis: {
        summary: 'Positive customer testimonial about plumbing services',
        sentiment: 'positive',
        topics: ['professionalism', 'timeliness', 'quality service'],
      },
    },
    businessContext: {
      businessName: 'Acme Plumbing',
      industry: 'Home Services',
      serviceCategory: 'Plumbing',
      location: 'New York, NY',
      ownerName: 'John Smith',
      ownerTitle: 'Owner',
      businessUrl: 'https://acmeplumbing.com',
    },
  };

  describe('Google SGE (JSON-LD)', () => {
    it('should generate valid JSON-LD schema', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const googleSchema = schemas.google;

      expect(googleSchema.type).toBe('json-ld');
      expect(googleSchema.mimeType).toBe('application/ld+json');

      const parsed = JSON.parse(googleSchema.content);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBeDefined();
    });

    it('should include author information', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const parsed = JSON.parse(schemas.google.content);

      expect(parsed.author).toBeDefined();
      expect(parsed.author.name).toBeDefined();
    });

    it('should include business context', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const parsed = JSON.parse(schemas.google.content);

      expect(parsed.itemReviewed).toBeDefined();
      expect(parsed.itemReviewed.name).toBe('Acme Plumbing');
    });

    it('should be valid JSON', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      expect(() => JSON.parse(schemas.google.content)).not.toThrow();
    });
  });

  describe('ChatGPT (Markdown)', () => {
    it('should generate markdown format', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const chatgptSchema = schemas.chatgpt;

      expect(chatgptSchema.type).toBe('markdown');
      expect(chatgptSchema.mimeType).toBe('text/markdown');
      expect(chatgptSchema.content).toContain('##');
      expect(chatgptSchema.content).toContain('|');
    });

    it('should include markdown table', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.chatgpt.content;

      expect(content).toContain('| Property | Value |');
      expect(content).toContain('|----------|-------|');
    });

    it('should include business link', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.chatgpt.content;

      expect(content).toContain('acmeplumbing.com');
    });
  });

  describe('Perplexity (Citation Format)', () => {
    it('should generate citation format', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const perplexitySchema = schemas.perplexity;

      expect(perplexitySchema.type).toBe('citation-format');
      expect(perplexitySchema.mimeType).toBe('text/plain');
    });

    it('should include source attribution', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.perplexity.content;

      expect(content).toContain('Source:');
      expect(content).toContain('Acme Plumbing');
    });

    it('should include date information', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.perplexity.content;

      expect(content).toContain('Date:');
    });
  });

  describe('Bing (Microdata)', () => {
    it('should generate microdata format', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const bingSchema = schemas.bing;

      expect(bingSchema.type).toBe('microdata');
      expect(bingSchema.mimeType).toBe('text/html');
      expect(bingSchema.content).toContain('itemscope');
      expect(bingSchema.content).toContain('itemtype');
      expect(bingSchema.content).toContain('itemprop');
    });

    it('should include proper schema types', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.bing.content;

      expect(content).toMatch(/itemtype="https:\/\/schema\.org\/\w+"/);
    });

    it('should be valid HTML', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.bing.content;

      expect(content).toContain('<div');
      expect(content).toContain('</div>');
    });
  });

  describe('Claude (Semantic HTML)', () => {
    it('should generate semantic HTML', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const claudeSchema = schemas.claude;

      expect(claudeSchema.type).toBe('html-semantic');
      expect(claudeSchema.mimeType).toBe('text/html');
    });

    it('should use semantic HTML tags', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.claude.content;

      expect(content).toContain('<article');
      expect(content).toContain('<header');
      expect(content).toContain('<section');
      expect(content).toContain('<blockquote');
      expect(content).toContain('<aside');
    });

    it('should include business details', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.claude.content;

      expect(content).toContain('Acme Plumbing');
      expect(content).toContain('Plumbing');
    });
  });

  describe('Gemini (RDFa)', () => {
    it('should generate RDFa format', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const gemminiSchema = schemas.gemini;

      expect(gemminiSchema.type).toBe('rdfa');
      expect(gemminiSchema.mimeType).toBe('text/html');
    });

    it('should include vocab and typeof', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.gemini.content;

      expect(content).toContain('vocab="https://schema.org/"');
      expect(content).toContain('typeof=');
      expect(content).toContain('property=');
    });

    it('should have proper RDFa properties', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);
      const content = schemas.gemini.content;

      expect(content).toMatch(/property="\w+"/);
    });
  });

  describe('Video Content Type', () => {
    it('should generate VideoObject schema for video content', async () => {
      const videoConfig: SchemaGenerationConfig = {
        ...mockConfig,
        contentType: 'video',
      };

      const schemas = await generateMultiPlatformSchema(videoConfig);

      // Check Google schema includes VideoObject
      const googleSchema = JSON.parse(schemas.google.content);
      expect(googleSchema['@type']).toBe('VideoObject');

      // Check other formats mention video
      expect(schemas.chatgpt.content).toContain('Video');
      expect(schemas.bing.content).toContain('VideoObject');
    });

    it('should include video metadata', async () => {
      const videoConfig: SchemaGenerationConfig = {
        ...mockConfig,
        contentType: 'video',
      };

      const schemas = await generateMultiPlatformSchema(videoConfig);
      const googleSchema = JSON.parse(schemas.google.content);

      expect(googleSchema.duration).toBeDefined();
      expect(googleSchema.contentUrl).toBeDefined();
    });
  });

  describe('E2EAT Signal Integration', () => {
    it('should include author information for E2EAT', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);

      // Google schema should have author with details
      const googleSchema = JSON.parse(schemas.google.content);
      expect(googleSchema.author).toBeDefined();
      expect(googleSchema.author.name).toBe(mockConfig.businessContext.ownerName);

      // Perplexity should attribute reviewer
      expect(schemas.perplexity.content).toContain('John Smith');
    });

    it('should include business credentials', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);

      // Should mention business info across platforms
      expect(schemas.chatgpt.content).toContain('Acme Plumbing');
      expect(schemas.perplexity.content).toContain('Plumbing');
      expect(schemas.bing.content).toContain('Home Services');
    });
  });

  describe('Multi-Platform Consistency', () => {
    it('should return all 6 platforms', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);

      expect(Object.keys(schemas)).toHaveLength(6);
      expect(schemas.google).toBeDefined();
      expect(schemas.chatgpt).toBeDefined();
      expect(schemas.perplexity).toBeDefined();
      expect(schemas.bing).toBeDefined();
      expect(schemas.claude).toBeDefined();
      expect(schemas.gemini).toBeDefined();
    });

    it('should have consistent content across formats', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);

      // All should mention the business
      Object.values(schemas).forEach((schema) => {
        expect(schema.content).toContain('Acme Plumbing');
      });
    });

    it('should have correct mime types', async () => {
      const schemas = await generateMultiPlatformSchema(mockConfig);

      expect(schemas.google.mimeType).toBe('application/ld+json');
      expect(schemas.chatgpt.mimeType).toBe('text/markdown');
      expect(schemas.perplexity.mimeType).toBe('text/plain');
      expect(schemas.bing.mimeType).toBe('text/html');
      expect(schemas.claude.mimeType).toBe('text/html');
      expect(schemas.gemini.mimeType).toBe('text/html');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields', async () => {
      const minimalConfig: SchemaGenerationConfig = {
        ...mockConfig,
        clientMedia: {
          id: 'contrib-1',
          workspace_id: 'workspace-1',
          contribution_type: 'text',
        },
      };

      expect(async () => {
        await generateMultiPlatformSchema(minimalConfig);
      }).not.toThrow();
    });

    it('should handle special characters in text', async () => {
      const specialConfig: SchemaGenerationConfig = {
        ...mockConfig,
        clientMedia: {
          ...mockConfig.clientMedia,
          content_text: 'Great <service> & "worth it"! Cost: $100-$500.',
        },
      };

      const schemas = await generateMultiPlatformSchema(specialConfig);

      // Should escape HTML in HTML-based formats
      expect(schemas.bing.content).toContain('&lt;');
      expect(schemas.claude.content).toContain('&lt;');
    });

    it('should handle very long content', async () => {
      const longConfig: SchemaGenerationConfig = {
        ...mockConfig,
        clientMedia: {
          ...mockConfig.clientMedia,
          content_text: 'A'.repeat(5000),
        },
      };

      expect(async () => {
        await generateMultiPlatformSchema(longConfig);
      }).not.toThrow();
    });
  });
});
