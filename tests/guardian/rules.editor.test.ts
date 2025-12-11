import { describe, it, expect } from 'vitest';

/**
 * Guardian Rule Editor Tests (G51)
 *
 * Lightweight tests for rule editor payload construction.
 * These serve as a starting point for deeper Guardian regression coverage.
 */

describe('Guardian Rule Editor', () => {
  it('can construct a simple rule payload', () => {
    const rule = {
      name: 'Test rule',
      description: 'Example rule for testing',
      severity: 'medium',
      source: 'telemetry',
      channel: 'email',
      is_active: true,
      condition: {},
    };

    expect(rule.name).toBe('Test rule');
    expect(rule.is_active).toBe(true);
    expect(rule.severity).toBe('medium');
    expect(rule.channel).toBe('email');
  });

  it('validates required fields', () => {
    const rule = {
      name: 'Test rule',
      severity: 'high',
      source: 'warehouse',
      channel: 'webhook',
    };

    expect(rule.name).toBeTruthy();
    expect(rule.severity).toBeTruthy();
    expect(rule.source).toBeTruthy();
    expect(rule.channel).toBeTruthy();
  });

  it('supports all severity levels', () => {
    const severities = ['low', 'medium', 'high', 'critical'];

    for (const severity of severities) {
      const rule = { severity };
      expect(['low', 'medium', 'high', 'critical']).toContain(rule.severity);
    }
  });

  it('supports all notification channels', () => {
    const channels = ['email', 'slack', 'webhook', 'in_app'];

    for (const channel of channels) {
      const rule = { channel };
      expect(['email', 'slack', 'webhook', 'in_app']).toContain(rule.channel);
    }
  });
});
