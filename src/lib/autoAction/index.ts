/**
 * Synthex Auto-Action Engine
 *
 * Computer-use automation system powered by Fara-7B and Qwen2.5-VL.
 * Enables automated form filling, onboarding flows, and CRM operations
 * with Critical Point safety gates and sandbox enforcement.
 *
 * @module autoAction
 */

// Configuration
export { autoActionConfig, isAutoActionConfigured, isFeatureEnabled, isOriginAllowed, isActionBlocked, getConfigSummary } from '@config/autoAction.config';
export type { AutoActionConfig, Fara7BConfig, QwenVLConfig, SandboxConfig, CriticalPointConfig, ProviderType } from '@config/autoAction.config';

// Fara-7B Client (Computer-Use Model)
export { FaraClient, getFaraClient } from './faraClient';
export type { FaraAction, FaraRequest, FaraResponse, FaraClientOptions, ActionType, UIElement } from './faraClient';

// Qwen2.5-VL Client (Vision-Language Model)
export { QwenVisionClient, getQwenVisionClient } from './qwenVisionClient';
export type { QwenRequest, QwenResponse, QwenClientOptions, BoundingBox, DetectedElement, FormField, ScreenAnalysis, OCRResult } from './qwenVisionClient';

// Critical Point Guard (Safety System)
export { CriticalPointGuard, getCriticalPointGuard } from './criticalPointGuard';
export type { CriticalPoint, CriticalCategory, ApprovalStatus, ApprovalRequest, ApprovalResponse, CriticalPointDetectionResult } from './criticalPointGuard';

// Sandbox Manager (Constraint Enforcement)
export { SandboxManager, getSandboxManager } from './sandboxConfig';
export type { SandboxState, SandboxViolation, SandboxValidationResult } from './sandboxConfig';

// Session Logger (Audit Trail)
export { SessionLogger, getSessionLogger } from './sessionLogger';
export type { LogEntry, SessionLog, LogExport, LogLevel, LogEventType } from './sessionLogger';

// Computer Use Orchestrator (Main Controller)
export { ComputerUseOrchestrator, getComputerUseOrchestrator } from './computerUseOrchestrator';
export type { TaskDefinition, TaskProgress, TaskStatus, ExecutionResult, OrchestratorOptions, BrowserInterface } from './computerUseOrchestrator';

// Onboarding Flows (Pre-defined Templates)
export {
  clientOnboardingFlow,
  staffOnboardingFlow,
  crmContactAutofillFlow,
  crmDealAutofillFlow,
  flowRegistry,
  getFlow,
  getFlowsByType,
  flowToTask,
  validateFlowData,
  getEstimatedDuration,
} from './onboardingFlows';
export type { OnboardingFlowTemplate, OnboardingStep, OnboardingData } from './onboardingFlows';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick check if auto-action is available and enabled
 */
export function isAutoActionAvailable(): boolean {
  return isAutoActionConfigured();
}

/**
 * Get all singleton instances for testing or advanced usage
 */
export function getAutoActionInstances() {
  return {
    orchestrator: getComputerUseOrchestrator(),
    faraClient: getFaraClient(),
    qwenClient: getQwenVisionClient(),
    criticalGuard: getCriticalPointGuard(),
    sandboxManager: getSandboxManager(),
    sessionLogger: getSessionLogger(),
  };
}
