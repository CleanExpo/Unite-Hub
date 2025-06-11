// ================================================
// Authentication Functions
// ================================================

import { AuthResponse, User, LoginCredentials, AUTH_ERROR_CODES, AuditLogEntry } from './types';
import { supabaseClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { email, password, rememberMe } = credentials;

    // Validate input
    if (!email || !password) {
      return {
        user: null,
        error: 'Email and password are required',
      };
    }

    // Attempt to sign in with Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Log failed login attempt
      await logAuthEvent({
        action: 'Login attempt failed',
        actionType: 'failed_login',
        targetUserEmail: email,
        success: false,
        errorMessage: authError?.message || 'Invalid credentials',
      });

      return {
        user: null,
        error: authError?.message || 'Invalid credentials',
      };
    }

    // Get user details with role from user_profiles table
    const { data: userData, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      return {
        user: null,
        error: 'Failed to fetch user details',
      };
    }

    // Check if user is active
    if (!userData.is_active) {
      await supabaseClient.auth.signOut();
      
      await logAuthEvent({
        action: 'Inactive user login attempt',
        actionType: 'failed_login',
        targetUserEmail: email,
        success: false,
        errorMessage: 'Account is inactive',
      });

      return {
        user: null,
        error: 'Your account has been deactivated. Please contact support.',
      };
    }

    // Update last login (Note: login tracking could be added to user_profiles if needed)
    await supabaseClient
      .from('user_profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.id);

    // Log successful login
    await logAuthEvent({
      action: 'User logged in',
      actionType: 'login',
      targetUserId: userData.id,
      targetUserEmail: userData.email,
      success: true,
    });

    // Create user object
    const user: User = {
      id: userData.id,
      email: authData.user.email || '',
      role: userData.role,
      isActive: userData.is_active,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      createdBy: userData.created_by,
      fullName: userData.full_name,
      phone: userData.phone,
      department: userData.department,
      jobTitle: userData.job_title,
    };

    // Create session
    const session = {
      accessToken: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token,
      expiresAt: new Date(authData.session?.expires_at || Date.now() + 3600000),
    };

    // Set session cookie if remember me is enabled
    if (rememberMe && typeof window === 'undefined') {
      // Server-side cookie setting
      const cookieStore = await cookies();
      cookieStore.set('auth-session', session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return {
      user,
      error: null,
      session,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: 'An unexpected error occurred during authentication',
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  try {
    // Get current user before signing out
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
      // Log logout event
      await logAuthEvent({
        action: 'User logged out',
        actionType: 'logout',
        targetUserId: user.id,
        targetUserEmail: user.email,
        success: true,
      });
    }

    // Sign out from Supabase
    await supabaseClient.auth.signOut();

    // Clear cookies if on server
    if (typeof window === 'undefined') {
      const cookieStore = await cookies();
      cookieStore.delete('auth-session');
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out');
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();

    if (!authUser) {
      return null;
    }

    // Get user details with role from user_profiles
    const { data: userData, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !userData || !userData.is_active) {
      return null;
    }

    return {
      id: userData.id,
      email: authUser.email || '',
      role: userData.role,
      isActive: userData.is_active,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      createdBy: userData.created_by,
      fullName: userData.full_name,
      phone: userData.phone,
      department: userData.department,
      jobTitle: userData.job_title,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabaseClient.auth.refreshSession();

    if (error || !data.user) {
      return {
        user: null,
        error: error?.message || 'Failed to refresh session',
      };
    }

    const user = await getCurrentUser();

    if (!user) {
      return {
        user: null,
        error: 'User not found',
      };
    }

    return {
      user,
      error: null,
      session: {
        accessToken: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token,
        expiresAt: new Date(data.session?.expires_at || Date.now() + 3600000),
      },
    };
  } catch (error) {
    console.error('Refresh session error:', error);
    return {
      user: null,
      error: 'Failed to refresh session',
    };
  }
}

/**
 * Check if user has specific permission
 */
export async function checkUserPermission(
  userId: string,
  module: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): Promise<boolean> {
  try {
    // Get user role from user_profiles
    const { data: userData } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!userData) return false;

    // Master role has all permissions
    if (userData.role === 'Master') return true;

    // Use the check_user_permission function from the database
    const { data: hasPermission } = await supabaseClient
      .rpc('check_user_permission', {
        p_user_id: userId,
        p_resource: module,
        p_action: action
      });

    return hasPermission || false;
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
}

/**
 * Log authentication event
 */
async function logAuthEvent(event: Partial<AuditLogEntry>): Promise<void> {
  try {
    const ipAddress = typeof window !== 'undefined' 
      ? null 
      : (await fetch('https://api.ipify.org?format=json').then(r => r.json())).ip;

    const userAgent = typeof window !== 'undefined'
      ? window.navigator.userAgent
      : null;

    await supabaseClient.from('permission_audit_log').insert({
      action: event.action,
      action_type: event.actionType,
      target_user_id: event.targetUserId,
      target_user_email: event.targetUserEmail,
      performed_by_id: event.performedById,
      performed_by_email: event.performedByEmail,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: event.details,
      success: event.success ?? true,
      error_message: event.errorMessage,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
    // Don't throw - logging failures shouldn't break auth flow
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  role: User['role'],
  createdBy: string
): Promise<AuthResponse> {
  try {
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        user: null,
        error: passwordValidation.errors.join('. '),
      };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return {
        user: null,
        error: authError?.message || 'Failed to create user',
      };
    }

    // Update user profile with role (trigger should have created the profile)
    const { data: userData, error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        role,
        created_by: createdBy,
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError || !userData) {
      // Rollback auth user creation
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      return {
        user: null,
        error: 'Failed to set user role',
      };
    }

    // Log user creation
    await logAuthEvent({
      action: 'User account created',
      actionType: 'grant',
      targetUserId: userData.id,
      targetUserEmail: authData.user.email || email,
      performedById: createdBy,
      details: { role },
      success: true,
    });

    const user: User = {
      id: userData.id,
      email: authData.user.email || email,
      role: userData.role,
      isActive: userData.is_active,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      createdBy: userData.created_by,
    };

    return {
      user,
      error: null,
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      user: null,
      error: 'Failed to create user account',
    };
  }
}
