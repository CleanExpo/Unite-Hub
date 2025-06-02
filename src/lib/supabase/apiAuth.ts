import { createClient } from './server';
import { NextRequest, NextResponse } from 'next/server';

export function withApiAuth(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const supabase = await createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      return await handler(req, session.user.id);
    } catch {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
