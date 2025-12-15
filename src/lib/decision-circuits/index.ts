/**
 * Decision Circuits Module
 * Autonomous decision governance for marketing operations
 */

export {
  type CircuitCategory,
  type CircuitFailureMode,
  type DecisionCircuit,
  type CircuitExecutionLog,
  type CircuitResult,
  DECISION_CIRCUITS,
  getCircuit,
  getCircuitsByCategory,
  validateCircuitInputs,
} from './registry';

export {
  type CircuitExecutionContext,
  type CircuitInput,
  type CircuitOutput,
  executeCircuit,
  getCircuitExecutionHistory,
  getCircuitMetrics,
  chainCircuits,
} from './executor';

export {
  type StrategyState,
  type AutoCorrectionAction,
  evaluateStrategyHealth,
  executeAutoCorrection,
  updateStrategyMetrics,
  getAutonomyDashboard,
} from './autonomy';
