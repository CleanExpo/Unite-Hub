/**
 * Research Agent
 *
 * AI-powered research agent using Brave Search for real-time web research.
 * Supports company research, competitor analysis, content research, and market intelligence.
 *
 * @model Claude Sonnet 4.5 (default)
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  webSearch,
  newsSearch,
  researchCompany,
  searchIndustryNews,
  researchContentTopic,
  getAISummary,
} from "@/lib/integrations/brave-search";
import {
  CLAUDE_MODELS,
  createCacheableSystemPrompt,
  withThinking,
  THINKING_BUDGETS,
} from "@/lib/anthropic/features";

// ============================================================================
// Types
// ============================================================================

export interface ResearchRequest {
  workspaceId: string;
  type: "company" | "competitor" | "topic" | "market" | "general";
  query: string;
  options?: {
    includeNews?: boolean;
    includeLocal?: boolean;
    depth?: "quick" | "standard" | "deep";
  };
}

export interface ResearchResult {
  query: string;
  type: ResearchRequest["type"];
  summary: string;
  keyFindings: string[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  relatedNews?: Array<{
    title: string;
    url: string;
    source: string;
    age: string;
  }>;
  aiInsights?: string;
  timestamp: string;
}

// ============================================================================
// Agent Configuration
// ============================================================================

const RESEARCH_SYSTEM_PROMPT = `You are a professional research analyst assistant. Your task is to analyze search results and provide comprehensive, actionable insights.

## Your Responsibilities:
1. Synthesize information from multiple sources
2. Identify key findings and patterns
3. Highlight important facts and statistics
4. Note any conflicting information
5. Provide actionable recommendations

## Output Format:
- Start with a concise executive summary (2-3 sentences)
- List 3-5 key findings as bullet points
- Include relevant quotes or statistics when available
- End with strategic recommendations if applicable

## Guidelines:
- Be objective and factual
- Cite sources when making claims
- Acknowledge limitations or gaps in the data
- Prioritize recent and authoritative sources
- Focus on information relevant to business decision-making`;

// Lazy Anthropic client
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// ============================================================================
// Research Functions
// ============================================================================

/**
 * Perform company research
 */
async function performCompanyResearch(
  query: string,
  options: ResearchRequest["options"] = {}
): Promise<{ searchData: Awaited<ReturnType<typeof researchCompany>>; rawSummary: string | null }> {
  const searchData = await researchCompany(query, {
    includeNews: options.includeNews ?? true,
    includeLocal: options.includeLocal ?? false,
  });

  const rawSummary = await getAISummary(`${query} company overview business model`);

  return { searchData, rawSummary };
}

/**
 * Perform competitor research
 */
async function performCompetitorResearch(
  query: string
): Promise<{ webResults: Awaited<ReturnType<typeof webSearch>>; newsResults: Awaited<ReturnType<typeof newsSearch>> }> {
  const [webResults, newsResults] = await Promise.all([
    webSearch(`"${query}" competitor analysis market position`, { count: 15 }),
    newsSearch(`${query} company news`, { count: 10 }),
  ]);

  return { webResults, newsResults };
}

/**
 * Perform topic/content research
 */
async function performTopicResearch(
  query: string
): Promise<{ results: Awaited<ReturnType<typeof researchContentTopic>>["results"]; summary: string | null }> {
  const { results, summary } = await researchContentTopic(query);
  return { results, summary };
}

/**
 * Perform market/industry research
 */
async function performMarketResearch(
  query: string
): Promise<{ newsResults: Awaited<ReturnType<typeof searchIndustryNews>>; webResults: Awaited<ReturnType<typeof webSearch>> }> {
  const [newsResults, webResults] = await Promise.all([
    searchIndustryNews(query, "pm"),
    webSearch(`${query} market trends statistics 2026`, { count: 10 }),
  ]);

  return { newsResults, webResults };
}

// ============================================================================
// Main Research Agent
// ============================================================================

/**
 * Execute research request
 *
 * @param request - Research request parameters
 * @returns Comprehensive research result
 *
 * @example
 * const result = await executeResearch({
 *   workspaceId: "ws_123",
 *   type: "company",
 *   query: "Stripe payments",
 *   options: { includeNews: true, depth: "deep" }
 * });
 */
export async function executeResearch(
  request: ResearchRequest
): Promise<ResearchResult> {
  const { type, query, options = {} } = request;
  const depth = options.depth || "standard";

  console.log(`[ResearchAgent] Starting ${type} research for: "${query}" (depth: ${depth})`);

  // Gather search data based on research type
  let searchContext = "";
  let sources: ResearchResult["sources"] = [];
  let relatedNews: ResearchResult["relatedNews"] = [];

  try {
    switch (type) {
      case "company": {
        const { searchData, rawSummary } = await performCompanyResearch(query, options);

        sources = searchData.web.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));

        if (searchData.news) {
          relatedNews = searchData.news.results.map((r) => ({
            title: r.title,
            url: r.url,
            source: r.source,
            age: r.age,
          }));
        }

        searchContext = `
Company: ${query}

Web Search Results:
${searchData.web.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}\n   URL: ${r.url}`).join("\n\n")}

