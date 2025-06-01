import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter is required' },
      { status: 400 }
    );
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const notificationData = await request.json();
  
  if (!notificationData.user_id || !notificationData.title || !notificationData.message) {
    return NextResponse.json(
      { error: 'user_id, title and message are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: notificationData.user_id,
      title: notificationData.title,
      message: notificationData.message,
      entity_type: notificationData.entity_type,
      entity_id: notificationData.entity_id,
      read: false
    }])
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data[0], { status: 201 });
}
