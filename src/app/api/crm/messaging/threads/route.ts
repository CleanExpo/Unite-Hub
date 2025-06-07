import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { parentMessageId, channelId } = await request.json()
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create thread if it doesn't exist
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .upsert({
        parent_message_id: parentMessageId,
        channel_id: channelId
      }, {
        onConflict: 'parent_message_id',
        ignoreDuplicates: true
      })
      .select()
      .single()

    if (threadError) {
      console.error('Thread creation error:', threadError)
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }

    // Add user as participant
    const { error: participantError } = await supabase
      .from('thread_participants')
      .upsert({
        thread_id: thread.id,
        user_id: user.id,
        last_read_at: new Date().toISOString()
      }, {
        onConflict: 'thread_id,user_id'
      })

    if (participantError) {
      console.error('Thread participant error:', participantError)
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Thread API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const parentMessageId = searchParams.get('parentMessageId')

    if (!threadId && !parentMessageId) {
      return NextResponse.json({ error: 'Thread ID or parent message ID required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    let query = supabase.from('message_threads').select(`
      id,
      parent_message_id,
      channel_id,
      created_at,
      last_reply_at,
      reply_count,
      participant_count,
      messages!inner(
        id,
        content,
        formatted_content,
        user_id,
        created_at,
        is_edited,
        edited_at,
        deleted_at,
        user:profiles!inner(
          id,
          full_name,
          avatar_url
        )
      ),
      thread_participants!inner(
        user_id,
        last_read_at,
        user:profiles!inner(
          id,
          full_name,
          avatar_url
        )
      )
    `)

    if (threadId) {
      query = query.eq('id', threadId)
    } else if (parentMessageId) {
      query = query.eq('parent_message_id', parentMessageId)
    }

    const { data: thread, error } = await query.single()

    if (error) {
      console.error('Fetch thread error:', error)
      return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Thread API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { threadId } = await request.json()
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update last read time
    const { error: updateError } = await supabase
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update thread read time error:', updateError)
      return NextResponse.json({ error: 'Failed to update read time' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Thread API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
