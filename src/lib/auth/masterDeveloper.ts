import { MASTER_DEVELOPER_EMAIL, USER_ROLES, ROLE_PERMISSIONS } from '@/lib/constants';
import { supabaseClient } from '@/lib/supabase/client';

/**
 * Check if the current user is the master developer
 */
export async function isMasterDeveloper(email?: string): Promise<boolean> {
  if (!email) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    email = user?.email;
  }
  
  return email === MASTER_DEVELOPER_EMAIL;
}

/**
 * Get user role from profiles table
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data.role;
}

/**
 * Check if user has permission for an action
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const role = await getUserRole(userId);
  
  if (!role) return false;
  
  // Master developer has all permissions
  if (role === USER_ROLES.MASTER_DEVELOPER) {
    return true;
  }
  
  // Check specific role permissions
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  
  if (!permissions) return false;
  
  // Check if permissions array includes the specific permission
  return permissions.includes('all' as any) || permissions.includes(permission as any);
}

/**
 * Ensure only master developer can create/manage other users
 */
export async function canManageUsers(userId: string): Promise<boolean> {
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (!user || user.id !== userId) return false;
  
  // Check if user is master developer
  if (await isMasterDeveloper(user.email)) {
    return true;
  }
  
  // Check if user has manage_users permission
  return hasPermission(userId, 'manage_users');
}

export { ROLE_PERMISSIONS };
