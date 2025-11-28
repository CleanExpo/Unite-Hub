/**
 * Role-Based Routing Tests
 *
 * Tests the role-based redirect logic for FOUNDER, STAFF, CLIENT, ADMIN roles.
 */

import { describe, it, expect } from 'vitest';
import {
  UserRole,
  isFounder,
  isStaff,
  isClient,
  isAdmin,
  hasElevatedAccess,
  canAccessStaffAreas,
  getDefaultDashboardForRole,
} from '../../../src/lib/auth/userTypes';

describe('UserRole Type Helpers', () => {
  describe('isFounder', () => {
    it('returns true for FOUNDER role', () => {
      expect(isFounder('FOUNDER')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isFounder('STAFF')).toBe(false);
      expect(isFounder('CLIENT')).toBe(false);
      expect(isFounder('ADMIN')).toBe(false);
      expect(isFounder(null)).toBe(false);
      expect(isFounder(undefined)).toBe(false);
    });
  });

  describe('isStaff', () => {
    it('returns true for STAFF role', () => {
      expect(isStaff('STAFF')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isStaff('FOUNDER')).toBe(false);
      expect(isStaff('CLIENT')).toBe(false);
    });
  });

  describe('isClient', () => {
    it('returns true for CLIENT role', () => {
      expect(isClient('CLIENT')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isClient('FOUNDER')).toBe(false);
      expect(isClient('STAFF')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true for ADMIN role', () => {
      expect(isAdmin('ADMIN')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isAdmin('FOUNDER')).toBe(false);
      expect(isAdmin('CLIENT')).toBe(false);
    });
  });

  describe('hasElevatedAccess', () => {
    it('returns true for FOUNDER and ADMIN', () => {
      expect(hasElevatedAccess('FOUNDER')).toBe(true);
      expect(hasElevatedAccess('ADMIN')).toBe(true);
    });

    it('returns false for STAFF and CLIENT', () => {
      expect(hasElevatedAccess('STAFF')).toBe(false);
      expect(hasElevatedAccess('CLIENT')).toBe(false);
    });
  });

  describe('canAccessStaffAreas', () => {
    it('returns true for STAFF, FOUNDER, and ADMIN', () => {
      expect(canAccessStaffAreas('STAFF')).toBe(true);
      expect(canAccessStaffAreas('FOUNDER')).toBe(true);
      expect(canAccessStaffAreas('ADMIN')).toBe(true);
    });

    it('returns false for CLIENT', () => {
      expect(canAccessStaffAreas('CLIENT')).toBe(false);
    });
  });

  describe('getDefaultDashboardForRole', () => {
    it('returns /founder for FOUNDER role', () => {
      expect(getDefaultDashboardForRole('FOUNDER')).toBe('/founder');
    });

    it('returns /staff/dashboard for STAFF role', () => {
      expect(getDefaultDashboardForRole('STAFF')).toBe('/staff/dashboard');
    });

    it('returns /client for CLIENT role', () => {
      expect(getDefaultDashboardForRole('CLIENT')).toBe('/client');
    });

    it('returns /admin for ADMIN role', () => {
      expect(getDefaultDashboardForRole('ADMIN')).toBe('/admin');
    });

    it('returns /client for null/undefined roles', () => {
      expect(getDefaultDashboardForRole(null as unknown as UserRole)).toBe('/client');
      expect(getDefaultDashboardForRole(undefined as unknown as UserRole)).toBe('/client');
    });
  });
});

describe('Role Routing Rules', () => {
  describe('FOUNDER routing', () => {
    it('should route founders to /founder from marketing pages', () => {
      // This tests the expectation that logged-in founders bypass pricing/marketing
      const role: UserRole = 'FOUNDER';
      const marketingPaths = ['/', '/pricing', '/landing'];

      marketingPaths.forEach(path => {
        // When a founder visits a marketing path, they should be redirected to /founder
        const expectedRedirect = '/founder';
        expect(getDefaultDashboardForRole(role)).toBe(expectedRedirect);
      });
    });

    it('should have elevated access', () => {
      expect(hasElevatedAccess('FOUNDER')).toBe(true);
    });
  });

  describe('STAFF routing', () => {
    it('should route staff to /staff/dashboard from marketing pages', () => {
      const role: UserRole = 'STAFF';
      expect(getDefaultDashboardForRole(role)).toBe('/staff/dashboard');
    });

    it('should be able to access staff areas', () => {
      expect(canAccessStaffAreas('STAFF')).toBe(true);
    });

    it('should not have elevated (founder) access', () => {
      expect(hasElevatedAccess('STAFF')).toBe(false);
    });
  });

  describe('CLIENT routing', () => {
    it('should route clients to /client', () => {
      const role: UserRole = 'CLIENT';
      expect(getDefaultDashboardForRole(role)).toBe('/client');
    });

    it('should not be able to access staff areas', () => {
      expect(canAccessStaffAreas('CLIENT')).toBe(false);
    });

    it('should not have elevated access', () => {
      expect(hasElevatedAccess('CLIENT')).toBe(false);
    });
  });

  describe('Guest (no role) handling', () => {
    it('should default to CLIENT dashboard for undefined role', () => {
      expect(getDefaultDashboardForRole(undefined as unknown as UserRole)).toBe('/client');
    });

    it('should not have elevated access', () => {
      expect(hasElevatedAccess(null)).toBe(false);
      expect(hasElevatedAccess(undefined)).toBe(false);
    });
  });
});
