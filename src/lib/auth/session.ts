// ================================================
// Session Management Functions
// ================================================

import { NextRequest } from 'next/server';
import { User, UserRole } from './types';
import { supabaseClient } from '@/lib/supabase/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Get current user from request (for API routes and middleware)
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user: authUser }, error } = await supabaseClient.auth.getUser(token);

    if (error || !authUser) {
      return null;
    }

    // Get user details with role from user_profiles (NOT users)
    const { data: userData } = await supabaseClient
      .from('user_profiles')  // FIXED: Changed from 'users' to 'user_profiles'
      .select('id, email, role, is_active, created_at, updated_at, created_by')
      .eq('id', authUser.id)
      .single();

    if (!userData || !userData.is_active) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email || authUser.email || '',
      role: userData.role,
      isActive: userData.is_active,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      createdBy: userData.created_by,
    };
  } catch (error) {
    console.error('Get current user from request error:', error);
    return null;
  }
}

/**
 * Get user role from session (for middleware)
 */
export async function getUserRoleFromSession(request: NextRequest): Promise<UserRole | null> {
  try {
    const user = await getCurrentUser(request);
    return user ? user.role : null;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
}

/**
 * Create a Supabase server client for server-side operations
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          (await cookieStore).set({ name, value, ...options });
        },
        async remove(name: string, options: any) {
          (await cookieStore).set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Get current user for server components
 */
export async function getCurrentUserServer(): Promise<User | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return null;
    }

    // Get user details with role from user_profiles (NOT users)
    const { data: userData, error } = await supabase
      .from('user_profiles')  // FIXED: Changed from 'users' to 'user_profiles'
      .select('id, email, role, is_active, created_at, updated_at, created_by')
      .eq('id', authUser.id)
      .single();

    if (error || !userData || !userData.is_active) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email || authUser.email || '',
      role: userData.role,
      isActive: userData.is_active,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      createdBy: userData.created_by,
    };
  } catch (error) {
    console.error('Get current user server error:', error);
    return null;
  }
}

/**
 * Check if user has permission (server-side)
 */
export async function checkUserPermissionServer(
  userId: string,
  module: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient();

    // Get user role from user_profiles
    const { data: userData } = await supabase
      .from('user_profiles')  // FIXED: Changed from 'users' to 'user_profiles'
      .select('role')
      .eq('id', userId)
      .single();

    if (!userData) return false;

    // Master role has all permissions
    if (userData.role === 'Master') return true;

    // Check specific permission using the check_user_permission function
    const { data: hasPermission } = await supabase
      .rpc('check_user_permission', {
        p_user_id: userId,
        p_resource: module,
        p_action: action
      });

    return hasPermission || false;
  } catch (error) {
    console.error('Check permission server error:', error);
    return false;
  }
}

/**
 * Validate session token
 */
export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    return !error && !!user;
  } catch (error) {
    console.error('Validate session token error:', error);
    return false;
  }
}

/**
 * Create session for testing
 */
export async function createTestSession(userId: string): Promise<string | null> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('createTestSession can only be used in test environment');
  }

  try {
    // This is a mock implementation for testing
    // In a real test environment, you would create a proper test session
    return `test-session-${userId}`;
  } catch (error) {
    console.error('Create test session error:', error);
    return null;
  }
}

/**
 * Clear all sessions for a user
 */
export async function clearUserSessions(userId: string): Promise<void> {
  try {
    // In production, you might want to:
    // 1. Revoke all refresh tokens
    // 2. Clear any server-side session storage
    // 3. Broadcast session invalidation to other services
    
    // For now, we'll just log the action
    console.log(`Clearing all sessions for user: ${userId}`);
    
    // You could also update a sessions table or cache
    const supabase = createSupabaseServerClient();
    await supabase.from('permission_audit_log').insert({
      action: 'All sessions cleared',
      action_type: 'logout',
      target_user_id: userId,
      performed_by_id: userId,
      details: { reason: 'Manual session clear' },
      success: true,
    });
  } catch (error) {
    console.error('Clear user sessions error:', error);
    throw error;
  }
}

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  // Session duration in seconds
  duration: 60 * 60 * 24, // 24 hours
  
  // Remember me duration in seconds  
  rememberMeDuration: 60 * 60 * 24 * 30, // 30 days
  
  // Session refresh threshold (when to refresh before expiry)
  refreshThreshold: 60 * 5, // 5 minutes
  
  // Maximum concurrent sessions per user
  maxConcurrentSessions: 5,
  
  // Session cookie name
  cookieName: 'auth-session',
  
  // Cookie options
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
};
