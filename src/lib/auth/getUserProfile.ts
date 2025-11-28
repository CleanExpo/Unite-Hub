/**
 * Server-side User Profile Helper
 *
 * Fetches the current user's profile in Server Components and API routes.
 * Uses the server-side Supabase client which reads session from cookies.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { UserRole } from './userTypes';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's profile from the server
 *
 * @returns UserProfile if authenticated, null otherwise
 *
 * @example
 * // In a Server Component or API route:
 * const profile = await getUserProfile();
 * if (!profile) {
 *   redirect('/login');
 * }
 * if (profile.role === 'FOUNDER') {
 *   // Show founder-specific content
 * }
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Normalize role to uppercase enum value
    const normalizedRole = normalizeRole(profile.role);

    return {
      ...profile,
      role: normalizedRole,
    } as UserProfile;
  } catch (error) {
    console.error('getUserProfile error:', error);
    return null;
  }
}

/**
 * Normalize legacy role strings to UserRole enum
 */
function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return 'CLIENT';
  const upperRole = role.toUpperCase();
  if (upperRole === 'FOUNDER') return 'FOUNDER';
  if (upperRole === 'ADMIN') return 'ADMIN';
  if (upperRole === 'STAFF') return 'STAFF';
  if (upperRole === 'CLIENT' || upperRole === 'CUSTOMER') return 'CLIENT';
  return 'CLIENT';
}

/**
 * Get user role only (lighter weight than full profile)
 */
export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile();
  return profile?.role || null;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile !== null;
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(expectedRole: UserRole): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === expectedRole;
}

/**
 * Check if current user has elevated access (FOUNDER or ADMIN)
 */
export async function hasElevatedAccess(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === 'FOUNDER' || profile?.role === 'ADMIN';
}
