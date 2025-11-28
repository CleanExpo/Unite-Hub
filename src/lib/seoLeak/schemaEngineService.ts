/**
 * Schema Engine Service
 * JSON-LD schema markup generation and validation
 *
 * Features:
 * - Generate schema.org JSON-LD markup for various types
 * - Validate schema against schema.org specifications
 * - Save and manage schema templates
 * - Approval workflow for schema deployment
 * - Human governance mode enforced - never auto-deploy
 *
 * Supported Schema Types:
 * - Article, BlogPosting
 * - Product, Service
 * - LocalBusiness, Organization, Person
 * - FAQ, HowTo
 * - Review, Event
 * - Recipe, Course
 * - WebPage, BreadcrumbList
 * - VideoObject, ImageObject
 *
 * @module schemaEngineService
 * @version 1.0.0
 */

import { getSupabaseServer } from '@/lib/supabase';
import { SEO_LEAK_ENGINE_CONFIG } from '@/config/seoLeakEngine.config';

// =============================================================================
// Types & Interfaces
// =============================================================================

export type SchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'Product'
  | 'LocalBusiness'
  | 'Organization'
  | 'Person'
  | 'FAQ'
  | 'HowTo'
  | 'Review'
  | 'Event'
  | 'Recipe'
  | 'Service'
  | 'WebPage'
  | 'BreadcrumbList'
  | 'VideoObject'
  | 'ImageObject'
  | 'Course';

export type ValidationStatus = 'pending' | 'valid' | 'warnings' | 'errors';
export type SchemaStatus = 'proposed' | 'approved' | 'deployed' | 'rejected' | 'archived';

export interface SchemaTemplate {
  id: string;
  founder_business_id: string;
  template_name: string;
  schema_type: SchemaType;
  schema_body: Record<string, unknown>;
  created_at: string;
}

export interface GeneratedSchema {
  id: string;
  founder_business_id: string;
  url: string;
  schema_type: SchemaType;
  schema_body: Record<string, unknown>;
  validation_status: ValidationStatus | null;
  validation_errors: ValidationError[];
  status: SchemaStatus;
  created_at: string;
  approved_at: string | null;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  status: ValidationStatus;
  errors: ValidationError[];
}

export interface PageInfo {
  title?: string;
  description?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string;
  organizationName?: string;
  organizationLogo?: string;
  // LocalBusiness specific
  businessName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  telephone?: string;
  email?: string;
  priceRange?: string;
  openingHours?: string[];
  latitude?: number;
  longitude?: number;
  // Product specific
  productName?: string;
  productDescription?: string;
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  sku?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  // FAQ specific
  questions?: Array<{ question: string; answer: string }>;
  // HowTo specific
  steps?: Array<{ name: string; text: string; imageUrl?: string }>;
  totalTime?: string;
  // Event specific
  eventName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  performer?: string;
  // Video specific
  videoName?: string;
  videoDuration?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  contentUrl?: string;
  embedUrl?: string;
}

// =============================================================================
// Schema Generation Functions
// =============================================================================

/**
 * Generate Article schema
 */
function generateArticleSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: info.title || '',
    description: info.description || '',
    image: info.imageUrl || '',
    author: {
      '@type': 'Person',
      name: info.author || '',
    },
    publisher: {
      '@type': 'Organization',
      name: info.organizationName || '',
      logo: {
        '@type': 'ImageObject',
        url: info.organizationLogo || '',
      },
    },
    datePublished: info.datePublished || new Date().toISOString(),
    dateModified: info.dateModified || new Date().toISOString(),
  };
}

/**
 * Generate BlogPosting schema
 */
function generateBlogPostingSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: info.title || '',
    description: info.description || '',
    image: info.imageUrl || '',
    author: {
      '@type': 'Person',
      name: info.author || '',
    },
    publisher: {
      '@type': 'Organization',
      name: info.organizationName || '',
      logo: {
        '@type': 'ImageObject',
        url: info.organizationLogo || '',
      },
    },
    datePublished: info.datePublished || new Date().toISOString(),
    dateModified: info.dateModified || new Date().toISOString(),
  };
}

/**
 * Generate Product schema
 */
