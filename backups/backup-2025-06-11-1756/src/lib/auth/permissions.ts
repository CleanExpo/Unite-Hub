import { createClient } from '@/lib/supabase/server'

export async function checkPermission(userId: string, permissionName: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('has_permission', {
    user_id: userId,
    permission_name: permissionName
  })

  if (error) {
    console.error('Permission check error:', error)
    return false
  }

  return data as boolean
}
