/**
 * DataForSEO API Client
 * Phase 5: Intelligence Layer
 *
 * Provides access to DataForSEO's comprehensive SEO intelligence:
 * - SERP Keyword Rankings
 * - Competitor SERP Analysis
 * - Keyword Gap Analysis
 * - Backlink Summary
 * - On-Page SEO Score
 * - Technical SEO Score
 * - Local GEO Pack Tracking
 * - Social Signals (where available)
 *
 * API Documentation: https://docs.dataforseo.com/v3/
 */

import axios, { AxiosInstance } from "axios";

export interface DataForSEOConfig {
  login: string;
  password: string;
  baseURL?: string;
}

export class DataForSEOClient {
  private client: AxiosInstance;
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;

    this.client = axios.create({
      baseURL: "https://api.dataforseo.com/v3",
      auth: {
        username: login,
        password: password,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get SERP keyword rankings for a domain
   */
  async getSerpKeywords(domain: string, keywords: string[]): Promise<any> {
    try {
      console.log(`[DataForSEO] Fetching SERP keywords for ${domain}...`);

      const response = await this.client.post("/serp/google/organic/live/advanced", {
        tasks: keywords.map((keyword) => ({
          keyword,
          location_code: 2840, // United States
          language_code: "en",
          device: "desktop",
          os: "windows",
        })),
      });

      if (response.data.status_code === 20000) {
        const results = response.data.tasks.map((task: any) => {
          const organicResults = task.result?.[0]?.items || [];
          const domainRanking = organicResults.find((item: any) =>
            item.domain?.includes(domain.replace("https://", "").replace("http://", ""))
          );

          return {
            keyword: task.data.keyword,
            position: domainRanking?.rank_group || null,
            url: domainRanking?.url || null,
            title: domainRanking?.title || null,
            description: domainRanking?.description || null,
          };
        });

        return results;
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] SERP keywords error:", error);
      throw error;
    }
  }

  /**
   * Get on-page SEO score for a domain
   */
  async getOnPageScore(domain: string): Promise<any> {
    try {
      console.log(`[DataForSEO] Fetching on-page score for ${domain}...`);

      const response = await this.client.post("/on_page/instant_pages", {
        tasks: [
          {
            target: domain,
            max_crawl_pages: 10,
            load_resources: true,
            enable_javascript: true,
          },
        ],
      });

      if (response.data.status_code === 20000) {
        const result = response.data.tasks[0].result?.[0];

        return {
          score: result?.onpage_score || 0,
          crawledPages: result?.crawled_pages || 0,
          pagesWithErrors: result?.pages_with_errors || 0,
          totalErrors: result?.total_errors || 0,
          brokenLinks: result?.broken_links || 0,
          duplicateTitles: result?.duplicate_titles || 0,
          duplicateDescriptions: result?.duplicate_descriptions || 0,
        };
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] On-page score error:", error);
      throw error;
    }
  }

  /**
   * Get competitor SERP analysis
   */
  async getCompetitorAnalysis(domain: string, competitors: string[]): Promise<any> {
    try {
      console.log(`[DataForSEO] Analyzing competitors for ${domain}...`);

      const response = await this.client.post("/dataforseo_labs/google/competitors_domain/live", {
        tasks: [
          {
            target: domain,
            location_code: 2840,
            language_code: "en",
            competitors_count: Math.min(competitors.length, 10),
          },
        ],
      });

      if (response.data.status_code === 20000) {
        const competitors = response.data.tasks[0].result?.[0]?.items || [];

        return competitors.map((comp: any) => ({
          domain: comp.domain,
          avgPosition: comp.avg_position,
          sum_position: comp.sum_position,
          intersections: comp.intersections,
          full_domain_metrics: comp.full_domain_metrics,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Competitor analysis error:", error);
      throw error;
    }
  }

  /**
   * Get keyword gap analysis
   */
  async getKeywordGap(domain: string, competitors: string[]): Promise<any> {
    try {
      console.log(`[DataForSEO] Analyzing keyword gap for ${domain}...`);

      const response = await this.client.post("/dataforseo_labs/google/domain_intersection/live", {
        tasks: [
          {
            target1: domain,
            target2: competitors[0] || domain,
            location_code: 2840,
            language_code: "en",
            include_serp_info: true,
          },
        ],
      });

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          keyword: item.keyword_data?.keyword,
          searchVolume: item.keyword_data?.keyword_info?.search_volume,
          competition: item.keyword_data?.keyword_info?.competition,
          target1Position: item.intersection_result?.target1?.rank_absolute,
          target2Position: item.intersection_result?.target2?.rank_absolute,
          gap: Math.abs(
            (item.intersection_result?.target1?.rank_absolute || 100) -
              (item.intersection_result?.target2?.rank_absolute || 100)
          ),
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Keyword gap error:", error);
      throw error;
    }
  }

  /**
   * Get backlink summary
   */
  async getBacklinks(domain: string): Promise<any> {
    try {
      console.log(`[DataForSEO] Fetching backlinks for ${domain}...`);

      const response = await this.client.post("/backlinks/summary/live", {
        tasks: [
          {
            target: domain,
            internal_list_limit: 10,
            backlinks_status_type: "all",
          },
        ],
      });

      if (response.data.status_code === 20000) {
        const summary = response.data.tasks[0].result?.[0];

        return {
          totalBacklinks: summary?.backlinks || 0,
          referringDomains: summary?.referring_domains || 0,
          referringMainDomains: summary?.referring_main_domains || 0,
          referringIPs: summary?.referring_ips || 0,
          rank: summary?.rank || 0,
        };
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Backlinks error:", error);
      throw error;
    }
  }

  /**
   * Get local GEO pack rankings
   */
  async getLocalGeoPack(domain: string, location: string): Promise<any> {
    try {
      console.log(`[DataForSEO] Fetching local GEO pack for ${domain} in ${location}...`);

      const response = await this.client.post("/serp/google/maps/live/advanced", {
        tasks: [
          {
            keyword: domain,
            location_name: location,
            language_code: "en",
          },
        ],
      });

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          title: item.title,
          address: item.address,
          rating: item.rating?.value,
          reviews: item.rating?.votes_count,
          category: item.category,
          phone: item.phone,
          website: item.url,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Local GEO pack error:", error);
      throw error;
    }
  }

  /**
   * Get social signals (if available)
   */
  async getSocialSignals(domain: string): Promise<any> {
    try {
      console.log(`[DataForSEO] Fetching social signals for ${domain}...`);

      // Note: DataForSEO does not have a dedicated social signals endpoint
      // This is a placeholder for future implementation
      // Consider using alternative APIs (e.g., SharedCount, BuzzSumo) for social metrics

      return {
        facebook: {
          shares: 0,
          comments: 0,
          reactions: 0,
        },
        twitter: {
          tweets: 0,
          retweets: 0,
        },
        pinterest: {
          pins: 0,
        },
        reddit: {
          posts: 0,
          upvotes: 0,
        },
      };
    } catch (error) {
      console.error("[DataForSEO] Social signals error:", error);
      throw error;
    }
  }

  /**
   * Check API credentials
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/appendix/user_data");
      return response.data.status_code === 20000;
    } catch (error) {
      console.error("[DataForSEO] Connection test failed:", error);
      return false;
    }
  }

  /**
   * Get account balance and limits
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.client.get("/appendix/user_data");

      if (response.data.status_code === 20000) {
        const tasks = response.data.tasks[0];

        return {
          balance: tasks.result?.money?.balance || 0,
          currency: tasks.result?.money?.currency || "USD",
          limits: tasks.result?.limits || {},
        };
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Account info error:", error);
      throw error;
    }
  }

  // =============================================================
  // PHASE 8 WEEK 22: Backlinks & Entity Intelligence Extensions
  // =============================================================

  /**
   * Get detailed backlinks for a domain (Week 22)
   * Returns individual backlinks with anchor text, source URLs, and metrics
   */
  async getBacklinksForDomain(
    domain: string,
    options: {
      limit?: number;
      offset?: number;
      order_by?: string[];
      filters?: string[][];
    } = {}
  ): Promise<BacklinkItem[]> {
    try {
      console.log(`[DataForSEO] Fetching detailed backlinks for ${domain}...`);

      const response = await this.client.post("/backlinks/backlinks/live", [
        {
          target: domain,
          limit: options.limit || 100,
          offset: options.offset || 0,
          order_by: options.order_by || ["rank,desc"],
          filters: options.filters,
          mode: "as_is",
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          source_url: item.page_from || "",
          source_domain: item.domain_from || "",
          target_url: item.url_to || "",
          anchor_text: item.anchor || "",
          link_type: item.dofollow ? "dofollow" : "nofollow",
          first_seen: item.first_seen || "",
          last_seen: item.last_seen || "",
          rank: item.rank || 0,
          page_from_rank: item.page_from_rank || 0,
          domain_from_rank: item.domain_from_rank || 0,
          is_new: item.is_new || false,
          is_lost: item.is_lost || false,
          is_broken: item.is_broken || false,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Detailed backlinks error:", error);
      throw error;
    }
  }

  /**
   * Get referring domains for a domain (Week 22)
   * Aggregates backlinks by source domain
   */
  async getReferringDomains(
    domain: string,
    options: {
      limit?: number;
      offset?: number;
      order_by?: string[];
    } = {}
  ): Promise<ReferringDomain[]> {
    try {
      console.log(`[DataForSEO] Fetching referring domains for ${domain}...`);

      const response = await this.client.post("/backlinks/referring_domains/live", [
        {
          target: domain,
          limit: options.limit || 100,
          offset: options.offset || 0,
          order_by: options.order_by || ["rank,desc"],
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          domain: item.domain || "",
          rank: item.rank || 0,
          backlinks: item.backlinks || 0,
          first_seen: item.first_seen || "",
          lost_date: item.lost_date || null,
          dofollow_count: item.dofollow || 0,
          nofollow_count: item.nofollow || 0,
          redirect_count: item.redirect || 0,
          country: item.country || "",
          spam_score: item.spam_score || 0,
          broken_backlinks: item.broken_backlinks || 0,
          broken_pages: item.broken_pages || 0,
          referring_pages: item.referring_pages || 0,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Referring domains error:", error);
      throw error;
    }
  }

  /**
   * Get anchor text distribution (Week 22)
   */
  async getAnchorTextDistribution(
    domain: string,
    limit: number = 100
  ): Promise<AnchorTextItem[]> {
    try {
      console.log(`[DataForSEO] Fetching anchor text distribution for ${domain}...`);

      const response = await this.client.post("/backlinks/anchors/live", [
        {
          target: domain,
          limit,
          order_by: ["backlinks,desc"],
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          anchor: item.anchor || "",
          backlinks: item.backlinks || 0,
          referring_domains: item.referring_domains || 0,
          first_seen: item.first_seen || "",
          last_seen: item.last_seen || "",
          dofollow: item.dofollow || 0,
          nofollow: item.nofollow || 0,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Anchor text error:", error);
      throw error;
    }
  }

  /**
   * Get backlinks history for trend analysis (Week 22)
   */
  async getBacklinksHistory(
    domain: string,
    dateFrom: string,
    dateTo: string
  ): Promise<BacklinkHistoryItem[]> {
    try {
      console.log(`[DataForSEO] Fetching backlinks history for ${domain}...`);

      const response = await this.client.post("/backlinks/history/live", [
        {
          target: domain,
          date_from: dateFrom,
          date_to: dateTo,
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          date: item.date || "",
          rank: item.rank || 0,
          backlinks: item.backlinks || 0,
          referring_domains: item.referring_domains || 0,
          referring_main_domains: item.referring_main_domains || 0,
          referring_ips: item.referring_ips || 0,
          referring_subnets: item.referring_subnets || 0,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Backlinks history error:", error);
      throw error;
    }
  }

  /**
   * Get new and lost backlinks (Week 22)
   */
  async getNewLostBacklinks(
    domain: string,
    type: "new" | "lost",
    limit: number = 100
  ): Promise<BacklinkItem[]> {
    try {
      console.log(`[DataForSEO] Fetching ${type} backlinks for ${domain}...`);

      const endpoint = type === "new" ? "/backlinks/bulk_new_lost_backlinks/live" : "/backlinks/bulk_new_lost_backlinks/live";

      const response = await this.client.post(endpoint, [
        {
          targets: [domain],
          limit,
          date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Last 30 days
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items
          .filter((item: any) => (type === "new" ? item.new_backlinks > 0 : item.lost_backlinks > 0))
          .map((item: any) => ({
            source_url: item.target || "",
            source_domain: item.target || "",
            target_url: "",
            anchor_text: "",
            link_type: "unknown",
            first_seen: "",
            last_seen: "",
            rank: item.rank || 0,
            page_from_rank: 0,
            domain_from_rank: 0,
            is_new: type === "new",
            is_lost: type === "lost",
            is_broken: false,
            new_backlinks: item.new_backlinks || 0,
            lost_backlinks: item.lost_backlinks || 0,
          }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error(`[DataForSEO] ${type} backlinks error:`, error);
      throw error;
    }
  }

  /**
   * Get content analysis for entity extraction (Week 22)
   * Uses on-page content analysis to extract entities
   */
  async getContentEntities(url: string): Promise<ContentEntity[]> {
    try {
      console.log(`[DataForSEO] Extracting entities from ${url}...`);

      const response = await this.client.post("/content_analysis/search/live", [
        {
          keyword: url,
          search_mode: "as_is",
          return_sentiment: true,
          return_entities: true,
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result || [];
        const entities: ContentEntity[] = [];

        for (const item of items) {
          if (item.entities) {
            for (const entity of item.entities) {
              entities.push({
                name: entity.name || "",
                entity_type: entity.type || "unknown",
                sentiment: entity.sentiment?.type || "neutral",
                sentiment_score: entity.sentiment?.score || 0,
                salience: entity.salience || 0,
                mentions: entity.mentions || 1,
              });
            }
          }
        }

        return entities;
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Content entities error:", error);
      // Return empty array on error for graceful degradation
      return [];
    }
  }

  /**
   * Get ranked keywords with search intent classification (Week 22)
   */
  async getRankedKeywordsWithIntent(
    domain: string,
    limit: number = 100
  ): Promise<KeywordWithIntent[]> {
    try {
      console.log(`[DataForSEO] Fetching ranked keywords with intent for ${domain}...`);

      const response = await this.client.post("/dataforseo_labs/google/ranked_keywords/live", [
        {
          target: domain,
          location_code: 2840, // United States
          language_code: "en",
          limit,
          order_by: ["keyword_data.keyword_info.search_volume,desc"],
          include_serp_info: true,
        },
      ]);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result?.[0]?.items || [];

        return items.map((item: any) => ({
          keyword: item.keyword_data?.keyword || "",
          position: item.ranked_serp_element?.serp_item?.rank_group || 0,
          search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
          competition: item.keyword_data?.keyword_info?.competition || 0,
          cpc: item.keyword_data?.keyword_info?.cpc || 0,
          search_intent: item.keyword_data?.keyword_info?.search_intent_info?.main_intent || "informational",
          is_featured_snippet: item.ranked_serp_element?.serp_item?.is_featured_snippet || false,
          is_knowledge_panel: item.ranked_serp_element?.serp_item?.is_knowledge_panel || false,
          etv: item.keyword_data?.keyword_info?.estimated_traffic_volume || 0,
        }));
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Ranked keywords with intent error:", error);
      throw error;
    }
  }

  /**
   * Get domain categories and topics (Week 22)
   */
  async getDomainCategories(domain: string): Promise<DomainCategory[]> {
    try {
      console.log(`[DataForSEO] Fetching domain categories for ${domain}...`);

      const response = await this.client.post("/dataforseo_labs/google/domain_whois_overview/live", [
        {
          target: domain,
        },
      ]);

      if (response.data.status_code === 20000) {
        const result = response.data.tasks[0].result?.[0];

        // Extract categories from domain metrics
        const categories: DomainCategory[] = [];

        if (result?.categories) {
          for (const [category, confidence] of Object.entries(result.categories)) {
            categories.push({
              category: category as string,
              confidence: confidence as number,
            });
          }
        }

        return categories.sort((a, b) => b.confidence - a.confidence);
      }

      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    } catch (error) {
      console.error("[DataForSEO] Domain categories error:", error);
      return [];
    }
  }
}

// =============================================================
// TypeScript Interfaces for Week 22 Extensions
// =============================================================

export interface BacklinkItem {
  source_url: string;
  source_domain: string;
  target_url: string;
  anchor_text: string;
  link_type: "dofollow" | "nofollow" | "unknown";
  first_seen: string;
  last_seen: string;
  rank: number;
  page_from_rank: number;
  domain_from_rank: number;
  is_new: boolean;
  is_lost: boolean;
  is_broken: boolean;
  new_backlinks?: number;
  lost_backlinks?: number;
}

export interface ReferringDomain {
  domain: string;
  rank: number;
  backlinks: number;
  first_seen: string;
  lost_date: string | null;
  dofollow_count: number;
  nofollow_count: number;
  redirect_count: number;
  country: string;
  spam_score: number;
  broken_backlinks: number;
  broken_pages: number;
  referring_pages: number;
}

export interface AnchorTextItem {
  anchor: string;
  backlinks: number;
  referring_domains: number;
  first_seen: string;
  last_seen: string;
  dofollow: number;
  nofollow: number;
}

export interface BacklinkHistoryItem {
  date: string;
  rank: number;
  backlinks: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_ips: number;
  referring_subnets: number;
}

export interface ContentEntity {
  name: string;
  entity_type: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  salience: number;
  mentions: number;
}

export interface KeywordWithIntent {
  keyword: string;
  position: number;
  search_volume: number;
  competition: number;
  cpc: number;
  search_intent: "informational" | "navigational" | "commercial" | "transactional";
  is_featured_snippet: boolean;
  is_knowledge_panel: boolean;
  etv: number;
}

export interface DomainCategory {
  category: string;
  confidence: number;
}

export default DataForSEOClient;
