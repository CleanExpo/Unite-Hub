/**
 * Data Extraction Engine
 * Parses HTML content and extracts structured data for articles
 * - Products, pricing, features
 * - Images, contact info, social links
 * - Key insights and article-relevant content
 */

import { anthropic } from "@/lib/anthropic/client";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import * as cheerio from "cheerio";

// ============================================
// Types
// ============================================

export interface ExtractedData {
  url: string;
  title?: string;
  metaDescription?: string;
  mainHeading?: string;
  bodyText?: string;
  products?: Product[];
  pricingModels?: PricingModel[];
  pricingSummary?: string;
  images?: ScraperImage[];
  contactInfo?: ContactInfo;
  socialLinks?: SocialLinks;
  features?: Feature[];
  testimonials?: Testimonial[];
  articleSummary?: string;
  keyInsights?: string[];
}

export interface Product {
  name: string;
  description?: string;
  price?: string;
  currency?: string;
  imageUrl?: string;
  url?: string;
  features?: string[];
}

export interface PricingModel {
  name: string;
  price?: string;
  currency?: string;
  features?: string[];
  description?: string;
}

export interface ScraperImage {
  url: string;
  altText?: string;
  type?: "product" | "feature" | "logo" | "other";
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  reddit?: string;
}

export interface Feature {
  name: string;
  description?: string;
}

export interface Testimonial {
  author?: string;
  text: string;
  rating?: number;
  company?: string;
}

// ============================================
// Main Extraction
// ============================================

/**
 * Extract structured data from HTML using multiple strategies
 */
export async function extractDataFromHTML(
  html: string,
  url: string,
  keywords?: string[]
): Promise<ExtractedData> {
  const $ = cheerio.load(html);

  const data: ExtractedData = {
    url,
  };

  // 1. Basic metadata
  data.title = $("title").text() || $("meta[property='og:title']").attr("content");
  data.metaDescription =
    $("meta[name='description']").attr("content") ||
    $("meta[property='og:description']").attr("content");
  data.mainHeading = $("h1").first().text();

  // 2. Body text (first 5000 chars)
  const bodyText = $("article, main, .content, .post-content, .page-content")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  data.bodyText = bodyText.substring(0, 5000);

  // 3. Extract structured data
  data.products = extractProducts($);
  data.pricingModels = extractPricing($);
  data.images = extractImages($);
  data.contactInfo = extractContactInfo($);
  data.socialLinks = extractSocialLinks($);
  data.features = extractFeatures($);
  data.testimonials = extractTestimonials($);

  // 4. Use Claude to extract article-relevant insights
  const claudeEnhanced = await enhanceWithClaude(
    data,
    html,
    keywords
  );

  return {
    ...data,
    ...claudeEnhanced,
  };
}

// ============================================
// HTML Parsing Functions
// ============================================

function extractProducts($: any): Product[] {
  const products: Product[] = [];

  // Common product container selectors
  const selectors = [
    ".product",
    ".product-card",
    "[data-product]",
    ".item",
    ".card",
    "article",
  ];

  for (const selector of selectors) {
    $(selector).each((i, el) => {
      if (products.length >= 10) {
return;
} // Limit to 10

      const productEl = $(el);
      const product: Product = {
        name: productEl.find("h2, h3, .name, .title").first().text().trim(),
      };

      if (!product.name) {
return;
}

      // Extract details
      product.description = productEl.find(".description, .desc, p").first().text().trim();
      product.price = productEl.find(".price, [data-price]").first().text().trim();

      // Currency detection
      if (product.price) {
        const currencyMatch = product.price.match(/(\$|€|£|¥|₹)/);
        product.currency = currencyMatch ? currencyMatch[0] : "USD";
      }

      // Image
      const img = productEl.find("img").first();
      if (img.length) {
        product.imageUrl = img.attr("src") || img.attr("data-src");
      }

      // URL
      const link = productEl.find("a").first();
      if (link.length) {
        product.url = link.attr("href");
      }

      // Features
      const featureList = productEl.find(".features, .feature-list, ul, ol").first();
      if (featureList.length) {
        product.features = featureList
          .find("li")
          .map((_, el) => $(el).text().trim())
          .get()
          .slice(0, 5);
      }

      if (product.name) {
        products.push(product);
      }
    });

    if (products.length > 0) {
break;
}
  }

  return products;
}

function extractPricing($: any): PricingModel[] {
  const pricing: PricingModel[] = [];

  // Look for pricing tables/sections
  const pricingSelectors = [
    ".pricing-table",
    ".pricing-cards",
    ".plans",
    ".tiers",
    "[data-pricing]",
  ];

  for (const selector of pricingSelectors) {
    $(selector)
      .find(".pricing-plan, .plan, .tier, .pricing-card")
      .each((i, el) => {
        const planEl = $(el);
        const plan: PricingModel = {
          name: planEl.find("h2, h3, .name").first().text().trim(),
        };

        if (!plan.name) {
return;
}

        // Price
        const priceText = planEl.find(".price, [data-price]").first().text().trim();
        if (priceText) {
          const priceMatch = priceText.match(/[\$€£¥₹]?([\d,.]+)/);
          plan.price = priceMatch ? priceMatch[1] : priceText;

          const currencyMatch = priceText.match(/(USD|EUR|GBP|JPY|INR|\$|€|£|¥|₹)/);
          plan.currency = currencyMatch ? currencyMatch[1] : "USD";
        }

        // Features
        const featureList = planEl.find("ul, .features");
        if (featureList.length) {
          plan.features = featureList
            .find("li")
            .map((_, el) => $(el).text().trim())
            .get()
            .slice(0, 5);
        }

        plan.description = planEl.find(".description, p").first().text().trim();

        pricing.push(plan);
      });

    if (pricing.length > 0) {
break;
}
  }

  return pricing;
}

