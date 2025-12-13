/**
 * Guardian Plugin Manifest Schema
 *
 * Defines the structure and validation for Guardian plugins.
 * All plugins must conform to this schema (build-time validation).
 * Read-only plugins only; no runtime code execution.
 */

/**
 * Plugin capabilities
 */
export type GuardianPluginCapability = 'ui_panel' | 'report' | 'connector';

/**
 * User roles that can access plugins
 */
export type GuardianPluginRole = 'admin' | 'analyst' | 'operator' | 'viewer';

/**
 * Subscription tiers that can use plugins
 */
export type GuardianTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

/**
 * Plugin route definition
 */
export interface GuardianPluginRoute {
  path: string;
  title: string;
  role: GuardianPluginRole;
  icon?: string;
  description?: string;
}

/**
 * Governance policy for plugins
 */
export interface GuardianPluginGovernance {
  piiSafe: boolean;
  requiresExternalSharing?: boolean;
  auditLogged?: boolean;
  notes?: string;
}

/**
 * Complete plugin manifest
 */
export interface GuardianPluginManifest {
  key: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  capabilities: GuardianPluginCapability[];
  routes?: GuardianPluginRoute[];
  governance: GuardianPluginGovernance;
  requiredTiers?: GuardianTier[];
  requiredFeatures?: string[];
  requiresAI?: boolean;
  entry: string;
  dependencies?: string[];
  stable?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Validate plugin manifest
 * Enforces required fields and reasonable constraints
 */
export function validatePluginManifest(manifest: any): manifest is GuardianPluginManifest {
  // Required fields
  if (!manifest.key || typeof manifest.key !== 'string') {
return false;
}
  if (!manifest.name || typeof manifest.name !== 'string') {
return false;
}
  if (!manifest.version || typeof manifest.version !== 'string') {
return false;
}
  if (!manifest.description || typeof manifest.description !== 'string') {
return false;
}
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
return false;
}
  if (!manifest.governance || typeof manifest.governance !== 'object') {
return false;
}
  if (typeof manifest.governance.piiSafe !== 'boolean') {
return false;
}
  if (!manifest.entry || typeof manifest.entry !== 'string') {
return false;
}

  // Governance must declare PII safety
  if (!manifest.governance.piiSafe) {
    // Non-PII-safe plugins are restricted in production
    // TODO: add additional validation for non-PII plugins
  }

  // Capabilities must be valid
  const validCapabilities = ['ui_panel', 'report', 'connector'];
  if (!manifest.capabilities.every((c: any) => validCapabilities.includes(c))) {
return false;
}

  // Tiers must be valid if specified
  if (manifest.requiredTiers) {
    const validTiers = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    if (!Array.isArray(manifest.requiredTiers) || !manifest.requiredTiers.every((t: any) => validTiers.includes(t))) {
      return false;
    }
  }

  // Features must be a string array if specified
  if (manifest.requiredFeatures && !Array.isArray(manifest.requiredFeatures)) {
return false;
}

  // Dependencies must be a string array if specified
  if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
return false;
}

  return true;
}

/**
 * Type-safe manifest creator
 */
export function definePluginManifest(manifest: GuardianPluginManifest): GuardianPluginManifest {
  if (!validatePluginManifest(manifest)) {
    throw new Error(`Invalid plugin manifest for key "${manifest.key}"`);
  }
  return manifest;
}
