/**
 * Decision Circuits Module
 * Autonomous decision governance for marketing operations
 * v1.1.0: Production enforcement and health monitoring
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

export {
  type HealthCheck,
  ENFORCEMENT_CONFIG,
  PRODUCTION_HEALTH_CHECKS,
  AUTONOMY_LOCK,
  EnforcementViolationError,
  validateEntrypoint,
  detectDisallowedModelCalls,
  validateGenerationCircuitReference,
  checkProductionHealth,
  executeHealthCheckAction,
  verifyDeploymentRequirements,
  runDeploymentPreflightCheck,
  logEnforcementEvent,
} from './enforcement';

export {
  type HealthMetrics,
  type CircuitHealthSnapshot,
  collectHealthMetrics,
  getCircuitHealthSnapshot,
  runHealthMonitoring,
  generateHealthReport,
  exportHealthMetrics,
} from './health-monitor';
