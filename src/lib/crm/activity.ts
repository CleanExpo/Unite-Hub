import { createClient } from '@/utils/supabase/server';
import { Json } from '@/types/supabase';

type LogActivityParams = {
  user_id: string;
  action: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  old_values?: Json | null;
  new_values?: Json | null;
};

export async function logActivity(params: LogActivityParams) {
  const supabase = createClient();
  const { error } = await supabase.from('crm_activity_log').insert({
    user_id: params.user_id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    old_values: params.old_values,
    new_values: params.new_values
  });

  if (error) {
    console.error('Failed to log activity:', error);
  }
}
