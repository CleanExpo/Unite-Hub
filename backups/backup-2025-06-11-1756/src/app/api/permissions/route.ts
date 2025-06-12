import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function handleGET(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to view permissions
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.permissions.view' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const businessUnit = searchParams.get('business_unit');

  let query = supabase
    .from('permissions')
    .select('*')
    .order('business_unit', { ascending: true })
    .order('name', { ascending: true });

  if (businessUnit) {
    query = query.eq('business_unit', businessUnit);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

async function handlePOST(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to create permissions
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.permissions.assign' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, business_unit, resource, action } = body;

  const { data, error } = await supabase
    .from('permissions')
    .insert({
      name,
      description,
      business_unit,
      resource,
      action
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export const GET = handleGET;
export const POST = handlePOST;
