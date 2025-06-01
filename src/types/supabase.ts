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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export type Database = Record<string, any>;
