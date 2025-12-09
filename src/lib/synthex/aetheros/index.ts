/**
 * AetherOS Omega Protocol - Main Entry Point
 * 
 * Central export for all AetherOS components
 */

// Types
export * from './types';

// Context Injector (The Heartbeat)
export {
  generateTelemetry,
  formatTelemetryForPrompt,
  injectTelemetry,
  startSession,
  endSession,
  updateSessionCost,
  calculateEnergyCostMultiplier,
  canAffordOperation,
} from './contextInjector';

// Visual Codex (The Semantic Memory)
export {
  getCodex,
  getEntriesByCategory,
  getEntriesByPriority,
  translatePrompt,
  getSuggestions,
  buildContextAssembler,
  quickTranslate,
  addCustomEntry,
  getAllEntries,
  searchCodex,
  getRandomEntry,
  validatePromptComplexity,
} from './visualCodex';

// Tool Manifest (The Hands)
export {
  AETHEROS_TOOLS,
  getTool,
  getAllTools,
  validateToolCall,
  formatToolsForClaude,
  estimateToolCost,
  getToolsByCost,
} from './toolManifest';

// Orchestrator Prompt (The Neural BIOS)
export {
  buildOrchestratorPrompt,
  buildOrchestratorPromptWithTools,
  getInitializationPrompt,
  getVisualCodexEducationPrompt,
  getBudgetWarningPrompt,
  getTruthVerificationPrompt,
} from './orchestratorPrompt';

// Tiered Generator (Cost Optimization)
export {
  TIER_CONFIGS,
  recommendTier,
  canUpgradeTier,
  calculateSavings,
  generateVisual,
  upgradeVisual,
  batchGenerate,
  getTierConfig,
  getAllTierConfigs,
  compareTiers,
} from './tieredGenerator';

// Default export with convenience methods
export { default as OrchestratorPrompt } from './orchestratorPrompt';
