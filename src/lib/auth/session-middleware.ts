import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export const withSession = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  async (req: NextRequest) => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };

export async function getUserRoleFromSession(request: NextRequest): Promise<string | null> {
  try {
    // Create a Supabase client for server-side operations
    const supabase = createClient();

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }

    // Get role from user metadata first (faster)
    if (session.user.user_metadata?.role) {
      return session.user.user_metadata.role;
    }

    // Fallback: Get user profile with role information from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      // If no profile exists, return null
      return null;
    }

    return profile.role;
  } catch (error) {
    console.error('Error getting user role from session:', error);
    return null;
  }
}