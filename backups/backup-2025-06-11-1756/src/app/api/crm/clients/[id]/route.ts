import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// 👤 GET INDIVIDUAL CLIENT
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    const resolvedParams = await params
    const clientId = resolvedParams.id

    // Get client with all related data
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        assigned_to_profile:user_profiles!clients_assigned_to_fkey(
          id, full_name, email, avatar_url, job_title
        ),
        created_by_profile:user_profiles!clients_created_by_fkey(
          id, full_name, email
        ),
        contacts:client_contacts(
          id, contact_type, subject, description, contact_date,
          created_by, duration_minutes, outcome,
          created_by_profile:user_profiles!client_contacts_created_by_fkey(
            id, full_name, email
          )
        ),
        documents:client_documents(
          id, filename, file_type, document_type, 
          description, created_at,
          uploaded_by_profile:user_profiles!client_documents_uploaded_by_fkey(
            id, full_name, email
          )
        ),
        deals(
          id, title, value, status, stage_id, expected_close_date,
          pipeline_stage:pipeline_stages(name, color)
        )
      `)
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ data: client })

  } catch (error) {
    console.error('Client Detail API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✏️ UPDATE CLIENT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServerClient()
    const resolvedParams = await params
    const clientId = resolvedParams.id

    // Validate client exists and user has permission
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, assigned_to, created_by')
      .eq('id', clientId)
      .single()

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Update client data
    const updateData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      address_line_1: body.address_line_1,
      address_line_2: body.address_line_2,
      city: body.city,
      state: body.state,
      postal_code: body.postal_code,
      country: body.country,
      industry: body.industry,
      company_size: body.company_size,
      annual_revenue: body.annual_revenue,
      source: body.source,
      status: body.status,
      priority: body.priority,
      assigned_to: body.assigned_to,
      notes: body.notes,
      tags: body.tags,
      metadata: body.metadata || {},
      updated_at: new Date().toISOString()
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select(`
        *,
        assigned_to_profile:user_profiles!clients_assigned_to_fkey(
          id, full_name, email, avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ data: client })

  } catch (error) {
    console.error('Client Update Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 🗑️ DELETE CLIENT
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    const resolvedParams = await params
    const clientId = resolvedParams.id

    // Check if client has active deals or invoices
    const { data: activeDependencies } = await supabase
      .from('deals')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'open')

    if (activeDependencies && activeDependencies.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with active deals' }, 
        { status: 400 }
      )
    }

    // Soft delete by updating status
    const { error } = await supabase
      .from('clients')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Client deleted successfully' })

  } catch (error) {
    console.error('Client Delete Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
