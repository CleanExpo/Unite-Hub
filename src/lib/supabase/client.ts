import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Export as both supabase and supabaseClient for compatibility
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseClient = supabase;
