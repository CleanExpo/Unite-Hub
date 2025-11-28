/**
 * Critical Point Guard Tests
 *
 * Tests for the safety system that gates sensitive actions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CriticalPointGuard } from '@/lib/autoAction/criticalPointGuard';
import type { FaraAction } from '@/lib/autoAction/faraClient';

// Mock the config
vi.mock('@config/autoAction.config', () => ({
  autoActionConfig: {
    enabled: true,
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
      approvalTimeoutMs: 5000, // 5 seconds for tests
      autoRejectOnTimeout: true,
    },
    sandbox: {
      blockedActions: ['deleteAccount', 'formatDisk'],
      allowedOrigins: ['localhost', 'synthex.social'],
    },
  },
}));

describe('CriticalPointGuard', () => {
  let guard: CriticalPointGuard;

  beforeEach(() => {
    guard = new CriticalPointGuard();
  });

  describe('detectCriticalPoint', () => {
    it('should detect financial information patterns', () => {
      const action: FaraAction = {
        type: 'type',
        value: '4111111111111111',
        confidence: 0.9,
        reasoning: 'Entering credit card number',
      };

      const result = guard.detectCriticalPoint(
        action,
        'Enter your credit card number to complete the purchase'
      );

      expect(result.isCritical).toBe(true);
      expect(result.category).toBe('financial_information');
    });

    it('should detect password patterns', () => {
      const action: FaraAction = {
        type: 'type',
        value: 'secret123',
        confidence: 0.95,
        reasoning: 'Entering password',
      };

      const result = guard.detectCriticalPoint(
        action,
        'Please enter your password'
      );

      expect(result.isCritical).toBe(true);
      expect(result.category).toBe('passwords_and_security_answers');
    });

    it('should detect identity document patterns', () => {
      const action: FaraAction = {
        type: 'type',
        confidence: 0.9,
        reasoning: 'Entering passport number',
      };

      const result = guard.detectCriticalPoint(
        action,
        'Enter your passport number for verification'
      );

      expect(result.isCritical).toBe(true);
      expect(result.category).toBe('identity_documents');
    });

    it('should detect submission patterns from action target', () => {
      const action: FaraAction = {
        type: 'click',
        target: 'Submit Order',
        confidence: 0.95,
        reasoning: 'Clicking submit button',
      };

      const result = guard.detectCriticalPoint(action, 'Review your order');

      expect(result.isCritical).toBe(true);
    });

    it('should not flag non-critical actions', () => {
      const action: FaraAction = {
        type: 'type',
        value: 'John Doe',
        confidence: 0.9,
        reasoning: 'Entering name',
      };

      const result = guard.detectCriticalPoint(
        action,
        'Enter your full name'
      );

      expect(result.isCritical).toBe(false);
    });

    it('should detect destructive action patterns', () => {
      const action: FaraAction = {
        type: 'click',
        target: 'Delete Account',
        confidence: 0.9,
        reasoning: 'Clicking delete button',
      };

      const result = guard.detectCriticalPoint(
        action,
        'Are you sure you want to delete your account permanently?'
      );

      expect(result.isCritical).toBe(true);
      expect(result.category).toBe('destructive_actions');
    });
  });

  describe('createCriticalPoint', () => {
    it('should create a critical point with unique ID', async () => {
      const action: FaraAction = {
        type: 'click',
        target: 'Pay Now',
        confidence: 0.9,
        reasoning: 'Processing payment',
      };

      const detection = {
        isCritical: true,
        category: 'financial_information' as const,
        risk: 'critical' as const,
      };

      const cp = await guard.createCriticalPoint(
        'session_123',
        action,
        { pageUrl: 'https://localhost/checkout' },
        detection
      );

      expect(cp.id).toMatch(/^cp_\d+_[a-z0-9]+$/);
      expect(cp.sessionId).toBe('session_123');
      expect(cp.category).toBe('financial_information');
      expect(cp.status).toBe('pending');
    });
  });

  describe('submitApproval', () => {
    it('should process approval when callback exists', async () => {
      const action: FaraAction = {
        type: 'click',
        confidence: 0.9,
        reasoning: 'Test action',
      };

      const detection = {
        isCritical: true,
        category: 'financial_information' as const,
        risk: 'high' as const,
      };

      const cp = await guard.createCriticalPoint(
        'session_456',
        action,
        { pageUrl: 'https://localhost/test' },
        detection
      );

      // Start waiting in background
      const approvalPromise = guard.waitForApproval(cp.id);

      // Submit approval
      const success = guard.submitApproval({
        approved: true,
        criticalPointId: cp.id,
        respondedBy: 'test-user',
        timestamp: new Date(),
      });

      expect(success).toBe(true);

      // Check the approval result
      const result = await approvalPromise;
      expect(result.approved).toBe(true);
      expect(result.respondedBy).toBe('test-user');
    });
  });

  describe('isOriginAllowed', () => {
    it('should allow configured origins', () => {
      expect(guard.isOriginAllowed('https://localhost:3000/test')).toBe(true);
      expect(guard.isOriginAllowed('https://synthex.social/dashboard')).toBe(true);
    });

    it('should block non-configured origins', () => {
      expect(guard.isOriginAllowed('https://malicious-site.com')).toBe(false);
      expect(guard.isOriginAllowed('https://google.com')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(guard.isOriginAllowed('not-a-url')).toBe(false);
    });
  });

  describe('isActionBlocked', () => {
    it('should block configured actions', () => {
      expect(guard.isActionBlocked('deleteAccount')).toBe(true);
      expect(guard.isActionBlocked('formatDisk')).toBe(true);
    });

    it('should allow non-blocked actions', () => {
      expect(guard.isActionBlocked('click')).toBe(false);
      expect(guard.isActionBlocked('type')).toBe(false);
    });
  });

  describe('getPendingApprovals', () => {
    it('should return only pending approvals', async () => {
      const action: FaraAction = {
        type: 'click',
        confidence: 0.9,
        reasoning: 'Test',
      };

      const detection = {
        isCritical: true,
        category: 'financial_information' as const,
        risk: 'high' as const,
      };

      // Create multiple critical points
      await guard.createCriticalPoint(
        'session_a',
        action,
        { pageUrl: 'https://localhost/a' },
        detection
      );

      await guard.createCriticalPoint(
        'session_b',
        action,
        { pageUrl: 'https://localhost/b' },
        detection
      );

      const allPending = guard.getPendingApprovals();
      expect(allPending.length).toBe(2);

      const sessionAPending = guard.getPendingApprovals('session_a');
      expect(sessionAPending.length).toBe(1);
      expect(sessionAPending[0].sessionId).toBe('session_a');
    });
  });
});
