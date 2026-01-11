/**
 * Universal Web Scraper Agent
 *
 * Orchestrates end-to-end web scraping:
 * 1. Discover URLs (search + pattern generation)
 * 2. Batch scrape all URLs (Bright Data)
 * 3. Extract structured data (HTML parsing + Claude)
 * 4. Aggregate results for article writing
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { reliableAgentExecution } from "@/lib/agents/agent-reliability";
import { discoverURLs, deduplicateURLs, filterURLs } from "./url-discovery";
import { scrapeUrl, scrapeBatch } from "./brightdata-client";
import { extractDataFromHTML, ExtractedData } from "./data-extraction";
import { anthropic } from "@/lib/anthropic/client";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";

// ============================================
// Types
// ============================================

export interface ScraperProjectInput {
  workspaceId: string;
  name: string;
  description?: string;
  seedUrl: string;
  keywords: string[];
  maxUrlsToScrape?: number;
  searchDepth?: number;
  includeImages?: boolean;
  includePricing?: boolean;
}

export interface ScraperProjectOutput {
  success: boolean;
  projectId?: string;
  urlsDiscovered: number;
  urlsScraped: number;
  urlsFailed: number;
  products?: any[];
  pricing?: any[];
  images?: any[];
  articleOutline?: any;
  error?: string;
}

// ============================================
// Main Scraper Agent
// ============================================

export async function universalScrapeProject(
  input: ScraperProjectInput
): Promise<ScraperProjectOutput> {
  const result = await reliableAgentExecution(
    async () => {
      // 1. Create project
      const projectId = await createProject(input);

      try {
        // 2. Discover URLs
        await updateProjectStatus(projectId, "searching");

        const discoveredURLs = await discoverURLs({
          seedUrl: input.seedUrl,
          keywords: input.keywords,
          maxResults: input.maxUrlsToScrape || 20,
        });

        const deduped = deduplicateURLs(discoveredURLs);
        const filtered = filterURLs(deduped, {
          minRelevanceScore: 0.3,
          maxResults: input.maxUrlsToScrape || 20,
        });

        // Store URLs
        await storeDiscoveredURLs(projectId, filtered);
        await updateProjectStatus(projectId, "scraping", {
          current: 0,
          total: filtered.length,
          stage: "scraping",
        });

        // 3. Batch scrape
        const scrapeResults = await scrapeBatch(
          filtered.map((u) => u.url),
          {
            rateLimit: {
              delayMs: 2000, // 2s between requests
              concurrent: 2,
            },
          }
        );

        // Store raw results
        for (let i = 0; i < scrapeResults.length; i++) {
          const result = scrapeResults[i];
          const urlId = filtered[i].url;

          if (result.success && result.content) {
            await storeRawResult(projectId, urlId, result);
          }

          // Update progress
          await updateProjectStatus(projectId, "scraping", {
            current: i + 1,
            total: filtered.length,
            stage: "scraping",
          });
        }

        // 4. Extract structured data
        await updateProjectStatus(projectId, "extracting", {
          current: 0,
          total: filtered.length,
          stage: "extracting",
        });

        const extractedDataList: ExtractedData[] = [];

        for (let i = 0; i < scrapeResults.length; i++) {
          const scrapeResult = scrapeResults[i];
          const discoveredUrl = filtered[i];

          if (scrapeResult.success && scrapeResult.content) {
            const extracted = await extractDataFromHTML(
              scrapeResult.content,
              scrapeResult.url,
              input.keywords
            );

            extractedDataList.push(extracted);

            // Store extracted data
            await storeExtractedData(projectId, extracted);
          }

          // Update progress
          await updateProjectStatus(projectId, "extracting", {
            current: i + 1,
            total: filtered.length,
            stage: "extracting",
          });
        }

        // 5. Aggregate results
        const aggregated = await aggregateResults(
          projectId,
          extractedDataList,
          input.keywords
        );

        // 6. Mark as completed
        await updateProjectStatus(projectId, "completed");

        return {
          success: true,
          projectId,
          urlsDiscovered: filtered.length,
          urlsScraped: scrapeResults.filter((r) => r.success).length,
          urlsFailed: scrapeResults.filter((r) => !r.success).length,
          products: aggregated.allProducts,
          pricing: aggregated.allPricing,
          images: aggregated.allImages,
          articleOutline: aggregated.articleOutline,
        };
      } catch (error) {
        await updateProjectStatus(projectId, "failed", null, (error as Error).message);
        throw error;
      }
    },
    {
      agentId: "universal-scraper",
      params: { workspaceId: input.workspaceId, keywords: input.keywords },
      enableLoopDetection: true,
      guardConfig: {
        timeoutMs: 600000, // 10 minutes
        maxRetries: 1,
        retryDelayMs: 5000,
      },
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      urlsDiscovered: 0,
      urlsScraped: 0,
      urlsFailed: 0,
      error: result.error || "Scraping project failed",
    };
  }

  return result.data;
}

// ============================================
// Database Operations
// ============================================

async function createProject(input: ScraperProjectInput): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("scraper_projects")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name,
      description: input.description,
      seed_url: input.seedUrl,
      keywords: input.keywords,
      max_urls_to_scrape: input.maxUrlsToScrape || 20,
      search_depth: input.searchDepth || 1,
      include_images: input.includeImages !== false,
      include_pricing: input.includePricing !== false,
      status: "pending",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
throw new Error(`Failed to create project: ${error.message}`);
}
  return data.id;
}

async function updateProjectStatus(
  projectId: string,
  status: string,
  progress?: any,
  errorMessage?: string
): Promise<void> {
  const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };

  if (progress) {
updateData.progress = progress;
}
  if (errorMessage) {
updateData.error_message = errorMessage;
}
  if (status === "completed") {
updateData.completed_at = new Date().toISOString();
}

  const { error } = await supabaseAdmin
    .from("scraper_projects")
    .update(updateData)
    .eq("id", projectId);

  if (error) {
console.error(`Failed to update project ${projectId}:`, error);
}
}

async function storeDiscoveredURLs(
  projectId: string,
  urls: Array<{ url: string; source: string; relevanceScore: number }>
): Promise<void> {
  const urls_to_insert = urls.map((u) => ({
    project_id: projectId,
    workspace_id: "", // Will be populated by RLS
    url: u.url,
    source: u.source,
    relevance_score: u.relevanceScore,
    priority: Math.floor(u.relevanceScore * 100),
    status: "pending",
  }));

  const { error } = await supabaseAdmin
    .from("scraper_urls")
    .insert(urls_to_insert);

  if (error) {
    console.error("Error storing discovered URLs:", error);
  }
}

async function storeRawResult(
  projectId: string,
  urlId: string,
  result: any
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("scraper_raw_results")
    .insert({
      project_id: projectId,
      url_id: urlId,
      workspace_id: "", // RLS
      url: result.url,
      raw_html: result.content,
      http_status: result.statusCode,
      scraped_at: new Date().toISOString(),
    });

  if (error) {
console.error("Error storing raw result:", error);
}
}

async function storeExtractedData(projectId: string, data: ExtractedData): Promise<void> {
  const { error } = await supabaseAdmin
    .from("scraper_extracted_data")
    .insert({
      project_id: projectId,
      url_id: data.url,
      workspace_id: "", // RLS
      url: data.url,
      title: data.title,
      meta_description: data.metaDescription,
      main_heading: data.mainHeading,
      body_text: data.bodyText,
      products: data.products,
      pricing_models: data.pricingModels,
      pricing_summary: data.pricingSummary,
      images: data.images,
      contact_info: data.contactInfo,
      social_links: data.socialLinks,
      features: data.features,
      testimonials: data.testimonials,
      article_summary: data.articleSummary,
      key_insights: data.keyInsights,
      extracted_at: new Date().toISOString(),
    });

  if (error) {
console.error("Error storing extracted data:", error);
}
}

// ============================================
// Aggregation
// ============================================

async function aggregateResults(
  projectId: string,
  extractedDataList: ExtractedData[],
  keywords: string[]
): Promise<{
  allProducts: any[];
  allPricing: any[];
  allImages: any[];
  articleOutline: any;
}> {
  // Aggregate all products
  const allProducts = extractedDataList
    .flatMap((d) => d.products || [])
    .filter((p) => p.name);

  // Aggregate pricing
  const allPricing = extractedDataList
    .flatMap((d) => d.pricingModels || [])
    .filter((p) => p.name);

  // Aggregate images
  const allImages = extractedDataList.flatMap((d) => d.images || []);

  // Price range
  const prices = allPricing
    .filter((p) => p.price && !isNaN(parseFloat(p.price)))
    .map((p) => parseFloat(p.price));
  const priceRange = prices.length > 0 ? {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency: allPricing.find((p) => p.currency)?.currency || "USD",
  } : null;

  // Generate article outline with Claude
  const articleOutline = await generateArticleOutline(
    extractedDataList,
    keywords,
    allProducts,
    allPricing
  );

  // Store aggregated results
  await supabaseAdmin.from("scraper_project_results").insert({
    project_id: projectId,
    workspace_id: "", // RLS
    all_products: allProducts,
    all_pricing: allPricing,
    all_images: allImages.slice(0, 20), // Limit to 20 images
    article_outline: articleOutline,
    total_products_found: allProducts.length,
    total_images_found: allImages.length,
    price_range: priceRange,
    common_features: extractCommonFeatures(extractedDataList),
  });

  return {
    allProducts,
    allPricing,
    allImages,
    articleOutline,
  };
}

function extractCommonFeatures(extractedDataList: ExtractedData[]): string[] {
  const featureCounts: Record<string, number> = {};

  extractedDataList.forEach((data) => {
    (data.features || []).forEach((f) => {
      const name = f.name.toLowerCase();
      featureCounts[name] = (featureCounts[name] || 0) + 1;
    });
  });

  return Object.entries(featureCounts)
    .filter(([, count]) => count >= 2) // Features mentioned 2+ times
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);
}

async function generateArticleOutline(
  extractedDataList: ExtractedData[],
  keywords: string[],
  products: any[],
  pricing: any[]
): Promise<any> {
  try {
    const systemPrompt = `You are an article strategist. Given research data, create an outline for an article.

Return JSON:
{
  "title": "Article title",
  "sections": [
    {
      "title": "Section title",
      "content": "Section description",
      "sources": ["url1", "url2"]
    }
  ],
  "highlights": ["Key point 1", "Key point 2"],
  "callToAction": "Recommended CTA"
}`;

    const summaries = extractedDataList
      .slice(0, 5)
      .map((d) => `${d.title}: ${d.articleSummary}`)
      .join("\n");

    const productSummary = products
      .slice(0, 5)
      .map((p) => `${p.name} - ${p.price || "N/A"}`)
      .join(", ");

    const userPrompt = `Create an article outline for keywords: ${keywords.join(", ")}

Research Summary:
${summaries}

Top Products: ${productSummary}

Generate a compelling article outline that incorporates this research.`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-opus-4-5-20251101",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
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
    console.error("Error generating article outline:", error);
    return {
      title: `Article about ${keywords.join(", ")}`,
      sections: [],
    };
  }
}

// ============================================
// Query Functions
// ============================================

export async function getProjectResults(
  workspaceId: string,
  projectId: string
): Promise<any | null> {
  const { data, error } = await supabaseAdmin
    .from("scraper_project_results")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    console.error("Error fetching project results:", error);
    return null;
  }

  return data;
}

export async function getProjectStatus(
  workspaceId: string,
  projectId: string
): Promise<any | null> {
  const { data, error } = await supabaseAdmin
    .from("scraper_projects")
    .select("*")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    console.error("Error fetching project status:", error);
    return null;
  }

  return data;
}

export async function listProjects(workspaceId: string): Promise<any[] | null> {
  const { data, error } = await supabaseAdmin
    .from("scraper_projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing projects:", error);
    return null;
  }

  return data;
}
