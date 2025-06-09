import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// 💼 DEALS MANAGEMENT API - GET ALL DEALS
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const stageId = searchParams.get('stage_id') || ''
    const assignedTo = searchParams.get('assigned_to') || ''
    
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('deals')
      .select(`
        *,
        client:clients(
          id, name, email, company, status
        ),
        assigned_to_profile:user_profiles!deals_assigned_to_fkey(
          id, full_name, email, avatar_url
        ),
        pipeline_stage:pipeline_stages(
          id, name, color, probability
        ),
        created_by_profile:user_profiles!deals_created_by_fkey(
          id, full_name, email
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (stageId) {
      query = query.eq('stage_id', stageId)
    }
    
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Execute query with pagination
    const { data: deals, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching deals:', error)
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: deals || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Deals API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 💼 DEALS MANAGEMENT API - CREATE NEW DEAL
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    // Validate required fields
    if (!body.title || !body.client_id || !body.value) {
      return NextResponse.json(
        { error: 'Title, client ID, and value are required' }, 
        { status: 400 }
      )
    }

    // Get user profile for created_by
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get first pipeline stage if none provided
    let stageId = body.stage_id
    if (!stageId) {
      const { data: firstStage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('is_active', true)
        .order('stage_order')
        .limit(1)
        .single()
      
      stageId = firstStage?.id
    }

    // Create deal
    const dealData = {
      title: body.title,
      description: body.description || null,
      client_id: body.client_id,
      assigned_to: body.assigned_to || userProfile.id,
      value: parseFloat(body.value),
      currency: body.currency || 'AUD',
      probability: body.probability || 50,
      stage_id: stageId,
      expected_close_date: body.expected_close_date || null,
      status: body.status || 'open',
      source: body.source || null,
      competitors: body.competitors || [],
      tags: body.tags || [],
      created_by: userProfile.id,
      metadata: body.metadata || {}
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .insert(dealData)
      .select(`
        *,
        client:clients(id, name, email, company),
        assigned_to_profile:user_profiles!deals_assigned_to_fkey(
          id, full_name, email, avatar_url
        ),
        pipeline_stage:pipeline_stages(id, name, color, probability)
      `)
      .single()

    if (error) {
      console.error('Error creating deal:', error)
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
    }

    // Log deal creation activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: deal.id,
        activity_type: 'note',
        description: 'Deal created',
        created_by: userProfile.id
      })

    return NextResponse.json({ data: deal }, { status: 201 })

  } catch (error) {
    console.error('Deal Creation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
