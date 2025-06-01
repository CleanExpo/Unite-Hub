import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

// Function to check user permissions
export async function checkPermission(user: User, permissionName: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('has_permission', {
    user_id: user.id,
    permission_name: permissionName
  });

  if (error) {
    console.error('Permission check error:', error);
    return false;
  }

  return data as boolean;
}
