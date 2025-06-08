import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';

interface Decision {
  id: string;
  context: DecisionContext;
  options: DecisionOption[];
  selectedOption: DecisionOption | null;
  reasoning: string;
  confidence: number;
  outcome?: DecisionOutcome;
  timestamp: Date;
}

interface DecisionContext {
  domain: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'minimal' | 'moderate' | 'significant' | 'major';
  constraints: Constraint[];
  objectives: Objective[];
  data: Record<string, unknown>;
}

interface DecisionOption {
  id: string;
  action: string;
  pros: string[];
  cons: string[];
  risks: Risk[];
  estimatedCost: number;
  estimatedDuration: number;
  successProbability: number;
  score: number;
}

interface Constraint {
  type: 'budget' | 'time' | 'resource' | 'policy' | 'technical';
  description: string;
  value: unknown;
  weight: number;
}

interface Objective {
  type: 'maximize' | 'minimize' | 'target';
  metric: string;
  target?: number;
  weight: number;
}

interface Risk {
  description: string;
  probability: number;
  impact: number;
  mitigation?: string;
}

interface DecisionOutcome {
  success: boolean;
  actualCost?: number;
  actualDuration?: number;
  metrics: Record<string, number>;
  feedback?: string;
  recordedAt: Date;
}

interface DecisionRule {
  id: string;
  domain: string;
  condition: string;
  priority: number;
  action: string;
  confidence: number;
}

