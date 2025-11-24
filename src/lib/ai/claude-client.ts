/**
 * Claude AI Client for Landing Page Copy Generation
 */

import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import {
  generateSectionCopyPrompt,
  generateSEOMetadataPrompt,
  generateCopyTipsPrompt,
  generateDesignTipsPrompt,
  generateCopyVariationsPrompt,
  improveCopyPrompt,
} from "./landing-page-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface CopyGenerationContext {
  businessName: string;
  businessDescription: string;
  pageType: string;
  sectionName: string;
  persona?: any;
  strategy?: any;
  hooks?: string[];
}

/**
 * Generate copy for a landing page section
 */
export async function generateSectionCopy(
  context: CopyGenerationContext
): Promise<{
  headline: string;
  subheadline: string;
  bodyCopy: string;
  cta: string;
  imagePrompt: string;
  alternatives: Array<{
    headline: string;
    subheadline: string;
    bodyCopy?: string;
    cta?: string;
  }>;
}> {
  try {
    const prompt = generateSectionCopyPrompt(context);

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const content = message.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return result;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Error generating section copy:", error);
    // Return fallback copy
    return {
      headline: `${context.sectionName} for ${context.businessName}`,
      subheadline: `Discover how ${context.businessName} can help you achieve your goals`,
      bodyCopy: context.businessDescription,
      cta: "Get Started",
      imagePrompt: `Professional ${context.sectionName.toLowerCase()} image for ${context.businessName}`,
      alternatives: [],
    };
  }
}

/**
 * Generate SEO metadata for a landing page
 */
export async function generateSEOMetadata(context: {
  title: string;
  pageType: string;
  businessName: string;
  businessDescription: string;
  persona?: any;
}): Promise<{
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
}> {
  try {
    const prompt = generateSEOMetadataPrompt(context);

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const content = message.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return result;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Error generating SEO metadata:", error);
    // Return fallback metadata
    return {
      metaTitle: `${context.title} | ${context.businessName}`,
      metaDescription: context.businessDescription.substring(0, 160),
      keywords: ["business", "services", context.businessName.toLowerCase()],
      ogTitle: context.title,
      ogDescription: context.businessDescription.substring(0, 160),
    };
  }
}

/**
 * Generate copy writing tips
 */
export async function generateCopyTips(
  pageType: string,
  persona?: any
): Promise<string[]> {
  try {
    const prompt = generateCopyTipsPrompt(pageType, persona);

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const content = message.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return result.copyTips;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Error generating copy tips:", error);
    // Return fallback tips
    return [
      "Focus on benefits, not features",
      "Use active voice and strong verbs",
      "Keep headlines under 10 words",
      "Include social proof early",
      "Make CTAs specific and action-oriented",
    ];
  }
}

/**
 * Generate design tips
 */
export async function generateDesignTips(pageType: string): Promise<string[]> {
  try {
    const prompt = generateDesignTipsPrompt(pageType);

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const content = message.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return result.designTips;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Error generating design tips:", error);
    // Return fallback tips
    return [
      "Use whitespace effectively",
      "Maintain visual hierarchy",
      "Ensure mobile responsiveness",
      "Use high-quality images",
      "Keep consistent branding",
    ];
  }
}

/**
 * Generate copy variations for A/B testing
 */
export async function generateCopyVariations(
  currentCopy: {
    headline: string;
    subheadline: string;
    bodyCopy?: string;
    cta?: string;
  },
  context: CopyGenerationContext,
  count: number = 3
): Promise<
  Array<{
    headline: string;
    subheadline: string;
    bodyCopy?: string;
    cta?: string;
    approach?: string;
  }>
> {
  try {
    const prompt = generateCopyVariationsPrompt(currentCopy, context, count);

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const content = message.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return result.variations;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Error generating copy variations:", error);
    // Return fallback variations
    return [
      {
        headline: `Alternative: ${currentCopy.headline}`,
        subheadline: "A different approach to engage your audience",
        bodyCopy: currentCopy.bodyCopy,
        cta: currentCopy.cta,
      },
    ];
  }
}

/**
 * Improve existing copy
 */
export async function improveCopy(
  currentCopy: string,
  context: CopyGenerationContext
): Promise<{
  improvedCopy: string;
  improvements: string[];
  conversionScore: number;
}> {
  try {
    const prompt = improveCopyPrompt(currentCopy, context);

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    const content = message.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return result;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Error improving copy:", error);
    return {
      improvedCopy: currentCopy,
      improvements: ["Unable to generate improvements at this time"],
      conversionScore: 70,
    };
  }
}

/**
 * Generate complete landing page checklist
 */
export async function generateCompleteLandingPage(context: {
  businessName: string;
  businessDescription: string;
  pageType: string;
  sections: string[];
  persona?: any;
  strategy?: any;
  hooks?: string[];
}): Promise<{
  sections: Array<{
    sectionName: string;
    headline: string;
    subheadline: string;
    bodyCopy: string;
    cta: string;
    imagePrompt: string;
    alternatives: any[];
  }>;
  seoMetadata: any;
  tips: {
    copyTips: string[];
    designTips: string[];
  };
}> {
  const results = await Promise.all([
    // Generate copy for each section
    ...context.sections.map((sectionName) =>
      generateSectionCopy({
        ...context,
        sectionName,
      })
    ),
    // Generate SEO metadata
    generateSEOMetadata({
      title: `${context.pageType} page`,
      pageType: context.pageType,
      businessName: context.businessName,
      businessDescription: context.businessDescription,
      persona: context.persona,
    }),
    // Generate tips
    generateCopyTips(context.pageType, context.persona),
    generateDesignTips(context.pageType),
  ]);

  const sectionResults = results.slice(0, context.sections.length);
  const seoMetadata = results[context.sections.length];
  const copyTips = results[context.sections.length + 1];
  const designTips = results[context.sections.length + 2];

  return {
    sections: context.sections.map((sectionName, index) => ({
      sectionName,
      ...(sectionResults[index] as any),
    })),
    seoMetadata,
    tips: {
      copyTips: copyTips as string[],
      designTips: designTips as string[],
    },
  };
}
