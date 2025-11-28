/**
 * AI Phill Configuration
 * Master brain configuration for AI Phill - the Founder Intelligence System
 *
 * @module aiPhill.config
 * @version 1.0.0
 */

/**
 * AI Phill governance modes
 */
export type AiPhillGovernanceMode =
  | 'HUMAN_GOVERNED'
  | 'AI_ASSISTED'
  | 'AUTONOMOUS';

/**
 * AI Phill allowed intents for action
 */
export type AiPhillIntent =
  | 'read_data'
  | 'generate_insights'
  | 'propose_actions'
  | 'trigger_workflows'
  | 'monitor_metrics'
  | 'analyze_patterns'
  | 'create_recommendations';

/**
 * AI Phill persona configuration
 */
export interface AiPhillPersona {
  name: string;
  role: string;
  expertise: string[];
  communicationStyle: 'technical' | 'business' | 'casual';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

/**
 * AI Phill configuration interface
 */
export interface AiPhillConfig {
  /** Enable/disable AI Phill completely */
  AI_PHILL_ENABLED: boolean;

  /** Governance mode for AI Phill decision-making */
  AI_PHILL_GOVERNANCE_MODE: AiPhillGovernanceMode;

  /** Primary Claude model for AI Phill */
  AI_PHILL_MODEL: string;

  /** Maximum insights AI Phill can generate per day */
  AI_PHILL_MAX_INSIGHTS_PER_DAY: number;

  /** Maximum frequency for umbrella business synopsis (hours) */
  AI_PHILL_MAX_UMBRELLA_SYNOPSIS_FREQUENCY_HOURS: number;

  /** Allowed intents for AI Phill actions */
  AI_PHILL_ALLOWED_INTENTS: AiPhillIntent[];

  /** Extended thinking budget tokens for complex analysis */
  AI_PHILL_THINKING_BUDGET_TOKENS: number;

  /** AI Phill persona configuration */
  AI_PHILL_PERSONA: AiPhillPersona;

  /** Enable real-time analysis across all businesses */
  AI_PHILL_REAL_TIME_ANALYSIS_ENABLED: boolean;

  /** Maximum concurrent analysis tasks */
  AI_PHILL_MAX_CONCURRENT_ANALYSIS: number;

  /** Cache insights for this many hours */
  AI_PHILL_INSIGHT_CACHE_HOURS: number;

  /** Enable predictive insights */
  AI_PHILL_PREDICTIVE_INSIGHTS_ENABLED: boolean;

  /** Enable anomaly detection across business data */
  AI_PHILL_ANOMALY_DETECTION_ENABLED: boolean;

