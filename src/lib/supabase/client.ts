'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Export the createClient function explicitly as required by Vercel
export function createClient() {
  return createClientComponentClient<Database>();
}

// Also export the client instance for convenience
export const supabaseClient = createClient();