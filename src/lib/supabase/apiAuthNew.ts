import { createApiClient } from './api';
import { NextRequest, NextResponse } from 'next/server';

export function withApiAuthNew(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const supabase = await createApiClient();
      
      // Get the authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      // Verify the token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
      }
      
      return await handler(req, user.id);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}

// For endpoints that don't require auth
export function withoutAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
