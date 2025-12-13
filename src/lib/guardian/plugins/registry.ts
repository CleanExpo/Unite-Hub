/**
 * Guardian Plugin Registry
 *
 * Build-time registry of all available plugins.
 * Plugins are statically imported (no dynamic loading).
 * Registry is consulted for filtering by tier, features, governance.
 */

import type { GuardianPluginManifest, GuardianTier } from './pluginManifest';
import { manifest as industryRestorationPackManifest } from './industry-restoration-pack/manifest';
import { manifest as industryInsurancePackManifest } from './industry-insurance-pack/manifest';
import { manifest as industryHealthcareAgedcarePackManifest } from './industry-healthcare-agedcare/manifest';
import { manifest as industryGovernmentRegulatoryPackManifest } from './industry-government-regulatory/manifest';

/**
 * All registered plugins (static, build-time)
 */
const REGISTERED_PLUGINS: GuardianPluginManifest[] = [
  industryRestorationPackManifest,
  industryInsurancePackManifest,
  industryHealthcareAgedcarePackManifest,
  industryGovernmentRegulatoryPackManifest
  // Future plugins added here
];

/**
 * Plugin Registry
 */
export class PluginRegistry {
  /**
   * Get all registered plugins
   */
  getAllPlugins(): GuardianPluginManifest[] {
    return [...REGISTERED_PLUGINS];
  }

  /**
   * Get a single plugin by key
   */
  getPlugin(key: string): GuardianPluginManifest | undefined {
    return REGISTERED_PLUGINS.find((p) => p.key === key);
  }

  /**
   * Filter plugins by subscription tier
   */
  filterByTier(tier: GuardianTier): GuardianPluginManifest[] {
    return REGISTERED_PLUGINS.filter((p) => {
      if (!p.requiredTiers || p.requiredTiers.length === 0) {
return true;
}
      return p.requiredTiers.includes(tier);
    });
  }

  /**
   * Filter plugins by enabled features
   */
  filterByFeatures(enabledFeatures: string[]): GuardianPluginManifest[] {
    return REGISTERED_PLUGINS.filter((p) => {
      if (!p.requiredFeatures || p.requiredFeatures.length === 0) {
return true;
}
      return p.requiredFeatures.every((f) => enabledFeatures.includes(f));
    });
  }

  /**
   * Filter plugins by governance policy
   */
  filterByGovernance(governance: { allowExternal: boolean }): GuardianPluginManifest[] {
    return REGISTERED_PLUGINS.filter((p) => {
      if (!p.governance.requiresExternalSharing) {
return true;
}
      return governance.allowExternal;
    });
  }

  /**
   * Get plugins enabled for a given subscription tier, features, and governance
   */
  getEnabledPlugins(
    tier: GuardianTier,
    enabledFeatures: string[],
    governance: { allowExternal: boolean }
  ): GuardianPluginManifest[] {
    return REGISTERED_PLUGINS.filter((p) => {
      // Check tier constraint
      if (p.requiredTiers && !p.requiredTiers.includes(tier)) {
return false;
}

      // Check feature constraint
      if (p.requiredFeatures && p.requiredFeatures.length > 0) {
        if (!p.requiredFeatures.every((f) => enabledFeatures.includes(f))) {
return false;
}
      }

      // Check governance constraint
      if (p.governance.requiresExternalSharing && !governance.allowExternal) {
return false;
}

      return true;
    });
  }

  /**
   * Get plugins by capability
   */
  getPluginsByCapability(capability: string): GuardianPluginManifest[] {
    return REGISTERED_PLUGINS.filter((p) => p.capabilities.includes(capability as any));
  }

  /**
   * Get UI panel plugins only
   */
  getUIPanelPlugins(
    tier: GuardianTier,
    enabledFeatures: string[],
    governance: { allowExternal: boolean }
  ): GuardianPluginManifest[] {
    return this.getEnabledPlugins(tier, enabledFeatures, governance).filter((p) =>
      p.capabilities.includes('ui_panel')
    );
  }

  /**
   * Get report plugins only
   */
  getReportPlugins(
    tier: GuardianTier,
    enabledFeatures: string[],
    governance: { allowExternal: boolean }
  ): GuardianPluginManifest[] {
    return this.getEnabledPlugins(tier, enabledFeatures, governance).filter((p) =>
      p.capabilities.includes('report')
    );
  }
}

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry();
