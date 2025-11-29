/**
 * Session Management - PKCE Flow
 *
 * Handles session retrieval and validation using PKCE cookies.
 * This is the single source of truth for session state.
 *
 * @module core/auth/session
 */

import { createClient } from '@/lib/supabase/server';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from './types';

/**
 * Session validation result
 */
export interface SessionResult {
  valid: boolean;
  user: User | null;
  session: Session | null;
  supabase: SupabaseClient;
  error?: string;
}

/**
 * Profile fetch result
 */
export interface ProfileResult {
  profile: UserProfile | null;
  role: UserRole;
  error?: string;
}

/**
 * Get and validate the current session from cookies
 *
 * Uses getUser() instead of getSession() for JWT validation.
 * This is the recommended approach per Supabase security guidelines.
 *
 * @returns SessionResult with validation status
 */
export async function getValidatedSession(): Promise<SessionResult> {
  const supabase = await createClient();

  // Use getUser() for JWT validation (more secure than getSession)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      valid: false,
      user: null,
      session: null,
      supabase,
      error: userError?.message || 'No authenticated user',
    };
  }

  // Get session for token access if needed
  const { data: { session } } = await supabase.auth.getSession();

  return {
    valid: true,
    user,
    session,
    supabase,
  };
}

/**
 * Get user profile with role from database
 *
 * @param supabase - Supabase client
 * @param userId - User ID to fetch profile for
 * @returns ProfileResult with role defaulting to CLIENT
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileResult> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Session] Error fetching profile:', error.message);
    return {
      profile: null,
      role: 'CLIENT', // Default to most restrictive
      error: error.message,
    };
  }

  if (!profile) {
    return {
      profile: null,
      role: 'CLIENT',
      error: 'Profile not found',
    };
  }

  return {
    profile: profile as UserProfile,
    role: (profile.role as UserRole) || 'CLIENT',
  };
}

/**
 * Get user's workspace ID from their organization membership
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Workspace ID or null
 */
export async function getUserWorkspace(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // First, try to get from user_organizations
  const { data: membership, error } = await supabase
    .from('user_organizations')
    .select('organization_id, organizations(id)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Session] Error fetching workspace:', error.message);
    return null;
  }

  if (membership?.organization_id) {
    return membership.organization_id;
  }

  // Fallback: check workspaces table directly
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  return workspace?.id || null;
}

/**
 * Full session context for protected routes
 */
export interface FullSessionContext {
  user: User;
  profile: UserProfile;
  role: UserRole;
  workspaceId: string;
  supabase: SupabaseClient;
}

/**
 * Get complete session context including profile and workspace
 *
 * @returns FullSessionContext or null if not authenticated
 */
export async function getFullSessionContext(): Promise<FullSessionContext | null> {
  const sessionResult = await getValidatedSession();

  if (!sessionResult.valid || !sessionResult.user) {
    return null;
  }

  const { user, supabase } = sessionResult;

  // Get profile with role
  const profileResult = await getUserProfile(supabase, user.id);

  // Get workspace
  const workspaceId = await getUserWorkspace(supabase, user.id);

  if (!workspaceId) {
    console.error('[Session] No workspace found for user:', user.id);
    return null;
  }

  return {
    user,
    profile: profileResult.profile || {
      id: user.id,
      email: user.email || '',
      role: profileResult.role,
    },
    role: profileResult.role,
    workspaceId,
    supabase,
  };
}
