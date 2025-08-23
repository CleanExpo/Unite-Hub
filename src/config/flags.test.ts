import { describe, it, expect, beforeEach } from '@jest/globals';

// Test the simple flags configuration
describe('Feature Flags - Simple Configuration', () => {
  it('should have default flags defined', () => {
    const flags = require('./flags.simple').flags;
    
    expect(flags).toBeDefined();
    expect(typeof flags).toBe('object');
  });

  it('should have aiOrchestrator flag defaulted to false', () => {
    const flags = require('./flags.simple').flags;
    
    expect(flags.aiOrchestrator).toBe(false);
  });

  it('should have exampleFeature flag defaulted to false', () => {
    const flags = require('./flags.simple').flags;
    
    expect(flags.exampleFeature).toBe(false);
  });
});

// Test the advanced feature flag manager
describe('Feature Flags - Advanced Manager', () => {
  let FeatureFlagManager: any;
  let manager: any;

  beforeEach(() => {
    // Clear module cache to get fresh instance
    jest.resetModules();
    const module = require('./flags');
    FeatureFlagManager = module.FeatureFlagManager;
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_FEATURE_AI_ORCHESTRATOR = 'false';
    process.env.NEXT_PUBLIC_FEATURE_NEW_UI = 'false';
    
    // Create new instance
    manager = new FeatureFlagManager();
  });

  it('should initialize with default flags', () => {
    const allFlags = manager.getAllFlags();
    
    expect(Array.isArray(allFlags)).toBe(true);
    expect(allFlags.length).toBeGreaterThan(0);
  });

  it('should check if aiOrchestrator flag is disabled by default', () => {
    const isEnabled = manager.isEnabled('aiOrchestrator');
    
    expect(isEnabled).toBe(false);
  });

  it('should enable a flag programmatically', () => {
    manager.enable('aiOrchestrator');
    const isEnabled = manager.isEnabled('aiOrchestrator');
    
    expect(isEnabled).toBe(true);
  });

  it('should disable a flag programmatically', () => {
    manager.enable('aiOrchestrator');
    manager.disable('aiOrchestrator');
    const isEnabled = manager.isEnabled('aiOrchestrator');
    
    expect(isEnabled).toBe(false);
  });

  it('should handle rollout percentage', () => {
    manager.register({
      name: 'test_feature',
      description: 'Test feature with rollout',
      enabled: true,
      rolloutPercentage: 50
    });

    // Test with multiple user IDs
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(manager.isEnabled('test_feature', `user_${i}`));
    }

    // Should have some enabled and some disabled (roughly 50%)
    const enabledCount = results.filter(r => r).length;
    expect(enabledCount).toBeGreaterThan(20);
    expect(enabledCount).toBeLessThan(80);
  });

  it('should return false for non-existent flag', () => {
    const isEnabled = manager.isEnabled('non_existent_flag');
    
    expect(isEnabled).toBe(false);
  });

  it('should use withFlag helper correctly', () => {
    const enabledResult = manager.withFlag(
      'aiOrchestrator',
      () => 'enabled',
      () => 'disabled'
    );
    
    expect(enabledResult).toBe('disabled'); // Default is false
    
    manager.enable('aiOrchestrator');
    const afterEnable = manager.withFlag(
      'aiOrchestrator',
      () => 'enabled',
      () => 'disabled'
    );
    
    expect(afterEnable).toBe('enabled');
  });
});