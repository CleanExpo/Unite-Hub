import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export function createClient() {
  return createServerComponentClient<Database>({ cookies });
}