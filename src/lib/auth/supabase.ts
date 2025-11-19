/**
 * Supabase Staff Authentication
 * Phase 1 - New authentication layer for staff users (founder, admin, developer)
 *
 * This runs parallel to existing authentication without breaking current flows
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Ensure environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create Supabase client for staff authentication
 * Uses the same Supabase instance as existing system
 */
export const supabaseStaff = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Staff login with email/password
 * @param email - Staff email address
 * @param password - Staff password
 */
export async function staffLogin(email: string, password: string) {
  const { data, error } = await supabaseStaff.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Staff login failed:', error.message);
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'No user data returned' };
  }

  // Verify user is actually staff
  const { data: staffData, error: staffError } = await supabaseStaff
    .from('staff_users')
    .select('id, role, active')
    .eq('id', data.user.id)
    .single();

  if (staffError || !staffData) {
    await supabaseStaff.auth.signOut();
    return { success: false, error: 'User is not authorized as staff' };
  }

  if (!staffData.active) {
    await supabaseStaff.auth.signOut();
    return { success: false, error: 'Staff account is inactive' };
  }

  // Log staff activity
  await logStaffActivity(data.user.id, 'staff_login', {
    email,
    role: staffData.role,
  });

  return {
    success: true,
    user: data.user,
    session: data.session,
    role: staffData.role,
  };
}

/**
 * Staff logout
 */
export async function staffLogout() {
  const { error } = await supabaseStaff.auth.signOut();

  if (error) {
    console.error('Staff logout failed:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get current staff session
 */
export async function getStaffSession() {
  const { data, error } = await supabaseStaff.auth.getSession();

  if (error) {
    console.error('Failed to get staff session:', error.message);
    return { session: null, error: error.message };
  }

  return { session: data.session, error: null };
}

/**
 * Get current staff user
 */
export async function getStaffUser() {
  const { data, error } = await supabaseStaff.auth.getUser();

  if (error) {
    console.error('Failed to get staff user:', error.message);
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

/**
 * Log staff activity to audit trail
 * @param staffId - Staff user ID
 * @param action - Action performed
 * @param metadata - Additional context
 */
export async function logStaffActivity(
  staffId: string,
  action: string,
  metadata: Record<string, any> = {}
) {
  try {
    await supabaseStaff.from('staff_activity_logs').insert({
      staff_id: staffId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log staff activity:', error);
    // Don't throw - activity logging shouldn't break the app
  }
}

/**
 * Check if user has specific staff role
 */
export async function hasStaffRole(userId: string, role: 'founder' | 'admin' | 'developer') {
  const { data, error } = await supabaseStaff
    .from('staff_users')
    .select('role, active')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.active && data.role === role;
}

/**
 * Middleware helper for protecting staff routes
 */
export async function requireStaffAuth() {
  const { user, error } = await getStaffUser();

  if (error || !user) {
    throw new Error('Unauthorized: Staff authentication required');
  }

  const { data: staffData } = await supabaseStaff
    .from('staff_users')
    .select('role, active')
    .eq('id', user.id)
    .single();

  if (!staffData || !staffData.active) {
    throw new Error('Unauthorized: Invalid or inactive staff account');
  }

  return { user, role: staffData.role };
}

/**
 * Client Authentication Functions
 * Phase 2 Step 5 - Client portal authentication
 */

/**
 * Client login with email/password
 * @param email - Client email address
 * @param password - Client password
 */
export async function clientLogin(email: string, password: string) {
  const { data, error } = await supabaseStaff.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Client login failed:', error.message);
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'No user data returned' };
  }

  // Verify user is actually a client
  const { data: clientData, error: clientError } = await supabaseStaff
    .from('client_users')
    .select('id, name, email, subscription_tier, active')
    .eq('id', data.user.id)
    .single();

  if (clientError || !clientData) {
    await supabaseStaff.auth.signOut();
    return { success: false, error: 'User does not have client portal access' };
  }

  if (!clientData.active) {
    await supabaseStaff.auth.signOut();
    return { success: false, error: 'Your account has been deactivated. Contact support.' };
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    client: clientData,
  };
}

/**
 * Client logout
 */
export async function clientLogout() {
  const { error } = await supabaseStaff.auth.signOut();

  if (error) {
    console.error('Client logout failed:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get current client session (with client_users table verification)
 */
export async function getClientSession() {
  const { data, error } = await supabaseStaff.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  // Verify user exists in client_users table
  const { data: clientData, error: clientError } = await supabaseStaff
    .from('client_users')
    .select('id, name, email, subscription_tier, active')
    .eq('id', data.session.user.id)
    .single();

  if (clientError || !clientData) {
    console.error('Client not found in client_users table:', clientError);
    return null;
  }

  // Check if client is active
  if (!clientData.active) {
    console.warn('Inactive client attempted access:', clientData.email);
    return null;
  }

  return {
    ...data.session,
    client: clientData,
  };
}

/**
 * Require client authentication (for API routes)
 */
export async function requireClientAuth() {
  const session = await getClientSession();

  if (!session) {
    throw new Error('Unauthorized: Client session required');
  }

  return session;
}
