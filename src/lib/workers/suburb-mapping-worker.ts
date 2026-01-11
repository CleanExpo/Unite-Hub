/**
 * Suburb Mapping Worker
 * Batch-processes 15,000+ Australian suburbs overnight using Gemini 2.0 Flash
 * Analyzes competition, search volume, and gap opportunities per suburb/service
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import type { Job } from 'bull';

const log = (msg: string, ...args: any[]) => console.log(`[SuburbMappingWorker]`, msg, ...args);

export interface SuburbMappingJob {
  suburbName: string;
  state: string;
  postcode: string;
  serviceCategory: string; // e.g., "plumber", "electrician", "glass_balustrades"
  lat?: number;
  lng?: number;
}

export interface SuburbMappingResult {
  suburb: string;
  state: string;
  postcode: string;
  service: string;
  searchVolume: 'low' | 'medium' | 'high' | 'very_high';
  competition: 'low' | 'medium' | 'high';
  topBusinesses: Array<{ name: string; ranking: number }>;
  gapOpportunities: string[];
  localKeywords: string[];
  rawAnalysis: string;
  costUsd: number;
}

export class SuburbMappingWorker {
  private readonly genAI: GoogleGenerativeAI;
  private readonly supabase: ReturnType<typeof createClient>;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = 'gemini-2.0-flash'; // Cost-effective for bulk analysis

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    log('Worker initialized');
  }

  /**
   * Process single suburb mapping job
   */
  async processSuburb(job: Job<SuburbMappingJob>): Promise<SuburbMappingResult> {
    const { suburbName, state, postcode, serviceCategory, lat, lng } = job.data;

    log(`Analyzing ${serviceCategory} in ${suburbName}, ${state} ${postcode}`);

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const prompt = `Analyze the local search landscape for "${serviceCategory}" businesses in ${suburbName}, ${state} ${postcode}, Australia.

Based on your knowledge of Australian suburbs and search patterns, provide:

1. **Search Volume**: Estimate monthly searches for "${serviceCategory} ${suburbName}" (low/medium/high/very_high)
2. **Competition Level**: How many ${serviceCategory} businesses likely operate there (low/medium/high)
3. **Top Businesses**: If you know of established businesses in this suburb, list up to 3
4. **Gap Opportunities**: What market gaps exist? (e.g., "No modern website presence", "No 24/7 emergency service advertised")
5. **Local Keywords**: Suburb-specific keyword variations (e.g., "plumber ipswich qld", "ipswich emergency plumber")

Return ONLY valid JSON format:
{
  "searchVolume": "low|medium|high|very_high",
  "competition": "low|medium|high",
  "topBusinesses": [{"name": "Business Name", "ranking": 1}],
  "gapOpportunities": ["opportunity 1", "opportunity 2"],
  "localKeywords": ["keyword 1", "keyword 2"]
}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for factual analysis
          responseMimeType: 'application/json',
        }
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      let analysis: any = {};
      try {
        analysis = JSON.parse(text);
      } catch (e) {
        log(`Failed to parse JSON for ${suburbName}, using defaults`);
        analysis = {
          searchVolume: 'medium',
          competition: 'medium',
          topBusinesses: [],
          gapOpportunities: ['Unable to analyze - requires manual review'],
          localKeywords: [`${serviceCategory} ${suburbName}`],
        };
      }

      // Calculate cost
      const usageMetadata = response.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;

      // Gemini 2.0 Flash pricing: $0.075 per 1M input, $0.30 per 1M output
      const costUsd =
        (inputTokens / 1_000_000) * 0.075 +
        (outputTokens / 1_000_000) * 0.30;

      // Store in database
      await this.storeSuburbMapping({
        suburb: suburbName,
        state,
        postcode,
        serviceCategory,
        lat,
        lng,
        searchVolume: analysis.searchVolume,
        competition: analysis.competition,
        topBusinesses: analysis.topBusinesses,
        gapOpportunities: analysis.gapOpportunities,
        localKeywords: analysis.localKeywords,
        rawAnalysis: text,
        costUsd,
      });

      log(`Completed ${suburbName}: ${analysis.competition} competition, $${costUsd.toFixed(4)}`);

      return {
        suburb: suburbName,
        state,
        postcode,
        service: serviceCategory,
        searchVolume: analysis.searchVolume,
        competition: analysis.competition,
        topBusinesses: analysis.topBusinesses,
        gapOpportunities: analysis.gapOpportunities,
        localKeywords: analysis.localKeywords,
        rawAnalysis: text,
        costUsd,
      };
    } catch (error: any) {
      log(`Failed to analyze ${suburbName}:`, error.message);
      throw error;
    }
  }

  /**
   * Store suburb mapping result in database
   */
  private async storeSuburbMapping(data: {
    suburb: string;
    state: string;
    postcode: string;
    serviceCategory: string;
    lat?: number;
    lng?: number;
    searchVolume: string;
    competition: string;
    topBusinesses: any[];
    gapOpportunities: string[];
    localKeywords: string[];
    rawAnalysis: string;
    costUsd: number;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('synthex_suburb_mapping')
      .upsert({
        suburb: data.suburb,
        state: data.state,
        postcode: data.postcode,
        service_category: data.serviceCategory,
        lat: data.lat,
        lng: data.lng,
        search_volume: data.searchVolume,
        competition: data.competition,
        top_businesses: data.topBusinesses,
        gap_opportunities: data.gapOpportunities,
        local_keywords: data.localKeywords,
        analysis: { raw: data.rawAnalysis },
        analyzed_by: 'suburb_mapping_worker',
        model_used: this.model,
        analysis_cost_usd: data.costUsd,
      }, {
        onConflict: 'suburb,state,service_category', // Update if already exists
      });

    if (error) {
      throw new Error(`Failed to store suburb mapping: ${error.message}`);
    }
  }

  /**
   * Batch schedule suburbs for mapping
   * Chunks into batches of 100 with 2s delay between requests
   */
  static async scheduleBatch(
    suburbs: SuburbMappingJob[],
    queue: any // Bull Queue instance
  ): Promise<void> {
    const CHUNK_SIZE = 100;
    const DELAY_BETWEEN_REQUESTS_MS = 2000;
    const DELAY_BETWEEN_CHUNKS_MS = 60000; // 1 minute between 100-suburb chunks

    log(`Scheduling ${suburbs.length} suburbs for mapping...`);

    for (let i = 0; i < suburbs.length; i += CHUNK_SIZE) {
      const chunk = suburbs.slice(i, i + CHUNK_SIZE);

      log(`Scheduling chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(suburbs.length / CHUNK_SIZE)} (${chunk.length} suburbs)`);

      // Add each suburb to queue with staggered delays
      chunk.forEach((suburb, index) => {
        queue.add(suburb, {
          delay: index * DELAY_BETWEEN_REQUESTS_MS,
          priority: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        });
      });

      // Wait before next chunk
      if (i + CHUNK_SIZE < suburbs.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS));
      }
    }

    log(`Scheduled all ${suburbs.length} suburbs for mapping`);
  }
}

/**
 * Get Australian suburbs dataset
 * TODO: Replace with actual AU Post PAF or scraping
 */
export async function getAustralianSuburbs(): Promise<SuburbMappingJob[]> {
  // Placeholder: In production, load from:
  // - Australia Post Postcode Database
  // - Or scrape from google.com.au/local
  // - Or use public dataset (e.g., ABS geographic data)

  // Example suburbs for testing
  const testSuburbs: SuburbMappingJob[] = [
    { suburbName: 'Paddington', state: 'NSW', postcode: '2021', serviceCategory: 'plumber', lat: -33.8847, lng: 151.2311 },
    { suburbName: 'Ipswich', state: 'QLD', postcode: '4305', serviceCategory: 'plumber', lat: -27.6149, lng: 152.7609 },
    { suburbName: 'Gold Coast', state: 'QLD', postcode: '4217', serviceCategory: 'glass_balustrades', lat: -28.0167, lng: 153.4000 },
    // ... 14,997 more suburbs
  ];

  log(`Loaded ${testSuburbs.length} suburbs for mapping (placeholder dataset)`);

  return testSuburbs;
}
