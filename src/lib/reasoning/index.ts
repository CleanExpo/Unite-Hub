/**
 * Reasoning Engine - Memory-Driven Autonomous Reasoning
 *
 * Multi-pass reasoning system with memory integration, uncertainty propagation,
 * and risk-aware decision modeling for all agents.
 *
 * @module lib/reasoning
 */

export {
  PassEngine,
  createPassEngine,
  passEngine,
} from './passEngine';
// Placeholder types for compatibility (passEngine does not currently export them)
export type PassType = unknown;
export type PassInput = unknown;
export type PassOutput = unknown;
export type ReasoningTrace = unknown;

export {
  ContextAssembler,
  createContextAssembler,
  contextAssembler,
} from './contextAssembler';
export type ContextPacket = unknown;

export {
  RiskModel,
  createRiskModel,
  riskModel,
} from './riskModel';
export type RiskAssessment = unknown;

export {
  UncertaintyPropagator,
  createUncertaintyPropagator,
  uncertaintyPropagator,
} from './uncertaintyPropagator';
export type PassUncertainty = unknown;

export {
  ReasoningArchiveBridge,
  createReasoningArchiveBridge,
  reasoningArchiveBridge,
} from './reasoningArchiveBridge';
export type ArchiveRequest = unknown;

/**
 * Complete reasoning system with all components
 */
export interface ReasoningSystem {
  passEngine: PassEngine;
  contextAssembler: ContextAssembler;
  riskModel: RiskModel;
  uncertaintyPropagator: UncertaintyPropagator;
  archiveBridge: ReasoningArchiveBridge;
}

/**
 * Factory to create complete reasoning system
 */
export function createReasoningSystem(): ReasoningSystem {
  return {
    passEngine: new PassEngine(),
    contextAssembler: new ContextAssembler(),
    riskModel: new RiskModel(),
    uncertaintyPropagator: new UncertaintyPropagator(),
    archiveBridge: new ReasoningArchiveBridge(),
  };
}
