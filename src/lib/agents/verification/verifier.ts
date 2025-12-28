/**
 * Agent Output Verifier
 * Validates agent outputs before applying to prevent hallucinations and errors
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VerificationResult {
  passed: boolean;
  confidence: number; // 0-1
  errors: string[];
  warnings: string[];
  details?: Record<string, any>;
}

export class AgentVerifier {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for AgentVerifier');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Verify email intent extraction
   */
  verifyEmailIntent(intent: string, emailBody: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check intent is not empty
    if (!intent || intent.trim().length === 0) {
      errors.push('Intent is empty');
      return { passed: false, confidence: 0, errors, warnings };
    }

    // Check intent is reasonable length (not too short, not too long)
    if (intent.length < 5) {
      errors.push('Intent too short (< 5 chars)');
      confidence -= 0.3;
    }

    if (intent.length > 200) {
      warnings.push('Intent unusually long (> 200 chars)');
      confidence -= 0.1;
    }

    // Check intent contains words from email
    const emailWords = emailBody.toLowerCase().split(/\s+/);
    const intentWords = intent.toLowerCase().split(/\s+/);
    const overlap = intentWords.filter(word =>
      emailWords.some(ew => ew.includes(word) || word.includes(ew))
    );

    const overlapRatio = overlap.length / intentWords.length;
    if (overlapRatio < 0.2) {
      warnings.push('Low word overlap with email body');
      confidence -= 0.2;
    }

    const passed = errors.length === 0 && confidence >= 0.6;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings,
      details: { overlap_ratio: overlapRatio }
    };
  }

  /**
   * Verify sentiment analysis accuracy
   */
  verifySentimentAccuracy(sentiment: string, emailBody: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check sentiment is valid value
    const validSentiments = ['positive', 'negative', 'neutral', 'mixed'];
    if (!validSentiments.includes(sentiment.toLowerCase())) {
      errors.push(`Invalid sentiment: ${sentiment}`);
      return { passed: false, confidence: 0, errors, warnings };
    }

    // Basic keyword matching for confidence
    const positiveWords = ['great', 'excellent', 'love', 'thanks', 'appreciate', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'hate', 'disappointed', 'awful', 'unacceptable', 'worst'];

    const lowerBody = emailBody.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerBody.includes(word));
    const hasNegative = negativeWords.some(word => lowerBody.includes(word));

    // Check for contradictions
    if (sentiment === 'positive' && hasNegative && !hasPositive) {
      warnings.push('Sentiment marked positive but contains negative words');
      confidence -= 0.3;
    }

    if (sentiment === 'negative' && hasPositive && !hasNegative) {
      warnings.push('Sentiment marked negative but contains positive words');
      confidence -= 0.3;
    }

    const passed = errors.length === 0 && confidence >= 0.6;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings
    };
  }

  /**
   * Verify contact data quality
   */
  verifyContactData(contact: Record<string, any>): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check email format
    if (contact.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        errors.push('Invalid email format');
        confidence = 0;
      }
    } else {
      errors.push('Missing email');
      confidence = 0;
    }

    // Check name exists
    if (!contact.name && !contact.first_name && !contact.last_name) {
      warnings.push('Missing name fields');
      confidence -= 0.1;
    }

    // Check for placeholder values
    const placeholderPatterns = ['test', 'example', 'foo', 'bar', 'placeholder', 'TBD', 'TODO'];
    const placeholderFields = Object.entries(contact).filter(([key, value]) =>
      typeof value === 'string' &&
      placeholderPatterns.some(p => value.toLowerCase().includes(p.toLowerCase()))
    );

    if (placeholderFields.length > 0) {
      warnings.push(`Placeholder values detected: ${placeholderFields.map(([k]) => k).join(', ')}`);
      confidence -= 0.2;
    }

    const passed = errors.length === 0 && confidence >= 0.7;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings
    };
  }

  /**
   * Verify content quality (for ContentGenerator)
   */
  verifyContentQuality(content: string, _template?: Record<string, any>): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check content not empty
    if (!content || content.trim().length === 0) {
      errors.push('Content is empty');
      return { passed: false, confidence: 0, errors, warnings };
    }

    // Check minimum length
    if (content.length < 20) {
      errors.push('Content too short (< 20 chars)');
      confidence -= 0.3;
    }

    // Check for personalization tokens
    const hasTokens = /\{[a-zA-Z_]+\}/.test(content);
    if (!hasTokens) {
      warnings.push('No personalization tokens found');
      confidence -= 0.2;
    }

    // Check for CTA
    const hasCTA = /<button|<a |href=|Click here|Learn more|Get started|Sign up/i.test(content);
    if (!hasCTA) {
      warnings.push('No clear call-to-action found');
      confidence -= 0.1;
    }

    // Check for excessive caps
    const capsWords = content.split(/\s+/).filter(word =>
      word.length > 2 && word === word.toUpperCase() && /[A-Z]/.test(word)
    );
    if (capsWords.length > 3) {
      warnings.push(`Excessive all-caps words (${capsWords.length})`);
      confidence -= 0.1;
    }

    // Check readability (basic - word count)
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 10) {
      warnings.push('Very short content (< 10 words)');
      confidence -= 0.1;
    }

    const passed = errors.length === 0 && confidence >= 0.7;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings,
      details: { word_count: wordCount, has_tokens: hasTokens, has_cta: hasCTA }
    };
  }

  /**
   * Verify personalization tokens are replaced
   */
  verifyPersonalization(content: string, contactData: Record<string, any>): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Find all tokens in content
    const tokenRegex = /\{([a-zA-Z_]+)\}/g;
    const tokens = [...content.matchAll(tokenRegex)].map(m => m[1]);

    if (tokens.length === 0) {
      warnings.push('No personalization tokens found');
      confidence -= 0.3;
    }

    // Check if tokens match contact data fields
    const missingTokens = tokens.filter(token => {
      const value = contactData[token] || contactData[token.toLowerCase()];
      return !value || value === '';
    });

    if (missingTokens.length > 0) {
      errors.push(`Missing contact data for tokens: ${missingTokens.join(', ')}`);
      confidence -= 0.4;
    }

    const passed = errors.length === 0 && confidence >= 0.7;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings,
      details: { tokens_found: tokens.length, missing_tokens: missingTokens }
    };
  }

  /**
   * Verify score change is reasonable
   */
  verifyScoreChangeReasonable(
    scoreChange: number,
    contactHistory?: Record<string, any>
  ): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check magnitude
    if (Math.abs(scoreChange) > 30) {
      errors.push(`Extreme score change: ${scoreChange}`);
      confidence = 0;
    } else if (Math.abs(scoreChange) > 20) {
      warnings.push(`Large score change: ${scoreChange}`);
      confidence -= 0.2;
    }

    // Check if change aligns with history pattern
    if (contactHistory?.recent_changes) {
      const avg = contactHistory.recent_changes.reduce((sum: number, c: number) => sum + Math.abs(c), 0) / contactHistory.recent_changes.length;
      if (Math.abs(scoreChange) > avg * 3) {
        warnings.push('Score change significantly larger than historical average');
        confidence -= 0.1;
      }
    }

    const passed = errors.length === 0 && confidence >= 0.7;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings
    };
  }

  /**
   * Verify campaign conditions logic
   */
  verifyCampaignConditions(conditions: Record<string, any>): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check condition depth (prevent infinite loops)
    const depth = this.calculateConditionDepth(conditions);
    if (depth > 10) {
      errors.push(`Condition depth too deep: ${depth}`);
      confidence = 0;
    } else if (depth > 5) {
      warnings.push(`Condition depth high: ${depth}`);
      confidence -= 0.2;
    }

    // Check for circular references (basic)
    if (this.hasCircularReference(conditions)) {
      errors.push('Circular reference detected in conditions');
      confidence = 0;
    }

    const passed = errors.length === 0 && confidence >= 0.8;

    return {
      passed,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings,
      details: { depth }
    };
  }

  /**
   * Calculate condition depth recursively
   */
  private calculateConditionDepth(obj: any, currentDepth: number = 0): number {
    if (currentDepth > 20) {
return currentDepth;
} // Prevent infinite recursion

    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    for (const _key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, _key)) {
        const childDepth = this.calculateConditionDepth(obj[_key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }

    return maxDepth;
  }

  /**
   * Check for circular references (basic detection)
   */
  private hasCircularReference(obj: any, seen: Set<any> = new Set()): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    if (seen.has(obj)) {
      return true;
    }

    seen.add(obj);

    for (const _key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, _key)) {
        if (this.hasCircularReference(obj[_key], seen)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Log verification result to database
   */
  async logVerification(
    workspaceId: string,
    agentName: string,
    executionId: string | undefined,
    verificationType: string,
    result: VerificationResult,
    inputData: any,
    expectedOutput?: any,
    actualOutput?: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('agent_verification_logs')
        .insert({
          workspace_id: workspaceId,
          execution_id: executionId,
          agent_name: agentName,
          verification_type: verificationType,
          input_data: inputData,
          expected_output: expectedOutput,
          actual_output: actualOutput,
          passed: result.passed,
          confidence: result.confidence,
          errors: result.errors,
          warnings: result.warnings,
          verified_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log verification:', error);
      }
    } catch (err) {
      console.error('Error logging verification:', err);
    }
  }

  /**
   * Get verification statistics for an agent
   */
  async getVerificationStats(
    agentName: string,
    workspaceId: string,
    hoursAgo: number = 24
  ): Promise<{
    total_verifications: number;
    pass_rate: number;
    avg_confidence: number;
    failed_count: number;
    by_type: Record<string, { total: number; passed: number; failed: number }>;
  }> {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('agent_verification_logs')
        .select('*')
        .eq('agent_name', agentName)
        .eq('workspace_id', workspaceId)
        .gte('verified_at', since);

      if (error) {
throw error;
}

      if (!data || data.length === 0) {
        return {
          total_verifications: 0,
          pass_rate: 0,
          avg_confidence: 0,
          failed_count: 0,
          by_type: {}
        };
      }

      const passedCount = data.filter(v => v.passed).length;
      const avgConfidence = data.reduce((sum, v) => sum + (Number(v.confidence) || 0), 0) / data.length;

      // Aggregate by type
      const byType: Record<string, { total: number; passed: number; failed: number }> = {};
      data.forEach(v => {
        if (!byType[v.verification_type]) {
          byType[v.verification_type] = { total: 0, passed: 0, failed: 0 };
        }
        byType[v.verification_type].total++;
        if (v.passed) {
          byType[v.verification_type].passed++;
        } else {
          byType[v.verification_type].failed++;
        }
      });

      return {
        total_verifications: data.length,
        pass_rate: (passedCount / data.length) * 100,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
        failed_count: data.length - passedCount,
        by_type: byType
      };
    } catch (err) {
      console.error('Failed to get verification stats:', err);
      throw err;
    }
  }
}

