export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server';
import UserTable from '@/components/users/UserTable';

export default async function UsersPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return <div>Unauthorized</div>;
  }

  // Check permissions
  const { data: hasPermission, error: permError } = await supabase.rpc('has_permission', {
    user_id: user.id,
    permission_name: 'system.users.view'
  });

  if (permError || !hasPermission) {
    return <div>Forbidden</div>;
  }

  // Fetch users
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profileError) {
    return <div>Error loading users</div>;
  }

  return <UserTable users={profiles} />;
}
