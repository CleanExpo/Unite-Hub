import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    
    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return mock messages for now (tables don't exist yet)
    const mockMessages = [
      {
        id: '1',
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email || 'User',
        userAvatar: user.user_metadata?.avatar_url,
        content: 'Welcome to the messaging system!',
        createdAt: new Date().toISOString(),
        editedAt: null,
        isDeleted: false,
        parentId: null,
        attachments: [],
        reactions: []
      },
      {
        id: '2',
        userId: 'system',
        userName: 'System',
        userAvatar: null,
        content: 'CRM messaging system is ready for use.',
        createdAt: new Date().toISOString(),
        editedAt: null,
        isDeleted: false,
        parentId: null,
        attachments: [],
        reactions: []
      }
    ]

    return NextResponse.json(mockMessages)
  } catch (error) {
    console.error('Messages API error:', error)
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
    if (!data.channelId || !data.content) {
      return NextResponse.json(
        { error: 'Channel ID and content are required' },
        { status: 400 }
      )
    }

    // Check if user is a member of the channel
    const { data: member, error: memberError } = await supabase
      .from('channel_members')
      .select('user_id')
      .eq('channel_id', data.channelId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create the message
    const { data: message, error } = await supabase
      .from('messaging_messages')
      .insert({
        channel_id: data.channelId,
        user_id: user.id,
        content: data.content,
        parent_id: data.parentId,
        attachments: data.attachments
      })
      .select(`
        id,
        content,
        user_id,
        created_at,
        edited_at,
        is_deleted,
        parent_id,
        attachments,
        reactions,
        profiles:user_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Format response
    const formattedMessage = {
      id: message.id,
      userId: message.user_id,
      userName: (message as any).profiles?.full_name || 'Unknown User',
      userAvatar: (message as any).profiles?.avatar_url,
      content: message.content,
      createdAt: message.created_at,
      editedAt: message.edited_at,
      isDeleted: message.is_deleted,
      parentId: message.parent_id,
      attachments: message.attachments || [],
      reactions: message.reactions || []
    }

    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    if (!data.messageId || !data.content) {
      return NextResponse.json(
        { error: 'Message ID and content are required' },
        { status: 400 }
      )
    }

    // Check if user owns the message
    const { data: existingMessage, error: checkError } = await supabase
      .from('messaging_messages')
      .select('user_id')
      .eq('id', data.messageId)
      .single()

    if (checkError || !existingMessage || existingMessage.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update the message
    const { data: message, error } = await supabase
      .from('messaging_messages')
      .update({
        content: data.content,
        edited_at: new Date().toISOString()
      })
      .eq('id', data.messageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating message:', error)
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Update message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns the message
    const { data: existingMessage, error: checkError } = await supabase
      .from('messaging_messages')
      .select('user_id')
      .eq('id', messageId)
      .single()

    if (checkError || !existingMessage || existingMessage.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Soft delete the message
    const { error } = await supabase
      .from('messaging_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
