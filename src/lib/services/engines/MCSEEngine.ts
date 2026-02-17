// MCSE - MAOS Cognitive Supervisor Engine (Phase 84)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface CognitiveValidation {
  valid: boolean;
  logic_score: number;
  hallucination_score: number;
  issues: string[];
}

export class MCSEEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }

  async validateReasoning(
    tenantId: string,
    agentId: string,
    reasoning: string,
    output: string
  ): Promise<CognitiveValidation> {
    const issues: string[] = [];

    // Calculate logic score
    const logic_score = this.assessLogicCoherence(reasoning);

    // Calculate hallucination score
    const hallucination_score = this.detectHallucinations(reasoning, output);

    // Get policy rules
    const { data: rules } = await this.supabase
      .from('mcse_policy_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    // Check against rules
    for (const rule of rules || []) {
      if (logic_score < (rule.min_logic_score || 70)) {
        issues.push(`Logic score ${logic_score} below threshold ${rule.min_logic_score}`);
      }
      if (hallucination_score > (rule.max_hallucination_score || 30)) {
        issues.push(`Hallucination score ${hallucination_score} above threshold ${rule.max_hallucination_score}`);
      }
    }

    // Log cognitive event
    await this.supabase.from('mcse_cognitive_events').insert({
      tenant_id: tenantId,
      agent_id: agentId,
      logic_score,
      hallucination_score,
      reasoning_snippet: reasoning.substring(0, 500),
      validation_result: issues.length === 0 ? 'passed' : 'failed'
    });

    return {
      valid: issues.length === 0,
      logic_score,
      hallucination_score,
      issues
    };
  }

  private assessLogicCoherence(reasoning: string): number {
    let score = 70;

    // Check for logical connectors
    const connectors = ['because', 'therefore', 'thus', 'since', 'given that'];
    const hasConnectors = connectors.some(c => reasoning.toLowerCase().includes(c));
    if (hasConnectors) score += 10;

    // Check for structured reasoning
    if (reasoning.includes('1.') || reasoning.includes('Step')) score += 10;

    // Penalize contradictions
    if (reasoning.includes('but also') && reasoning.includes('however')) score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  private detectHallucinations(reasoning: string, output: string): number {
    let score = 20;

    // Check for unsubstantiated claims
    const certaintyWords = ['definitely', 'certainly', 'always', 'never', 'absolutely'];
    const hasCertainty = certaintyWords.some(w => reasoning.toLowerCase().includes(w));
    if (hasCertainty) score += 15;

    // Check for fabricated details
    const fabricationPatterns = [/\d{3}-\d{3}-\d{4}/, /\$\d+,\d{3}/];
    for (const pattern of fabricationPatterns) {
      if (pattern.test(output)) score += 10;
    }

    return Math.min(100, score);
  }
}

export const mcseEngine = new MCSEEngine();
