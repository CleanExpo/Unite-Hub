/**
 * Email Idea Extractor
 *
 * AI-powered extraction of actionable insights from email content.
 * Uses Claude to identify action items, meeting requests, deadlines, etc.
 */

import Anthropic from '@anthropic-ai/sdk';
import { emailIngestionConfig, getIdeaExtractionModel } from '@config/emailIngestion.config';

// ============================================================================
// Types
// ============================================================================

export type IdeaType =
  | 'action_item'
  | 'meeting_request'
  | 'deadline'
  | 'follow_up'
  | 'opportunity'
  | 'concern'
  | 'feedback'
  | 'question'
  | 'decision_needed'
  | 'general_insight';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ExtractedIdea {
  type: IdeaType;
  title: string;
  description: string;
  extractedText: string;
  priority: Priority;
  confidence: number;
  dueDate?: Date;
  dueDateConfidence?: number;
}

export interface EmailContent {
  subject: string;
  bodyText: string;
  fromEmail: string;
  fromName: string;
  date: Date;
  isIncoming: boolean;
}

export interface ExtractionResult {
  ideas: ExtractedIdea[];
  sentiment: number; // -1 to 1
  intentClassification: string;
  intentConfidence: number;
  processingTimeMs: number;
  model: string;
}

// ============================================================================
// Extraction Prompt
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are an AI assistant that extracts actionable insights from email conversations for a CRM system.

Your task is to analyze email content and identify:
1. Action items that need to be completed
2. Meeting requests or scheduling needs
3. Deadlines mentioned
4. Follow-up items needed
5. Business opportunities
6. Concerns or issues raised
7. Feedback provided
8. Questions that need answers
9. Decisions that need to be made
10. General insights worth noting

For each insight, provide:
- type: The category of insight
- title: A brief, actionable title (max 100 chars)
- description: A short explanation (max 300 chars)
- extractedText: The exact text from the email that triggered this insight
- priority: low, medium, high, or urgent
- confidence: 0.0 to 1.0 confidence score
- dueDate: ISO date string if a date/deadline is mentioned
- dueDateConfidence: 0.0 to 1.0 confidence in the date extraction

Also provide:
- sentiment: -1.0 (very negative) to 1.0 (very positive) overall sentiment
- intentClassification: The primary intent of the email (inquiry, complaint, request, information, greeting, followup, etc.)
- intentConfidence: 0.0 to 1.0 confidence in intent classification

Only extract insights with confidence >= ${emailIngestionConfig.ideaExtraction.minConfidence}.

Respond with valid JSON only, no markdown or explanation.`;

// ============================================================================
// Email Idea Extractor Class
// ============================================================================

class EmailIdeaExtractor {
  private anthropic: Anthropic;
  private model: string;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = getIdeaExtractionModel();
  }

  /**
   * Extract ideas from email content
   */
  async extractIdeas(email: EmailContent): Promise<ExtractionResult> {
    const startTime = Date.now();

    // Skip if extraction is disabled
    if (!emailIngestionConfig.ideaExtraction.enabled) {
      return {
        ideas: [],
        sentiment: 0,
        intentClassification: 'unknown',
        intentConfidence: 0,
        processingTimeMs: 0,
        model: this.model,
      };
    }

    const userPrompt = this.buildExtractionPrompt(email);

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const processingTimeMs = Date.now() - startTime;

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = JSON.parse(content.text) as {
        ideas: Array<{
          type: IdeaType;
          title: string;
          description: string;
          extractedText: string;
          priority: Priority;
          confidence: number;
          dueDate?: string;
          dueDateConfidence?: number;
        }>;
        sentiment: number;
        intentClassification: string;
        intentConfidence: number;
      };

      // Convert due dates to Date objects and filter by enabled types
      const ideas = parsed.ideas
        .filter((idea) => this.isIdeaTypeEnabled(idea.type))
        .filter((idea) => idea.confidence >= emailIngestionConfig.ideaExtraction.minConfidence)
        .map((idea) => ({
          ...idea,
          dueDate: idea.dueDate ? new Date(idea.dueDate) : undefined,
        }));

      return {
        ideas,
        sentiment: parsed.sentiment,
        intentClassification: parsed.intentClassification,
        intentConfidence: parsed.intentConfidence,
        processingTimeMs,
        model: this.model,
      };
    } catch (error) {
      console.error('[EmailIdeaExtractor] Extraction failed:', error);

      return {
        ideas: [],
        sentiment: 0,
        intentClassification: 'error',
        intentConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        model: this.model,
      };
    }
  }

  /**
   * Extract ideas from multiple emails (batch)
   */
  async extractFromBatch(
    emails: EmailContent[]
  ): Promise<Map<number, ExtractionResult>> {
    const results = new Map<number, ExtractionResult>();

    // Process in parallel with concurrency limit
    const concurrency = emailIngestionConfig.batch.maxConcurrentBatches;
    const chunks = this.chunkArray(emails, concurrency);

    let index = 0;
    for (const chunk of chunks) {
      const promises = chunk.map(async (email, i) => {
        const result = await this.extractIdeas(email);
        results.set(index + i, result);
      });

      await Promise.all(promises);
      index += chunk.length;

      // Rate limiting between batches
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(emailIngestionConfig.batch.delayBetweenBatchesMs);
      }
    }

    return results;
  }

  /**
   * Build the extraction prompt
   */
  private buildExtractionPrompt(email: EmailContent): string {
    const direction = email.isIncoming ? 'RECEIVED' : 'SENT';
    const dateStr = email.date.toISOString();

    return `Analyze this email and extract actionable insights:

--- EMAIL METADATA ---
Direction: ${direction}
From: ${email.fromName} <${email.fromEmail}>
Date: ${dateStr}
Subject: ${email.subject}

--- EMAIL BODY ---
${email.bodyText.substring(0, 4000)}

--- END EMAIL ---

Extract all relevant insights as JSON:
{
  "ideas": [
    {
      "type": "action_item|meeting_request|deadline|follow_up|opportunity|concern|feedback|question|decision_needed|general_insight",
      "title": "Brief actionable title",
      "description": "Short explanation",
      "extractedText": "Exact text from email",
      "priority": "low|medium|high|urgent",
      "confidence": 0.0-1.0,
      "dueDate": "ISO date string or null",
      "dueDateConfidence": 0.0-1.0
    }
  ],
  "sentiment": -1.0 to 1.0,
  "intentClassification": "primary intent",
  "intentConfidence": 0.0-1.0
}`;
  }

  /**
   * Check if an idea type is enabled in config
   */
  private isIdeaTypeEnabled(type: IdeaType): boolean {
    const config = emailIngestionConfig.ideaExtraction;

    switch (type) {
      case 'action_item':
        return config.extractActionItems;
      case 'meeting_request':
        return config.extractMeetingRequests;
      case 'deadline':
        return config.extractDeadlines;
      case 'follow_up':
        return config.extractFollowups;
      default:
        return true; // Other types always enabled
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let extractorInstance: EmailIdeaExtractor | null = null;

export function getEmailIdeaExtractor(): EmailIdeaExtractor {
  if (!extractorInstance) {
    extractorInstance = new EmailIdeaExtractor();
  }
  return extractorInstance;
}

export default EmailIdeaExtractor;
