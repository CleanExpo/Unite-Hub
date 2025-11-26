/**
 * Domain Knowledge Router
 *
 * Models financial, macroeconomic, crypto, futures, psychology, and personal development
 * knowledge domains. Routes advisor requests to appropriate agents and models based on domain.
 */

export type KnowledgeDomain =
  | 'business_finance'
  | 'macroeconomics'
  | 'crypto_web3'
  | 'futures_commodities'
  | 'psychology_human_development'
  | 'restoration_industry'
  | 'marketing_growth'
  | 'personal_health';

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface DomainProfile {
  id: KnowledgeDomain;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  preferredAgents: string[];
  preferredModels: string[]; // From Phase 8 model catalog
  requiresDisclaimer: boolean;
  disclaimerText?: string;
  allowedAdviceTypes: string[];
  blockedAdviceTypes: string[];
  notes: string;
}

export const domainProfiles: DomainProfile[] = [
  {
    id: 'business_finance',
    name: 'Business & Finance',
    description: 'Company-level financials, cashflow, runway, budgets, pricing strategy, unit economics.',
    riskLevel: 'low',
    preferredAgents: ['analysis_agent', 'research_agent'],
    preferredModels: ['claude-sonnet-4-5', 'gpt-4-turbo', 'gemini-3-pro'],
    requiresDisclaimer: false,
    allowedAdviceTypes: ['analysis', 'scenario_planning', 'benchmarking', 'optimization'],
    blockedAdviceTypes: ['personal_investment', 'tax_advice'],
    notes: 'Primary domain of expertise. Strategic financial analysis recommended.'
  },

  {
    id: 'macroeconomics',
    name: 'Macroeconomics & Markets',
    description: 'Macro trends, sectors, equities, bonds, economic indicators, policy impacts.',
    riskLevel: 'medium',
    preferredAgents: ['research_agent', 'analysis_agent'],
    preferredModels: ['claude-sonnet-4-5', 'gpt-4-turbo'],
    requiresDisclaimer: true,
    disclaimerText: 'Market analysis is informational only. Not investment advice. Consult a licensed financial advisor.',
    allowedAdviceTypes: ['trend_analysis', 'scenario_exploration', 'risk_assessment', 'correlation_analysis'],
    blockedAdviceTypes: ['investment_recommendations', 'trading_signals'],
    notes: 'High-signal domain. Use for strategic understanding, not tactical decisions.'
  },

  {
    id: 'crypto_web3',
    name: 'Crypto & Web3',
    description: 'Digital assets, blockchain protocols, smart contracts, DeFi, NFTs, tokenomics.',
    riskLevel: 'high',
    preferredAgents: ['research_agent', 'content_agent'],
    preferredModels: ['claude-opus-4-5', 'deepseek-r1', 'gpt-4-turbo'],
    requiresDisclaimer: true,
    disclaimerText: 'Crypto is highly volatile and speculative. Not investment advice. Do your own research. Never invest more than you can afford to lose.',
    allowedAdviceTypes: ['protocol_analysis', 'risk_mapping', 'narrative_evaluation', 'technical_research'],
    blockedAdviceTypes: ['buy_sell_signals', 'price_predictions', 'portfolio_allocation'],
    notes: 'Volatility domain. Strictly informational. Flag emotional decisions. Require confidence scores.'
  },

  {
    id: 'futures_commodities',
    name: 'Futures & Commodities',
    description: 'Energy, agriculture, metals, financial futures, hedging strategies, market mechanics.',
    riskLevel: 'high',
    preferredAgents: ['research_agent', 'analysis_agent'],
    preferredModels: ['claude-sonnet-4-5', 'gpt-4-turbo'],
    requiresDisclaimer: true,
    disclaimerText: 'Futures trading involves substantial risk. Not trading advice. Consult a futures broker or advisor.',
    allowedAdviceTypes: ['market_structure', 'hedging_concepts', 'supply_demand_analysis'],
    blockedAdviceTypes: ['position_recommendations', 'leverage_advice', 'trading_strategies'],
    notes: 'Leverage and complexity require extreme caution. Informational only.'
  },

  {
    id: 'psychology_human_development',
    name: 'Psychology & Human Development',
    description: 'Habits, learning, skill development, mindset, sleep science, stress management, decision-making.',
    riskLevel: 'low',
    preferredAgents: ['content_agent', 'analysis_agent'],
    preferredModels: ['claude-sonnet-4-5'],
    requiresDisclaimer: true,
    disclaimerText: 'Not medical or therapeutic advice. For clinical issues, consult a licensed professional.',
    allowedAdviceTypes: ['habit_coaching', 'learning_frameworks', 'motivation', 'decision_frameworks'],
    blockedAdviceTypes: ['medical_diagnosis', 'mental_health_treatment', 'medication_advice'],
    notes: 'Safe domain. Coaching-style guidance recommended. Can be personalized with context.'
  },

  {
    id: 'restoration_industry',
    name: 'Restoration Industry',
    description: 'Water damage, mould remediation, fire restoration, biohazard, IICRC standards, AU regulations.',
    riskLevel: 'low',
    preferredAgents: ['research_agent', 'content_agent'],
    preferredModels: ['claude-sonnet-4-5'],
    requiresDisclaimer: false,
    allowedAdviceTypes: ['technical_guidance', 'compliance', 'best_practices', 'training'],
    blockedAdviceTypes: [],
    notes: 'Primary domain expertise. Full authority. Can provide detailed technical guidance.'
  },

  {
    id: 'marketing_growth',
    name: 'Marketing & Growth',
    description: 'SEO, content strategy, funnels, campaigns, branding, customer psychology, analytics.',
    riskLevel: 'low',
    preferredAgents: ['content_agent', 'coordination_agent', 'analysis_agent'],
    preferredModels: ['claude-sonnet-4-5', 'gpt-4-turbo'],
    requiresDisclaimer: false,
    allowedAdviceTypes: ['strategy', 'content_planning', 'audience_analysis', 'optimization'],
    blockedAdviceTypes: [],
    notes: 'Strong domain expertise. Supports lead and revenue growth across brands.'
  },

  {
    id: 'personal_health',
    name: 'Personal Health & Wellness',
    description: 'Sleep, nutrition, fitness, stress management, recovery protocols, biohacking.',
    riskLevel: 'low',
    preferredAgents: ['content_agent', 'analysis_agent'],
    preferredModels: ['claude-sonnet-4-5'],
    requiresDisclaimer: true,
    disclaimerText: 'Not medical advice. For health concerns, consult a healthcare professional.',
    allowedAdviceTypes: ['sleep_optimization', 'nutrition_frameworks', 'fitness_principles', 'stress_techniques'],
    blockedAdviceTypes: ['medical_diagnosis', 'supplement_prescriptions', 'treatment_protocols'],
    notes: 'Coaching-style guidance. Can integrate personal context (sleep, HRV, stress).'
  }
];

