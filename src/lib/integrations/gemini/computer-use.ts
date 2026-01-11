/**
 * Gemini 2.5 Computer Use Integration
 * Enables AI-powered browser automation for visual gap analysis
 * Used by Auditor Agent to record and analyze search gaps
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const log = (msg: string, ...args: any[]) => console.log(`[GeminiComputerUse]`, msg, ...args);

export interface ComputerUseConfig {
  apiKey: string;
  model?: string; // Default: 'gemini-2.5-pro-computer-use-preview'
}

export interface ComputerUseAction {
  type: 'click' | 'type' | 'scroll' | 'screenshot' | 'wait' | 'navigate';
  target?: string; // CSS selector or coordinates
  value?: string; // Text to type or URL to navigate
  duration?: number; // Wait duration in ms
}

export interface ComputerUseRequest {
  task: string; // High-level task description
  screenshot?: Buffer; // Current page screenshot (base64)
  context?: string; // Additional context about the page
}

export interface ComputerUseResult {
  reasoning: string; // Gemini's explanation of what it sees/plans
  actions: ComputerUseAction[]; // Recommended actions to take
  complete: boolean; // Whether task is considered complete
  model: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  costUsd: number;
}

export class GeminiComputerUse {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: string;

  constructor(config: ComputerUseConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required for Computer Use');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    // Note: Model name may change as API evolves from preview
    this.model = config.model || 'gemini-2.5-pro-experimental'; // Using experimental for now

    log(`Initialized with model: ${this.model}`);
  }

  /**
   * Analyze screenshot and recommend browser actions
   */
  async analyzeAndAct(request: ComputerUseRequest): Promise<ComputerUseResult> {
    const { task, screenshot, context } = request;

    log(`Analyzing task: "${task}"`);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
      });

      const parts: any[] = [
        {
          text: `Task: ${task}\n\n${context ? `Context: ${context}\n\n` : ''}Analyze the screenshot and determine what actions to take. Return JSON format:
{
  "reasoning": "What I see and why I'm taking these actions",
  "actions": [
    {"type": "click|type|scroll|screenshot|wait|navigate", "target": "selector or description", "value": "optional value"},
    ...
  ],
  "complete": true/false
}`
        }
      ];

      // Include screenshot if provided
      if (screenshot) {
        parts.push({
          inlineData: {
            data: screenshot.toString('base64'),
            mimeType: 'image/png'
          }
        });
      }

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent actions
          responseMimeType: 'application/json', // Request JSON response
        }
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        log('Failed to parse JSON response, extracting actions manually');
        // Fallback: extract actions from text
        parsed = {
          reasoning: text,
          actions: [],
          complete: text.toLowerCase().includes('complete') || text.toLowerCase().includes('done'),
        };
      }

      // Extract usage metadata
      const usageMetadata = response.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;

      // Calculate cost for Gemini 2.5 Pro
      // Pricing: $3.50 per 1M input tokens, $10.50 per 1M output tokens (experimental pricing)
      const costUsd =
        (inputTokens / 1_000_000) * 3.50 +
        (outputTokens / 1_000_000) * 10.50;

      log(`Analysis complete. Actions: ${parsed.actions?.length || 0}, Cost: $${costUsd.toFixed(4)}`);

      return {
        reasoning: parsed.reasoning || '',
        actions: parsed.actions || [],
        complete: parsed.complete || false,
        model: this.model,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
        costUsd,
      };
    } catch (error: any) {
      log('Computer Use analysis failed:', error.message);
      throw new Error(`Gemini Computer Use failed: ${error.message}`);
    }
  }

  /**
   * Specialized: Count competitors in Google search results
   * Optimized for Auditor Agent gap detection
   */
  async countCompetitorsInSERP(screenshot: Buffer): Promise<{
    competitorCount: number;
    localPackPresent: boolean;
    organicResults: number;
    reasoning: string;
    costUsd: number;
  }> {
    const result = await this.analyzeAndAct({
      task: 'Count the number of competitor businesses visible in this Google search results page. Identify: 1) Local pack businesses (map results), 2) Organic listings. Return exact counts.',
      screenshot,
      context: 'This is a Google Australia search results page. Focus on counting business listings, not ads or info boxes.',
    });

    // Parse reasoning to extract counts
    const reasoning = result.reasoning.toLowerCase();
    let competitorCount = 0;
    let localPackPresent = false;
    let organicResults = 0;

    // Extract numbers from reasoning
    const localPackMatch = reasoning.match(/local pack[:\s]+(\d+)/i);
    if (localPackMatch) {
      const count = parseInt(localPackMatch[1], 10);
      competitorCount += count;
      localPackPresent = count > 0;
    }

    const organicMatch = reasoning.match(/organic[:\s]+(\d+)/i);
    if (organicMatch) {
      organicResults = parseInt(organicMatch[1], 10);
      competitorCount += organicResults;
    }

    return {
      competitorCount,
      localPackPresent,
      organicResults,
      reasoning: result.reasoning,
      costUsd: result.costUsd,
    };
  }
}

/**
 * Create singleton instance
 */
let geminiComputerUse: GeminiComputerUse | null = null;

export function getGeminiComputerUse(): GeminiComputerUse {
  if (!geminiComputerUse) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable required');
    }

    geminiComputerUse = new GeminiComputerUse({
      apiKey,
      model: 'gemini-2.5-pro-experimental', // Using experimental until Computer Use GA
    });
  }

  return geminiComputerUse;
}
