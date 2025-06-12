import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function handleGET(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to view roles
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.roles.view' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('roles')
    .select(`
      *,
      role_permissions (
        permission_id,
        permissions (*)
      )
    `)
    .order('name', { ascending: true });

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

  // Check if user has permission to create roles
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.roles.create' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, permissions } = body;

  // Start a transaction
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({ name, description })
    .select()
    .single();

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 400 });
  }

  // Assign permissions to the role
  if (permissions && permissions.length > 0) {
    const rolePermissions = permissions.map((permissionId: string) => ({
      role_id: role.id,
      permission_id: permissionId
    }));

    const { error: permError } = await supabase
      .from('role_permissions')
      .insert(rolePermissions);

    if (permError) {
      return NextResponse.json({ error: permError.message }, { status: 400 });
    }
  }

  return NextResponse.json(role);
}

export const GET = handleGET;
export const POST = handlePOST;
