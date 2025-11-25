/**
 * Reasoning Engine - Memory-Driven Autonomous Reasoning
 *
 * Multi-pass reasoning system with memory integration, uncertainty propagation,
 * and risk-aware decision modeling for all agents.
 *
 * @module lib/reasoning
 */

export {
  PassType,
  PassInput,
  PassOutput,
  ReasoningTrace,
  PassEngine,
  createPassEngine,
  passEngine,
} from './passEngine';

export {
  ContextPacket,
  ContextAssembler,
  createContextAssembler,
  contextAssembler,
} from './contextAssembler';

export {
  RiskAssessment,
  RiskModel,
  createRiskModel,
  riskModel,
} from './riskModel';

export {
  PassUncertainty,
  UncertaintyPropagator,
  createUncertaintyPropagator,
  uncertaintyPropagator,
} from './uncertaintyPropagator';

export {
  ArchiveRequest,
  ReasoningArchiveBridge,
  createReasoningArchiveBridge,
  reasoningArchiveBridge,
} from './reasoningArchiveBridge';

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
