import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { generateRoadmap } from '@/lib/roadmap';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const { tenantId, name, horizonMonths } = await req.json();
    if (!tenantId || !name || !horizonMonths) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (horizonMonths < 3 || horizonMonths > 12) {
      return NextResponse.json({ error: 'Horizon must be between 3 and 12 months' }, { status: 400 });
    }

    const roadmap = await generateRoadmap(tenantId, name, horizonMonths);

    return NextResponse.json({ success: true, roadmap });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
