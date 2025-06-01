import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  
  // Extract query parameters
  const { searchParams } = new URL(req.url);
  const resourceType = searchParams.get('resource');
  const resourceId = searchParams.get('id');
  
  if (!resourceType || !resourceId) {
    return NextResponse.json(
      { error: 'Resource type and ID are required' },
      { status: 400 }
    );
  }

  try {
    const { data: activities, error } = await supabase
      .from('crm_activity_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        details,
        created_at,
        user:profiles!crm_activity_logs_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(activities);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching activities:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