function generateProductSchema(url: string, info: PageInfo): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: info.productName || info.title || '',
    description: info.productDescription || info.description || '',
    image: info.imageUrl || '',
    url: url,
  };

  if (info.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: info.brand,
    };
  }

  if (info.sku) {
    schema.sku = info.sku;
  }

  if (info.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: info.price,
      priceCurrency: info.currency || 'USD',
      availability: `https://schema.org/${info.availability || 'InStock'}`,
      url: url,
    };
  }

  if (info.rating !== undefined && info.reviewCount !== undefined) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: info.rating,
      reviewCount: info.reviewCount,
    };
  }

  return schema;
}

/**
 * Generate LocalBusiness schema
 */
function generateLocalBusinessSchema(url: string, info: PageInfo): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: info.businessName || info.organizationName || '',
    url: url,
    image: info.imageUrl || '',
    description: info.description || '',
  };

  if (info.streetAddress) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: info.streetAddress,
      addressLocality: info.city || '',
      addressRegion: info.state || '',
      postalCode: info.postalCode || '',
      addressCountry: info.country || '',
    };
  }

  if (info.telephone) {
    schema.telephone = info.telephone;
  }

  if (info.email) {
    schema.email = info.email;
  }

  if (info.priceRange) {
    schema.priceRange = info.priceRange;
  }

  if (info.openingHours && info.openingHours.length > 0) {
    schema.openingHours = info.openingHours;
  }

  if (info.latitude !== undefined && info.longitude !== undefined) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: info.latitude,
      longitude: info.longitude,
    };
  }

  return schema;
}

/**
 * Generate Organization schema
 */
function generateOrganizationSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: info.organizationName || '',
    url: url,
    logo: info.organizationLogo || '',
    description: info.description || '',
    email: info.email || '',
    telephone: info.telephone || '',
  };
}

/**
 * Generate Person schema
 */
function generatePersonSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: info.author || '',
    url: url,
    image: info.imageUrl || '',
    description: info.description || '',
    email: info.email || '',
  };
}

/**
 * Generate FAQ schema
 */
function generateFAQSchema(url: string, info: PageInfo): Record<string, unknown> {
  const questions = info.questions || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate HowTo schema
 */
function generateHowToSchema(url: string, info: PageInfo): Record<string, unknown> {
  const steps = info.steps || [];

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: info.title || '',
    description: info.description || '',
    image: info.imageUrl || '',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.imageUrl ? { image: step.imageUrl } : {}),
    })),
  };

  if (info.totalTime) {
    schema.totalTime = info.totalTime;
  }

  return schema;
}

/**
 * Generate Review schema
 */
function generateReviewSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: info.productName || info.title || '',
    },
    author: {
      '@type': 'Person',
      name: info.author || '',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: info.rating || 5,
      bestRating: 5,
    },
    datePublished: info.datePublished || new Date().toISOString(),
    reviewBody: info.description || '',
  };
}

/**
 * Generate Event schema
 */
function generateEventSchema(url: string, info: PageInfo): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: info.eventName || info.title || '',
    description: info.description || '',
    startDate: info.startDate || '',
    url: url,
    image: info.imageUrl || '',
  };

  if (info.endDate) {
    schema.endDate = info.endDate;
  }

  if (info.location) {
    schema.location = {
      '@type': 'Place',
      name: info.location,
    };
  }

  if (info.performer) {
    schema.performer = {
      '@type': 'Person',
      name: info.performer,
    };
  }

  return schema;
}

/**
 * Generate Service schema
 */
function generateServiceSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: info.title || '',
    description: info.description || '',
    url: url,
    provider: {
      '@type': 'Organization',
      name: info.organizationName || '',
    },
    ...(info.price !== undefined ? {
      offers: {
        '@type': 'Offer',
        price: info.price,
        priceCurrency: info.currency || 'USD',
      },
    } : {}),
  };
}

/**
 * Generate WebPage schema
 */
function generateWebPageSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: info.title || '',
    description: info.description || '',
    url: url,
    datePublished: info.datePublished || new Date().toISOString(),
    dateModified: info.dateModified || new Date().toISOString(),
  };
}

/**
 * Generate BreadcrumbList schema
 */
function generateBreadcrumbListSchema(url: string, info: PageInfo): Record<string, unknown> {
  // Parse URL to create breadcrumb items
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(p => p);

  const items = pathParts.map((part, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    item: `${urlObj.origin}/${pathParts.slice(0, index + 1).join('/')}`,
  }));

  // Add home as first item
  items.unshift({
    '@type': 'ListItem',
    position: 0,
    name: 'Home',
    item: urlObj.origin,
  });

  // Reindex positions
  items.forEach((item, index) => {
    item.position = index + 1;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate VideoObject schema
 */
function generateVideoObjectSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: info.videoName || info.title || '',
    description: info.description || '',
    thumbnailUrl: info.thumbnailUrl || info.imageUrl || '',
    uploadDate: info.uploadDate || info.datePublished || new Date().toISOString(),
    duration: info.videoDuration || '',
    contentUrl: info.contentUrl || '',
    embedUrl: info.embedUrl || '',
  };
}

