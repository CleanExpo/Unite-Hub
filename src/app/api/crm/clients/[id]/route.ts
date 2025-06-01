import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for client update
const updateClientSchema = z.object({
  company_name: z.string().min(1).optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  annual_revenue: z.number().optional(),
  client_status: z.enum(['lead', 'active', 'inactive', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

// GET /api/crm/clients/[id] - Get a specific client
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client with related data
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects:projects(
          id,
          project_name,
          status,
          start_date,
          end_date,
          budget,
          progress_percentage
        ),
        interactions:interactions(
          id,
          interaction_type,
          subject,
          interaction_date,
          created_by
        ),
        consultations:consultations(
          id,
          preferred_date,
          service_type,
          status
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Error fetching client:', error);
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/crm/clients/[id] - Update a client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateClientSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get the original client data for activity logging
    const { data: originalClient } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .single();

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Error updating client:', error);
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    // Log activity with changes
    const changes: Record<string, any> = {};
    if (originalClient) {
      Object.keys(validationResult.data).forEach(key => {
        if (originalClient[key] !== validationResult.data[key as keyof typeof validationResult.data]) {
          changes[key] = {
            old: originalClient[key],
            new: validationResult.data[key as keyof typeof validationResult.data],
          };
        }
      });
    }

    await supabase.from('activity_log').insert([{
      entity_type: 'client',
      entity_id: params.id,
      action: 'updated',
      changes,
      performed_by: user.id,
    }]);

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/crm/clients/[id] - Delete a client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if client has active projects
    const { data: activeProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', params.id)
      .eq('status', 'active')
      .limit(1);

    if (activeProjects && activeProjects.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with active projects' },
        { status: 400 }
      );
    }

    // Delete client (will cascade delete related records)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert([{
      entity_type: 'client',
      entity_id: params.id,
      action: 'deleted',
      performed_by: user.id,
    }]);

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
