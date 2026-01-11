import { describe, it, expect } from 'vitest';
import {
  secondsToISO8601Duration,
  generateVideoObjectSchema,
  generateVideoBreadcrumbSchema,
  generateVideoClipSchema,
  generateCompositeVideoSchema,
  generateVideoObjectForPlatform,
  extractDurationFromMetadata,
} from '@/lib/schema/video-object-schema';

describe('VideoObject Schema Generator', () => {
  describe('Duration Conversion', () => {
    it('should convert seconds to ISO 8601 format', () => {
      expect(secondsToISO8601Duration(0)).toBe('PT0S');
      expect(secondsToISO8601Duration(30)).toBe('PT30S');
      expect(secondsToISO8601Duration(90)).toBe('PT1M30S');
      expect(secondsToISO8601Duration(3661)).toBe('PT1H1M1S');
      expect(secondsToISO8601Duration(7200)).toBe('PT2H');
    });

    it('should handle edge cases', () => {
      expect(secondsToISO8601Duration(1)).toBe('PT1S');
      expect(secondsToISO8601Duration(60)).toBe('PT1M');
      expect(secondsToISO8601Duration(3600)).toBe('PT1H');
    });
  });

  describe('VideoObject Schema Generation', () => {
    const mockMetadata = {
      videoUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 150,
      transcript: 'This is a great service experience.',
      uploadDate: '2026-01-12T10:00:00Z',
      name: 'Customer Testimonial',
      description: 'A customer shares their positive experience',
    };

    it('should generate valid VideoObject schema', () => {
      const schema = generateVideoObjectSchema(mockMetadata);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('VideoObject');
      expect(schema.name).toBe('Customer Testimonial');
      expect(schema.duration).toBe('PT2M30S');
      expect(schema.contentUrl).toBe('https://example.com/video.mp4');
      expect(schema.transcript).toBe('This is a great service experience.');
    });

    it('should include interaction statistics', () => {
      const schema = generateVideoObjectSchema(mockMetadata, {
        viewCount: 1200,
        commentCount: 45,
      });

      expect(schema.interactionStatistic).toBeDefined();
      expect(schema.interactionStatistic?.length).toBe(2);
      expect(schema.interactionStatistic?.[0].userInteractionCount).toBe(1200);
    });

    it('should include content location', () => {
      const schemaWithLocation = generateVideoObjectSchema({
        ...mockMetadata,
        contentLocation: { name: 'New York, NY' },
      });

      expect(schemaWithLocation.contentLocation).toBeDefined();
      expect(schemaWithLocation.contentLocation?.name).toBe('New York, NY');
    });

    it('should handle missing optional fields', () => {
      const schema = generateVideoObjectSchema({
        ...mockMetadata,
        transcript: undefined,
      });

      expect(schema.transcript).toBeUndefined();
      expect(schema.name).toBe('Customer Testimonial');
    });
  });

  describe('BreadcrumbList Schema', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const breadcrumbs = [
        { name: 'Services', url: 'https://example.com/services' },
        { name: 'Testimonials', url: 'https://example.com/services/testimonials' },
      ];

      const schema = generateVideoBreadcrumbSchema(
        'https://example.com/services/testimonials/video-1',
        'Customer Success Story',
        breadcrumbs
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(4); // Home + 2 breadcrumbs + video
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
      expect(schema.itemListElement[3].name).toBe('Customer Success Story');
    });

    it('should order breadcrumbs correctly', () => {
      const breadcrumbs = [{ name: 'Services', url: 'https://example.com/services' }];
      const schema = generateVideoBreadcrumbSchema(
        'https://example.com/services/video',
        'Video Title',
        breadcrumbs
      );

      const items = schema.itemListElement;
      expect(items[0].name).toBe('Home');
      expect(items[1].name).toBe('Services');
      expect(items[2].name).toBe('Video Title');
    });
  });

  describe('VideoClip Schema', () => {
    it('should generate valid VideoClip schema', () => {
      const clip = generateVideoClipSchema(
        'Testimonial Highlight',
        'Best part of the testimonial',
        'https://example.com/clip-1',
        30,
        60,
        'https://example.com/video'
      );

      expect(clip['@type']).toBe('Clip');
      expect(clip.name).toBe('Testimonial Highlight');
      expect(clip.startOffset).toBe(30);
      expect(clip.endOffset).toBe(60);
      expect(clip.partOf['@type']).toBe('VideoObject');
    });
  });

  describe('Composite Video Schema', () => {
    it('should generate multiple schema types', () => {
      const schemas = generateCompositeVideoSchema(
        {
          videoUrl: 'https://example.com/video.mp4',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          duration: 150,
          transcript: 'Transcript',
          uploadDate: '2026-01-12T10:00:00Z',
          name: 'Video Title',
          description: 'Description',
        },
        'https://example.com/video',
        [{ name: 'Services', url: 'https://example.com/services' }]
      );

      expect(schemas).toHaveLength(2); // VideoObject + BreadcrumbList
      expect(schemas[0]).toHaveProperty('@type', 'VideoObject');
      expect(schemas[1]).toHaveProperty('@type', 'BreadcrumbList');
    });

    it('should include AggregateRating when provided', () => {
      const schemas = generateCompositeVideoSchema(
        {
          videoUrl: 'https://example.com/video.mp4',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          duration: 150,
          transcript: 'Transcript',
          uploadDate: '2026-01-12T10:00:00Z',
          name: 'Video Title',
          description: 'Description',
        },
        'https://example.com/video',
        [],
        {
          ratingValue: 4.8,
          ratingCount: 45,
          bestRating: 5,
          worstRating: 1,
        }
      );

      expect(schemas).toHaveLength(3);
      const ratingSchema = schemas[2];
      expect(ratingSchema).toHaveProperty('@type', 'AggregateRating');
      expect((ratingSchema as any).ratingValue).toBe(4.8);
    });
  });

  describe('Platform-Specific VideoObject', () => {
    const mockMetadata = {
      videoUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 120,
      transcript: 'Great service.',
      uploadDate: '2026-01-12T10:00:00Z',
      name: 'Testimonial',
      description: 'Customer shares experience',
      contentLocation: { name: 'New York, NY' },
    };

    it('should generate Google JSON-LD format', () => {
      const output = generateVideoObjectForPlatform('google', mockMetadata);
      const parsed = JSON.parse(output);

      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('VideoObject');
      expect(parsed.duration).toBe('PT2M');
    });

    it('should generate ChatGPT markdown format', () => {
      const output = generateVideoObjectForPlatform('chatgpt', mockMetadata);

      expect(output).toContain('## Video:');
      expect(output).toContain('| Property | Value |');
      expect(output).toContain('Testimonial');
      expect(output).toContain('120 seconds');
    });

    it('should generate Perplexity citation format', () => {
      const output = generateVideoObjectForPlatform('perplexity', mockMetadata);

      expect(output).toContain('**Video**:');
      expect(output).toContain('Duration:');
      expect(output).toContain('Transcript:');
      expect(output).toContain('Source:');
    });

    it('should generate Bing microdata HTML', () => {
      const output = generateVideoObjectForPlatform('bing', mockMetadata);

      expect(output).toContain('itemscope');
      expect(output).toContain('itemtype="https://schema.org/VideoObject"');
      expect(output).toContain('itemprop="name"');
      expect(output).toContain('itemprop="transcript"');
    });

    it('should generate Claude semantic HTML', () => {
      const output = generateVideoObjectForPlatform('claude', mockMetadata);

      expect(output).toContain('<article');
      expect(output).toContain('<header>');
      expect(output).toContain('<figure>');
      expect(output).toContain('<blockquote>');
      expect(output).toContain('<footer>');
    });

    it('should generate Gemini RDFa', () => {
      const output = generateVideoObjectForPlatform('gemini', mockMetadata);

      expect(output).toContain('vocab="https://schema.org/"');
      expect(output).toContain('typeof="VideoObject"');
      expect(output).toContain('property="name"');
      expect(output).toContain('property="transcript"');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract duration from metadata', () => {
      expect(extractDurationFromMetadata({ duration_seconds: 150 })).toBe(150);
      expect(extractDurationFromMetadata({ duration: 120 })).toBe(120);
      expect(extractDurationFromMetadata({ videoDuration: 90 })).toBe(90);
    });

    it('should return default duration if missing', () => {
      expect(extractDurationFromMetadata({})).toBe(120);
      expect(extractDurationFromMetadata(undefined)).toBe(120);
    });

    it('should handle edge case durations', () => {
      expect(extractDurationFromMetadata({ duration: 0 })).toBe(1);
      expect(extractDurationFromMetadata({ duration: -50 })).toBe(1);
    });
  });

  describe('HTML Escaping', () => {
    it('should handle special characters in Bing/Claude formats', () => {
      const dangerous = {
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        duration: 60,
        transcript: 'Cost: $100-$500 & <save> "30%"',
        uploadDate: '2026-01-12T10:00:00Z',
        name: 'Great <Deal>',
        description: 'Save & earn',
      };

      const bingOutput = generateVideoObjectForPlatform('bing', dangerous);
      expect(bingOutput).toContain('&lt;');
      expect(bingOutput).toContain('&gt;');
      expect(bingOutput).toContain('&quot;');
    });
  });
});
