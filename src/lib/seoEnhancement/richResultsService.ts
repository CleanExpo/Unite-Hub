/**
 * Rich Results Service
 * Schema markup generation, validation, and rich result opportunity detection
 */

import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types
export interface SchemaTemplate {
  id: string;
  workspace_id: string;
  name: string;
  schema_type: SchemaType;
  template_json: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedSchema {
  id: string;
  workspace_id: string;
  template_id?: string;
  url: string;
  schema_type: SchemaType;
  schema_json: Record<string, unknown>;
  validation_status: 'pending' | 'valid' | 'invalid' | 'warnings';
  validation_errors: ValidationIssue[];
  validation_warnings: ValidationIssue[];
  is_deployed: boolean;
  deployed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RichResultMonitoring {
  id: string;
  workspace_id: string;
  url: string;
  keyword: string;
  has_rich_result: boolean;
  rich_result_types: string[];
  organic_position?: number;
  rich_result_position?: number;
  competitor_rich_results: CompetitorRichResult[];
  opportunity_score: number;
  opportunity_type?: string;
  checked_at: string;
  created_at: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CompetitorRichResult {
  domain: string;
  type: string;
  position: number;
}

export type SchemaType =
  | 'Article'
  | 'Product'
  | 'LocalBusiness'
  | 'FAQ'
  | 'HowTo'
  | 'Review'
  | 'Event'
  | 'Recipe'
  | 'VideoObject'
  | 'BreadcrumbList'
  | 'Organization'
  | 'Person';

// Schema templates for common types
const SCHEMA_TEMPLATES: Record<SchemaType, Record<string, unknown>> = {
  Article: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '',
    description: '',
    image: '',
    author: {
      '@type': 'Person',
      name: '',
    },
    publisher: {
      '@type': 'Organization',
      name: '',
      logo: {
        '@type': 'ImageObject',
        url: '',
      },
    },
    datePublished: '',
    dateModified: '',
  },
  Product: {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: '',
    description: '',
    image: '',
    brand: {
      '@type': 'Brand',
      name: '',
    },
    offers: {
      '@type': 'Offer',
      price: '',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '',
      reviewCount: '',
    },
  },
  LocalBusiness: {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '',
    description: '',
    image: '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      addressCountry: '',
    },
    telephone: '',
    openingHoursSpecification: [],
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '',
      longitude: '',
    },
  },
  FAQ: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [],
  },
  HowTo: {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '',
    description: '',
    image: '',
    totalTime: '',
    step: [],
  },
  Review: {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Thing',
      name: '',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '',
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: '',
    },
    reviewBody: '',
  },
  Event: {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: {
      '@type': 'Place',
      name: '',
      address: '',
    },
    organizer: {
      '@type': 'Organization',
      name: '',
    },
  },
  Recipe: {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: '',
    description: '',
    image: '',
    prepTime: '',
    cookTime: '',
    totalTime: '',
    recipeIngredient: [],
    recipeInstructions: [],
  },
  VideoObject: {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: '',
    description: '',
    thumbnailUrl: '',
    uploadDate: '',
    duration: '',
    contentUrl: '',
  },
  BreadcrumbList: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [],
  },
  Organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '',
    url: '',
    logo: '',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '',
      contactType: 'customer service',
    },
    sameAs: [],
  },
  Person: {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: '',
    jobTitle: '',
    worksFor: {
      '@type': 'Organization',
      name: '',
    },
    sameAs: [],
  },
};

/**
 * Validate schema markup
 */