export class DecisionEngine extends EventEmitter {
  private decisions: Map<string, Decision> = new Map();
  private rules: Map<string, DecisionRule> = new Map();
  private learningData: Map<string, DecisionOutcome[]> = new Map();
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    await this.loadRules();
    await this.loadHistoricalDecisions();
  }

  private async loadRules() {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ai_decision_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;

      if (data) {
        data.forEach(rule => {
          this.rules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('Failed to load decision rules:', error);
    }
  }

  private async loadHistoricalDecisions() {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ai_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (data) {
        data.forEach(decision => {
          const domain = decision.context.domain;
          if (!this.learningData.has(domain)) {
            this.learningData.set(domain, []);
          }
          if (decision.outcome) {
            this.learningData.get(domain)!.push(decision.outcome);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load historical decisions:', error);
    }
  }

  async makeDecision(context: DecisionContext): Promise<Decision> {
    const startTime = Date.now();
    
    // Generate decision ID
    const decision: Decision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      context,
      options: [],
      selectedOption: null,
      reasoning: '',
      confidence: 0,
      timestamp: new Date()
    };

    try {
      // Generate options
      const options = await this.generateOptions(context);
      decision.options = options;

      // Evaluate options
      const evaluatedOptions = await this.evaluateOptions(options, context);
      
      // Select best option
      const selectedOption = this.selectBestOption(evaluatedOptions, context);
      decision.selectedOption = selectedOption;
      
      // Generate reasoning
      decision.reasoning = this.generateReasoning(selectedOption, evaluatedOptions, context);
      decision.confidence = this.calculateConfidence(selectedOption, context);

      // Store decision
      await this.storeDecision(decision);
      
      // Emit decision event
      this.emit('decision:made', {
        decision,
        duration: Date.now() - startTime
      });

      return decision;
    } catch (error) {
      console.error('Decision making failed:', error);
      decision.reasoning = `Decision failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      decision.confidence = 0;
      
      this.emit('decision:failed', { decision, error });
      return decision;
    }
  }

  private async generateOptions(context: DecisionContext): Promise<DecisionOption[]> {
    const options: DecisionOption[] = [];

    // Rule-based options
    const ruleOptions = this.generateRuleBasedOptions(context);
    options.push(...ruleOptions);

    // Historical pattern-based options
    const historicalOptions = this.generateHistoricalOptions(context);
    options.push(...historicalOptions);

    // Creative options (AI-generated)
    const creativeOptions = this.generateCreativeOptions(context);
    options.push(...creativeOptions);

    // Always include a "do nothing" option
    options.push({
      id: 'do-nothing',
      action: 'Maintain current state',
      pros: ['No immediate cost', 'No risk of negative change'],
      cons: ['May miss opportunities', 'Problem might worsen'],
      risks: [{
        description: 'Situation deteriorates',
        probability: 0.3,
        impact: 0.5
      }],
      estimatedCost: 0,
      estimatedDuration: 0,
      successProbability: 0.5,
      score: 0
    });

    return options;
  }

  private generateRuleBasedOptions(context: DecisionContext): DecisionOption[] {
    const options: DecisionOption[] = [];
    const domainRules = Array.from(this.rules.values())
      .filter(rule => rule.domain === context.domain);

    for (const rule of domainRules) {
      if (this.evaluateCondition(rule.condition, context)) {
        options.push({
          id: `rule-${rule.id}`,
          action: rule.action,
          pros: ['Based on established rules', 'Proven approach'],
          cons: ['May not fit unique circumstances'],
          risks: [],
          estimatedCost: 100,
          estimatedDuration: 60,
          successProbability: rule.confidence,
          score: 0
        });
      }
    }

    return options;
  }

  private generateHistoricalOptions(context: DecisionContext): DecisionOption[] {
    const options: DecisionOption[] = [];
    const domainHistory = this.learningData.get(context.domain) || [];
    
    // Find successful patterns
    const successfulPatterns = domainHistory
      .filter(outcome => outcome.success)
      .slice(0, 3);

    successfulPatterns.forEach((pattern, index) => {
      options.push({
        id: `historical-${index}`,
        action: `Apply historical successful pattern ${index + 1}`,
        pros: ['Proven success', 'Known outcomes'],
        cons: ['May be outdated', 'Context might differ'],
        risks: [{
          description: 'Context mismatch',
          probability: 0.2,
          impact: 0.4
        }],
        estimatedCost: pattern.actualCost || 200,
        estimatedDuration: pattern.actualDuration || 120,
        successProbability: 0.7,
        score: 0
      });
    });

    return options;
  }

  private generateCreativeOptions(context: DecisionContext): DecisionOption[] {
    const options: DecisionOption[] = [];

    // Generate creative solutions based on context
    if (context.urgency === 'critical') {
      options.push({
        id: 'creative-rapid',
        action: 'Rapid intervention with parallel processing',
        pros: ['Fast response', 'Multiple approaches'],
        cons: ['Higher cost', 'Coordination complexity'],
        risks: [{
          description: 'Coordination failure',
          probability: 0.3,
          impact: 0.6
        }],
        estimatedCost: 500,
        estimatedDuration: 30,
        successProbability: 0.75,
        score: 0
      });
    }

    if (context.impact === 'major') {
      options.push({
        id: 'creative-comprehensive',
        action: 'Comprehensive solution with phased approach',
        pros: ['Thorough coverage', 'Risk mitigation'],
        cons: ['Longer timeline', 'Higher investment'],
        risks: [{
          description: 'Scope creep',
          probability: 0.4,
          impact: 0.5
        }],
        estimatedCost: 1000,
        estimatedDuration: 240,
        successProbability: 0.85,
        score: 0
      });
    }

    return options;
  }

  private evaluateCondition(condition: string, context: DecisionContext): boolean {
    // Simple condition evaluation - in production, use a safe evaluator
    try {
      // Check for simple conditions
      if (condition.includes('urgency')) {
        return condition.includes(context.urgency);
      }
      if (condition.includes('impact')) {
        return condition.includes(context.impact);
      }
      return false;
    } catch {
      return false;
    }
  }

  private async evaluateOptions(
    options: DecisionOption[],
    context: DecisionContext
  ): Promise<DecisionOption[]> {
    return options.map(option => {
      let score = 0;

      // Objective scoring
      context.objectives.forEach(objective => {
        switch (objective.type) {
          case 'minimize':
            if (objective.metric === 'cost') {
              score += (1 - option.estimatedCost / 1000) * objective.weight;
            } else if (objective.metric === 'duration') {
              score += (1 - option.estimatedDuration / 300) * objective.weight;
            }
            break;
          case 'maximize':
            if (objective.metric === 'success') {
              score += option.successProbability * objective.weight;
            }
            break;
        }
      });

      // Constraint penalties
      context.constraints.forEach(constraint => {
        if (constraint.type === 'budget' && option.estimatedCost > (constraint.value as number)) {
          score -= constraint.weight;
        }
        if (constraint.type === 'time' && option.estimatedDuration > (constraint.value as number)) {
          score -= constraint.weight;
        }
      });

      // Risk adjustment
      const totalRisk = option.risks.reduce((sum, risk) => 
        sum + (risk.probability * risk.impact), 0);
      score -= totalRisk * 0.5;

      // Urgency adjustment
      if (context.urgency === 'critical') {
        score += (1 - option.estimatedDuration / 300) * 0.3;
      }

      option.score = Math.max(0, Math.min(1, score));
      return option;
    });
  }

  private selectBestOption(
    options: DecisionOption[],
    context: DecisionContext
  ): DecisionOption {
    // Sort by score
    const sortedOptions = options.sort((a, b) => b.score - a.score);
    
    // Apply decision threshold based on impact
    const threshold = context.impact === 'major' ? 0.7 : 
                     context.impact === 'significant' ? 0.6 : 
                     context.impact === 'moderate' ? 0.5 : 0.4;

    // Select best option above threshold, or top option
    return sortedOptions.find(opt => opt.score >= threshold) || sortedOptions[0];
  }

  private generateReasoning(
    selectedOption: DecisionOption,
    allOptions: DecisionOption[],
    context: DecisionContext
  ): string {
    const reasoning: string[] = [];

    reasoning.push(`Decision context: ${context.domain} with ${context.urgency} urgency and ${context.impact} impact.`);
    
    reasoning.push(`\nEvaluated ${allOptions.length} options:`);
    allOptions.forEach(opt => {
      reasoning.push(`- ${opt.action} (score: ${opt.score.toFixed(2)})`);
    });

    reasoning.push(`\nSelected: ${selectedOption.action}`);
    reasoning.push(`Score: ${selectedOption.score.toFixed(2)}`);
    reasoning.push(`Success probability: ${(selectedOption.successProbability * 100).toFixed(0)}%`);

    if (selectedOption.pros.length > 0) {
      reasoning.push(`\nPros: ${selectedOption.pros.join(', ')}`);
    }
    if (selectedOption.cons.length > 0) {
      reasoning.push(`Cons: ${selectedOption.cons.join(', ')}`);
    }

    if (selectedOption.risks.length > 0) {
      reasoning.push(`\nRisks identified:`);
      selectedOption.risks.forEach(risk => {
        reasoning.push(`- ${risk.description} (P: ${(risk.probability * 100).toFixed(0)}%, I: ${(risk.impact * 100).toFixed(0)}%)`);
      });
    }

    return reasoning.join('\n');
  }

  private calculateConfidence(option: DecisionOption, context: DecisionContext): number {
    let confidence = option.successProbability;

    // Adjust based on data availability
    const historicalData = this.learningData.get(context.domain) || [];
    if (historicalData.length > 100) {
      confidence += 0.1;
    } else if (historicalData.length < 10) {
      confidence -= 0.2;
    }

    // Adjust based on option score
    confidence = confidence * 0.7 + option.score * 0.3;

    // Adjust based on risk
    const totalRisk = option.risks.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact), 0);
    confidence -= totalRisk * 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  private async storeDecision(decision: Decision) {
    try {
      const supabase = await createClient();
      await supabase
        .from('ai_decisions')
        .insert({
          id: decision.id,
          context: decision.context,
          options: decision.options,
          selected_option: decision.selectedOption,
          reasoning: decision.reasoning,
          confidence: decision.confidence,
          created_at: decision.timestamp
        });

      this.decisions.set(decision.id, decision);
    } catch (error) {
      console.error('Failed to store decision:', error);
    }
  }

  async recordOutcome(decisionId: string, outcome: DecisionOutcome): Promise<void> {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    decision.outcome = outcome;
    
    // Update learning data
    const domain = decision.context.domain;
    if (!this.learningData.has(domain)) {
      this.learningData.set(domain, []);
    }
    this.learningData.get(domain)!.push(outcome);

    // Store outcome
    try {
      const supabase = await createClient();
      await supabase
        .from('ai_decisions')
        .update({ outcome })
        .eq('id', decisionId);

      this.emit('outcome:recorded', { decision, outcome });
    } catch (error) {
      console.error('Failed to record outcome:', error);
    }

    // Learn from outcome
    await this.learnFromOutcome(decision, outcome);
  }

  private async learnFromOutcome(decision: Decision, outcome: DecisionOutcome) {
    // Update success probabilities based on outcomes
    if (decision.selectedOption) {
      const optionType = decision.selectedOption.id.split('-')[0];
      
      // Adjust future confidence in similar options
      if (outcome.success) {
        this.emit('learning:positive', {
          domain: decision.context.domain,
          optionType,
          adjustment: 0.05
        });
      } else {
        this.emit('learning:negative', {
          domain: decision.context.domain,
          optionType,
          adjustment: -0.05
        });
      }
    }
  }

  async getDecisionHistory(domain?: string, limit: number = 100): Promise<Decision[]> {
    const decisions = Array.from(this.decisions.values());
    
    if (domain) {
      return decisions
        .filter(d => d.context.domain === domain)
        .slice(0, limit);
    }
    
    return decisions.slice(0, limit);
  }

  async getDecisionMetrics(domain?: string): Promise<{
    totalDecisions: number;
    successRate: number;
    averageConfidence: number;
    averageDuration: number;
    topOptions: { action: string; count: number; successRate: number }[];
  }> {
    const decisions = domain ? 
      Array.from(this.decisions.values()).filter(d => d.context.domain === domain) :
      Array.from(this.decisions.values());

    const withOutcomes = decisions.filter(d => d.outcome);
    const successful = withOutcomes.filter(d => d.outcome!.success);

    const optionStats = new Map<string, { count: number; successes: number }>();
    
    decisions.forEach(d => {
      if (d.selectedOption) {
        const action = d.selectedOption.action;
        if (!optionStats.has(action)) {
          optionStats.set(action, { count: 0, successes: 0 });
        }
        const stats = optionStats.get(action)!;
        stats.count++;
        if (d.outcome?.success) {
          stats.successes++;
        }
      }
    });

    const topOptions = Array.from(optionStats.entries())
      .map(([action, stats]) => ({
        action,
        count: stats.count,
        successRate: stats.successes / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalDecisions: decisions.length,
      successRate: withOutcomes.length > 0 ? successful.length / withOutcomes.length : 0,
      averageConfidence: decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length || 0,
      averageDuration: withOutcomes.reduce((sum, d) => sum + (d.outcome?.actualDuration || 0), 0) / withOutcomes.length || 0,
      topOptions
    };
  }
}
