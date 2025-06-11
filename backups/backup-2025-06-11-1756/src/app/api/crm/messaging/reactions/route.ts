import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { messageId, emoji } = await request.json()
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already reacted with this emoji
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single()

    if (existing) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error('Delete reaction error:', deleteError)
        return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
      }

      return NextResponse.json({ removed: true })
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })

      if (insertError) {
        console.error('Insert reaction error:', insertError)
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
      }

      return NextResponse.json({ added: true })
    }
  } catch (error) {
    console.error('Reaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get reactions with user info
    const { data: reactions, error } = await supabase
      .from('message_reactions')
      .select(`
        id,
        emoji,
        user_id,
        profiles!inner(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('message_id', messageId)

    if (error) {
      console.error('Fetch reactions error:', error)
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 })
    }

    // Group reactions by emoji
    const groupedReactions = reactions?.reduce((acc: any, reaction: any) => {
      const emoji = reaction.emoji
      if (!acc[emoji]) {
        acc[emoji] = {
          emoji,
          users: []
        }
      }
      acc[emoji].users.push({
        id: reaction.profiles.id,
        name: reaction.profiles.full_name,
        avatar: reaction.profiles.avatar_url
      })
      return acc
    }, {}) || {}

    return NextResponse.json({
      reactions: Object.values(groupedReactions)
    })
  } catch (error) {
    console.error('Reaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