function extractImages($: any): ScraperImage[] {
  const images: ScraperImage[] = [];
  const seen = new Set<string>();

  $("img").each((i, el) => {
    if (images.length >= 15) {
return;
} // Limit to 15 images

    const src = $(el).attr("src") || $(el).attr("data-src");
    const alt = $(el).attr("alt");

    // Skip tracking pixels, tiny images
    if (!src || src.includes("pixel") || src.includes("1x1")) {
return;
}
    if (seen.has(src)) {
return;
}

    seen.add(src);

    // Classify image type
    let type: "product" | "feature" | "logo" | "other" = "other";
    if (alt?.toLowerCase().includes("product")) {
type = "product";
} else if (alt?.toLowerCase().includes("feature")) {
type = "feature";
} else if (alt?.toLowerCase().includes("logo")) {
type = "logo";
} else if (src.includes("product") || src.includes("catalog")) {
type = "product";
} else if (src.includes("logo")) {
type = "logo";
}

    images.push({
      url: src,
      altText: alt,
      type,
    });
  });

  return images;
}

function extractContactInfo($: any): ContactInfo | null {
  const contact: ContactInfo = {};

  // Email
  const emailMatch = $.html().match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) {
contact.email = emailMatch[0];
}

  // Phone
  const phoneMatch = $.html().match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) {
contact.phone = phoneMatch[0];
}

  // Address
  const addressEl = $("address, [data-address]").first();
  if (addressEl.length) {
contact.address = addressEl.text().trim();
}

  return Object.keys(contact).length > 0 ? contact : null;
}

function extractSocialLinks($: any): SocialLinks | null {
  const social: SocialLinks = {};

  const patterns = {
    twitter: /twitter\.com\/[\w]+/i,
    linkedin: /linkedin\.com\/(company|in)\/[\w\-]+/i,
    facebook: /facebook\.com\/[\w\.-]+/i,
    instagram: /instagram\.com\/[\w\.]+/i,
    youtube: /youtube\.com\/(c|user|@)[\w\-]+/i,
    github: /github\.com\/[\w\-]+/i,
    reddit: /reddit\.com\/(r|u)\/[\w\-]+/i,
  };

  $("a").each((i, el) => {
    const href = $(el).attr("href") || "";

    for (const [platform, pattern] of Object.entries(patterns)) {
      if (pattern.test(href)) {
        social[platform as keyof SocialLinks] = href;
      }
    }
  });

  return Object.keys(social).length > 0 ? social : null;
}

function extractFeatures($: any): Feature[] {
  const features: Feature[] = [];

  // Look for feature lists
  const featureSelectors = [
    ".features",
    ".features-list",
    ".feature-list",
    "[data-features]",
  ];

  for (const selector of featureSelectors) {
    $(selector)
      .find("li, .feature, .feature-item")
      .each((i, el) => {
        const text = $(el).text().trim();
        if (text && features.length < 10) {
          features.push({
            name: text,
          });
        }
      });

    if (features.length > 0) {
break;
}
  }

  return features;
}

function extractTestimonials($: any): Testimonial[] {
  const testimonials: Testimonial[] = [];

  const selectors = [
    ".testimonial",
    ".review",
    ".quote",
    "[data-testimonial]",
    ".testimonials-item",
  ];

  for (const selector of selectors) {
    $(selector).each((i, el) => {
      if (testimonials.length >= 5) {
return;
}

      const testimonialEl = $(el);
      const testimonial: Testimonial = {
        text: testimonialEl.find(".text, .quote, p").first().text().trim(),
        author: testimonialEl.find(".author, .name").first().text().trim(),
      };

      if (testimonial.text) {
        testimonial.company = testimonialEl.find(".company, .organization").first().text().trim();

        // Try to extract rating
        const ratingMatch = testimonialEl.text().match(/(\d+)\s*\/\s*5/);
        if (ratingMatch) {
          testimonial.rating = parseInt(ratingMatch[1]);
        }

        testimonials.push(testimonial);
      }
    });

    if (testimonials.length > 0) {
break;
}
  }

  return testimonials;
}

// ============================================
// Claude Enhancement
// ============================================

/**
 * Use Claude to extract article-relevant insights and summaries
 */
async function enhanceWithClaude(
  data: ExtractedData,
  html: string,
  keywords?: string[]
): Promise<Partial<ExtractedData>> {
  try {
    const systemPrompt = `You are an article research assistant. Extract key insights from webpage content that would be useful for writing an article.

Return JSON:
{
  "articleSummary": "2-3 sentence summary of the page content",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "pricingSummary": "Brief description of pricing model if applicable"
}`;

    const contentForClaude = `
Title: ${data.title}
Heading: ${data.mainHeading}
Body: ${data.bodyText?.substring(0, 2000)}

Products Found: ${data.products?.length || 0}
${data.products?.map((p) => `- ${p.name}: ${p.price || "N/A"}`).join("\n")}

Pricing Models Found: ${data.pricingModels?.length || 0}
${data.pricingModels?.map((p) => `- ${p.name}: ${p.price || "N/A"}`).join("\n")}

${keywords ? `Keywords: ${keywords.join(", ")}` : ""}
    `;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-opus-4-5-20251101",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: contentForClaude,
          },
        ],
      });
    });

    const responseText =
      result.data.content[0].type === "text" ? result.data.content[0].text : "";

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error enhancing with Claude:", error);
    return {};
  }
}
