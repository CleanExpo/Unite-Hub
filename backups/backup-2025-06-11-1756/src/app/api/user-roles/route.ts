import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function handleGET(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');

  // Check if user has permission to view other users' roles
  if (userId && userId !== user.id) {
    const { data: hasPermission } = await supabase
      .rpc('has_permission', { 
        user_id: user.id, 
        permission_name: 'system.users.view' 
      });

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const targetUserId = userId || user.id;

  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      roles (
        *,
        role_permissions (
          permissions (*)
        )
      )
    `)
    .eq('user_id', targetUserId);

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

  // Check if user has permission to assign roles
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.permissions.assign' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { user_id, role_id } = body;

  const { data, error } = await supabase
    .from('user_roles')
    .insert({ user_id, role_id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

async function handleDELETE(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to remove roles
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.permissions.assign' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const roleId = searchParams.get('role_id');

  if (!userId || !roleId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export const GET = handleGET;
export const POST = handlePOST;
export const DELETE = handleDELETE;
