import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to view users
  const { data: hasPermission } = await supabase
    .rpc('has_permission', { 
      user_id: user.id, 
      permission_name: 'system.users.view' 
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get all users from profiles table
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Get emails from auth.users for each profile
  const users = await Promise.all(
    profiles.map(async (profile) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      return {
        ...profile,
        email: authUser?.user?.email
      };
    })
  );

  return NextResponse.json(users);
}