/**
 * Get domain profile
 */
export function getDomainProfile(domainId: KnowledgeDomain): DomainProfile | null {
  return domainProfiles.find(d => d.id === domainId) || null;
}

/**
 * Get routing configuration for domain
 */
export function getRoutingConfig(domainId: KnowledgeDomain) {
  const profile = getDomainProfile(domainId);
  if (!profile) return null;

  return {
    domain: domainId,
    preferredAgents: profile.preferredAgents,
    preferredModels: profile.preferredModels,
    riskLevel: profile.riskLevel,
    requiresDisclaimer: profile.requiresDisclaimer,
    disclaimer: profile.disclaimerText,
    allowedAdviceTypes: profile.allowedAdviceTypes
  };
}

/**
 * Check if advice type is allowed in domain
 */
export function isAdviceTypeAllowed(domainId: KnowledgeDomain, adviceType: string): boolean {
  const profile = getDomainProfile(domainId);
  if (!profile) return false;

  if (profile.blockedAdviceTypes.includes(adviceType)) return false;
  if (profile.allowedAdviceTypes.length === 0) return true;

  return profile.allowedAdviceTypes.includes(adviceType);
}

/**
 * Get risk level for domain
 */
export function getDomainRiskLevel(domainId: KnowledgeDomain): RiskLevel | null {
  const profile = getDomainProfile(domainId);
  return profile?.riskLevel || null;
}

