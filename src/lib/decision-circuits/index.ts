/**
 * Decision Circuits Module
 * Autonomous decision governance for marketing operations
 * v1.2.0: Release control with canary rollout and automatic rollback
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

export {
  type CanaryPhase,
  type CanaryConfiguration,
  type RollbackTrigger,
  type CircuitVersion,
  type ReleaseState,
  type RollbackEvent,
  CANARY_PHASES,
  ROLLBACK_TRIGGERS,
  createCircuitVersion,
  getReleaseState,
  updateReleaseState,
  startCanaryRollout,
  progressCanaryPhase,
  evaluateRollbackTriggers,
  executeAutomaticRollback,
  monitorCanaryRelease,
  getCanaryReleaseReport,
} from './release-control';

export {
  type SocialExecutorInput,
  type SocialExecutorOutput,
  type PlatformCredentials,
  type CRMContext,
  validateCircuitBinding,
  getCRMContext,
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  collectEngagementMetrics,
  executeSocialPublishing,
} from './agents/social-executor';

export {
  type EmailExecutorInput,
  type EmailExecutorOutput,
  type CRMContext as EmailCRMContext,
  type EmailSendOptions,
  validateRecipientSafety,
  collectEngagementMetrics as collectEmailEngagementMetrics,
  executeEmailSending,
} from './agents/email-executor';

export {
  type MultiChannelInput,
  type MultiChannelOutput,
  executeMultiChannelWorkflow,
  checkUnifiedSuppression,
  aggregateMetrics,
} from './agents/multichannel-coordinator';

export {
  type ABTestVariant,
  type ABTestEvaluationInput,
  type ABTestEvaluationResult,
  type MetricsSnapshot,
  type OptimizationSignal,
  evaluateABTest,
  logABTestResults,
} from './circuits/cx09-evaluator';

export {
  type ApplyAllocationInput,
  type AllocationResult,
  type GuardrailValidation,
  type RateLimitStatus,
  type HealthMetrics,
  type RollbackEvent,
  DEFAULT_GUARDRAILS,
  validateGuardrails,
  checkRateLimit,
  applyAllocation,
  checkHealthAndRollback,
  getAllocationState,
  getAllocationHistory,
} from './traffic-allocation-engine';
