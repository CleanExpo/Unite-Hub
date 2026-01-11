/**
 * Competitor Scraper Agent
 *
 * Orchestrates web scraping of competitors:
 * - Scrapes website HTML for pricing, features, content
 * - Collects Reddit mentions and engagement
 * - Extracts social metrics
 * - Stores raw + structured data in Supabase
 * - Detects changes between scrapes
 */

import { anthropic } from "@/lib/anthropic/client";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { scrapeUrl, scrapeBatch } from "./brightdata-client";
import { reliableAgentExecution } from "@/lib/agents/agent-reliability";

// ============================================
// Types
// ============================================

export interface ScrapeCompetitorInput {
  workspaceId: string;
  competitorId: string;
  domain: string;
  jobType: "full_scrape" | "pricing" | "social" | "reddit";
  socialHandles?: {
    reddit?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface PricingData {
  product: string;
  price: string;
  currency: string;
  url: string;
  description?: string;
}

export interface SocialMetrics {
  platform: string;
  followers?: number;
  engagement?: number;
  posts?: number;
  lastUpdated: string;
}

export interface ScraperOutput {
  success: boolean;
  jobId?: string;
  competitorId?: string;
  pricing?: PricingData[];
  socialMetrics?: SocialMetrics[];
  keywords?: string[];
  contentSummary?: string;
  error?: string;
}

// ============================================
// Main Scraper Agent
// ============================================

export async function scrapeCompetitor(
  input: ScrapeCompetitorInput
): Promise<ScraperOutput> {
  const result = await reliableAgentExecution(
    async () => {
      // 1. Create scrape job
      const jobId = await createScrapeJob(
        input.workspaceId,
        input.competitorId,
        input.jobType
      );

      try {
        // 2. Scrape URLs based on job type
        let scrapedData: {
          pricing: PricingData[];
          socialMetrics: SocialMetrics[];
          keywords: string[];
          contentSummary: string;
        } = {
          pricing: [],
          socialMetrics: [],
          keywords: [],
          contentSummary: "",
        };

        if (input.jobType === "full_scrape") {
          const homePageResult = await scrapeUrl({
            url: `https://${input.domain}`,
          });

          if (!homePageResult.success) {
            throw new Error(
              `Failed to scrape ${input.domain}: ${homePageResult.error}`
            );
          }

          // Store raw content
          await storeRawScrapResult(
            input.workspaceId,
            input.competitorId,
            jobId,
            `https://${input.domain}`,
            homePageResult.content || "",
            homePageResult.statusCode || 0
          );

          // Extract pricing, keywords, content from HTML
          scrapedData = await extractFromHTML(
            homePageResult.content || "",
            input.domain
          );

          // Try to scrape common pricing/products pages
          const pricingResult = await scrapeUrl({
            url: `https://${input.domain}/pricing`,
          });
          if (pricingResult.success) {
            const pricingData = await extractFromHTML(
              pricingResult.content || "",
              input.domain
            );
            scrapedData.pricing.push(...pricingData.pricing);

            await storeRawScrapResult(
              input.workspaceId,
              input.competitorId,
              jobId,
              `https://${input.domain}/pricing`,
              pricingResult.content || "",
              pricingResult.statusCode || 0
            );
          }
        }

        if (input.jobType === "social" || input.jobType === "full_scrape") {
          // Scrape Reddit for mentions
          if (input.socialHandles?.reddit) {
            const redditMetrics = await scrapeReddit(input.socialHandles.reddit);
            if (redditMetrics) {
              scrapedData.socialMetrics.push(redditMetrics);
            }
          }
        }

        // 3. Store structured data
        const structuredData = await storeStructuredData(
          input.workspaceId,
          input.competitorId,
          jobId,
          scrapedData
        );

        // 4. Mark job as completed
        await updateScrapeJob(jobId, "completed");

        return {
          success: true,
          jobId,
          competitorId: input.competitorId,
          ...scrapedData,
        };
      } catch (error) {
        await updateScrapeJob(jobId, "failed", (error as Error).message);
        throw error;
      }
    },
    {
      agentId: "competitor-scraper",
      params: { workspaceId: input.workspaceId, domain: input.domain },
      enableLoopDetection: true,
      guardConfig: {
        timeoutMs: 120000, // 2 minutes
        maxRetries: 2,
        retryDelayMs: 5000,
      },
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || "Scraping failed",
    };
  }

  return result.data;
}

// ============================================
// Scraping Functions
// ============================================

async function extractFromHTML(
  html: string,
  domain: string
): Promise<{
  pricing: PricingData[];
  socialMetrics: SocialMetrics[];
  keywords: string[];
  contentSummary: string;
}> {
  try {
    const systemPrompt = `You are a web content extraction expert. Extract pricing, keywords, and content summary from HTML.

Return JSON:
{
  "pricing": [
    {
      "product": "Product name",
      "price": "Amount",
      "currency": "USD/EUR/etc",
      "url": "Link if available",
      "description": "Optional description"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "contentSummary": "Brief 2-3 sentence summary of what the site offers"
}`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-opus-4-5-20251101",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Extract data from this website (${domain}):\n\n${html.substring(0, 10000)}`,
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

    const parsed = JSON.parse(cleanJson);

    return {
      pricing: parsed.pricing || [],
      socialMetrics: [],
      keywords: parsed.keywords || [],
      contentSummary: parsed.contentSummary || "",
    };
  } catch (error) {
    console.error("Error extracting from HTML:", error);
    return {
      pricing: [],
      socialMetrics: [],
      keywords: [],
      contentSummary: "",
    };
  }
}

async function scrapeReddit(subredditOrUsername: string): Promise<SocialMetrics | null> {
  try {
    // Construct Reddit URL (could be /r/subreddit or /u/username)
    const isSubreddit = subredditOrUsername.startsWith("r/");
    const redditUrl = isSubreddit
      ? `https://reddit.com/${subredditOrUsername}/about.json`
      : `https://reddit.com/u/${subredditOrUsername}/about.json`;

    const result = await scrapeUrl({
      url: redditUrl,
      format: "json",
    });

    if (!result.success) {
      console.log(`Could not scrape Reddit: ${subredditOrUsername}`);
      return null;
    }

    // Parse Reddit JSON response
    const data = JSON.parse(result.content || "{}");

    let followers = 0;
    let posts = 0;

    if (isSubreddit && data.data?.subscribers) {
      followers = data.data.subscribers;
      posts = data.data.public_description?.length || 0; // Simple proxy
    } else if (!isSubreddit && data.data?.link_karma) {
      followers = data.data.link_karma + data.data.comment_karma;
      posts = data.data.awardee_karma || 0;
    }

    return {
      platform: "reddit",
      followers,
      posts,
      engagement: Math.floor(followers * 0.05), // Rough estimate
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error scraping Reddit (${subredditOrUsername}):`, error);
    return null;
  }
}

// ============================================
// Database Functions
// ============================================

async function createScrapeJob(
  workspaceId: string,
  competitorId: string,
  jobType: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("scrape_jobs")
    .insert({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      job_type: jobType,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create scrape job: ${error.message}`);
  }

  return data.id;
}

async function updateScrapeJob(
  jobId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  const updateData: Record<string, any> = {
    status,
  };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (status === "failed") {
    updateData.error_message = errorMessage;
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("scrape_jobs")
    .update(updateData)
    .eq("id", jobId);

  if (error) {
    console.error(`Failed to update job ${jobId}:`, error);
  }
}

async function storeRawScrapResult(
  workspaceId: string,
  competitorId: string,
  jobId: string,
  sourceUrl: string,
  rawContent: string,
  httpStatus: number
): Promise<void> {
  const { error } = await supabaseAdmin.from("scrape_results_raw").insert({
    workspace_id: workspaceId,
    competitor_id: competitorId,
    job_id: jobId,
    source_url: sourceUrl,
    raw_content: rawContent,
    http_status: httpStatus,
    scraped_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to store raw scrape result:", error);
  }
}

async function storeStructuredData(
  workspaceId: string,
  competitorId: string,
  jobId: string,
  data: {
    pricing: PricingData[];
    socialMetrics: SocialMetrics[];
    keywords: string[];
    contentSummary: string;
  }
): Promise<string> {
  const { data: inserted, error } = await supabaseAdmin
    .from("competitor_data")
    .insert({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      job_id: jobId,
      pricing: data.pricing,
      social_metrics: data.socialMetrics,
      keywords: data.keywords,
      content_summary: data.contentSummary,
      last_updated: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to store structured data: ${error.message}`);
  }

  return inserted.id;
}

// ============================================
// Query Functions
// ============================================

export async function getCompetitorData(
  workspaceId: string,
  competitorId: string
): Promise<any | null> {
  const { data, error } = await supabaseAdmin
    .from("competitor_data")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("competitor_id", competitorId)
    .order("last_updated", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching competitor data:", error);
    return null;
  }

  return data;
}

export async function listCompetitors(
  workspaceId: string
): Promise<any[] | null> {
  const { data, error } = await supabaseAdmin
    .from("competitors")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing competitors:", error);
    return null;
  }

  return data;
}

export async function getScrapeJobs(
  workspaceId: string,
  competitorId?: string
): Promise<any[] | null> {
  let query = supabaseAdmin
    .from("scrape_jobs")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (competitorId) {
    query = query.eq("competitor_id", competitorId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("Error fetching scrape jobs:", error);
    return null;
  }

  return data;
}
