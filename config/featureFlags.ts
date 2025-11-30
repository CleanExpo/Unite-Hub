/**
 * Feature Flags System
 * Phase 1 UI/UX Overhaul - Safe Deployment Strategy
 *
 * This system allows us to deploy new features alongside existing ones
 * without breaking current functionality.
 */

import fs from 'fs';
import path from 'path';

export interface FeatureFlags {
  newUIEnabled: boolean;
  newStaffPortalEnabled: boolean;
  newClientPortalEnabled: boolean;
  newAIEngineEnabled: boolean;
  newAuthEnabled: boolean;
  parallelTestingMode: boolean;
}

let cachedFlags: FeatureFlags | null = null;

/**
 * Load feature flags from JSON config file
 * Caches flags in memory for performance
 */
export function getFeatureFlags(): FeatureFlags {
  if (cachedFlags) {
    return cachedFlags;
  }

  try {
    const flagsPath = path.join(process.cwd(), 'config', 'featureFlags.json');
    const flagsData = fs.readFileSync(flagsPath, 'utf-8');
    const config = JSON.parse(flagsData);
    cachedFlags = config.flags as FeatureFlags;
    return cachedFlags!
  } catch (error) {
    console.error('Failed to load feature flags, using defaults:', error);
    // Safe defaults: all new features disabled
    cachedFlags = {
      newUIEnabled: false,
      newStaffPortalEnabled: false,
      newClientPortalEnabled: false,
      newAIEngineEnabled: false,
      newAuthEnabled: false,
      parallelTestingMode: true,
    };
    return cachedFlags;
  }
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}

/**
 * Invalidate cache (use after updating flags during runtime)
 */
export function refreshFeatureFlags(): void {
  cachedFlags = null;
}

/**
 * Client-side hook for feature flags
 * (Only works in server components or API routes)
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature);
}
