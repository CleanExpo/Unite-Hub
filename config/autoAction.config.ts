/**
 * Synthex Auto-Action Engine Configuration
 *
 * Central configuration for the Fara-7B + Qwen2.5-VL computer-use automation system.
 * All secrets are read from environment variables - never hardcode credentials.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProviderType = 'local' | 'foundry' | 'huggingface' | 'openrouter' | 'custom';

export interface Fara7BConfig {
  provider: ProviderType;
  endpoint: string;
  apiKey: string | undefined;
  deviceMode: 'cpu' | 'gpu' | 'mps' | 'remote';
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface QwenVLConfig {
  provider: ProviderType;
  endpoint: string;
  apiKey: string | undefined;
  modelId: string;
  maxTokens: number;
}

export interface SandboxConfig {
  maxSteps: number;
  stepTimeoutMs: number;
  sessionTimeoutMs: number;
  allowedOrigins: string[];
  blockedActions: string[];
  rateLimit: {
    maxActionsPerMinute: number;
    maxSessionsPerHour: number;
  };
}

export interface CriticalPointConfig {
  categories: string[];
  requireApprovalFor: string[];
  approvalTimeoutMs: number;
  autoRejectOnTimeout: boolean;
}

export interface AutoActionConfig {
  enabled: boolean;
  fara7b: Fara7BConfig;
  qwenVL: QwenVLConfig;
  sandbox: SandboxConfig;
  criticalPoints: CriticalPointConfig;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeScreenshots: boolean;
    retentionDays: number;
  };
  featureFlags: {
    clientOnboarding: boolean;
    staffOnboarding: boolean;
    crmAutoFill: boolean;
    documentUpload: boolean;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const autoActionConfig: AutoActionConfig = {
  // Master toggle for the auto-action engine
  enabled: process.env.AUTO_ACTION_ENABLED === 'true',

  // Fara-7B Computer-Use Model Configuration
  fara7b: {
    provider: (process.env.FARA7B_PROVIDER as ProviderType) || 'local',
    endpoint: process.env.FARA7B_ENDPOINT || 'http://localhost:8080/v1',
    apiKey: process.env.FARA7B_API_KEY,
    deviceMode: (process.env.FARA7B_DEVICE_MODE as Fara7BConfig['deviceMode']) || 'cpu',
    modelId: process.env.FARA7B_MODEL_ID || 'rhymes-ai/Aria-UI',
    maxTokens: parseInt(process.env.FARA7B_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.FARA7B_TEMPERATURE || '0.1'),
  },

  // Qwen2.5-VL Vision-Language Model Configuration
  qwenVL: {
    provider: (process.env.QWEN_VL_PROVIDER as ProviderType) || 'huggingface',
    endpoint: process.env.QWEN_VL_ENDPOINT || 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct',
    apiKey: process.env.QWEN_VL_API_KEY,
    modelId: process.env.QWEN_VL_MODEL_ID || 'Qwen/Qwen2.5-VL-7B-Instruct',
    maxTokens: parseInt(process.env.QWEN_VL_MAX_TOKENS || '2048', 10),
  },

  // Sandbox Restrictions
  sandbox: {
    maxSteps: parseInt(process.env.AUTO_ACTION_MAX_STEPS || '50', 10),
    stepTimeoutMs: parseInt(process.env.AUTO_ACTION_STEP_TIMEOUT || '30000', 10),
    sessionTimeoutMs: parseInt(process.env.AUTO_ACTION_SESSION_TIMEOUT || '600000', 10), // 10 minutes
    allowedOrigins: (process.env.AUTO_ACTION_ALLOWED_ORIGINS || 'localhost,synthex.social,unite-hub.com')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    blockedActions: [
      'deleteAccount',
      'formatDisk',
      'installSoftware',
      'modifySystemSettings',
      'accessTerminal',
      'runShellCommands',
    ],
    rateLimit: {
      maxActionsPerMinute: parseInt(process.env.AUTO_ACTION_RATE_LIMIT || '30', 10),
      maxSessionsPerHour: parseInt(process.env.AUTO_ACTION_SESSIONS_PER_HOUR || '10', 10),
    },
  },

  // Critical Point Safety Configuration
  criticalPoints: {
    categories: [
      'financial_information',
      'identity_documents',
      'passwords_and_security_answers',
      'final_submission_or_purchase',
      'irreversible_changes',
      'destructive_actions',
    ],
    requireApprovalFor: [
      'submit_form',
      'make_payment',
      'upload_document',
      'delete_record',
      'change_password',
      'grant_permissions',
      'sign_agreement',
    ],
    approvalTimeoutMs: parseInt(process.env.CRITICAL_POINT_TIMEOUT || '300000', 10), // 5 minutes
    autoRejectOnTimeout: true,
  },

  // Logging Configuration
  logging: {
    level: (process.env.AUTO_ACTION_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    includeScreenshots: process.env.AUTO_ACTION_INCLUDE_SCREENSHOTS === 'true',
    retentionDays: parseInt(process.env.AUTO_ACTION_LOG_RETENTION_DAYS || '30', 10),
  },

  // Feature Flags
  featureFlags: {
    clientOnboarding: process.env.AUTO_ACTION_CLIENT_ONBOARDING !== 'false',
    staffOnboarding: process.env.AUTO_ACTION_STAFF_ONBOARDING !== 'false',
    crmAutoFill: process.env.AUTO_ACTION_CRM_AUTOFILL !== 'false',
    documentUpload: process.env.AUTO_ACTION_DOCUMENT_UPLOAD !== 'false',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the auto-action engine is properly configured
 */
export function isAutoActionConfigured(): boolean {
  return (
    autoActionConfig.enabled &&
    !!autoActionConfig.fara7b.endpoint &&
    !!autoActionConfig.qwenVL.endpoint
  );
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof AutoActionConfig['featureFlags']): boolean {
  return autoActionConfig.enabled && autoActionConfig.featureFlags[feature];
}

/**
 * Check if an origin is allowed for auto-action
 */
export function isOriginAllowed(origin: string): boolean {
  const normalizedOrigin = origin.toLowerCase().replace(/^https?:\/\//, '');
  return autoActionConfig.sandbox.allowedOrigins.some(
    (allowed) => normalizedOrigin.includes(allowed.toLowerCase())
  );
}

/**
 * Check if an action is blocked
 */
export function isActionBlocked(action: string): boolean {
  return autoActionConfig.sandbox.blockedActions.includes(action);
}

/**
 * Get configuration summary for logging (excludes secrets)
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    enabled: autoActionConfig.enabled,
    fara7bProvider: autoActionConfig.fara7b.provider,
    fara7bDeviceMode: autoActionConfig.fara7b.deviceMode,
    qwenVLProvider: autoActionConfig.qwenVL.provider,
    maxSteps: autoActionConfig.sandbox.maxSteps,
    allowedOrigins: autoActionConfig.sandbox.allowedOrigins,
    featureFlags: autoActionConfig.featureFlags,
  };
}

export default autoActionConfig;