${searchData.news ? `Recent News:\n${searchData.news.results.map((r) => `- ${r.title} (${r.source}, ${r.age})`).join("\n")}` : ""}

${rawSummary ? `AI Summary: ${rawSummary}` : ""}`;
        break;
      }

      case "competitor": {
        const { webResults, newsResults } = await performCompetitorResearch(query);

        sources = webResults.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));

        relatedNews = newsResults.results.map((r) => ({
          title: r.title,
          url: r.url,
          source: r.source,
          age: r.age,
        }));

        searchContext = `
Competitor Analysis: ${query}

Market Position & Analysis:
${webResults.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}`).join("\n\n")}

Recent Competitor News:
${newsResults.results.map((r) => `- ${r.title} (${r.source})`).join("\n")}`;
        break;
      }

      case "topic": {
        const { results, summary } = await performTopicResearch(query);

        sources = results.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));

        searchContext = `
Topic: ${query}

Research Findings:
${results.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}`).join("\n\n")}

${summary ? `Topic Summary: ${summary}` : ""}`;
        break;
      }

      case "market": {
        const { newsResults, webResults } = await performMarketResearch(query);

        sources = webResults.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));

        relatedNews = newsResults.results.map((r) => ({
          title: r.title,
          url: r.url,
          source: r.source,
          age: r.age,
        }));

        searchContext = `
Market/Industry: ${query}

Industry News & Trends:
${newsResults.results.map((r) => `- ${r.title} (${r.source}, ${r.age})`).join("\n")}

Market Analysis:
${webResults.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}`).join("\n\n")}`;
        break;
      }

      default: {
        // General research
        const webResults = await webSearch(query, { count: 15 });

        sources = webResults.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));

        searchContext = `
Query: ${query}

Search Results:
${webResults.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}\n   URL: ${r.url}`).join("\n\n")}`;
      }
    }

    // Use Claude to analyze and synthesize the research
    const client = getAnthropicClient();

    const thinkingBudget =
      depth === "deep"
        ? THINKING_BUDGETS.DEEP
        : depth === "quick"
          ? THINKING_BUDGETS.MINIMAL
          : THINKING_BUDGETS.STANDARD;

    const systemPrompt = createCacheableSystemPrompt([
      { text: RESEARCH_SYSTEM_PROMPT, cache: true, ttl: "1h" },
    ]);

    const messageParams = withThinking(
      {
        model: CLAUDE_MODELS.SONNET_4_5,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Please analyze the following research data and provide a comprehensive analysis:

${searchContext}

Provide:
1. Executive summary (2-3 sentences)
2. Key findings (3-5 bullet points)
3. Strategic insights or recommendations`,
          },
        ],
      },
      thinkingBudget
    );

    const response = await client.messages.create(messageParams);

    // Extract text response
    const textContent = response.content.find((block) => block.type === "text");
    const analysisText = textContent?.type === "text" ? textContent.text : "";

    // Parse the analysis into structured format
    const lines = analysisText.split("\n").filter((l) => l.trim());
    const summaryMatch = analysisText.match(/(?:executive summary|summary)[:\s]*(.+?)(?:\n|key findings)/is);
    const summary = summaryMatch
      ? summaryMatch[1].trim()
      : lines.slice(0, 2).join(" ").substring(0, 500);

    // Extract key findings (bullet points)
    const findingsMatch = analysisText.match(/key findings[:\s]*([\s\S]*?)(?:strategic|recommendations|insights|$)/i);
    const findingsText = findingsMatch ? findingsMatch[1] : "";
    const keyFindings = findingsText
      .split(/[-•*]\s+/)
      .filter((f) => f.trim().length > 10)
      .slice(0, 5)
      .map((f) => f.trim().replace(/\n/g, " "));

    return {
      query,
      type,
      summary,
      keyFindings: keyFindings.length > 0 ? keyFindings : [summary],
      sources: sources.slice(0, 10),
      relatedNews: relatedNews.length > 0 ? relatedNews.slice(0, 5) : undefined,
      aiInsights: analysisText,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[ResearchAgent] Error:", error);
    throw error;
  }
}

/**
 * Quick research helper - returns just the summary
 */
export async function quickResearch(query: string): Promise<string> {
  const result = await executeResearch({
    workspaceId: "system",
    type: "general",
    query,
    options: { depth: "quick" },
  });
  return result.summary;
}

/**
 * Deep company research helper
 */
export async function deepCompanyResearch(
  companyName: string,
  workspaceId: string
): Promise<ResearchResult> {
  return executeResearch({
    workspaceId,
    type: "company",
    query: companyName,
    options: { includeNews: true, includeLocal: true, depth: "deep" },
  });
}
