/**
 * RBAC System - Permission Tests
 *
 * Unit tests for the permission checking system.
 * Run with: npm test or jest
 */

import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRoleOrHigher,
  getRoleDisplayName,
  getRoleDescription,
  getPermissionsForRole,
  ROLE_HIERARCHY,
  UserRole,
} from '../permissions';

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('should allow owner to access billing', () => {
      expect(hasPermission('owner', 'billing:manage')).toBe(true);
    });

    it('should deny admin from accessing billing', () => {
      expect(hasPermission('admin', 'billing:manage')).toBe(false);
    });

    it('should allow member to create contacts', () => {
      expect(hasPermission('member', 'contact:create')).toBe(true);
    });

    it('should deny viewer from creating contacts', () => {
      expect(hasPermission('viewer', 'contact:create')).toBe(false);
    });

    it('should allow everyone to view contacts', () => {
      expect(hasPermission('owner', 'contact:view')).toBe(true);
      expect(hasPermission('admin', 'contact:view')).toBe(true);
      expect(hasPermission('member', 'contact:view')).toBe(true);
      expect(hasPermission('viewer', 'contact:view')).toBe(true);
    });

    it('should handle undefined role', () => {
      expect(hasPermission(undefined, 'contact:view')).toBe(false);
      expect(hasPermission(null, 'contact:view')).toBe(false);
    });

    it('should handle invalid permission', () => {
      expect(hasPermission('owner', 'invalid:permission' as any)).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should allow admin to have multiple permissions', () => {
      expect(hasAllPermissions('admin', [
        'contact:view',
        'contact:create',
        'contact:update',
      ])).toBe(true);
    });

    it('should deny member from having admin permissions', () => {
      expect(hasAllPermissions('member', [
        'contact:view',
        'contact:delete', // Member cannot delete
      ])).toBe(false);
    });

    it('should handle empty array', () => {
      expect(hasAllPermissions('viewer', [])).toBe(true);
    });

    it('should handle undefined role', () => {
      expect(hasAllPermissions(undefined, ['contact:view'])).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should allow member to have at least one permission', () => {
      expect(hasAnyPermission('member', [
        'billing:manage',    // No
        'contact:create',    // Yes
      ])).toBe(true);
    });

    it('should deny viewer from having any write permissions', () => {
      expect(hasAnyPermission('viewer', [
        'contact:create',
        'contact:update',
        'contact:delete',
      ])).toBe(false);
    });

    it('should handle empty array', () => {
      expect(hasAnyPermission('owner', [])).toBe(false);
    });
  });

  describe('hasRoleOrHigher', () => {
    it('should correctly compare role hierarchy', () => {
      expect(hasRoleOrHigher('owner', 'admin')).toBe(true);
      expect(hasRoleOrHigher('owner', 'member')).toBe(true);
      expect(hasRoleOrHigher('owner', 'viewer')).toBe(true);
      expect(hasRoleOrHigher('owner', 'owner')).toBe(true);
    });

    it('should deny lower roles', () => {
      expect(hasRoleOrHigher('member', 'admin')).toBe(false);
      expect(hasRoleOrHigher('viewer', 'member')).toBe(false);
    });

    it('should handle undefined role', () => {
      expect(hasRoleOrHigher(undefined, 'viewer')).toBe(false);
      expect(hasRoleOrHigher(null, 'viewer')).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return formatted role names', () => {
      expect(getRoleDisplayName('owner')).toBe('Owner');
      expect(getRoleDisplayName('admin')).toBe('Admin');
      expect(getRoleDisplayName('member')).toBe('Member');
      expect(getRoleDisplayName('viewer')).toBe('Viewer');
    });
  });

  describe('getRoleDescription', () => {
    it('should return role descriptions', () => {
      const ownerDesc = getRoleDescription('owner');
      expect(ownerDesc).toContain('billing');
      expect(ownerDesc).toContain('organization');

      const viewerDesc = getRoleDescription('viewer');
      expect(viewerDesc).toContain('View-only');
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for owner', () => {
      const permissions = getPermissionsForRole('owner');
      expect(permissions).toContain('billing:manage');
      expect(permissions).toContain('org:delete');
      expect(permissions).toContain('contact:create');
      expect(permissions.length).toBeGreaterThan(50); // Owner has 90+ permissions
    });

    it('should return limited permissions for viewer', () => {
      const permissions = getPermissionsForRole('viewer');
      expect(permissions).toContain('contact:view');
      expect(permissions).toContain('campaign:view');
      expect(permissions).not.toContain('contact:delete');
      expect(permissions).not.toContain('billing:manage');
    });

    it('should return different counts per role', () => {
      const ownerPerms = getPermissionsForRole('owner');
      const adminPerms = getPermissionsForRole('admin');
      const memberPerms = getPermissionsForRole('member');
      const viewerPerms = getPermissionsForRole('viewer');

      expect(ownerPerms.length).toBeGreaterThan(adminPerms.length);
      expect(adminPerms.length).toBeGreaterThan(memberPerms.length);
      expect(memberPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.owner).toBe(4);
      expect(ROLE_HIERARCHY.admin).toBe(3);
      expect(ROLE_HIERARCHY.member).toBe(2);
      expect(ROLE_HIERARCHY.viewer).toBe(1);
    });

    it('should have descending order', () => {
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.member);
      expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.viewer);
    });
  });

  describe('Critical Permissions', () => {
    it('should protect billing from non-owners', () => {
      expect(hasPermission('owner', 'billing:manage')).toBe(true);
      expect(hasPermission('admin', 'billing:manage')).toBe(false);
      expect(hasPermission('member', 'billing:manage')).toBe(false);
      expect(hasPermission('viewer', 'billing:manage')).toBe(false);
    });

    it('should protect org deletion from non-owners', () => {
      expect(hasPermission('owner', 'org:delete')).toBe(true);
      expect(hasPermission('admin', 'org:delete')).toBe(false);
      expect(hasPermission('member', 'org:delete')).toBe(false);
      expect(hasPermission('viewer', 'org:delete')).toBe(false);
    });

    it('should allow admins to manage team', () => {
      expect(hasPermission('owner', 'org:invite')).toBe(true);
      expect(hasPermission('admin', 'org:invite')).toBe(true);
      expect(hasPermission('member', 'org:invite')).toBe(false);
      expect(hasPermission('viewer', 'org:invite')).toBe(false);
    });

    it('should protect contact deletion', () => {
      expect(hasPermission('owner', 'contact:delete')).toBe(true);
      expect(hasPermission('admin', 'contact:delete')).toBe(true);
      expect(hasPermission('member', 'contact:delete')).toBe(false);
      expect(hasPermission('viewer', 'contact:delete')).toBe(false);
    });

    it('should protect campaign sending', () => {
      expect(hasPermission('owner', 'campaign:send')).toBe(true);
      expect(hasPermission('admin', 'campaign:send')).toBe(true);
      expect(hasPermission('member', 'campaign:send')).toBe(false);
      expect(hasPermission('viewer', 'campaign:send')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null role gracefully', () => {
      expect(hasPermission(null, 'contact:view')).toBe(false);
      expect(hasAllPermissions(null, ['contact:view'])).toBe(false);
      expect(hasAnyPermission(null, ['contact:view'])).toBe(false);
    });

    it('should handle undefined role gracefully', () => {
      expect(hasPermission(undefined, 'contact:view')).toBe(false);
      expect(hasAllPermissions(undefined, ['contact:view'])).toBe(false);
      expect(hasAnyPermission(undefined, ['contact:view'])).toBe(false);
    });

    it('should handle empty permission arrays', () => {
      expect(hasAllPermissions('owner', [])).toBe(true); // No requirements = pass
      expect(hasAnyPermission('owner', [])).toBe(false);  // No options = fail
    });

    it('should be case-sensitive for roles', () => {
      // TypeScript should catch this, but test runtime behavior
      expect(hasPermission('Owner' as UserRole, 'contact:view')).toBe(false);
      expect(hasPermission('OWNER' as UserRole, 'contact:view')).toBe(false);
    });
  });
});
