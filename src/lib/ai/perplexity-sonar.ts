/**
 * Perplexity Sonar API Integration
 * Real-time web search with citations for SEO intelligence
 *
 * Pricing:
 * - Sonar: $5/1K searches, $1/750K tokens
 * - Sonar Pro: $5/1K searches, $3/750K input, $15/750K output
 */

interface SonarSearchOptions {
  model?: 'sonar' | 'sonar-pro';
  domains?: string[]; // Limit search to specific domains
  recencyFilter?: 'day' | 'week' | 'month' | 'year';
  maxTokens?: number;
  includeImages?: boolean;
  includeRawContent?: boolean;
}

interface SonarCitation {
  index: number;
  url: string;
  title: string;
  snippet: string;
}

interface SonarResponse {
  answer: string;
  citations: SonarCitation[];
  rawContent?: string;
  images?: string[];
}

export class PerplexitySonar {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
    this.baseURL = 'https://api.perplexity.ai';

    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
  }

  /**
   * Perform real-time search with citations
   *
   * Optional cost tracking parameters:
   * @param organizationId - Organization ID for cost tracking
   * @param workspaceId - Workspace ID for cost tracking
   * @param clientId - Client ID for cost tracking (optional)
   */
  async search(
    query: string,
    options: SonarSearchOptions & {
      organizationId?: string;
      workspaceId?: string;
      clientId?: string;
    } = {}
  ): Promise<SonarResponse> {
    const {
      model = 'sonar',
      domains = [],
      recencyFilter = 'month',
      maxTokens = 2048,
      includeImages = false,
      includeRawContent = false,
      organizationId,
      workspaceId,
      clientId,
    } = options;

    try {
      const startTime = Date.now();

      // Build request payload for Perplexity API
      const payload: any = {
        model: model === 'sonar-pro' ? 'sonar-pro' : 'sonar',
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
        return_citations: true,
        return_images: includeImages,
      };

      // Add optional filters
      if (recencyFilter) {
        payload.search_recency_filter = recencyFilter;
      }

      if (domains.length > 0) {
        payload.search_domain_filter = domains;
      }

      // Call Perplexity Sonar API
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Extract answer from response
      const answer = data.choices?.[0]?.message?.content || '';
      const citations: SonarCitation[] = [];

      // Extract citations if available
      if (data.citations && Array.isArray(data.citations)) {
        data.citations.forEach((citation: any, index: number) => {
          citations.push({
            index: index + 1,
            url: citation.url || '',
            title: citation.title || citation.url || '',
            snippet: citation.snippet || '',
          });
        });
      }

      // Track costs if tracking params provided
      if (organizationId && workspaceId) {
        try {
          const { CostTracker } = await import('@/lib/accounting/cost-tracker');

          const usage = data.usage || {};
          const totalTokens = usage.total_tokens || 0;

          // Calculate cost based on model
          // Sonar: $1/750K tokens (~$0.00133 per 1K tokens)
          // Sonar Pro: $3/750K input, $15/750K output (~$0.004-0.02 per 1K tokens)
          const baseCost = model === 'sonar-pro' ? 0.015 : 0.00133;
          const cost = (totalTokens / 1000) * baseCost;

          // Track expense
          await CostTracker.trackExpense({
            organizationId,
            workspaceId,
            clientId,
            expenseType: 'perplexity',
            description: `${model} - ${totalTokens} tokens - ${citations.length} citations`,
            amount: cost,
            tokensUsed: totalTokens,
            apiEndpoint: '/chat/completions',
            metadata: {
              model,
              query: query.substring(0, 100), // First 100 chars
              citationCount: citations.length,
              responseTime,
            }
          });
        } catch (trackingError) {
          // Log but don't throw - cost tracking should never break the app
          console.error('❌ Cost tracking failed (non-critical):', trackingError);
        }
      }

      return {
        answer,
        citations,
        rawContent: includeRawContent ? data.raw_content : undefined,
        images: includeImages && data.images ? data.images : undefined,
      };
    } catch (error: any) {
      console.error('Perplexity Sonar API error:', error);
      throw new Error(`Sonar search failed: ${error.message}`);
    }
  }

  /**
   * Get latest SEO trends with real-time data
   */
  async getLatestSEOTrends(topic: string): Promise<SonarResponse> {
    const query = `What are the latest SEO trends and best practices for ${topic} in 2025? Include specific data, statistics, and recent algorithm updates.`;

    return this.search(query, {
      model: 'sonar-pro', // Use Pro for deeper research
      recencyFilter: 'month', // Only recent data
      domains: [
        'searchengineland.com',
        'searchenginejournal.com',
        'moz.com',
        'semrush.com',
        'ahrefs.com',
        'backlinko.com',
        'neilpatel.com',
      ],
    });
  }

  /**
   * Research E-E-A-T factors with citations
   */
  async researchEEAT(): Promise<SonarResponse> {
    const query = `What are the latest Google E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines and requirements for 2025? How do they affect SEO rankings? Provide specific examples and recent case studies.`;

    return this.search(query, {
      model: 'sonar-pro',
      recencyFilter: 'month',
      domains: [
        'developers.google.com',
        'searchengineland.com',
        'searchenginejournal.com',
        'moz.com',
      ],
    });
  }

  /**
   * Get Google Business Profile optimization strategies
   */
  async getGMBStrategies(): Promise<SonarResponse> {
    const query = `What are the most effective Google Business Profile (GBP) optimization strategies for local SEO in 2025? Include latest features, algorithm updates, and proven tactics for improving local search rankings.`;

    return this.search(query, {
      model: 'sonar-pro',
      recencyFilter: 'week',
      domains: [
        'support.google.com',
        'searchengineland.com',
        'localiq.com',
        'brightlocal.com',
        'sterling sky.ca',
      ],
    });
  }

  /**
   * Research GEO search and voice search trends
   */
  async getGEOSearchTrends(): Promise<SonarResponse> {
    const query = `What are the latest trends in GEO search, voice search, and AI-powered local search for 2025? How is Google's SGE (Search Generative Experience) affecting local businesses? Include statistics and case studies.`;

    return this.search(query, {
      model: 'sonar-pro',
      recencyFilter: 'month',
      domains: [
        'searchengineland.com',
        'searchenginejournal.com',
        'brightlocal.com',
        'localiq.com',
        'moz.com',
      ],
    });
  }

  /**
   * Get Bing SEO strategies
   */
  async getBingStrategies(): Promise<SonarResponse> {
    const query = `What are the latest Bing SEO strategies and ranking factors for 2025? How does Bing's integration with AI (Copilot, ChatGPT) affect search rankings? What are the key differences from Google SEO?`;

    return this.search(query, {
      model: 'sonar-pro',
      recencyFilter: 'month',
      domains: [
        'bing.com',
        'searchengineland.com',
        'searchenginejournal.com',
        'moz.com',
      ],
    });
  }

  /**
   * Research backlink quality factors
   */
  async getBacklinkStrategies(): Promise<SonarResponse> {
    const query = `What are the most effective white-hat backlink building strategies for 2025? What makes a backlink "viable" and high-quality according to latest Google guidelines? Include E-E-A-T considerations.`;

    return this.search(query, {
      model: 'sonar-pro',
      recencyFilter: 'month',
      domains: [
        'ahrefs.com',
        'moz.com',
        'backlinko.com',
        'searchengineland.com',
        'semrush.com',
      ],
    });
  }

  /**
   * Comprehensive SEO research for a topic
   */
  async comprehensiveSEOResearch(topic: string): Promise<{
    trends: SonarResponse;
    eeat: SonarResponse;
    gmb: SonarResponse;
    geoSearch: SonarResponse;
    bing: SonarResponse;
    backlinks: SonarResponse;
  }> {
    console.log(`🔍 Starting comprehensive SEO research for: ${topic}`);

    const [trends, eeat, gmb, geoSearch, bing, backlinks] = await Promise.all([
      this.getLatestSEOTrends(topic),
      this.researchEEAT(),
      this.getGMBStrategies(),
      this.getGEOSearchTrends(),
      this.getBingStrategies(),
      this.getBacklinkStrategies(),
    ]);

    console.log(`✅ Research complete with ${trends.citations.length + eeat.citations.length + gmb.citations.length + geoSearch.citations.length + bing.citations.length + backlinks.citations.length} total citations`);

    return {
      trends,
      eeat,
      gmb,
      geoSearch,
      bing,
      backlinks,
    };
  }

  /**
   * Generate comprehensive SEO report
   */
  async generateSEOReport(topic: string): Promise<string> {
    const research = await this.comprehensiveSEOResearch(topic);

    let report = `# Comprehensive SEO Intelligence Report: ${topic}\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Source**: Real-time data via Perplexity Sonar Pro\n\n`;

    report += `---\n\n`;

    // Latest SEO Trends
    report += `## 📈 Latest SEO Trends (2025)\n\n`;
    report += `${research.trends.answer}\n\n`;
    report += `**Citations**:\n`;
    research.trends.citations.forEach((c) => {
      report += `${c.index}. [${c.title}](${c.url})\n`;
    });
    report += `\n---\n\n`;

    // E-E-A-T Guidelines
    report += `## 🎯 E-E-A-T Guidelines & Requirements\n\n`;
    report += `${research.eeat.answer}\n\n`;
    report += `**Citations**:\n`;
    research.eeat.citations.forEach((c) => {
      report += `${c.index}. [${c.title}](${c.url})\n`;
    });
    report += `\n---\n\n`;

    // Google Business Profile
    report += `## 🗺️ Google Business Profile Optimization\n\n`;
    report += `${research.gmb.answer}\n\n`;
    report += `**Citations**:\n`;
    research.gmb.citations.forEach((c) => {
      report += `${c.index}. [${c.title}](${c.url})\n`;
    });
    report += `\n---\n\n`;

    // GEO & Voice Search
    report += `## 🌍 GEO Search & Voice Search Trends\n\n`;
    report += `${research.geoSearch.answer}\n\n`;
    report += `**Citations**:\n`;
    research.geoSearch.citations.forEach((c) => {
      report += `${c.index}. [${c.title}](${c.url})\n`;
    });
    report += `\n---\n\n`;

    // Bing SEO
    report += `## 🔍 Bing SEO Strategies\n\n`;
    report += `${research.bing.answer}\n\n`;
    report += `**Citations**:\n`;
    research.bing.citations.forEach((c) => {
      report += `${c.index}. [${c.title}](${c.url})\n`;
    });
    report += `\n---\n\n`;

    // Backlink Strategies
    report += `## 🔗 Viable Backlink Building Strategies\n\n`;
    report += `${research.backlinks.answer}\n\n`;
    report += `**Citations**:\n`;
    research.backlinks.citations.forEach((c) => {
      report += `${c.index}. [${c.title}](${c.url})\n`;
    });
    report += `\n---\n\n`;

    report += `**Total Citations**: ${research.trends.citations.length + research.eeat.citations.length + research.gmb.citations.length + research.geoSearch.citations.length + research.bing.citations.length + research.backlinks.citations.length}\n`;

    return report;
  }
}

export default PerplexitySonar;