// Singleton instance
let instance: AgentVerifier | null = null;

export function getAgentVerifier(): AgentVerifier {
  if (!instance) {
    instance = new AgentVerifier();
  }
  return instance;
}

/**
 * Agent SDK Hook: Verify output after tool use
 * Usage in Agent SDK options:
 *
 * hooks: {
 *   PostToolUse: [createVerificationHook(workspaceId, agentName)]
 * }
 */
export function createVerificationHook(workspaceId: string, agentName: string) {
  const verifier = getAgentVerifier();

  return async (input: any, toolUseId: string, context: any) => {
    try {
      // Determine verification type based on context
      const verificationType = context?.verification_type || 'output_quality';
      const output = context?.output || input;

      // Perform appropriate verification
      let result: VerificationResult;

      if (verificationType === 'email_intent' && context?.email_body) {
        result = verifier.verifyEmailIntent(output, context.email_body);
      } else if (verificationType === 'sentiment' && context?.email_body) {
        result = verifier.verifySentimentAccuracy(output, context.email_body);
      } else if (verificationType === 'contact_data') {
        result = verifier.verifyContactData(output);
      } else if (verificationType === 'content_quality') {
        result = verifier.verifyContentQuality(output, context?.template);
      } else {
        // Default: minimal verification
        result = {
          passed: true,
          confidence: 0.9,
          errors: [],
          warnings: []
        };
      }

      // Log verification
      await verifier.logVerification(
        workspaceId,
        agentName,
        context?.execution_id,
        verificationType,
        result,
        input,
        context?.expected_output,
        output
      );

      // Return result for agent to use
      return {
        verification: result,
        should_escalate: !result.passed || result.confidence < 0.7
      };
    } catch (err) {
      console.error('VerificationHook error:', err);
      return {};
    }
  };
}
