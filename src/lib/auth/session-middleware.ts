// ================================================
// Session Management for Middleware - Cookie Based
// ================================================

import { NextRequest } from 'next/server';
import { UserRole } from './types';
import { createServerClient } from '@supabase/ssr';

/**
 * Get user role from session for middleware using cookies
 */
export async function getUserRoleFromSession(request: NextRequest): Promise<UserRole | null> {
  try {
    // Create a Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Middleware can't set cookies, but we don't need to for reading
          },
          remove(name: string, options: any) {
            // Middleware can't remove cookies, but we don't need to for reading
          },
        },
      }
    );

    // Get the session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      console.log('No session found in middleware');
      return null;
    }

    // Get user profile with role
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    return userData.role as UserRole;
  } catch (error) {
    console.error('Get user role from session error:', error);
    return null;
  }
}