/**
 * Generate ImageObject schema
 */
function generateImageObjectSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: info.imageUrl || url,
    description: info.description || '',
    name: info.title || '',
    uploadDate: info.datePublished || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: info.author || '',
    },
  };
}

/**
 * Generate Course schema
 */
function generateCourseSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: info.title || '',
    description: info.description || '',
    url: url,
    provider: {
      '@type': 'Organization',
      name: info.organizationName || '',
    },
    ...(info.price !== undefined ? {
      offers: {
        '@type': 'Offer',
        price: info.price,
        priceCurrency: info.currency || 'USD',
      },
    } : {}),
  };
}

/**
 * Generate Recipe schema (bonus type)
 */
function generateRecipeSchema(url: string, info: PageInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: info.title || '',
    description: info.description || '',
    image: info.imageUrl || '',
    author: {
      '@type': 'Person',
      name: info.author || '',
    },
    datePublished: info.datePublished || new Date().toISOString(),
    totalTime: info.totalTime || '',
  };
}

// =============================================================================
// Schema Validation
// =============================================================================

/**
 * Validate schema against schema.org specifications
 *
 * @param schemaBody - Schema to validate
 * @returns Validation result
 */
export function validateSchema(schemaBody: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Check @context
  if (!schemaBody['@context']) {
    errors.push({
      path: '@context',
      message: 'Missing @context property',
      severity: 'error',
    });
  } else if (schemaBody['@context'] !== 'https://schema.org') {
    errors.push({
      path: '@context',
      message: 'Invalid @context, should be "https://schema.org"',
      severity: 'warning',
    });
  }

  // Check @type
  if (!schemaBody['@type']) {
    errors.push({
      path: '@type',
      message: 'Missing @type property',
      severity: 'error',
    });
  }

  const schemaType = schemaBody['@type'] as string;

  // Type-specific validation
  switch (schemaType) {
    case 'Article':
    case 'BlogPosting':
      if (!schemaBody.headline) {
        errors.push({
          path: 'headline',
          message: 'Missing headline property',
          severity: 'error',
        });
      }
      if (!schemaBody.datePublished) {
        errors.push({
          path: 'datePublished',
          message: 'Missing datePublished property',
          severity: 'warning',
        });
      }
      break;

    case 'Product':
      if (!schemaBody.name) {
        errors.push({
          path: 'name',
          message: 'Missing name property',
          severity: 'error',
        });
      }
      if (!schemaBody.offers) {
        errors.push({
          path: 'offers',
          message: 'Missing offers property (price information)',
          severity: 'warning',
        });
      }
      break;

    case 'LocalBusiness':
      if (!schemaBody.name) {
        errors.push({
          path: 'name',
          message: 'Missing name property',
          severity: 'error',
        });
      }
      if (!schemaBody.address) {
        errors.push({
          path: 'address',
          message: 'Missing address property',
          severity: 'warning',
        });
      }
      break;

    case 'FAQPage':
      if (!schemaBody.mainEntity || !Array.isArray(schemaBody.mainEntity)) {
        errors.push({
          path: 'mainEntity',
          message: 'Missing or invalid mainEntity (should be array of Questions)',
          severity: 'error',
        });
      }
      break;

    case 'HowTo':
      if (!schemaBody.step || !Array.isArray(schemaBody.step)) {
        errors.push({
          path: 'step',
          message: 'Missing or invalid step (should be array of HowToSteps)',
          severity: 'error',
        });
      }
      break;

    case 'Event':
      if (!schemaBody.startDate) {
        errors.push({
          path: 'startDate',
          message: 'Missing startDate property',
          severity: 'error',
        });
      }
      break;

    case 'VideoObject':
      if (!schemaBody.name) {
        errors.push({
          path: 'name',
          message: 'Missing name property',
          severity: 'error',
        });
      }
      if (!schemaBody.thumbnailUrl) {
        errors.push({
          path: 'thumbnailUrl',
          message: 'Missing thumbnailUrl property',
          severity: 'warning',
        });
      }
      break;
  }

  // Determine overall status
  const hasErrors = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');

  let status: ValidationStatus = 'valid';
  if (hasErrors) {
    status = 'errors';
  } else if (hasWarnings) {
    status = 'warnings';
  }

  return {
    isValid: !hasErrors,
    status,
    errors,
  };
}

