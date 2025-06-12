import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { channelId, isTyping } = await request.json()
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isTyping) {
      // Set typing indicator
      const { error: upsertError } = await supabase
        .from('typing_indicators')
        .upsert({
          channel_id: channelId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10000).toISOString() // 10 seconds
        }, {
          onConflict: 'channel_id,user_id'
        })

      if (upsertError) {
        console.error('Typing indicator error:', upsertError)
        return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 })
      }
    } else {
      // Remove typing indicator
      const { error: deleteError } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Remove typing indicator error:', deleteError)
        return NextResponse.json({ error: 'Failed to remove typing status' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Typing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active typing indicators (not expired and not current user)
    const { data: typingUsers, error } = await supabase
      .from('typing_indicators')
      .select(`
        user_id,
        profiles!inner(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)
      .neq('user_id', user.id)
      .gte('expires_at', new Date().toISOString())

    if (error) {
      console.error('Fetch typing users error:', error)
      return NextResponse.json({ error: 'Failed to fetch typing users' }, { status: 500 })
    }

    const formattedTypingUsers = typingUsers?.map((tu: any) => ({
      id: tu.profiles?.id || tu.user_id,
      name: tu.profiles?.full_name || 'Unknown User',
      avatar: tu.profiles?.avatar_url
    })) || []

    return NextResponse.json({
      typingUsers: formattedTypingUsers
    })
  } catch (error) {
    console.error('Typing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
