import { getSupabaseServer } from '@/lib/supabase';

/**
 * Gets the user role for a given request
 * Retrieves from auth session and profiles table
 */
export async function getUserRole(req?: any) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get profile with role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Failed to fetch profile:', error);
      // Return user info even if profile doesn't exist yet
      return {
        id: user.id,
        email: user.email,
        role: 'customer' // default to customer
      };
    }

    return {
      id: profile?.id,
      email: profile?.email || user.email,
      role: profile?.role || 'customer'
    };
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Ensure user has a profile in the profiles table
 * Called during first login or profile creation
 */
export async function ensureUserProfile(userId: string, email: string) {
  try {
    const supabase = await getSupabaseServer();

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      return existing;
    }

    // Create new profile
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        role: 'customer' // default role
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }

    return newProfile;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
}

/**
 * Check if user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const supabase = await getSupabaseServer();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    return profile;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}
