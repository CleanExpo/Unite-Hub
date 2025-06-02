import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function handleGET(req, userId) () {
  const supabase = await createClient();
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url')
    .order('full_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(users);
}

export const GET = withApiAuth(handleGET);