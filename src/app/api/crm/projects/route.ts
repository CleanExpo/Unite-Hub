import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch projects data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        description,
        status,
        priority,
        start_date,
        end_date,
        budget,
        progress_percentage,
        client_id,
        clients (
          company_name,
          contact_person
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projects || []
    });

  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      client_id,
      project_name,
      description,
      project_type,
      status = 'planning',
      priority = 'medium',
      start_date,
      end_date,
      budget
    } = body;

    // Validate required fields
    if (!client_id || !project_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new project
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        client_id,
        project_name,
        description,
        project_type,
        status,
        priority,
        start_date,
        end_date,
        budget,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
