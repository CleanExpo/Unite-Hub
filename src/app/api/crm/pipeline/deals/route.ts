import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ðŸ“Š GET PIPELINE DEALS
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()

    // Get pipeline deals with stages
    const { data: deals, error } = await supabase
      .from('pipeline_deals')
      .select(`
        *,
        client:clients(
          id, name, company, email
        ),
        assigned_to_profile:user_profiles!pipeline_deals_assigned_to_fkey(
          id, full_name, email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pipeline deals:', error)
      return NextResponse.json({ error: 'Failed to fetch pipeline deals' }, { status: 500 })
    }

    return NextResponse.json({ data: deals || [] })

  } catch (error) {
    console.error('Pipeline Deals API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ðŸ“ CREATE NEW PIPELINE DEAL
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    const dealData = {
      title: body.title,
      description: body.description,
      value: body.value,
      client_id: body.client_id,
      stage: body.stage || 'lead',
      assigned_to: body.assigned_to || user.id,
      expected_close_date: body.expected_close_date,
      priority: body.priority || 'medium',
      probability: body.probability || 50,
      tags: body.tags || [],
      metadata: body.metadata || {},
      created_by: user.id,
      created_at: new Date().toISOString()
    }

    const { data: deal, error } = await supabase
      .from('pipeline_deals')
      .insert(dealData)
      .select(`
        *,
        client:clients(
          id, name, company, email
        ),
        assigned_to_profile:user_profiles!pipeline_deals_assigned_to_fkey(
          id, full_name, email
        )
      `)
      .single()

    if (error) {
      console.error('Error creating pipeline deal:', error)
      return NextResponse.json({ error: 'Failed to create pipeline deal' }, { status: 500 })
    }

    return NextResponse.json({ data: deal }, { status: 201 })

  } catch (error) {
    console.error('Pipeline Deal Creation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
