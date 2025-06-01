// Define a type for JSON values that can be stored in Supabase
export type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json } 
  | Json[];

// Activity log type
export interface ActivityLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  old_values?: Json | null;
  new_values?: Json | null;
  created_at: string;
  user?: {
    email?: string;
    avatar_url?: string;
  };
}