function validateSchema(schema: Record<string, unknown>): {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Check required fields
  if (!schema['@context']) {
    errors.push({
      field: '@context',
      message: 'Missing @context field',
      severity: 'error',
    });
  }

  if (!schema['@type']) {
    errors.push({
      field: '@type',
      message: 'Missing @type field',
      severity: 'error',
    });
  }

  // Type-specific validation
  const type = schema['@type'] as string;

  if (type === 'Article') {
    if (!schema['headline']) {
      errors.push({ field: 'headline', message: 'Article requires a headline', severity: 'error' });
    }
    if (!schema['author']) {
      warnings.push({ field: 'author', message: 'Article should have an author', severity: 'warning' });
    }
    if (!schema['datePublished']) {
      warnings.push({ field: 'datePublished', message: 'Article should have a publish date', severity: 'warning' });
    }
  }

  if (type === 'Product') {
    if (!schema['name']) {
      errors.push({ field: 'name', message: 'Product requires a name', severity: 'error' });
    }
    if (!schema['offers']) {
      warnings.push({ field: 'offers', message: 'Product should have offers/pricing', severity: 'warning' });
    }
  }

  if (type === 'LocalBusiness') {
    if (!schema['name']) {
      errors.push({ field: 'name', message: 'Business requires a name', severity: 'error' });
    }
    if (!schema['address']) {
      errors.push({ field: 'address', message: 'Business requires an address', severity: 'error' });
    }
  }

  if (type === 'FAQPage') {
    const mainEntity = schema['mainEntity'] as Array<unknown>;
    if (!mainEntity || mainEntity.length === 0) {
      errors.push({ field: 'mainEntity', message: 'FAQ requires at least one question', severity: 'error' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate schema markup using AI
 */
async function generateSchemaWithAI(
  type: SchemaType,
  pageInfo: {
    url: string;
    title?: string;
    description?: string;
    content?: string;
  }
): Promise<Record<string, unknown>> {
  const template = SCHEMA_TEMPLATES[type];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Generate schema.org ${type} markup for this page:

URL: ${pageInfo.url}
Title: ${pageInfo.title || 'Unknown'}
Description: ${pageInfo.description || 'Unknown'}
Content excerpt: ${pageInfo.content?.substring(0, 500) || 'Not available'}

Base template:
${JSON.stringify(template, null, 2)}

Fill in the template with appropriate values based on the page info.
Return only valid JSON (the schema object).`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const match = text.text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    console.error('[RichResults] AI schema generation failed:', error);
  }

  return template;
}

/**
 * Create or get schema template
 */
export async function getSchemaTemplate(
  workspaceId: string,
  type: SchemaType
): Promise<SchemaTemplate | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('schema_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('schema_type', type)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get template: ${error.message}`);
  }

  return data;
}

/**
 * Create a schema template
 */
export async function createSchemaTemplate(
  workspaceId: string,
  name: string,
  type: SchemaType,
  customJson?: Record<string, unknown>
): Promise<SchemaTemplate> {
  const supabase = await getSupabaseServer();

  const templateJson = customJson || SCHEMA_TEMPLATES[type];

  const { data, error } = await supabase
    .from('schema_templates')
    .insert({
      workspace_id: workspaceId,
      name,
      schema_type: type,
      template_json: templateJson,
      is_default: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return data;
}

/**
 * Generate schema for a URL
 */
export async function generateSchema(
  workspaceId: string,
  url: string,
  type: SchemaType,
  pageInfo?: { title?: string; description?: string; content?: string }
): Promise<GeneratedSchema> {
  const supabase = await getSupabaseServer();

  // Generate schema using AI
  const schemaJson = await generateSchemaWithAI(type, {
    url,
    ...pageInfo,
  });

  // Validate
  const validation = validateSchema(schemaJson);

  const { data, error } = await supabase
    .from('generated_schemas')
    .insert({
      workspace_id: workspaceId,
      url,
      schema_type: type,
      schema_json: schemaJson,
      validation_status: validation.isValid
        ? (validation.warnings.length > 0 ? 'warnings' : 'valid')
        : 'invalid',
      validation_errors: validation.errors,
      validation_warnings: validation.warnings,
      is_deployed: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save schema: ${error.message}`);
  return data;
}

/**
 * Validate existing schema
 */
export async function validateExistingSchema(schemaId: string): Promise<GeneratedSchema> {
  const supabase = await getSupabaseServer();

  const { data: schema, error: fetchError } = await supabase
    .from('generated_schemas')
    .select('*')
    .eq('id', schemaId)
    .single();

  if (fetchError) throw new Error(`Schema not found: ${fetchError.message}`);

  const validation = validateSchema(schema.schema_json);

  const { data, error } = await supabase
    .from('generated_schemas')
    .update({
      validation_status: validation.isValid
        ? (validation.warnings.length > 0 ? 'warnings' : 'valid')
        : 'invalid',
      validation_errors: validation.errors,
      validation_warnings: validation.warnings,
    })
    .eq('id', schemaId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update validation: ${error.message}`);
  return data;
}

/**
 * Get schemas for a workspace
 */
export async function getSchemas(
  workspaceId: string,
  options: { url?: string; type?: SchemaType; limit?: number } = {}
): Promise<GeneratedSchema[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('generated_schemas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options.url) {
    query = query.eq('url', options.url);
  }

  if (options.type) {
    query = query.eq('schema_type', options.type);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch schemas: ${error.message}`);
  return data || [];
}

/**
 * Check rich result opportunities for a URL/keyword
 */
export async function checkRichResultOpportunity(
  workspaceId: string,
  url: string,
  keyword: string
): Promise<RichResultMonitoring> {
  const supabase = await getSupabaseServer();

  // In production, this would check Google SERP for rich results
  // For now, simulate opportunity detection
  const richResultTypes = ['faq', 'howto', 'review'];
  const hasOpportunity = Math.random() > 0.4;
  const opportunityType = hasOpportunity ? richResultTypes[Math.floor(Math.random() * richResultTypes.length)] : null;

  const { data, error } = await supabase
    .from('rich_results_monitoring')
    .insert({
      workspace_id: workspaceId,
      url,
      keyword,
      has_rich_result: !hasOpportunity,
      rich_result_types: hasOpportunity ? [] : [opportunityType].filter(Boolean),
      organic_position: Math.floor(Math.random() * 20) + 1,
      competitor_rich_results: [
        { domain: 'competitor1.com', type: 'faq', position: 3 },
        { domain: 'competitor2.com', type: 'review', position: 5 },
      ],
      opportunity_score: hasOpportunity ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30),
      opportunity_type: opportunityType,
      checked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save monitoring: ${error.message}`);
  return data;
}

/**
 * Get rich result monitoring history
 */
export async function getRichResultMonitoring(
  workspaceId: string,
  options: { url?: string; limit?: number } = {}
): Promise<RichResultMonitoring[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('rich_results_monitoring')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('checked_at', { ascending: false });

  if (options.url) {
    query = query.eq('url', options.url);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch monitoring: ${error.message}`);
  return data || [];
}

/**
 * Generate schema JSON-LD script tag
 */
export function generateSchemaScript(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

// Singleton export
export const richResultsService = {
  getSchemaTemplate,
  createSchemaTemplate,
  generateSchema,
  validateExistingSchema,
  getSchemas,
  checkRichResultOpportunity,
  getRichResultMonitoring,
  generateSchemaScript,
  SCHEMA_TEMPLATES,
};
