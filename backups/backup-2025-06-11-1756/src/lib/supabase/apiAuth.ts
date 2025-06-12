import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type ApiHandler = (req: NextRequest, userId: string) => Promise<NextResponse>;

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      // Create Supabase client
      const supabase = await createClient();
      
      // Get the user from the session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError.message);
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - No user found' },
          { status: 401 }
        );
      }
      
      // Call the handler with the authenticated user ID
      return await handler(req, user.id);
    } catch (error) {
      console.error('API Auth wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export async function getAuthenticatedUser(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    throw error;
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return user;
}

export async function optionalAuth(req: NextRequest) {
  try {
    return await getAuthenticatedUser(req);
  } catch {
    return null;
  }
}