/**
 * Get all domains
 */
export function getAllDomains(): DomainProfile[] {
  return domainProfiles;
}

/**
 * Get domains by risk level
 */
export function getDomainsByRiskLevel(riskLevel: RiskLevel): DomainProfile[] {
  return domainProfiles.filter(d => d.riskLevel === riskLevel);
}

/**
 * Validate request against domain constraints
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiresDisclaimer: boolean;
  disclaimer?: string;
}

export function validateAgainstDomain(
  domainId: KnowledgeDomain,
  adviceType: string,
  requestText?: string
): ValidationResult {
  const profile = getDomainProfile(domainId);

  if (!profile) {
    return {
      valid: false,
      errors: [`Unknown domain: ${domainId}`],
      warnings: [],
      requiresDisclaimer: false
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check advice type
  if (!isAdviceTypeAllowed(domainId, adviceType)) {
    errors.push(`Advice type '${adviceType}' is not allowed in ${profile.name}`);
  }

  // Check for blocked keywords
  if (requestText) {
    const blockedKeywords = {
      'buy|invest|allocate': adviceType !== 'analysis' && ['crypto_web3', 'futures_commodities', 'macroeconomics'].includes(domainId),
      'recommend|should': profile.riskLevel === 'high' && adviceType.includes('recommendation'),
      'diagnose|treat|cure': ['personal_health'].includes(domainId)
    };

    for (const [pattern, shouldBlock] of Object.entries(blockedKeywords)) {
      if (shouldBlock && new RegExp(pattern, 'i').test(requestText)) {
        errors.push(`Request contains blocked language for this domain: "${pattern}"`);
      }
    }
  }

  // Add warnings for high-risk domains
  if (profile.riskLevel === 'high' || profile.riskLevel === 'very_high') {
    warnings.push(`⚠️ High-risk domain. ${profile.disclaimerText || ''}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    requiresDisclaimer: profile.requiresDisclaimer,
    disclaimer: profile.disclaimerText
  };
}

/**
 * Select best agent for domain and advice type
 */
export function selectBestAgent(domainId: KnowledgeDomain, adviceType: string): string | null {
  const profile = getDomainProfile(domainId);
  if (!profile) return null;

  // Map advice types to preferred agents
  const agentPreferences: Record<string, number> = {};

  // Research-heavy domains
  if (['macroeconomics', 'crypto_web3', 'futures_commodities'].includes(domainId)) {
    if (adviceType.includes('research') || adviceType.includes('analysis')) {
      return 'research_agent';
    }
  }

  // Content-heavy domains
  if (['psychology_human_development', 'personal_health', 'marketing_growth'].includes(domainId)) {
    if (adviceType.includes('coaching') || adviceType.includes('learning') || adviceType.includes('content')) {
      return 'content_agent';
    }
  }

  // Default to first preferred agent
  return profile.preferredAgents[0] || null;
}

/**
 * Select best model for domain and risk level
 */
export function selectBestModel(domainId: KnowledgeDomain): string | null {
  const profile = getDomainProfile(domainId);
  if (!profile) return null;

  // High-risk domains benefit from extended thinking
  if (profile.riskLevel === 'high' || profile.riskLevel === 'very_high') {
    const extendedThinkingModels = profile.preferredModels.filter(m =>
      ['claude-opus', 'gpt-4', 'deepseek-r1'].some(mt => m.includes(mt))
    );
    if (extendedThinkingModels.length > 0) return extendedThinkingModels[0];
  }

  // Default to first preferred model
  return profile.preferredModels[0] || null;
}
