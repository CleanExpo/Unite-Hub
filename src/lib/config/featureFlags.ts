/**
 * Feature Flags Configuration
 * Phase 56: Kill-switches and feature toggles for safety
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  founderControlled: boolean;
  category: 'core' | 'experimental' | 'beta' | 'deprecated';
}

export const featureFlags: Record<string, FeatureFlag> = {
  visual_playground_enabled: {
    key: 'visual_playground_enabled',
    name: 'Visual Playground',
    description: 'AI image generation and visual concept builder',
    enabled: true,
    founderControlled: true,
    category: 'beta',
  },
  training_centre_enabled: {
    key: 'training_centre_enabled',
    name: 'Training Centre',
    description: 'On-platform micro-courses and client education',
    enabled: true,
    founderControlled: true,
    category: 'core',
  },
  packs_module_enabled: {
    key: 'packs_module_enabled',
    name: 'Content Packs',
    description: 'Strategy and execution pack delivery system',
    enabled: true,
    founderControlled: true,
    category: 'core',
  },
  activation_program_enabled: {
    key: 'activation_program_enabled',
    name: '90-Day Activation',
    description: 'Structured activation timeline and milestones',
    enabled: true,
    founderControlled: true,
    category: 'core',
  },
  production_engine_enabled: {
    key: 'production_engine_enabled',
    name: 'Production Engine',
    description: 'Automated marketing production system',
    enabled: true,
    founderControlled: true,
    category: 'core',
  },
  voice_navigation_enabled: {
    key: 'voice_navigation_enabled',
    name: 'Voice Navigation',
    description: 'Voice commands for founder assistant',
    enabled: false,
    founderControlled: true,
    category: 'experimental',
  },
  ai_content_auto_publish: {
    key: 'ai_content_auto_publish',
    name: 'Auto-Publish AI Content',
    description: 'Skip approval for AI-generated content (NOT RECOMMENDED)',
    enabled: false,
    founderControlled: true,
    category: 'experimental',
  },
  extended_thinking_enabled: {
    key: 'extended_thinking_enabled',
    name: 'Extended Thinking',
    description: 'Use Claude Extended Thinking for complex tasks',
    enabled: true,
    founderControlled: true,
    category: 'core',
  },
};

// Check if a feature is enabled
export function isFeatureEnabled(key: string): boolean {
  const flag = featureFlags[key];
  if (!flag) {
return false;
}

  // Check environment override
  const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase()}`;
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return envValue === 'true';
  }

  return flag.enabled;
}

// Get all flags for founder panel
export function getAllFlags(): FeatureFlag[] {
  return Object.values(featureFlags);
}

// Get founder-controlled flags only
export function getFounderControlledFlags(): FeatureFlag[] {
  return Object.values(featureFlags).filter((f) => f.founderControlled);
}

// Toggle a flag (for runtime changes via API)
export function setFeatureFlag(key: string, enabled: boolean): boolean {
  const flag = featureFlags[key];
  if (!flag) {
return false;
}

  flag.enabled = enabled;
  return true;
}

// Feature flag check with fallback
export function withFeature<T>(
  key: string,
  enabledValue: T,
  disabledValue: T
): T {
  return isFeatureEnabled(key) ? enabledValue : disabledValue;
}

export default {
  featureFlags,
  isFeatureEnabled,
  getAllFlags,
  getFounderControlledFlags,
  setFeatureFlag,
  withFeature,
};
