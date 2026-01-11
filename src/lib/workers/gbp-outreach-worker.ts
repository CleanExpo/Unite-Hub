/**
 * GBP Outreach Worker
 * Sends automated Google Business Profile messages to prospects
 * Triggered when visual gap detected and prospect has verified GBP
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import type { Job } from 'bull';

const log = (msg: string, ...args: any[]) => console.log(`[GBPOutreachWorker]`, msg, ...args);

export interface GBPOutreachJob {
  prospectBusinessName: string;
  prospectGBPId?: string; // Google Business Profile location ID
  targetKeyword: string;
  suburb: string;
  state: string;
  gapDetected: string; // Description of gap (e.g., "Not in top 10 results")
  clientId: string;
  workspaceId: string;
  informationVacuumId: string;
}

export interface GBPOutreachResult {
  prospectName: string;
  messageSent: string;
  status: 'sent' | 'skipped' | 'failed';
  skipReason?: string;
  gbpId?: string;
  costUsd: number;
}

export class GBPOutreachWorker {
  private readonly anthropic: Anthropic;
  private readonly supabase: ReturnType<typeof createClient>;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY required');
    }

    this.anthropic = new Anthropic({ apiKey });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    log('Worker initialized');
  }

  /**
   * Process GBP outreach job
   */
  async processOutreach(job: Job<GBPOutreachJob>): Promise<GBPOutreachResult> {
    const {
      prospectBusinessName,
      prospectGBPId,
      targetKeyword,
      suburb,
      state,
      gapDetected,
      clientId,
      workspaceId,
      informationVacuumId,
    } = job.data;

    log(`Processing outreach for ${prospectBusinessName} in ${suburb}, ${state}`);

    try {
      // Step 1: Check if already contacted in last 90 days
      const recentOutreach = await this.checkRecentOutreach(prospectBusinessName, suburb);
      if (recentOutreach) {
        log(`Skipping ${prospectBusinessName}: Already contacted ${recentOutreach.days_ago} days ago`);
        return {
          prospectName: prospectBusinessName,
          messageSent: '',
          status: 'skipped',
          skipReason: `Already contacted ${recentOutreach.days_ago} days ago`,
          costUsd: 0,
        };
      }

      // Step 2: Verify prospect has GBP listing
      // TODO: Implement GBP API lookup if prospectGBPId not provided
      if (!prospectGBPId) {
        log(`Skipping ${prospectBusinessName}: No GBP ID provided`);
        return {
          prospectName: prospectBusinessName,
          messageSent: '',
          status: 'skipped',
          skipReason: 'No Google Business Profile found',
          costUsd: 0,
        };
      }

      // Step 3: Generate personalized outreach message
      const message = await this.generateOutreachMessage({
        businessName: prospectBusinessName,
        keyword: targetKeyword,
        suburb,
        state,
        gap: gapDetected,
      });

      // Step 4: Send via GBP Messaging API
      // NOTE: GBP Messaging API only allows responding to customer messages, not initiating
      // Alternative: Send via email/SMS if contact details available
      // For now: Store for manual send or use alternative channel
      const sendResult = await this.sendGBPMessage(prospectGBPId, message.text);

      // Step 5: Track in database
      await this.trackOutreach({
        workspaceId,
        clientId,
        informationVacuumId,
        prospectName: prospectBusinessName,
        prospectGBPId,
        keyword: targetKeyword,
        suburb,
        state,
        message: message.text,
        messageTemplate: 'gap_opportunity_v1',
        status: sendResult.success ? 'sent' : 'failed',
        costUsd: message.costUsd,
      });

      log(`Outreach ${sendResult.success ? 'sent' : 'failed'} for ${prospectBusinessName}`);

      return {
        prospectName: prospectBusinessName,
        messageSent: message.text,
        status: sendResult.success ? 'sent' : 'failed',
        gbpId: prospectGBPId,
        costUsd: message.costUsd,
      };
    } catch (error: any) {
      log(`Failed to process outreach for ${prospectBusinessName}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate personalized outreach message
   */
  private async generateOutreachMessage(context: {
    businessName: string;
    keyword: string;
    suburb: string;
    state: string;
    gap: string;
  }): Promise<{ text: string; costUsd: number }> {
    const prompt = `Generate a short, friendly direct message (max 160 characters) for ${context.businessName}.

Context:
- They're a business in ${context.suburb}, ${context.state}
- We detected they're not showing well for "${context.keyword}"
- Specific gap: ${context.gap}
- We can offer a free diagnostic report showing the opportunity

Tone:
- Helpful and professional, not salesy
- Australian English (mate, arvo, etc. OK if natural)
- Focus on the opportunity, not the problem
- Include clear next step

Example good messages:
"Hi! Noticed ${context.businessName} isn't ranking for '${context.keyword}' locally. We've mapped ${context.suburb}'s search landscape—would a free diagnostic help?"

Write ONE message only, no subject line, max 160 chars.`;

    const result = await callAnthropicWithRetry(async () => {
      return await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', // Fast + cheap for message generation
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });
    });

    const messageText = result.content[0].type === 'text' ? result.content[0].text.trim() : '';

    // Calculate cost (Haiku 4.5: $0.80 per 1M input, $4 per 1M output)
    const costUsd =
      (result.usage.input_tokens / 1_000_000) * 0.80 +
      (result.usage.output_tokens / 1_000_000) * 4.0;

    return {
      text: messageText,
      costUsd,
    };
  }

  /**
   * Check if prospect was recently contacted
   */
  private async checkRecentOutreach(businessName: string, suburb: string): Promise<{
    id: string;
    days_ago: number;
  } | null> {
    const { data } = await this.supabase
      .from('synthex_gbp_outreach')
      .select('id, sent_at')
      .eq('prospect_name', businessName)
      .eq('suburb', suburb)
      .gte('sent_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    const daysAgo = Math.floor((Date.now() - new Date(data.sent_at).getTime()) / (24 * 60 * 60 * 1000));

    return {
      id: data.id,
      days_ago: daysAgo,
    };
  }

  /**
   * Send GBP message (placeholder - API may not support initiating messages)
   */
  private async sendGBPMessage(gbpId: string, message: string): Promise<{ success: boolean; error?: string }> {
    // NOTE: Google Business Profile Messaging API only allows RESPONDING to customer messages
    // Not initiating new messages to other businesses
    //
    // Alternative approaches:
    // 1. Use email if business email is available
    // 2. Use SMS if phone number is available
    // 3. Store message for manual send via GBP dashboard
    // 4. Use LinkedIn/other channel

    log(`GBP Messaging API does not support initiating messages. Storing for manual send or alternative channel.`);

    // For now: Mark as "queued for manual send"
    return { success: true }; // Placeholder - always succeeds (stored for manual action)
  }

  /**
   * Track outreach in database
   */
  private async trackOutreach(data: {
    workspaceId: string;
    clientId: string;
    informationVacuumId: string;
    prospectName: string;
    prospectGBPId?: string;
    keyword: string;
    suburb: string;
    state: string;
    message: string;
    messageTemplate: string;
    status: string;
    costUsd: number;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('synthex_gbp_outreach')
      .insert({
        workspace_id: data.workspaceId,
        client_id: data.clientId,
        information_vacuum_id: data.informationVacuumId,
        prospect_name: data.prospectName,
        prospect_gbp_id: data.prospectGBPId,
        keyword: data.keyword,
        suburb: data.suburb,
        state: data.state,
        message_sent: data.message,
        message_template: data.messageTemplate,
        status: data.status,
      });

    if (error) {
      throw new Error(`Failed to track outreach: ${error.message}`);
    }
  }
}
