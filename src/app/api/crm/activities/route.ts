import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkPermission } from '@/lib/auth/permissions';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to create CRM activities
  if (!await checkPermission(user, 'crm.activities.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const activityData = await req.json();
  
  // Validate required fields
  if (!activityData.client_id || !activityData.interaction_type) {
    return NextResponse.json({ error: 'Client ID and interaction type are required' }, { status: 400 });
  }

  // Create new activity
  const { data: newActivity, error } = await supabase
    .from('crm_activities')
    .insert({
      ...activityData,
      performed_by: user.id,
      interaction_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(newActivity, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission to view CRM activities
  if (!await checkPermission(user, 'crm.activities.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  // Fetch activities for client
  const { data: activities, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('client_id', clientId)
    .order('interaction_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(activities);
}
