/**
 * Pattern Learner Service
 *
 * Learns and stores automation patterns from user actions for reuse.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import {
  LearnedPattern,
  PatternStep,
  PatternCategory,
  PatternStatus,
  SelectorStrategy,
  BrowserActionLog,
  ActionType,
} from './browserTypes';
import { browserAutomationConfig } from '../../../config/browserAutomationBoost.config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface LearnFromActionsOptions {
  minActions?: number;
  maxActions?: number;
  domain?: string;
  category?: PatternCategory;
}

export interface PatternMatchResult {
  pattern: LearnedPattern;
  confidence: number;
  mappedVariables: Record<string, string>;
  suggestedSteps: PatternStep[];
}

export interface PatternFilters {
  category?: PatternCategory[];
  domain?: string;
  minConfidence?: number;
  status?: PatternStatus[];
}

class PatternLearnerService {
  private config = browserAutomationConfig.patternLearning;

  /**
   * Learn a pattern from recorded actions
   */
  async learnFromActions(
    workspaceId: string,
    sessionId: string,
    name: string,
    options: LearnFromActionsOptions = {}
  ): Promise<LearnedPattern> {
    const supabase = await getSupabaseServer();

    // Get recent actions from the session
    const { data: actions } = await supabase
      .from('browser_action_logs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('result', 'success')
      .order('performed_at', { ascending: true })
      .limit(options.maxActions || 50);

    if (!actions || actions.length < (options.minActions || 3)) {
      throw new Error(`Need at least ${options.minActions || 3} successful actions to learn a pattern`);
    }

    // Analyze actions and extract pattern
    const analyzedPattern = await this.analyzeActionsWithAI(actions);

    // Create pattern record
    const { data: pattern, error } = await supabase
      .from('browser_learned_patterns')
      .insert({
        workspace_id: workspaceId,
        name,
        category: options.category || analyzedPattern.category,
        description: analyzedPattern.description,
        domain: options.domain || this.extractDomain(actions),
        url_pattern: analyzedPattern.urlPattern,
        steps: analyzedPattern.steps,
        success_rate: 100, // Initial rate
        usage_count: 0,
        status: 'learning' as PatternStatus,
        confidence: analyzedPattern.confidence,
        variable_fields: analyzedPattern.variableFields,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapPatternFromDb(pattern);
  }

  /**
   * Find matching patterns for a given context
   */
  async findMatchingPatterns(
    workspaceId: string,
    url: string,
    intent?: string
  ): Promise<PatternMatchResult[]> {
    const supabase = await getSupabaseServer();
    const domain = this.extractDomainFromUrl(url);

    // Find patterns that might match
    let query = supabase
      .from('browser_learned_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'learning'])
      .gte('confidence', this.config.minConfidenceThreshold);

    if (domain) {
      query = query.or(`domain.eq.${domain},domain.is.null`);
    }

    const { data: patterns } = await query;

    if (!patterns || patterns.length === 0) {
      return [];
    }

    // Score patterns against current context
    const results: PatternMatchResult[] = [];

    for (const pattern of patterns) {
      const mapped = this.mapPatternFromDb(pattern);
      const confidence = this.calculateMatchConfidence(mapped, url, intent);

      if (confidence >= this.config.minConfidenceThreshold) {
        results.push({
          pattern: mapped,
          confidence,
          mappedVariables: this.mapVariables(mapped, url),
          suggestedSteps: mapped.steps,
        });
      }
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
  }

  /**
   * Get patterns for a workspace
   */
  async getPatterns(
    workspaceId: string,
    filters: PatternFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ patterns: LearnedPattern[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('browser_learned_patterns')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (filters.category?.length) {
      query = query.in('category', filters.category);
    }

    if (filters.domain) {
      query = query.eq('domain', filters.domain);
    }

    if (filters.minConfidence) {
      query = query.gte('confidence', filters.minConfidence);
    }

    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }

    const offset = (page - 1) * limit;
    query = query
      .order('usage_count', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      patterns: (data || []).map(this.mapPatternFromDb),
      total: count || 0,
    };
  }

  /**
   * Update pattern after successful use
   */
  async recordPatternUse(
    patternId: string,
    success: boolean,
    actualSteps?: PatternStep[]
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get current pattern
    const { data: pattern } = await supabase
      .from('browser_learned_patterns')
      .select('usage_count, success_rate, steps, confidence')
      .eq('id', patternId)
      .single();

    if (!pattern) {
      return;
    }

    const newUsageCount = pattern.usage_count + 1;
    const newSuccessRate = (
      (pattern.success_rate * pattern.usage_count + (success ? 100 : 0)) /
      newUsageCount
    );

    const updates: Record<string, unknown> = {
      usage_count: newUsageCount,
      success_rate: newSuccessRate,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update confidence based on success rate
    if (newUsageCount >= this.config.minUsesForConfidenceUpdate) {
      updates.confidence = Math.min(1, newSuccessRate / 100);
    }

    // Promote from learning to active if criteria met
    if (
      pattern.confidence >= this.config.promotionThreshold &&
      newUsageCount >= 5 &&
      newSuccessRate >= 80
    ) {
      updates.status = 'active' as PatternStatus;
    }

    // Deprecate if success rate drops
    if (newUsageCount >= 10 && newSuccessRate < 50) {
      updates.status = 'deprecated' as PatternStatus;
    }

    // If actual steps provided and successful, potentially refine pattern
    if (success && actualSteps && this.shouldRefinePattern(pattern.steps, actualSteps)) {
      updates.steps = this.refineSteps(pattern.steps as PatternStep[], actualSteps);
    }

    await supabase
      .from('browser_learned_patterns')
      .update(updates)
      .eq('id', patternId);
  }

  /**
   * Update pattern manually
   */
  async updatePattern(
    patternId: string,
    updates: Partial<{
      name: string;
      description: string;
      category: PatternCategory;
      status: PatternStatus;
      steps: PatternStep[];
      variableFields: string[];
    }>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.steps) dbUpdates.steps = updates.steps;
    if (updates.variableFields) dbUpdates.variable_fields = updates.variableFields;

    const { error } = await supabase
      .from('browser_learned_patterns')
      .update(dbUpdates)
      .eq('id', patternId);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete a pattern
   */
  async deletePattern(patternId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('browser_learned_patterns')
      .delete()
      .eq('id', patternId);

    if (error) {
      throw error;
    }
  }

  /**
   * Suggest pattern category based on actions
   */
  async suggestCategory(actions: BrowserActionLog[]): Promise<PatternCategory> {
    // Simple heuristics for category detection
    const actionTypes = actions.map((a) => a.action);

    if (actionTypes.some((a) => a === 'type') && actionTypes.includes('click')) {
      // Check for login-like patterns
      const targets = actions.map((a) => (a.target || '').toLowerCase());
      if (
        targets.some((t) =>
          t.includes('password') || t.includes('email') || t.includes('username') || t.includes('login')
        )
      ) {
        return 'login';
      }

      // Check for form fill
      if (actionTypes.filter((a) => a === 'type').length >= 2) {
        return 'form_fill';
      }
    }

    if (actionTypes.includes('scroll') && actionTypes.filter((a) => a === 'click').length >= 3) {
      return 'pagination';
    }

    if (actionTypes.some((a) => a === 'type') && actionTypes.includes('navigate')) {
      return 'search';
    }

    return 'custom';
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(workspaceId: string): Promise<{
    total: number;
    byCategory: Record<PatternCategory, number>;
    byStatus: Record<PatternStatus, number>;
    avgSuccessRate: number;
    totalUses: number;
    topPatterns: Array<{ name: string; usageCount: number; successRate: number }>;
  }> {
    const supabase = await getSupabaseServer();

    const { data: patterns } = await supabase
      .from('browser_learned_patterns')
      .select('category, status, success_rate, usage_count, name')
      .eq('workspace_id', workspaceId);

    if (!patterns || patterns.length === 0) {
      return {
        total: 0,
        byCategory: {} as Record<PatternCategory, number>,
        byStatus: {} as Record<PatternStatus, number>,
        avgSuccessRate: 0,
        totalUses: 0,
        topPatterns: [],
      };
    }

    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalSuccessRate = 0;
    let totalUses = 0;

    for (const p of patterns) {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      totalSuccessRate += p.success_rate;
      totalUses += p.usage_count;
    }

    // Get top patterns by usage
    const topPatterns = [...patterns]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        usageCount: p.usage_count,
        successRate: p.success_rate,
      }));

    return {
      total: patterns.length,
      byCategory: byCategory as Record<PatternCategory, number>,
      byStatus: byStatus as Record<PatternStatus, number>,
      avgSuccessRate: patterns.length > 0 ? totalSuccessRate / patterns.length : 0,
      totalUses,
      topPatterns,
    };
  }

  // Private helper methods

  private async analyzeActionsWithAI(
    actions: BrowserActionLog[]
  ): Promise<{
    category: PatternCategory;
    description: string;
    urlPattern: string;
    steps: PatternStep[];
    confidence: number;
    variableFields: string[];
  }> {
    const actionsDescription = actions
      .map(
        (a, i) =>
          `${i + 1}. ${a.action}${a.target ? ` on "${a.target}"` : ''}${a.value ? ` with value "${a.value}"` : ''}`
      )
      .join('\n');

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze these browser actions and extract a reusable pattern:

${actionsDescription}

Return JSON with:
- category: one of [login, form_fill, navigation, data_extraction, pagination, search, filter, export, upload, custom]
- description: brief description of what the pattern does
- urlPattern: regex pattern for matching URLs where this pattern applies
- steps: array of steps with {order, action, isVariable, variableName (if variable)}
- variableFields: array of field names that might change between uses
- confidence: 0.0-1.0 confidence this is a valid reusable pattern`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback to basic analysis
      return this.basicPatternAnalysis(actions);
    }
  }

  private basicPatternAnalysis(actions: BrowserActionLog[]): {
    category: PatternCategory;
    description: string;
    urlPattern: string;
    steps: PatternStep[];
    confidence: number;
    variableFields: string[];
  } {
    const steps: PatternStep[] = actions.map((a, i) => ({
      order: i + 1,
      action: a.action as ActionType,
      selectorStrategies: a.target
        ? [{ type: 'css' as const, value: a.target, confidence: 0.7 }]
        : [],
      valuePattern: a.value,
      isVariable: a.action === 'type',
      variableName: a.action === 'type' ? `input_${i}` : undefined,
    }));

    return {
      category: 'custom',
      description: `Recorded ${actions.length} browser actions`,
      urlPattern: '.*',
      steps,
      confidence: 0.6,
      variableFields: steps.filter((s) => s.isVariable).map((s) => s.variableName!),
    };
  }

  private extractDomain(actions: BrowserActionLog[]): string | undefined {
    // Extract domain from first navigate action or session target
    const navigateAction = actions.find((a) => a.action === 'navigate');
    if (navigateAction?.metadata?.url) {
      return this.extractDomainFromUrl(navigateAction.metadata.url as string);
    }
    return undefined;
  }

  private extractDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private calculateMatchConfidence(
    pattern: LearnedPattern,
    url: string,
    intent?: string
  ): number {
    let confidence = pattern.confidence;

    // URL pattern match
    if (pattern.urlPattern) {
      try {
        const regex = new RegExp(pattern.urlPattern);
        if (!regex.test(url)) {
          confidence *= 0.5;
        }
      } catch {
        // Invalid regex, ignore
      }
    }

    // Domain match
    if (pattern.domain) {
      const urlDomain = this.extractDomainFromUrl(url);
      if (urlDomain !== pattern.domain) {
        confidence *= 0.7;
      }
    }

    // Intent match (if provided)
    if (intent) {
      const intentLower = intent.toLowerCase();
      const categoryMatch =
        intentLower.includes(pattern.category) ||
        (pattern.description?.toLowerCase().includes(intentLower));
      if (categoryMatch) {
        confidence *= 1.2;
      }
    }

    return Math.min(1, confidence);
  }

  private mapVariables(
    pattern: LearnedPattern,
    url: string
  ): Record<string, string> {
    const variables: Record<string, string> = {};

    // Map URL-based variables
    try {
      const urlObj = new URL(url);
      variables['domain'] = urlObj.hostname;
      variables['path'] = urlObj.pathname;

      // Extract path segments as potential variables
      const segments = urlObj.pathname.split('/').filter(Boolean);
      segments.forEach((seg, i) => {
        variables[`path_${i}`] = seg;
      });
    } catch {
      // Invalid URL
    }

    return variables;
  }

  private shouldRefinePattern(
    currentSteps: PatternStep[],
    actualSteps: PatternStep[]
  ): boolean {
    // Refine if actual steps have better selectors
    return actualSteps.some(
      (step) =>
        step.selectorStrategies.length > 0 &&
        step.selectorStrategies[0].confidence > 0.8
    );
  }

  private refineSteps(
    currentSteps: PatternStep[],
    actualSteps: PatternStep[]
  ): PatternStep[] {
    return currentSteps.map((step, i) => {
      if (actualSteps[i] && actualSteps[i].selectorStrategies.length > 0) {
        // Merge selector strategies, keeping higher confidence ones
        const mergedStrategies = [
          ...step.selectorStrategies,
          ...actualSteps[i].selectorStrategies,
        ]
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);

        return {
          ...step,
          selectorStrategies: mergedStrategies,
        };
      }
      return step;
    });
  }

  private mapPatternFromDb(data: Record<string, unknown>): LearnedPattern {
    return {
      id: data.id as string,
      workspaceId: data.workspace_id as string,
      name: data.name as string,
      category: data.category as PatternCategory,
      description: data.description as string | undefined,
      domain: data.domain as string | undefined,
      urlPattern: data.url_pattern as string | undefined,
      steps: data.steps as PatternStep[],
      successRate: data.success_rate as number,
      usageCount: data.usage_count as number,
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at as string) : undefined,
      status: data.status as PatternStatus,
      confidence: data.confidence as number,
      variableFields: data.variable_fields as string[] | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const patternLearnerService = new PatternLearnerService();
