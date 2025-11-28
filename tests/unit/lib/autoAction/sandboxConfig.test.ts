/**
 * Sandbox Manager Tests
 *
 * Tests for the sandbox constraint enforcement system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SandboxManager } from '@/lib/autoAction/sandboxConfig';

// Mock the config
vi.mock('@config/autoAction.config', () => ({
  autoActionConfig: {
    enabled: true,
    sandbox: {
      maxSteps: 10,
      stepTimeoutMs: 5000,
      sessionTimeoutMs: 30000,
      allowedOrigins: ['localhost', 'synthex.social', 'unite-hub.com'],
      blockedActions: ['deleteAccount', 'formatDisk', 'runShellCommands'],
      rateLimit: {
        maxActionsPerMinute: 5,
        maxSessionsPerHour: 3,
      },
    },
  },
}));

describe('SandboxManager', () => {
  let sandbox: SandboxManager;

  beforeEach(() => {
    sandbox = new SandboxManager();
  });

  describe('createSession', () => {
    it('should create a new session with correct initial state', () => {
      const session = sandbox.createSession('session_1', 'user_1');

      expect(session.sessionId).toBe('session_1');
      expect(session.stepCount).toBe(0);
      expect(session.actionsInCurrentMinute).toBe(0);
      expect(session.isActive).toBe(true);
      expect(session.violations.length).toBe(0);
    });

    it('should track hourly session limits per user', () => {
      // Create 3 sessions (the limit)
      sandbox.createSession('session_1', 'user_1');
      sandbox.createSession('session_2', 'user_1');
      sandbox.createSession('session_3', 'user_1');

      // Fourth session should fail
      expect(() => sandbox.createSession('session_4', 'user_1')).toThrow(
        'Hourly session limit exceeded'
      );
    });

    it('should allow different users to have their own limits', () => {
      sandbox.createSession('session_1', 'user_1');
      sandbox.createSession('session_2', 'user_1');
      sandbox.createSession('session_3', 'user_1');

      // Different user should work
      const session = sandbox.createSession('session_4', 'user_2');
      expect(session.sessionId).toBe('session_4');
    });
  });

  describe('validateAction', () => {
    it('should allow valid actions', () => {
      sandbox.createSession('session_1', 'user_1');

      const result = sandbox.validateAction(
        'session_1',
        'click',
        'https://localhost:3000/dashboard'
      );

      expect(result.allowed).toBe(true);
      expect(result.remainingSteps).toBe(9); // maxSteps - 1
    });

    it('should block actions for non-existent sessions', () => {
      const result = sandbox.validateAction(
        'non_existent',
        'click',
        'https://localhost/test'
      );

      expect(result.allowed).toBe(false);
      expect(result.violation?.type).toBe('timeout');
    });

    it('should block actions when max steps exceeded', () => {
      sandbox.createSession('session_1', 'user_1');

      // Record max steps
      for (let i = 0; i < 10; i++) {
        sandbox.recordAction('session_1');
      }

      const result = sandbox.validateAction('session_1', 'click');

      expect(result.allowed).toBe(false);
      expect(result.violation?.type).toBe('max_steps');
      expect(result.remainingSteps).toBe(0);
    });

    it('should block blocked actions', () => {
      sandbox.createSession('session_1', 'user_1');

      const result = sandbox.validateAction('session_1', 'deleteAccount');

      expect(result.allowed).toBe(false);
      expect(result.violation?.type).toBe('blocked_action');
    });

    it('should block non-allowed origins', () => {
      sandbox.createSession('session_1', 'user_1');

      const result = sandbox.validateAction(
        'session_1',
        'click',
        'https://malicious-site.com/steal'
      );

      expect(result.allowed).toBe(false);
      expect(result.violation?.type).toBe('blocked_origin');
    });

    it('should enforce rate limits', () => {
      sandbox.createSession('session_1', 'user_1');

      // Perform max actions
      for (let i = 0; i < 5; i++) {
        sandbox.recordAction('session_1');
      }

      const result = sandbox.validateAction('session_1', 'click');

      expect(result.allowed).toBe(false);
      expect(result.violation?.type).toBe('rate_limit');
      expect(result.remainingActionsThisMinute).toBe(0);
    });
  });

  describe('recordAction', () => {
    it('should increment step count', () => {
      sandbox.createSession('session_1', 'user_1');
      sandbox.recordAction('session_1');
      sandbox.recordAction('session_1');

      const session = sandbox.getSession('session_1');
      expect(session?.stepCount).toBe(2);
    });

    it('should track actions in current minute', () => {
      sandbox.createSession('session_1', 'user_1');
      sandbox.recordAction('session_1');

      const session = sandbox.getSession('session_1');
      expect(session?.actionsInCurrentMinute).toBe(1);
    });
  });

  describe('endSession', () => {
    it('should mark session as inactive', () => {
      sandbox.createSession('session_1', 'user_1');

      const endedSession = sandbox.endSession('session_1');

      expect(endedSession?.isActive).toBe(false);
    });

    it('should return undefined for non-existent sessions', () => {
      const result = sandbox.endSession('non_existent');
      expect(result).toBeUndefined();
    });
  });

  describe('isOriginAllowed', () => {
    it('should allow configured origins', () => {
      expect(sandbox.isOriginAllowed('https://localhost:3000')).toBe(true);
      expect(sandbox.isOriginAllowed('https://synthex.social/app')).toBe(true);
      expect(sandbox.isOriginAllowed('https://unite-hub.com')).toBe(true);
    });

    it('should block non-configured origins', () => {
      expect(sandbox.isOriginAllowed('https://evil.com')).toBe(false);
      expect(sandbox.isOriginAllowed('https://google.com')).toBe(false);
    });

    it('should handle subdomains', () => {
      expect(sandbox.isOriginAllowed('https://api.synthex.social')).toBe(true);
      expect(sandbox.isOriginAllowed('https://app.unite-hub.com')).toBe(true);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(sandbox.isOriginAllowed('not-a-url')).toBe(false);
      expect(sandbox.isOriginAllowed('')).toBe(false);
    });
  });

  describe('getActiveSessions', () => {
    it('should return only active sessions', () => {
      sandbox.createSession('session_1', 'user_1');
      sandbox.createSession('session_2', 'user_2');
      sandbox.endSession('session_1');

      const active = sandbox.getActiveSessions();

      expect(active.length).toBe(1);
      expect(active[0].sessionId).toBe('session_2');
    });
  });

  describe('getConfigSummary', () => {
    it('should return configuration values', () => {
      const summary = sandbox.getConfigSummary();

      expect(summary.maxSteps).toBe(10);
      expect(summary.maxActionsPerMinute).toBe(5);
      expect(summary.maxSessionsPerHour).toBe(3);
      expect(summary.allowedOrigins).toContain('localhost');
      expect(summary.blockedActions).toContain('deleteAccount');
    });
  });
});
