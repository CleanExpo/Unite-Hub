/**
 * Reflector Agent - Australian Compliance Verification
 * Validates all generated content against AU regulatory requirements
 * Rules: GST, Fair Work, ACL, Location accuracy, Australian English
 */

import { BaseAgent, AgentTask } from './base-agent';
import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const AU_COMPLIANCE_SYSTEM_PROMPT = `You are a compliance verification agent for Australian businesses.

CRITICAL REQUIREMENTS:

1. **GST Compliance (AU Tax)**
   - All prices MUST include GST unless explicitly marked "ex GST"
   - GST is 10% in Australia
   - Correct format: "$99 inc GST" or "$90 + GST ($99 total)"
   - NEVER show US-style sales tax
   - Examples:
     ✅ "$495/month inc GST"
     ✅ "$450 + GST ($495 total)"
     ❌ "$450/month" (missing GST disclosure)
     ❌ "$450 + tax" (wrong terminology)

2. **Fair Work Australia (Labor Law)**
   - Service delivery times must account for AU working hours (9am-5pm AEST/AEDT)
   - No claims about "24/7" unless genuinely staffed
   - Employee references must comply with Fair Work Act 2009
   - Public holiday surcharges must be disclosed

3. **Australian Consumer Law (ACL)**
   - No misleading or deceptive claims
   - Refund policy must mention ACL consumer guarantees
   - "Money-back guarantee" must specify conditions
   - Contact details must include AU phone/address
   - Consumer guarantees cannot be excluded

4. **Location Accuracy**
   - Suburb names must match Australia Post database
   - State abbreviations: NSW, VIC, QLD, SA, WA, TAS, NT, ACT (uppercase)
   - Phone format: (02) 1234 5678 or 0412 345 678 (AU formats only)
   - Addresses must follow AU format (street, suburb, state, postcode)

5. **Language/Spelling**
   - Australian English only (colour not color, centre not center, aluminium not aluminum)
   - Avoid Americanisms (elevator → lift, apartment → flat, gas → petrol)
   - Local terminology preferred

Return JSON format:
{
  "compliant": boolean,
  "violations": [
    {
      "type": "GST" | "FairWork" | "ACL" | "Location" | "Language",
      "severity": "high" | "medium" | "low",
      "issue": "Detailed description of the violation",
      "fix": "Corrected version",
      "regulation_reference": "Relevant Australian law/regulation",
      "line_number": number (if applicable)
    }
  ],
  "fixedContent": "The corrected content with all violations fixed",
  "summary": "Brief summary of compliance status"
}`;

export interface ReflectorJob {
  contentType: 'landing_page' | 'email' | 'ad_copy' | 'proposal' | 'blog_post' | 'social_post';
  content: string;
  clientId: string;
  metadata?: {
    pricePoints?: number[];
    serviceHours?: string;
    location?: { suburb: string; state: string };
    claimsValidated?: boolean;
  };
}

export interface ComplianceViolation {
  type: 'GST' | 'FairWork' | 'ACL' | 'Location' | 'Language';
  severity: 'high' | 'medium' | 'low';
  issue: string;
  fix: string;
  regulation_reference: string;
  line_number?: number;
}

export interface ReflectorResult {
  compliant: boolean;
  violations: ComplianceViolation[];
  fixedContent: string;
  summary: string;
  autoFixed: boolean;
  requiresManualReview: boolean;
  costUsd: number;
}

export class ReflectorAgent extends BaseAgent {
  private readonly anthropic: Anthropic;

  constructor() {
    super({
      name: 'Reflector Agent',
      queueName: 'authority-reflector',
      concurrency: 5, // Can process 5 compliance checks in parallel
      prefetchCount: 5,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY required');
    }

    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Process Reflector task - verify AU compliance
   */
  protected async processTask(task: AgentTask): Promise<ReflectorResult> {
    const payload = task.payload as ReflectorJob;

    console.log(`[Reflector] Checking ${payload.contentType} compliance for client ${payload.clientId}`);

    try {
      const result = await callAnthropicWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000,
          system: [{ type: 'text', text: AU_COMPLIANCE_SYSTEM_PROMPT }],
          messages: [{
            role: 'user',
            content: `Verify Australian regulatory compliance for this ${payload.contentType}:

Content:
${payload.content}

Metadata:
${JSON.stringify(payload.metadata, null, 2)}

Check all requirements: GST disclosure, Fair Work compliance, ACL adherence, location accuracy, Australian English.

Return JSON with violations and fixed content.`
          }]
        });
      });

      const responseText = result.content[0].type === 'text' ? result.content[0].text : '';

      // Parse JSON response
      let analysis: any = {};
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('[Reflector] Failed to parse response:', responseText);
        throw new Error('Invalid JSON response from Claude');
      }

      // Calculate cost
      const inputTokens = result.usage.input_tokens;
      const outputTokens = result.usage.output_tokens;

      // Sonnet 4.5 pricing: $3 per 1M input, $15 per 1M output
      const costUsd =
        (inputTokens / 1_000_000) * 3.0 +
        (outputTokens / 1_000_000) * 15.0;

      const complianceResult: ReflectorResult = {
        compliant: analysis.compliant || false,
        violations: analysis.violations || [],
        fixedContent: analysis.fixedContent || payload.content,
        summary: analysis.summary || 'No summary provided',
        autoFixed: analysis.compliant === false && analysis.fixedContent !== payload.content,
        requiresManualReview: analysis.violations?.some((v: any) => v.severity === 'high') || false,
        costUsd,
      };

      // Store violation record if not compliant
      if (!complianceResult.compliant) {
        await this.storeComplianceViolation({
          workspaceId: task.workspace_id,
          clientId: payload.clientId,
          contentType: payload.contentType,
          violations: complianceResult.violations,
          originalContent: payload.content,
          fixedContent: complianceResult.fixedContent,
          compliant: false,
          autoFixed: complianceResult.autoFixed,
          requiresManualReview: complianceResult.requiresManualReview,
        });

        console.log(`[Reflector] ${complianceResult.violations.length} violations found, stored for review`);
      } else {
        console.log(`[Reflector] Content is compliant ✅`);
      }

      return complianceResult;
    } catch (error: any) {
      console.error('[Reflector] Compliance check failed:', error.message);
      throw error;
    }
  }

  /**
   * Store compliance violation in database
   */
  private async storeComplianceViolation(data: {
    workspaceId: string;
    clientId: string;
    contentType: string;
    violations: ComplianceViolation[];
    originalContent: string;
    fixedContent: string;
    compliant: boolean;
    autoFixed: boolean;
    requiresManualReview: boolean;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('synthex_compliance_violations')
      .insert({
        workspace_id: data.workspaceId,
        client_id: data.clientId,
        content_type: data.contentType,
        violations: data.violations,
        original_content: data.originalContent,
        fixed_content: data.fixedContent,
        compliant: data.compliant,
        auto_fixed: data.autoFixed,
        requires_manual_review: data.requiresManualReview,
        checked_by: 'reflector_agent',
        model_used: 'claude-sonnet-4-5-20250929',
      });

    if (error) {
      throw new Error(`Failed to store compliance violation: ${error.message}`);
    }
  }
}

/**
 * Create and export singleton instance
 */
let reflectorAgentInstance: ReflectorAgent | null = null;

export function getReflectorAgent(): ReflectorAgent {
  if (!reflectorAgentInstance) {
    reflectorAgentInstance = new ReflectorAgent();
  }
  return reflectorAgentInstance;
}
