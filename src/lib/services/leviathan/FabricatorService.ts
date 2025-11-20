/**
 * FabricatorService
 * Phase 13 Week 1-2: JSON-LD schema generation, HTML templates, seeded randomization
 */

import { EntityNode, EntityAttribute } from './EntityGraphService';

// Types
export interface FabricationInput {
  entity: EntityNode;
  attributes: EntityAttribute[];
  variants?: string[];
  sameAsUrls?: string[];
}

export interface JSONLDSchema {
  '@context': string;
  '@type': string;
  '@id'?: string;
  name: string;
  description?: string;
  url?: string;
  sameAs?: string[];
  [key: string]: any;
}

export interface HTMLTemplate {
  head: string;
  body: string;
  scripts: string;
}

export interface FabricationOutput {
  schema: JSONLDSchema;
  html: HTMLTemplate;
  metadata: {
    seed: number;
    generatedAt: string;
    variationIndex: number;
  };
}

export class FabricatorService {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
  }

  /**
   * Set seed for deterministic output
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * Fabricate complete output from entity data
   */
  fabricate(input: FabricationInput, variationIndex: number = 0): FabricationOutput {
    const schema = this.generateSchema(input);
    const html = this.generateHTMLTemplate(input, schema);

    return {
      schema,
      html,
      metadata: {
        seed: this.seed,
        generatedAt: new Date().toISOString(),
        variationIndex,
      },
    };
  }

  /**
   * Generate JSON-LD schema from entity
   */
  generateSchema(input: FabricationInput): JSONLDSchema {
    const { entity, attributes, sameAsUrls } = input;

    // Map entity type to schema.org type
    const schemaType = this.mapEntityTypeToSchema(entity.entity_type);

    const schema: JSONLDSchema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: entity.name,
    };

    // Add canonical URL as @id
    if (entity.canonical_url) {
      schema['@id'] = entity.canonical_url;
      schema.url = entity.canonical_url;
    }

    // Add description
    if (entity.description) {
      schema.description = entity.description;
    }

    // Add sameAs links
    if (sameAsUrls && sameAsUrls.length > 0) {
      schema.sameAs = sameAsUrls;
    }

    // Add attributes with schema mapping
    for (const attr of attributes) {
      if (attr.schema_property) {
        schema[attr.schema_property] = this.formatAttributeValue(
          attr.attribute_value,
          attr.attribute_type
        );
      }
    }

    // Add type-specific properties
    this.addTypeSpecificProperties(schema, entity, attributes);

    return schema;
  }

  /**
   * Generate HTML template with embedded schema
   */
  generateHTMLTemplate(input: FabricationInput, schema: JSONLDSchema): HTMLTemplate {
    const { entity, variants } = input;

    // Select variant based on seed
    const description = variants && variants.length > 0
      ? variants[this.seed % variants.length]
      : entity.description || '';

    // Generate head section
    const head = this.generateHead(entity, description, schema);

    // Generate body section
    const body = this.generateBody(entity, description);

    // Generate scripts section
    const scripts = this.generateScripts(schema);

    return { head, body, scripts };
  }

  /**
   * Generate multiple schema variations
   */
  generateSchemaVariations(
    input: FabricationInput,
    count: number = 3
  ): JSONLDSchema[] {
    const variations: JSONLDSchema[] = [];

    for (let i = 0; i < count; i++) {
      const variantInput = {
        ...input,
        variants: input.variants ? [input.variants[i % input.variants.length]] : undefined,
      };

      this.setSeed(this.seed + i);
      variations.push(this.generateSchema(variantInput));
    }

    return variations;
  }

  /**
   * Map entity type to schema.org type
   */
  private mapEntityTypeToSchema(entityType: string): string {
    const mapping: { [key: string]: string } = {
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
   * Format attribute value by type
   */
  private formatAttributeValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'date':
        return value; // ISO date string
      default:
        return value;
    }
  }

  /**
   * Add type-specific schema properties
   */
  private addTypeSpecificProperties(
    schema: JSONLDSchema,
    entity: EntityNode,
    attributes: EntityAttribute[]
  ): void {
    const attrMap: { [key: string]: string } = {};
    attributes.forEach(a => {
      attrMap[a.attribute_key] = a.attribute_value;
    });

    switch (entity.entity_type) {
      case 'organization':
      case 'brand':
        if (attrMap.email) schema.email = attrMap.email;
        if (attrMap.phone) schema.telephone = attrMap.phone;
        if (attrMap.logo) schema.logo = attrMap.logo;
        if (attrMap.address) {
          schema.address = {
            '@type': 'PostalAddress',
            streetAddress: attrMap.address,
          };
        }
        break;

      case 'person':
        if (attrMap.jobTitle) schema.jobTitle = attrMap.jobTitle;
        if (attrMap.email) schema.email = attrMap.email;
        if (attrMap.organization) {
          schema.worksFor = {
            '@type': 'Organization',
            name: attrMap.organization,
          };
        }
        break;

      case 'product':
        if (attrMap.brand) {
          schema.brand = {
            '@type': 'Brand',
            name: attrMap.brand,
          };
        }
        if (attrMap.price) {
          schema.offers = {
            '@type': 'Offer',
            price: attrMap.price,
            priceCurrency: attrMap.currency || 'USD',
          };
        }
        break;

      case 'article':
      case 'webpage':
        if (attrMap.author) {
          schema.author = {
            '@type': 'Person',
            name: attrMap.author,
          };
        }
        if (attrMap.datePublished) schema.datePublished = attrMap.datePublished;
        if (attrMap.dateModified) schema.dateModified = attrMap.dateModified;
        break;
    }
  }

  /**
   * Generate HTML head section
   */
  private generateHead(
    entity: EntityNode,
    description: string,
    schema: JSONLDSchema
  ): string {
    const title = entity.name;
    const desc = description || entity.short_description || '';
    const url = entity.canonical_url || '';

    return `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.escapeHtml(title)}</title>
<meta name="description" content="${this.escapeHtml(desc.substring(0, 160))}">
${url ? `<link rel="canonical" href="${this.escapeHtml(url)}">` : ''}

<!-- Open Graph -->
<meta property="og:title" content="${this.escapeHtml(title)}">
<meta property="og:description" content="${this.escapeHtml(desc.substring(0, 200))}">
<meta property="og:type" content="${this.getOGType(entity.entity_type)}">
${url ? `<meta property="og:url" content="${this.escapeHtml(url)}">` : ''}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${this.escapeHtml(title)}">
<meta name="twitter:description" content="${this.escapeHtml(desc.substring(0, 200))}">

<!-- JSON-LD Schema -->
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`.trim();
  }

  /**
   * Generate HTML body section
   */
  private generateBody(entity: EntityNode, description: string): string {
    return `
<article itemscope itemtype="https://schema.org/${this.mapEntityTypeToSchema(entity.entity_type)}">
  <header>
    <h1 itemprop="name">${this.escapeHtml(entity.name)}</h1>
  </header>

  <section>
    <p itemprop="description">${this.escapeHtml(description)}</p>
  </section>

  ${entity.canonical_url ? `
  <footer>
    <a href="${this.escapeHtml(entity.canonical_url)}" itemprop="url">
      Learn More
    </a>
  </footer>` : ''}
</article>`.trim();
  }

  /**
   * Generate scripts section
   */
  private generateScripts(schema: JSONLDSchema): string {
    return `
<script>
  // Schema data available for JavaScript
  window.__SCHEMA_DATA__ = ${JSON.stringify(schema)};
</script>`.trim();
  }

  /**
   * Get Open Graph type from entity type
   */
  private getOGType(entityType: string): string {
    const mapping: { [key: string]: string } = {
      brand: 'business.business',
      person: 'profile',
      product: 'product',
      service: 'business.business',
      location: 'place',
      organization: 'business.business',
      event: 'event',
      article: 'article',
      webpage: 'website',
    };

    return mapping[entityType] || 'website';
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Validate JSON-LD schema
   */
  validateSchema(schema: JSONLDSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!schema['@context']) {
      errors.push('Missing @context');
    }
    if (!schema['@type']) {
      errors.push('Missing @type');
    }
    if (!schema.name) {
      errors.push('Missing name');
    }

    // Validate URLs
    if (schema.url && !this.isValidUrl(schema.url)) {
      errors.push('Invalid url format');
    }
    if (schema['@id'] && !this.isValidUrl(schema['@id'])) {
      errors.push('Invalid @id format');
    }
    if (schema.sameAs) {
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
   * Check if string is valid URL
   */
  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton
export const fabricatorService = new FabricatorService();
