/**
 * Brand Context Resolver
 *
 * Resolves brand context for all Unite-Hub operations including:
 * - Content generation (topic engine, content agents)
 * - Campaign planning (drip campaigns, email templates)
 * - Analytics (performance tracking, insights)
 * - Intelligence (topic discovery, trend analysis)
 *
 * Ensures all operations are brand-aware and respect cross-linking rules.
 *
 * @module brands/brandContextResolver
 */

import { brandRegistry, type Brand } from './brandRegistry';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/brands/context-resolver' });

// ====================================
// Brand Context Types
// ====================================

export interface BrandContext {
  brand: Brand;
  cross_linked_brands: Brand[];
  allowed_references: string[]; // Brand slugs that can be referenced
  content_guidelines: {
    tone_of_voice: string;
    positioning_keywords: string[];
    content_themes: string[];
    target_audience: string[];
  };
  restrictions: {
    cannot_reference: string[]; // Brand slugs that cannot be referenced
    no_brand_mixing: boolean;
    founder_approval_required: boolean;
  };
}

export interface BrandContentContext {
  primary_brand: string; // slug
  referenced_brands?: string[]; // slugs that are mentioned
  content_type: 'blog_post' | 'email' | 'social_media' | 'landing_page' | 'campaign';
  industry_context?: string;
  target_audience?: string[];
}

export interface BrandValidationResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
}

// ====================================
// Brand Context Resolver
// ====================================

