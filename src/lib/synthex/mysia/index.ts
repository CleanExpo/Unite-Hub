/**
 * Mysia Strategy Engine
 *
 * Truth-first, E.E.A.T.-driven marketing intelligence for Synthex
 *
 * @module mysia
 */

// Types
export * from './types';

// Strategy Modes
export {
  STRATEGY_MODES,
  ADVANCED_STRATEGIES,
  getRecommendedStrategies,
  getStrategyMode,
  getAllStrategyModes,
  getAdvancedStrategy,
  getAllAdvancedStrategies,
} from './strategy-modes';

// Brand Configuration
export {
  SYNTHEX_BRAND,
  TARGET_AUDIENCE,
  STORYBRAND,
  PROOF_POINTS,
  TESTIMONIALS,
  VOICE,
  EEAT_GUARDRAILS,
  GLOBAL_CONSTRAINTS,
  MESSAGING,
  COMPETITIVE_POSITIONING,
} from './brand-config';

// Psychology
export {
  AI_BIASES,
  AI_FRIENDLY_CONTENT_PATTERNS,
  HUMAN_TRIGGERS,
  SERP_LAYOUT_CONSIDERATIONS,
  scoreAIFriendliness,
  scoreHumanAppeal,
  getOptimizationRecommendations,
  CONTENT_TEMPLATES,
  getAIBias,
  getAllAIBiases,
  getHumanTrigger,
  getAllHumanTriggers,
} from './psychology';
