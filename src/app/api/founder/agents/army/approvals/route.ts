import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: list pending approvals
export async function GET(_req: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from('army_approvals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ approvals: data ?? [] });
}

// POST: submit approval or rejection
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, action }: { id: string; action: 'approve' | 'reject' } = body;

  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'id and action (approve|reject) required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('army_approvals')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, status, action_type, title')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ approval: data });
}
