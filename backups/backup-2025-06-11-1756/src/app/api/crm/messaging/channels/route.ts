import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get channels the user has access to
    const { data: channels, error } = await supabase
      .from('messaging_channels')
      .select(`
        *,
        channel_members!inner(user_id),
        messaging_messages(
          content,
          created_at,
          user_id
        )
      `)
      .eq('channel_members.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching channels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedChannels = channels?.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      createdAt: channel.created_at,
      memberCount: channel.channel_members?.length || 0,
      lastMessage: channel.messaging_messages?.[0] || null
    }))

    return NextResponse.json(formattedChannels || [])
  } catch (error) {
    console.error('Channels API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const data = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate input
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: 'Channel name and type are required' },
        { status: 400 }
      )
    }

    // Create the channel
    const { data: channel, error: channelError } = await supabase
      .from('messaging_channels')
      .insert({
        name: data.name,
        description: data.description,
        type: data.type,
        created_by: user.id
      })
      .select()
      .single()

    if (channelError) {
      console.error('Error creating channel:', channelError)
      return NextResponse.json(
        { error: 'Failed to create channel' },
        { status: 500 }
      )
    }

    // Add creator as a member
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: user.id,
        role: 'admin',
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
    }

    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    console.error('Create channel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
