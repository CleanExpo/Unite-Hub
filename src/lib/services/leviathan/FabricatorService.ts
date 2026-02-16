/**
 * FabricatorService - Content Fabrication & Schema Generation
 * Phase 13 Week 7-8
 */

import * as crypto from 'crypto';

export interface FabricationConfig {
  topic: string;
  keywords: string[];
  targetUrl: string;
  contentType?: string;
}

export interface FabricatedContent {
  id: string;
  html: string;
  title: string;
  description: string;
  keywords: string[];
  wordCount: number;
  createdAt: Date;
}

export interface SchemaInput {
  entity: {
    id: string;
    graph_id: string;
    entity_type: string;
    name: string;
    canonical_url?: string;
    description?: string;
    authority_score: number;
    relevance_score: number;
    freshness_score: number;
    created_at: string;
    updated_at: string;
  };
  attributes: Array<{
    id: string;
    node_id: string;
    attribute_key: string;
    attribute_value: string;
    attribute_type: string;
    confidence: number;
    created_at: string;
  }>;
  sameAsUrls?: string[];
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

export class FabricatorService {
  private seed?: number;

  constructor(seed?: number) {
    this.seed = seed;
  }

  async fabricate(config: FabricationConfig): Promise<FabricatedContent> {
    const id = crypto.randomUUID();
    const title = `Guide to ${config.topic}`;
    const html = `<h1>${title}</h1><p>Content about ${config.topic} with keywords: ${config.keywords.join(', ')}.</p>`;

    return {
      id,
      html,
      title,
      description: `Comprehensive guide about ${config.topic}`,
      keywords: config.keywords,
      wordCount: html.split(/\s+/).length,
      createdAt: new Date(),
    };
  }

  /**
   * Generate JSON-LD schema from entity data
   */
  generateSchema(input: SchemaInput): Record<string, any> {
    const { entity, attributes, sameAsUrls } = input;
    const schemaType = this.mapEntityTypeToSchema(entity.entity_type);

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: entity.name,
    };

    if (entity.canonical_url) {
      schema['@id'] = entity.canonical_url;
      schema.url = entity.canonical_url;
    }

    if (entity.description) {
      schema.description = entity.description;
    }

    if (sameAsUrls && sameAsUrls.length > 0) {
      schema.sameAs = sameAsUrls;
    }

    // Add type-specific properties from attributes
    for (const attr of attributes) {
      if (attr.attribute_key === 'email') {
        schema.email = attr.attribute_value;
      } else if (attr.attribute_key === 'telephone') {
        schema.telephone = attr.attribute_value;
      } else if (attr.attribute_key === 'address') {
        schema.address = attr.attribute_value;
      } else if (attr.attribute_key === 'logo') {
        schema.logo = attr.attribute_value;
      }
    }

    return schema;
  }

  /**
   * Map entity types to Schema.org types
   */
  private mapEntityTypeToSchema(entityType: string): string {
    const mapping: Record<string, string> = {
      brand: 'Brand',
      person: 'Person',
      product: 'Product',
      service: 'Service',
      location: 'Place',
      organization: 'Organization',
      event: 'Event',
      article: 'Article',
      webpage: 'WebPage',
    };
    return mapping[entityType] || 'Thing';
  }

  /**
   * Validate a JSON-LD schema
   */
  validateSchema(schema: Record<string, any>): SchemaValidationResult {
    const errors: string[] = [];

    if (!schema['@context']) {
      errors.push('Missing @context');
    }

    if (!schema['@type']) {
      errors.push('Missing @type');
    }

    if (!schema.name) {
      errors.push('Missing name');
    }

    // Validate URL format
    if (schema.url && !this.isValidUrl(schema.url)) {
      errors.push('Invalid url format');
    }

    // Validate sameAs URLs
    if (schema.sameAs && Array.isArray(schema.sameAs)) {
      for (const url of schema.sameAs) {
        if (!this.isValidUrl(url)) {
          errors.push(`Invalid sameAs URL: ${url}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate HTML template with OG tags
   */
  private generateHTMLTemplate(
    input: SchemaInput,
    schema: Record<string, any>
  ): { head: string; body: string } {
    const title = this.escapeHtml(input.entity.name);
    const description = this.escapeHtml(input.entity.description || '');

    const head = [
      `<title>${title}</title>`,
      `<meta property="og:title" content="${title}" />`,
      `<meta property="og:description" content="${description}" />`,
      `<meta property="og:type" content="${schema['@type']?.toLowerCase() || 'website'}" />`,
      input.entity.canonical_url
        ? `<meta property="og:url" content="${this.escapeHtml(input.entity.canonical_url)}" />`
        : '',
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    ]
      .filter(Boolean)
      .join('\n');

    const body = `<h1>${title}</h1>`;

    return { head, body };
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export default FabricatorService;

// Singleton instance for convenience
export const fabricatorService = new FabricatorService();
