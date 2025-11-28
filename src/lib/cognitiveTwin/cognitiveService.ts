/**
 * Cognitive Service
 *
 * Re-exports the Cognitive Twin Service from founderOS for backward compatibility.
 * This module provides a unified interface for domain health scoring, digests,
 * and AI-assisted decision support.
 */

// Re-export all types and functions from the actual service
export * from '@/lib/founderOS/cognitiveTwinService';

// Import the functions to create a singleton-style object
import {
  computeDomainScore,
  generateDigest,
  simulateDecision,
  getDomainScores,
  getDigests,
  getPendingDecisions,
  recordDecisionOutcome,
  getPortfolioHealthDashboard,
} from '@/lib/founderOS/cognitiveTwinService';

/**
 * Singleton-style service object for consumers expecting an object interface.
 * All methods delegate to the underlying functions from founderOS.
 */
export const cognitiveService = {
  computeDomainScore,
  generateDigest,
  simulateDecision,
  getDomainScores,
  getDigests,
  getPendingDecisions,
  recordDecisionOutcome,
  getPortfolioHealthDashboard,
} as const;

export default cognitiveService;
