/**
 * Tests for Guardian Plugin-03 Marketplace Gating (PLUGIN-02 Integration)
 *
 * Verifies that the Restoration Operations plugin correctly gates based on:
 * - Subscription tier (PROFESSIONAL/ENTERPRISE)
 * - Required features (guardian_core, h06_intelligence_dashboard)
 * - Governance policies
 * - Dependency checks
 */

import { describe, it, expect } from 'vitest';
import {
  PluginLifecycleService,
  PluginConstraintViolation
} from '@/lib/guardian/plugins/pluginLifecycleService';
import { pluginRegistry } from '@/lib/guardian/plugins/registry';
import { manifest as industryRestorationPackManifest } from '@/lib/guardian/plugins/industry-restoration-pack/manifest';

describe('PLUGIN-03: Marketplace Gating', () => {
  const RESTORATION_PACK_KEY = 'industry_restoration_pack';

  describe('Tier Gating', () => {
    it('should allow PROFESSIONAL tier', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false }
      );

      expect(constraints.filter((c: any) => c.constraint === 'tier')).toHaveLength(0);
    });

    it('should allow ENTERPRISE tier', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'ENTERPRISE',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false }
      );

      expect(constraints.filter((c: any) => c.constraint === 'tier')).toHaveLength(0);
    });

    it('should deny STARTER tier', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'STARTER',
        [],
        { allowExternal: false }
      );

      const tierConstraint = constraints.find((c: any) => c.constraint === 'tier');
      expect(tierConstraint).toBeDefined();
      expect(tierConstraint?.reason).toContain('PROFESSIONAL or ENTERPRISE');
    });
  });

  describe('Feature Gating', () => {
    it('should allow with all required features', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false }
      );

      expect(constraints.filter((c: any) => c.constraint === 'features')).toHaveLength(0);
    });

    it('should deny without guardian_core', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['h06_intelligence_dashboard'], // missing guardian_core
        { allowExternal: false }
      );

      const featureConstraint = constraints.find((c: any) => c.constraint === 'features');
      expect(featureConstraint).toBeDefined();
      expect(featureConstraint?.reason).toContain('guardian_core');
    });

    it('should deny without h06_intelligence_dashboard', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core'], // missing h06_intelligence_dashboard
        { allowExternal: false }
      );

      const featureConstraint = constraints.find((c: any) => c.constraint === 'features');
      expect(featureConstraint).toBeDefined();
      expect(featureConstraint?.reason).toContain('h06_intelligence_dashboard');
    });

    it('should deny with no features', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        [], // no features
        { allowExternal: false }
      );

      expect(constraints.filter((c: any) => c.constraint === 'features').length).toBeGreaterThan(0);
    });
  });

  describe('Governance Gating', () => {
    it('should allow internal-only governance (not requiring external sharing)', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false } // external sharing disabled
      );

      expect(constraints.filter((c: any) => c.constraint === 'governance')).toHaveLength(0);
    });

    it('should allow with external sharing enabled', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: true }
      );

      expect(constraints.filter((c: any) => c.constraint === 'governance')).toHaveLength(0);
    });
  });

  describe('Dependency Checking', () => {
    it('should have no dependencies', () => {
      expect(industryRestorationPackManifest.dependencies?.length || 0).toBe(0);
    });

    it('should pass dependency check', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false }
      );

      expect(constraints.filter((c: any) => c.constraint === 'dependencies')).toHaveLength(0);
    });
  });

  describe('Combined Constraint Checking', () => {
    it('should pass all checks for fully enabled workspace', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'ENTERPRISE',
        ['guardian_core', 'h06_intelligence_dashboard', 'h02_anomaly_detection', 'h04_incident_scoring'],
        { allowExternal: true }
      );

      expect(constraints).toHaveLength(0);
    });

    it('should fail on multiple constraint violations', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'STARTER', // wrong tier
        ['some_other_feature'], // missing required features
        { allowExternal: false }
      );

      expect(constraints.length).toBeGreaterThanOrEqual(2);
      expect(constraints.map((c: any) => c.constraint)).toContain('tier');
      expect(constraints.map((c: any) => c.constraint)).toContain('features');
    });
  });

  describe('Constraint Violation Details', () => {
    it('should include helpful details in tier violation', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'STARTER',
        [],
        { allowExternal: false }
      );

      const tierViolation = constraints.find((c: any) => c.constraint === 'tier');
      expect(tierViolation?.details).toContain('Upgrade');
    });

    it('should include helpful details in feature violation', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        [],
        { allowExternal: false }
      );

      const featureViolation = constraints.find((c: any) => c.constraint === 'features');
      expect(featureViolation?.details).toContain('Enable');
    });
  });

  describe('Registry Integration', () => {
    it('should be registered in plugin registry', () => {
      const plugin = pluginRegistry.getPlugin(RESTORATION_PACK_KEY);
      expect(plugin).toBeDefined();
      expect(plugin?.key).toBe(RESTORATION_PACK_KEY);
    });

    it('should be findable by tier filtering', () => {
      const plugins = pluginRegistry.filterByTier('PROFESSIONAL');
      expect(plugins.find((p) => p.key === RESTORATION_PACK_KEY)).toBeDefined();
    });

    it('should be excluded by STARTER tier filtering', () => {
      const plugins = pluginRegistry.filterByTier('STARTER');
      expect(plugins.find((p) => p.key === RESTORATION_PACK_KEY)).toBeUndefined();
    });

    it('should be findable by feature filtering', () => {
      const plugins = pluginRegistry.filterByFeatures([
        'guardian_core',
        'h06_intelligence_dashboard'
      ]);
      expect(plugins.find((p) => p.key === RESTORATION_PACK_KEY)).toBeDefined();
    });

    it('should be excluded by incomplete feature filtering', () => {
      const plugins = pluginRegistry.filterByFeatures(['guardian_core']); // missing h06
      expect(plugins.find((p) => p.key === RESTORATION_PACK_KEY)).toBeUndefined();
    });

    it('should be findable by governance filtering', () => {
      const plugins = pluginRegistry.filterByGovernance({ allowExternal: false });
      expect(plugins.find((p) => p.key === RESTORATION_PACK_KEY)).toBeDefined();
    });

    it('should be findable by capability filtering', () => {
      const uiPanels = pluginRegistry.getPluginsByCapability('ui_panel');
      expect(uiPanels.find((p) => p.key === RESTORATION_PACK_KEY)).toBeDefined();
    });

    it('should be in UI panel list', () => {
      const uiPanels = pluginRegistry.getUIPanelPlugins(
        'PROFESSIONAL',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false }
      );
      expect(uiPanels.find((p) => p.key === RESTORATION_PACK_KEY)).toBeDefined();
    });
  });

  describe('Manifest Validation', () => {
    it('should have valid manifest structure', () => {
      expect(industryRestorationPackManifest.key).toBe(RESTORATION_PACK_KEY);
      expect(industryRestorationPackManifest.name).toBeTruthy();
      expect(industryRestorationPackManifest.version).toBeTruthy();
      expect(industryRestorationPackManifest.description).toBeTruthy();
      expect(Array.isArray(industryRestorationPackManifest.capabilities)).toBe(true);
      expect(industryRestorationPackManifest.capabilities.length).toBeGreaterThan(0);
    });

    it('should declare required tiers', () => {
      expect(Array.isArray(industryRestorationPackManifest.requiredTiers)).toBe(true);
      expect(industryRestorationPackManifest.requiredTiers).toContain('PROFESSIONAL');
      expect(industryRestorationPackManifest.requiredTiers).toContain('ENTERPRISE');
    });

    it('should declare required features', () => {
      expect(Array.isArray(industryRestorationPackManifest.requiredFeatures)).toBe(true);
      expect(industryRestorationPackManifest.requiredFeatures).toContain('guardian_core');
      expect(industryRestorationPackManifest.requiredFeatures).toContain('h06_intelligence_dashboard');
    });

    it('should have governance metadata', () => {
      expect(industryRestorationPackManifest.governance).toBeDefined();
      expect(typeof industryRestorationPackManifest.governance.piiSafe).toBe('boolean');
      expect(industryRestorationPackManifest.governance.piiSafe).toBe(true);
    });

    it('should declare routes', () => {
      expect(Array.isArray(industryRestorationPackManifest.routes)).toBe(true);
      expect(industryRestorationPackManifest.routes?.length).toBeGreaterThan(0);
      const route = industryRestorationPackManifest.routes?.[0];
      expect(route?.path).toBeTruthy();
      expect(route?.title).toBeTruthy();
    });

    it('should declare entry point', () => {
      expect(industryRestorationPackManifest.entry).toBeTruthy();
      expect(typeof industryRestorationPackManifest.entry).toBe('string');
    });
  });

  describe('Stable/GA Status', () => {
    it('should be marked as stable', () => {
      expect(industryRestorationPackManifest.stable).toBe(true);
    });

    it('should have version >= 1.0.0', () => {
      const version = industryRestorationPackManifest.version;
      const [major] = version.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Messages', () => {
    it('should provide actionable error messages', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'STARTER',
        ['only_guardian_core'],
        { allowExternal: false }
      );

      constraints.forEach((v: PluginConstraintViolation) => {
        expect(v.reason).toBeTruthy();
        expect(v.reason.length).toBeGreaterThan(0);
        if (v.details) {
          expect(v.details.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('Scenario 1: Professional water damage restoration company with all features enabled', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        [
          'guardian_core',
          'h06_intelligence_dashboard',
          'h02_anomaly_detection',
          'h04_incident_scoring',
          'h05_governance_coach'
        ],
        { allowExternal: true }
      );
      expect(constraints).toHaveLength(0);
    });

    it('Scenario 2: Enterprise fire response with limited features', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'ENTERPRISE',
        ['guardian_core', 'h06_intelligence_dashboard'], // only required features
        { allowExternal: false }
      );
      expect(constraints).toHaveLength(0);
    });

    it('Scenario 3: Startup on STARTER tier tries to enable', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'STARTER',
        ['guardian_core', 'h06_intelligence_dashboard'],
        { allowExternal: false }
      );
      expect(constraints.length).toBeGreaterThan(0);
      expect(constraints[0].reason).toContain('PROFESSIONAL');
    });

    it('Scenario 4: Professional tier without intelligence dashboard', () => {
      const constraints = (PluginLifecycleService as any).checkConstraints(
        industryRestorationPackManifest,
        'PROFESSIONAL',
        ['guardian_core'], // missing h06
        { allowExternal: false }
      );
      expect(constraints.length).toBeGreaterThan(0);
      expect(constraints.some((c: any) => c.constraint === 'features')).toBe(true);
    });
  });
});