export class BrandContextResolver {
  /**
   * Resolve full brand context for operations
   */
  async resolveBrandContext(brandSlug: string): Promise<BrandContext | null> {
    try {
      // Get primary brand
      const brand = await brandRegistry.getBrandBySlug(brandSlug);
      if (!brand) {
        logger.error('Brand not found', { brandSlug });
        return null;
      }

      // Get cross-linked brands
      const crossLinkedBrands = await brandRegistry.getCrossLinkedBrands(brandSlug);

      // Build allowed references list
      const allowedReferences = [
        brandSlug, // Can always reference self
        ...crossLinkedBrands.map((b) => b.slug),
      ];

      // Get all brand slugs to determine disallowed references
      const allBrands = await brandRegistry.getAllBrands();
      const cannotReference = allBrands
        .map((b) => b.slug)
        .filter((slug) => !allowedReferences.includes(slug));

      // Build content guidelines
      const contentGuidelines = {
        tone_of_voice: brand.metadata?.tone_of_voice || 'Professional',
        positioning_keywords: brand.positioning.flatMap((p) =>
          p.split(' ').filter((w) => w.length > 3)
        ),
        content_themes: brand.metadata?.content_themes || [],
        target_audience: brand.metadata?.target_audience || [],
      };

      // Build restrictions
      const restrictions = {
        cannot_reference: cannotReference,
        no_brand_mixing: true,
        founder_approval_required: brandSlug !== 'unite-group', // Hub brand has more freedom
      };

      const context: BrandContext = {
        brand,
        cross_linked_brands: crossLinkedBrands,
        allowed_references: allowedReferences,
        content_guidelines,
        restrictions,
      };

      logger.info('Brand context resolved', {
        brandSlug,
        cross_links: crossLinkedBrands.length,
        allowed_references: allowedReferences.length,
      });

      return context;
    } catch (error) {
      logger.error('Failed to resolve brand context', {
        brandSlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Validate brand content context (check cross-linking rules)
   */
  async validateContentContext(
    contentContext: BrandContentContext
  ): Promise<BrandValidationResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      // Get primary brand context
      const brandContext = await this.resolveBrandContext(contentContext.primary_brand);

      if (!brandContext) {
        violations.push(`Invalid primary brand: ${contentContext.primary_brand}`);
        return { valid: false, violations, warnings };
      }

      // Check referenced brands
      if (contentContext.referenced_brands && contentContext.referenced_brands.length > 0) {
        for (const refBrand of contentContext.referenced_brands) {
          // Check if reference is allowed
          if (!brandContext.allowed_references.includes(refBrand)) {
            violations.push(
              `Brand "${contentContext.primary_brand}" cannot reference "${refBrand}" (cross-link rule violation)`
            );
          }

          // Warn if referencing self excessively
          if (refBrand === contentContext.primary_brand) {
            warnings.push('Content references its own brand excessively');
          }
        }
      }

      // Check for brand mixing (content should have ONE primary brand)
      if (contentContext.referenced_brands && contentContext.referenced_brands.length > 3) {
        warnings.push(
          `Content references ${contentContext.referenced_brands.length} brands - consider focusing on fewer brands`
        );
      }

      return {
        valid: violations.length === 0,
        violations,
        warnings,
      };
    } catch (error) {
      logger.error('Content context validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      violations.push('Validation system error');
      return { valid: false, violations, warnings };
    }
  }

  /**
   * Get content generation prompt with brand context
   */
  async getContentPromptWithBrandContext(
    brandSlug: string,
    basePrompt: string
  ): Promise<string> {
    const context = await this.resolveBrandContext(brandSlug);

    if (!context) {
      return basePrompt;
    }

    // Inject brand context into prompt
    const brandContextPrompt = `
Brand Context:
- Brand: ${context.brand.slug} (${context.brand.domain})
- Role: ${context.brand.role}
- Positioning: ${context.brand.positioning.join(', ')}
- Tone of Voice: ${context.content_guidelines.tone_of_voice}
- Target Audience: ${context.content_guidelines.target_audience.join(', ')}
- Content Themes: ${context.content_guidelines.content_themes.join(', ')}
- Allowed Brand References: ${context.allowed_references.join(', ')}
- Cannot Reference: ${context.restrictions.cannot_reference.join(', ')}

IMPORTANT: Maintain brand identity. Do not mix brand positioning or tone. Only reference allowed brands per cross-linking rules.

${basePrompt}
`;

    return brandContextPrompt;
  }

  /**
   * Filter topics by brand relevance
   */
  async filterTopicsByBrandRelevance(
    brandSlug: string,
    topics: Array<{ topic: string; signals: any[] }>
  ): Promise<Array<{ topic: string; signals: any[]; relevance_score: number }>> {
    const context = await this.resolveBrandContext(brandSlug);

    if (!context) {
      return topics.map((t) => ({ ...t, relevance_score: 0 }));
    }

    // Score topics based on brand context
    return topics.map((topic) => {
      let relevanceScore = 0;

      // Check if topic matches content themes
      const topicLower = topic.topic.toLowerCase();
      for (const theme of context.content_guidelines.content_themes) {
        if (topicLower.includes(theme.toLowerCase())) {
          relevanceScore += 20;
        }
      }

      // Check if topic matches positioning keywords
      for (const keyword of context.content_guidelines.positioning_keywords) {
        if (topicLower.includes(keyword.toLowerCase())) {
          relevanceScore += 15;
        }
      }

      // Check if topic matches target audience
      for (const audience of context.content_guidelines.target_audience) {
        if (topicLower.includes(audience.toLowerCase())) {
          relevanceScore += 10;
        }
      }

      // Cap at 100
      relevanceScore = Math.min(100, relevanceScore);

      return {
        ...topic,
        relevance_score: relevanceScore,
      };
    });
  }

  /**
   * Get brand-specific campaign context
   */
  async getCampaignContext(brandSlug: string): Promise<{
    brand: Brand;
    recommended_channels: string[];
    content_calendar_themes: string[];
    cross_promotion_opportunities: Brand[];
  } | null> {
    const context = await this.resolveBrandContext(brandSlug);

    if (!context) {
return null;
}

    // Determine recommended channels based on brand
    const recommendedChannels = this.getRecommendedChannels(context.brand);

    // Generate content calendar themes from positioning and content themes
    const contentCalendarThemes = [
      ...context.brand.positioning.map((p) => p.replace(/\./g, '')),
      ...context.content_guidelines.content_themes,
    ];

    return {
      brand: context.brand,
      recommended_channels: recommendedChannels,
      content_calendar_themes: contentCalendarThemes,
      cross_promotion_opportunities: context.cross_linked_brands,
    };
  }

  /**
   * Determine recommended marketing channels for brand
   */
  private getRecommendedChannels(brand: Brand): string[] {
    const channels: string[] = ['email', 'blog']; // Base channels

    // Add industry-specific channels
    if (brand.metadata?.industry?.includes('Education')) {
      channels.push('webinar', 'video');
    }

    if (brand.metadata?.industry?.includes('Agency')) {
      channels.push('linkedin', 'case_studies');
    }

    if (brand.metadata?.industry?.includes('Association')) {
      channels.push('newsletter', 'events');
    }

    // Always add social for unite-group (nexus brand)
    if (brand.slug === 'unite-group') {
      channels.push('linkedin', 'twitter', 'youtube');
    }

    return channels;
  }

  /**
   * Check if operation requires founder approval
   */
  async requiresFounderApproval(
    brandSlug: string,
    operationType: 'content_publish' | 'campaign_launch' | 'brand_update' | 'cross_link'
  ): Promise<boolean> {
    const context = await this.resolveBrandContext(brandSlug);

    if (!context) {
return true;
} // Safe default

    // Brand updates always require approval
    if (operationType === 'brand_update') {
return true;
}

    // Cross-linking requires approval
    if (operationType === 'cross_link') {
return true;
}

    // Hub brand (unite-group) has more autonomy
    if (brandSlug === 'unite-group' && operationType === 'content_publish') {
      return false;
    }

    // All other operations require approval by default
    return context.restrictions.founder_approval_required;
  }
}

// Export singleton instance
export const brandContextResolver = new BrandContextResolver();

/**
 * Helper function: Get brand context for content generation
 */
export async function getBrandContextForContent(
  brandSlug: string
): Promise<BrandContext | null> {
  return brandContextResolver.resolveBrandContext(brandSlug);
}

/**
 * Helper function: Validate content against brand rules
 */
export async function validateBrandContent(
  contentContext: BrandContentContext
): Promise<BrandValidationResult> {
  return brandContextResolver.validateContentContext(contentContext);
}

/**
 * Helper function: Enrich prompt with brand context
 */
export async function enrichPromptWithBrandContext(
  brandSlug: string,
  basePrompt: string
): Promise<string> {
  return brandContextResolver.getContentPromptWithBrandContext(brandSlug, basePrompt);
}