// =============================================================================
// Main Service Functions
// =============================================================================

/**
 * Generate schema markup for a URL
 *
 * @param businessId - Founder business ID
 * @param url - Target URL
 * @param schemaType - Type of schema to generate
 * @param pageInfo - Page information for schema
 * @returns Generated schema result
 */
export async function generateSchema(
  businessId: string,
  url: string,
  schemaType: SchemaType,
  pageInfo: PageInfo = {}
): Promise<{ success: boolean; schema?: GeneratedSchema; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    // Generate schema based on type
    let schemaBody: Record<string, unknown>;

    switch (schemaType) {
      case 'Article':
        schemaBody = generateArticleSchema(url, pageInfo);
        break;
      case 'BlogPosting':
        schemaBody = generateBlogPostingSchema(url, pageInfo);
        break;
      case 'Product':
        schemaBody = generateProductSchema(url, pageInfo);
        break;
      case 'LocalBusiness':
        schemaBody = generateLocalBusinessSchema(url, pageInfo);
        break;
      case 'Organization':
        schemaBody = generateOrganizationSchema(url, pageInfo);
        break;
      case 'Person':
        schemaBody = generatePersonSchema(url, pageInfo);
        break;
      case 'FAQ':
        schemaBody = generateFAQSchema(url, pageInfo);
        break;
      case 'HowTo':
        schemaBody = generateHowToSchema(url, pageInfo);
        break;
      case 'Review':
        schemaBody = generateReviewSchema(url, pageInfo);
        break;
      case 'Event':
        schemaBody = generateEventSchema(url, pageInfo);
        break;
      case 'Recipe':
        schemaBody = generateRecipeSchema(url, pageInfo);
        break;
      case 'Service':
        schemaBody = generateServiceSchema(url, pageInfo);
        break;
      case 'WebPage':
        schemaBody = generateWebPageSchema(url, pageInfo);
        break;
      case 'BreadcrumbList':
        schemaBody = generateBreadcrumbListSchema(url, pageInfo);
        break;
      case 'VideoObject':
        schemaBody = generateVideoObjectSchema(url, pageInfo);
        break;
      case 'ImageObject':
        schemaBody = generateImageObjectSchema(url, pageInfo);
        break;
      case 'Course':
        schemaBody = generateCourseSchema(url, pageInfo);
        break;
      default:
        return { success: false, error: `Unsupported schema type: ${schemaType}` };
    }

    // Validate the generated schema
    const validation = validateSchema(schemaBody);

    const supabase = await getSupabaseServer();

    // Store generated schema
    const { data, error } = await supabase
      .from('generated_schemas')
      .insert({
        founder_business_id: businessId,
        url,
        schema_type: schemaType,
        schema_body: schemaBody,
        validation_status: validation.status,
        validation_errors: validation.errors,
        status: 'proposed',
      })
      .select()
      .single();

    if (error) {
      console.error('[Schema Engine] Save schema error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, schema: data as GeneratedSchema };
  } catch (err) {
    console.error('[Schema Engine] Generate schema error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Save a schema template
 *
 * @param businessId - Founder business ID
 * @param templateName - Template name
 * @param schemaType - Type of schema
 * @param schemaBody - Schema template body
 * @returns Saved template result
 */
export async function saveTemplate(
  businessId: string,
  templateName: string,
  schemaType: SchemaType,
  schemaBody: Record<string, unknown>
): Promise<{ success: boolean; template?: SchemaTemplate; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('schema_templates')
      .insert({
        founder_business_id: businessId,
        template_name: templateName,
        schema_type: schemaType,
        schema_body: schemaBody,
      })
      .select()
      .single();

    if (error) {
      console.error('[Schema Engine] Save template error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, template: data as SchemaTemplate };
  } catch (err) {
    console.error('[Schema Engine] Save template error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get schema templates for a business
 *
 * @param businessId - Founder business ID
 * @param schemaType - Optional filter by type
 * @returns Array of templates
 */
export async function getTemplates(
  businessId: string,
  schemaType?: SchemaType
): Promise<SchemaTemplate[]> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('schema_templates')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false });

    if (schemaType) {
      query = query.eq('schema_type', schemaType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Schema Engine] Get templates error:', error);
      return [];
    }

    return (data ?? []) as SchemaTemplate[];
  } catch (err) {
    console.error('[Schema Engine] Get templates error:', err);
    return [];
  }
}

/**
 * Approve a schema for deployment
 *
 * @param schemaId - ID of the schema to approve
 * @returns Success status
 */
export async function approveSchema(schemaId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('generated_schemas')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', schemaId)
      .eq('status', 'proposed');

    if (error) {
      console.error('[Schema Engine] Approve schema error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Schema Engine] Approve schema error:', err);
    return false;
  }
}

/**
 * Reject a schema
 *
 * @param schemaId - ID of the schema to reject
 * @returns Success status
 */
export async function rejectSchema(schemaId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('generated_schemas')
      .update({ status: 'rejected' })
      .eq('id', schemaId);

    if (error) {
      console.error('[Schema Engine] Reject schema error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Schema Engine] Reject schema error:', err);
    return false;
  }
}

/**
 * Mark a schema as deployed
 *
 * @param schemaId - ID of the schema to mark deployed
 * @returns Success status
 */
export async function markDeployed(schemaId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('generated_schemas')
      .update({ status: 'deployed' })
      .eq('id', schemaId)
      .eq('status', 'approved');

    if (error) {
      console.error('[Schema Engine] Mark deployed error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Schema Engine] Mark deployed error:', err);
    return false;
  }
}

/**
 * Get generated schemas for a business
 *
 * @param businessId - Founder business ID
 * @param status - Optional filter by status
 * @param limit - Maximum number of results
 * @returns Array of generated schemas
 */
export async function getGeneratedSchemas(
  businessId: string,
  status?: SchemaStatus,
  limit = 50
): Promise<GeneratedSchema[]> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('generated_schemas')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Schema Engine] Get schemas error:', error);
      return [];
    }

    return (data ?? []) as GeneratedSchema[];
  } catch (err) {
    console.error('[Schema Engine] Get schemas error:', err);
    return [];
  }
}

