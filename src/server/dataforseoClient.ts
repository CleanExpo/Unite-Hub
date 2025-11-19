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
}

export default DataForSEOClient;
