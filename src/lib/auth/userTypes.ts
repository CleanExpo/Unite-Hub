/**
 * User Role Types
 *
 * Central type definitions for the role-based access control system.
 *
 * Roles:
 * - FOUNDER: Full access to Founder OS, Cognitive Twin, AI Phill, Approvals
 * - STAFF: Access to Staff CRM and operational tools
 * - CLIENT: Access to client dashboard and AI consultation
 * - ADMIN: Superuser with full system access
 */

export type UserRole = 'FOUNDER' | 'STAFF' | 'CLIENT' | 'ADMIN';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
}

/**
 * Role check helpers
 */
export const isFounder = (role: UserRole | null | undefined): boolean => role === 'FOUNDER';
export const isStaff = (role: UserRole | null | undefined): boolean => role === 'STAFF';
export const isClient = (role: UserRole | null | undefined): boolean => role === 'CLIENT';
export const isAdmin = (role: UserRole | null | undefined): boolean => role === 'ADMIN';

/**
 * Check if user has elevated privileges (Founder or Admin)
 */
export const hasElevatedAccess = (role: UserRole | null | undefined): boolean =>
  role === 'FOUNDER' || role === 'ADMIN';

/**
 * Check if user can access staff areas (Staff, Founder, or Admin)
 */
export const canAccessStaffAreas = (role: UserRole | null | undefined): boolean =>
  role === 'STAFF' || role === 'FOUNDER' || role === 'ADMIN';

/**
 * Get the default dashboard path for a role
 */
export const getDefaultDashboardForRole = (role: UserRole | null | undefined): string => {
  switch (role) {
    case 'FOUNDER':
      return '/founder';
    case 'STAFF':
      return '/staff/dashboard';
    case 'ADMIN':
      return '/admin';
    case 'CLIENT':
    default:
      return '/client';
  }
};
