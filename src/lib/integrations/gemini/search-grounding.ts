/**
 * Gemini Search Grounding Integration
 * Enables real-time web search capabilities via Gemini 2.5 Flash
 * Used by Scout Agent for competitor analysis and geographic gap detection
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const log = (msg: string, ...args: any[]) => console.log(`[GeminiSearchGrounding]`, msg, ...args);

export interface SearchGroundingConfig {
  apiKey: string;
  model?: string; // Default: 'gemini-2.5-flash'
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
}

export interface SearchGroundingRequest {
  query: string;
  location?: SearchLocation; // For geo-targeted search
  maxResults?: number; // Limit search results considered
}

export interface SearchGroundingResult {
  query: string;
  response: string; // Gemini's analysis with search grounding
  searchResultsIncluded: boolean;
  sources?: string[]; // URLs cited in response
  model: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  costUsd: number;
}

export class GeminiSearchGrounding {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: string;

  constructor(config: SearchGroundingConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required for Search Grounding');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.5-flash';

    log(`Initialized with model: ${this.model}`);
  }

  /**
   * Perform search-grounded query with Gemini
   * Gemini will search the web and ground its response in real-time results
   */
  async search(request: SearchGroundingRequest): Promise<SearchGroundingResult> {
    const { query, location, maxResults = 10 } = request;

    log(`Searching: "${query}" ${location ? `at lat=${location.latitude}, lng=${location.longitude}` : ''}`);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
      });

      // Build request with Google Search tool
      const tools: any[] = [{
        googleSearch: location ? {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        } : {}
      }];

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: query
          }]
        }],
        tools,
        generationConfig: {
          temperature: 0.3, // Lower temperature for factual search results
        }
      });

      const response = result.response;
      const text = response.text();

      // Extract usage metadata
      const usageMetadata = response.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;

      // Calculate cost for Gemini 2.5 Flash
      // Pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens
      const costUsd =
        (inputTokens / 1_000_000) * 0.075 +
        (outputTokens / 1_000_000) * 0.30;

      // Extract sources (if available in groundingMetadata)
      const groundingMetadata = (response as any).groundingMetadata;
      const sources: string[] = [];

      if (groundingMetadata?.webSearchQueries) {
        log('Search queries used:', groundingMetadata.webSearchQueries);
      }

      if (groundingMetadata?.searchEntryPoint) {
        sources.push(groundingMetadata.searchEntryPoint.renderedContent);
      }

      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push(chunk.web.uri);
          }
        });
      }

      log(`Search completed. Tokens: ${inputTokens}/${outputTokens}, Cost: $${costUsd.toFixed(4)}`);

      return {
        query,
        response: text,
        searchResultsIncluded: sources.length > 0,
        sources: sources.length > 0 ? sources : undefined,
        model: this.model,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
        costUsd,
      };
    } catch (error: any) {
      log('Search grounding failed:', error.message);
      throw new Error(`Gemini Search Grounding failed: ${error.message}`);
    }
  }

  /**
   * Analyze competitor landscape for specific service + suburb
   * Optimized for Scout Agent geographic gap detection
   */
  async analyzeCompetitorLandscape(params: {
    service: string;
    suburb: string;
    state: string;
    postcode?: string;
  }): Promise<{
    competitorCount: number;
    competition: 'none' | 'low' | 'medium' | 'high';
    topCompetitors: string[];
    gapOpportunities: string[];
    localKeywords: string[];
    response: string;
    costUsd: number;
  }> {
    const { service, suburb, state, postcode } = params;

    // Get approximate coordinates for suburb (AU-specific)
    const location = this.getSuburbCoordinates(suburb, state);

    const query = `Analyze the local search landscape for "${service}" businesses in ${suburb}, ${state}${postcode ? ` ${postcode}` : ''}, Australia.

Provide:
1. Number of competitors currently ranking in Google local pack (top 3) and organic results (top 10)
2. Competition level (none/low/medium/high)
3. Names of top 3 ranking businesses
4. Gap opportunities for a new business entering this market
5. Local keyword variations people search for

Return structured JSON format.`;

    const result = await this.search({ query, location });

    // Parse response (Gemini should return JSON due to prompt)
    let parsed: any = {};
    try {
      // Try to extract JSON from response
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      log('Failed to parse JSON, using raw response');
    }

    return {
      competitorCount: parsed.competitorCount || 0,
      competition: parsed.competition || 'medium',
      topCompetitors: parsed.topCompetitors || [],
      gapOpportunities: parsed.gapOpportunities || [],
      localKeywords: parsed.localKeywords || [],
      response: result.response,
      costUsd: result.costUsd,
    };
  }

  /**
   * Get approximate coordinates for Australian suburb
   * Simplified lookup - in production, use geocoding API
   */
  private getSuburbCoordinates(suburb: string, state: string): SearchLocation | undefined {
    // Major city coordinates as fallback
    const stateCenters: Record<string, SearchLocation> = {
      'NSW': { latitude: -33.8688, longitude: 151.2093 }, // Sydney
      'VIC': { latitude: -37.8136, longitude: 144.9631 }, // Melbourne
      'QLD': { latitude: -27.4698, longitude: 153.0251 }, // Brisbane
      'SA': { latitude: -34.9285, longitude: 138.6007 }, // Adelaide
      'WA': { latitude: -31.9505, longitude: 115.8605 }, // Perth
      'TAS': { latitude: -42.8821, longitude: 147.3272 }, // Hobart
      'NT': { latitude: -12.4634, longitude: 130.8456 }, // Darwin
      'ACT': { latitude: -35.2809, longitude: 149.1300 }, // Canberra
    };

    return stateCenters[state];
  }
}

/**
 * Create singleton instance
 */
let geminiSearchGrounding: GeminiSearchGrounding | null = null;

export function getGeminiSearchGrounding(): GeminiSearchGrounding {
  if (!geminiSearchGrounding) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable required');
    }

    geminiSearchGrounding = new GeminiSearchGrounding({
      apiKey,
      model: 'gemini-2.5-flash', // Cost-effective for bulk searches
    });
  }

  return geminiSearchGrounding;
}