/**
 * Get a specific generated schema
 *
 * @param schemaId - ID of the schema
 * @returns Schema or null
 */
export async function getSchema(schemaId: string): Promise<GeneratedSchema | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('generated_schemas')
      .select('*')
      .eq('id', schemaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[Schema Engine] Get schema error:', error);
      return null;
    }

    return data as GeneratedSchema;
  } catch (err) {
    console.error('[Schema Engine] Get schema error:', err);
    return null;
  }
}

/**
 * Delete a schema
 *
 * @param schemaId - ID of the schema to delete
 * @returns Success status
 */
export async function deleteSchema(schemaId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('generated_schemas')
      .delete()
      .eq('id', schemaId);

    if (error) {
      console.error('[Schema Engine] Delete schema error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Schema Engine] Delete schema error:', err);
    return false;
  }
}

/**
 * Delete a template
 *
 * @param templateId - ID of the template to delete
 * @returns Success status
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('schema_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('[Schema Engine] Delete template error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Schema Engine] Delete template error:', err);
    return false;
  }
}

/**
 * Generate schema from template
 *
 * @param templateId - ID of the template to use
 * @param url - Target URL
 * @param overrides - Page info overrides
 * @returns Generated schema result
 */
export async function generateFromTemplate(
  templateId: string,
  url: string,
  overrides: PageInfo = {}
): Promise<{ success: boolean; schema?: GeneratedSchema; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('schema_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return { success: false, error: 'Template not found' };
    }

    // Merge template with overrides
    const mergedSchema = {
      ...template.schema_body as Record<string, unknown>,
    };

    // Apply URL
    if (mergedSchema.mainEntityOfPage && typeof mergedSchema.mainEntityOfPage === 'object') {
      (mergedSchema.mainEntityOfPage as Record<string, unknown>)['@id'] = url;
    }
    if ('url' in mergedSchema) {
      mergedSchema.url = url;
    }

    // Validate
    const validation = validateSchema(mergedSchema);

    // Store
    const { data, error } = await supabase
      .from('generated_schemas')
      .insert({
        founder_business_id: template.founder_business_id,
        url,
        schema_type: template.schema_type,
        schema_body: mergedSchema,
        validation_status: validation.status,
        validation_errors: validation.errors,
        status: 'proposed',
      })
      .select()
      .single();

    if (error) {
      console.error('[Schema Engine] Save schema error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, schema: data as GeneratedSchema };
  } catch (err) {
    console.error('[Schema Engine] Generate from template error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
