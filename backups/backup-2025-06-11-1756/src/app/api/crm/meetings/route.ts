import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ðŸ“… MEETING MANAGEMENT API - GET ALL MEETINGS
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
    const clientId = searchParams.get('client_id') || ''
    const dateFrom = searchParams.get('date_from') || ''
    const dateTo = searchParams.get('date_to') || ''
    
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('meetings')
      .select(`
        *,
        client:clients(
          id, name, email, company
        ),
        organizer:user_profiles!meetings_organizer_id_fkey(
          id, full_name, email, avatar_url
        ),
        attendees:meeting_attendees(
          id,
          attendee:user_profiles(id, full_name, email, avatar_url),
          response_status
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('scheduled_at', dateTo)
    }

    // Execute query with pagination
    const { data: meetings, error } = await query
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching meetings:', error)
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: meetings || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Meetings API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ðŸ“… MEETING MANAGEMENT API - CREATE NEW MEETING
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    // Validate required fields
    if (!body.title || !body.scheduled_at || !body.duration_minutes) {
      return NextResponse.json(
        { error: 'Title, scheduled time, and duration are required' }, 
        { status: 400 }
      )
    }

    // Get user profile for organizer
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Calculate end time
    const startTime = new Date(body.scheduled_at)
    const endTime = new Date(startTime.getTime() + (body.duration_minutes * 60000))

    // Create meeting
    const meetingData = {
      title: body.title,
      description: body.description || null,
      scheduled_at: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: body.duration_minutes,
      location: body.location || null,
      meeting_type: body.meeting_type || 'in_person',
      meeting_url: body.meeting_url || null,
      client_id: body.client_id || null,
      organizer_id: userProfile.id,
      status: 'scheduled',
      agenda: body.agenda || null,
      metadata: body.metadata || {}
    }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select(`
        *,
        client:clients(id, name, email, company),
        organizer:user_profiles!meetings_organizer_id_fkey(
          id, full_name, email, avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating meeting:', error)
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
    }

    // Add attendees if provided
    if (body.attendees && Array.isArray(body.attendees)) {
      const attendeeData = body.attendees.map((attendeeId: string) => ({
        meeting_id: meeting.id,
        attendee_id: attendeeId,
        response_status: 'pending'
      }))

      await supabase
        .from('meeting_attendees')
        .insert(attendeeData)
    }

    return NextResponse.json({ data: meeting }, { status: 201 })

  } catch (error) {
    console.error('Meeting Creation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
