/**
 * SEED MASTER TEMPLATES FOR NEW CLIENTS
 * Populates template library with pre-built templates
 */

import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { ALL_MASTER_TEMPLATES, MasterTemplate } from "./masterTemplates";

export async function seedTemplatesForClient(clientId: string): Promise<number> {
  let count = 0;

  try {
    console.log(`Seeding templates for client ${clientId}...`);

    for (const template of ALL_MASTER_TEMPLATES) {
      try {
        await fetchMutation(api.socialTemplates.createTemplate, {
          clientId: clientId as any,
          platform: template.platform as any,
          category: template.category as any,
          templateName: template.templateName,
          copyText: template.copyText,
          hashtags: template.hashtags,
          emojiSuggestions: template.emojiSuggestions,
          callToAction: template.callToAction,
          variations: template.variations as any,
          performancePrediction: template.performancePrediction,
          aiGenerated: false,
          tags: template.tags,
        });

        count++;

        // Log progress every 10 templates
        if (count % 10 === 0) {
          console.log(`Seeded ${count} templates...`);
        }
      } catch (error) {
        console.error(`Error seeding template ${template.templateName}:`, error);
      }
    }

    console.log(`Successfully seeded ${count} templates for client ${clientId}`);
    return count;
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
}

export async function seedTemplatesByPlatform(
  clientId: string,
  platform: string
): Promise<number> {
  let count = 0;

  try {
    console.log(`Seeding ${platform} templates for client ${clientId}...`);

    const templates = ALL_MASTER_TEMPLATES.filter((t) => t.platform === platform);

    for (const template of templates) {
      try {
        await fetchMutation(api.socialTemplates.createTemplate, {
          clientId: clientId as any,
          platform: template.platform as any,
          category: template.category as any,
          templateName: template.templateName,
          copyText: template.copyText,
          hashtags: template.hashtags,
          emojiSuggestions: template.emojiSuggestions,
          callToAction: template.callToAction,
          variations: template.variations as any,
          performancePrediction: template.performancePrediction,
          aiGenerated: false,
          tags: template.tags,
        });

        count++;
      } catch (error) {
        console.error(`Error seeding template ${template.templateName}:`, error);
      }
    }

    console.log(
      `Successfully seeded ${count} ${platform} templates for client ${clientId}`
    );
    return count;
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
}

export async function seedTemplatesByCategory(
  clientId: string,
  category: string,
  platform?: string
): Promise<number> {
  let count = 0;

  try {
    console.log(
      `Seeding ${category} templates${platform ? ` for ${platform}` : ""} for client ${clientId}...`
    );

    let templates = ALL_MASTER_TEMPLATES.filter((t) => t.category === category);

    if (platform) {
      templates = templates.filter((t) => t.platform === platform);
    }

    for (const template of templates) {
      try {
        await fetchMutation(api.socialTemplates.createTemplate, {
          clientId: clientId as any,
          platform: template.platform as any,
          category: template.category as any,
          templateName: template.templateName,
          copyText: template.copyText,
          hashtags: template.hashtags,
          emojiSuggestions: template.emojiSuggestions,
          callToAction: template.callToAction,
          variations: template.variations as any,
          performancePrediction: template.performancePrediction,
          aiGenerated: false,
          tags: template.tags,
        });

        count++;
      } catch (error) {
        console.error(`Error seeding template ${template.templateName}:`, error);
      }
    }

    console.log(
      `Successfully seeded ${count} ${category} templates for client ${clientId}`
    );
    return count;
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
}

// API route helper
export async function handleSeedRequest(
  clientId: string,
  options?: {
    platform?: string;
    category?: string;
    limit?: number;
  }
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    let count = 0;

    if (options?.platform && options?.category) {
      count = await seedTemplatesByCategory(
        clientId,
        options.category,
        options.platform
      );
    } else if (options?.platform) {
      count = await seedTemplatesByPlatform(clientId, options.platform);
    } else if (options?.category) {
      count = await seedTemplatesByCategory(clientId, options.category);
    } else {
      count = await seedTemplatesForClient(clientId);
    }

    return {
      success: true,
      count,
      message: `Successfully seeded ${count} templates`,
    };
  } catch (error) {
    console.error("Error in seed request:", error);
    return {
      success: false,
      count: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Template statistics
export function getTemplateCounts() {
  const counts: Record<string, any> = {
    total: ALL_MASTER_TEMPLATES.length,
    byPlatform: {},
    byCategory: {},
  };

  ALL_MASTER_TEMPLATES.forEach((template) => {
    // Count by platform
    if (!counts.byPlatform[template.platform]) {
      counts.byPlatform[template.platform] = 0;
    }
    counts.byPlatform[template.platform]++;

    // Count by category
    if (!counts.byCategory[template.category]) {
      counts.byCategory[template.category] = 0;
    }
    counts.byCategory[template.category]++;
  });

  return counts;
}

// Validate templates
export function validateMasterTemplates(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  ALL_MASTER_TEMPLATES.forEach((template, index) => {
    // Required fields
    if (!template.templateName) {
      errors.push(`Template ${index}: Missing templateName`);
    }
    if (!template.copyText) {
      errors.push(`Template ${index}: Missing copyText`);
    }
    if (!template.platform) {
      errors.push(`Template ${index}: Missing platform`);
    }
    if (!template.category) {
      errors.push(`Template ${index}: Missing category`);
    }

    // Character limits
    const limits: Record<string, number> = {
      facebook: 63206,
      instagram: 2200,
      tiktok: 2200,
      linkedin: 3000,
      twitter: 280,
    };

    if (template.copyText.length > limits[template.platform]) {
      errors.push(
        `Template ${index} (${template.templateName}): Copy exceeds ${template.platform} limit`
      );
    }

    // Hashtag count
    if (template.hashtags.length === 0) {
      warnings.push(`Template ${index} (${template.templateName}): No hashtags`);
    }
    if (template.hashtags.length > 30) {
      warnings.push(
        `Template ${index} (${template.templateName}): Too many hashtags (${template.hashtags.length})`
      );
    }

    // Emojis
    if (template.emojiSuggestions.length === 0) {
      warnings.push(`Template ${index} (${template.templateName}): No emoji suggestions`);
    }

    // Performance predictions
    if (
      !template.performancePrediction.estimatedReach ||
      !template.performancePrediction.estimatedEngagement ||
      !template.performancePrediction.bestTimeToPost
    ) {
      warnings.push(
        `Template ${index} (${template.templateName}): Incomplete performance predictions`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
