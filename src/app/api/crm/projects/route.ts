import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sbAuthToken = cookieStore.get('sb-hdfggelozqzdxvupbnbp-auth-token');

    if (!sbAuthToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Your logic here to fetch projects using the authenticated session
    // For example, you might call a Supabase function or directly query the database

    // Example response:
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