  /** Confidence threshold for recommendations (0-1) */
  AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD: number;
}

/**
 * Default AI Phill persona
 */
const DEFAULT_AI_PHILL_PERSONA: AiPhillPersona = {
  name: 'AI Phill',
  role: 'Founder Intelligence Agent',
  expertise: [
    'Business Analytics',
    'Marketing Intelligence',
    'SEO Strategy',
    'Growth Optimization',
    'Data Analysis',
  ],
  communicationStyle: 'business',
  riskTolerance: 'moderate',
};

/**
 * AI Phill runtime configuration
 */
export const AI_PHILL_CONFIG: AiPhillConfig = {
  AI_PHILL_ENABLED: process.env.AI_PHILL_ENABLED !== 'false',

  AI_PHILL_GOVERNANCE_MODE:
    (process.env.AI_PHILL_GOVERNANCE_MODE as AiPhillGovernanceMode) ||
    'HUMAN_GOVERNED',

  AI_PHILL_MODEL:
    process.env.AI_PHILL_MODEL || 'claude-opus-4-5-20251101',

  AI_PHILL_MAX_INSIGHTS_PER_DAY: parseInt(
    process.env.AI_PHILL_MAX_INSIGHTS_PER_DAY || '100',
    10
  ),

  AI_PHILL_MAX_UMBRELLA_SYNOPSIS_FREQUENCY_HOURS: parseInt(
    process.env.AI_PHILL_MAX_UMBRELLA_SYNOPSIS_FREQUENCY_HOURS || '24',
    10
  ),

  AI_PHILL_ALLOWED_INTENTS: (
    process.env.AI_PHILL_ALLOWED_INTENTS
      ? process.env.AI_PHILL_ALLOWED_INTENTS.split(',')
      : [
          'read_data',
          'generate_insights',
          'propose_actions',
          'monitor_metrics',
          'analyze_patterns',
          'create_recommendations',
        ]
  ) as AiPhillIntent[],

  AI_PHILL_THINKING_BUDGET_TOKENS: parseInt(
    process.env.AI_PHILL_THINKING_BUDGET_TOKENS || '10000',
    10
  ),

  AI_PHILL_PERSONA: {
    name: process.env.AI_PHILL_PERSONA_NAME || DEFAULT_AI_PHILL_PERSONA.name,
    role: process.env.AI_PHILL_PERSONA_ROLE || DEFAULT_AI_PHILL_PERSONA.role,
    expertise: process.env.AI_PHILL_PERSONA_EXPERTISE
      ? process.env.AI_PHILL_PERSONA_EXPERTISE.split(',')
      : DEFAULT_AI_PHILL_PERSONA.expertise,
    communicationStyle:
      (process.env.AI_PHILL_PERSONA_COMMUNICATION_STYLE as
        | 'technical'
        | 'business'
        | 'casual') || DEFAULT_AI_PHILL_PERSONA.communicationStyle,
    riskTolerance:
      (process.env.AI_PHILL_PERSONA_RISK_TOLERANCE as
        | 'conservative'
        | 'moderate'
        | 'aggressive') || DEFAULT_AI_PHILL_PERSONA.riskTolerance,
  },

  AI_PHILL_REAL_TIME_ANALYSIS_ENABLED:
    process.env.AI_PHILL_REAL_TIME_ANALYSIS_ENABLED !== 'false',

  AI_PHILL_MAX_CONCURRENT_ANALYSIS: parseInt(
    process.env.AI_PHILL_MAX_CONCURRENT_ANALYSIS || '10',
    10
  ),

  AI_PHILL_INSIGHT_CACHE_HOURS: parseInt(
    process.env.AI_PHILL_INSIGHT_CACHE_HOURS || '4',
    10
  ),

  AI_PHILL_PREDICTIVE_INSIGHTS_ENABLED:
    process.env.AI_PHILL_PREDICTIVE_INSIGHTS_ENABLED !== 'false',

  AI_PHILL_ANOMALY_DETECTION_ENABLED:
    process.env.AI_PHILL_ANOMALY_DETECTION_ENABLED !== 'false',

  AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD: parseFloat(
    process.env.AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD || '0.75'
  ),
};

/**
 * Validate AI Phill configuration
 */
export function validateAiPhillConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (AI_PHILL_CONFIG.AI_PHILL_MAX_INSIGHTS_PER_DAY < 1) {
    errors.push('AI_PHILL_MAX_INSIGHTS_PER_DAY must be at least 1');
  }

  if (AI_PHILL_CONFIG.AI_PHILL_THINKING_BUDGET_TOKENS < 1000) {
    errors.push('AI_PHILL_THINKING_BUDGET_TOKENS should be at least 1000');
  }

  if (AI_PHILL_CONFIG.AI_PHILL_MAX_CONCURRENT_ANALYSIS < 1) {
    errors.push('AI_PHILL_MAX_CONCURRENT_ANALYSIS must be at least 1');
  }

  if (
    AI_PHILL_CONFIG.AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD < 0 ||
    AI_PHILL_CONFIG.AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD > 1
  ) {
    errors.push(
      'AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD must be between 0 and 1'
    );
  }

  const validModels = [
    'claude-opus-4-5-20251101',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
  ];
  if (!validModels.includes(AI_PHILL_CONFIG.AI_PHILL_MODEL)) {
    errors.push(
      `AI_PHILL_MODEL must be one of: ${validModels.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a specific intent is allowed for AI Phill
 */
export function isAiPhillIntentAllowed(intent: AiPhillIntent): boolean {
  return AI_PHILL_CONFIG.AI_PHILL_ALLOWED_INTENTS.includes(intent);
}
