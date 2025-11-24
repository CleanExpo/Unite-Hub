import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { executeAdjustment } from '@/lib/evolution/adjustmentEngine';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenantId, taskId, adjustmentType, targetEntity } = await req.json();
    if (!tenantId || !taskId || !adjustmentType || !targetEntity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adjustment = await executeAdjustment(tenantId, taskId, adjustmentType, targetEntity);

    return NextResponse.json({ success: true, adjustment });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
