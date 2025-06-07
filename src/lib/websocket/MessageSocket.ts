'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  message_type: 'text' | 'file' | 'image'
  metadata?: {
    file_url?: string
    file_name?: string
    file_size?: number
    reactions?: Record<string, string[]>
  }
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    name?: string
    avatar_url?: string
  }
}

export interface Channel {
  id: string
  name: string
  description?: string
  type: 'public' | 'private' | 'direct'
  created_by: string
  created_at: string
  updated_at: string
  members?: string[]
  last_message?: Message
  unread_count?: number
}

interface MessageSocketContextType {
  messages: Message[]
  channels: Channel[]
  activeChannel: string | null
  onlineUsers: string[]
  isConnected: boolean
  sendMessage: (channelId: string, content: string, type?: 'text' | 'file' | 'image') => Promise<void>
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  setActiveChannel: (channelId: string | null) => void
  addReaction: (messageId: string, emoji: string) => Promise<void>
  removeReaction: (messageId: string, emoji: string) => Promise<void>
  markAsRead: (channelId: string) => Promise<void>
}

const MessageSocketContext = createContext<MessageSocketContextType | null>(null)

export function useMessageSocket() {
  const context = useContext(MessageSocketContext)
  if (!context) {
    throw new Error('useMessageSocket must be used within a MessageSocketProvider')
  }
  return context
}

interface MessageSocketProviderProps {
  children: React.ReactNode
}

export function MessageSocketProvider({ children }: MessageSocketProviderProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const presenceRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (!session) return

        // Subscribe to messages
        channelRef.current = supabaseClient
          .channel('messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'crm_messages'
            },
            (payload) => {
              const newMessage = payload.new as Message
              setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === newMessage.id)) return prev
                return [...prev, newMessage].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'crm_messages'
            },
            (payload) => {
              const updatedMessage = payload.new as Message
              setMessages(prev => 
                prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
              )
            }
          )
          .subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED')
          })

        // Subscribe to presence for online users
        presenceRef.current = supabaseClient
          .channel('online-users')
          .on('presence', { event: 'sync' }, () => {
            const state = presenceRef.current?.presenceState()
            if (state) {
              const users = Object.keys(state)
              setOnlineUsers(users)
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await presenceRef.current?.track({
                user_id: session.user.id,
                email: session.user.email,
                online_at: new Date().toISOString(),
              })
            }
          })

        // Load initial data
        await loadChannels()
        
      } catch (error) {
        console.error('Error initializing socket:', error)
      }
    }

    initializeSocket()

    return () => {
      channelRef.current?.unsubscribe()
      presenceRef.current?.unsubscribe()
    }
  }, [])

  const loadChannels = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('crm_channels')
        .select(`
          *,
          last_message:crm_messages(*)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setChannels(data || [])
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  const loadMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('crm_messages')
        .select(`
          *,
          user:user_id(id, email, name, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async (channelId: string, content: string, type: 'text' | 'file' | 'image' = 'text') => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabaseClient
        .from('crm_messages')
        .insert({
          channel_id: channelId,
          user_id: session.user.id,
          content,
          message_type: type,
          metadata: {}
        })

      if (error) throw error

      // Update channel's last activity
      await supabaseClient
        .from('crm_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', channelId)

    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const joinChannel = (channelId: string) => {
    setActiveChannel(channelId)
    loadMessages(channelId)
  }

  const leaveChannel = (channelId: string) => {
    if (activeChannel === channelId) {
      setActiveChannel(null)
      setMessages([])
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Get current message
      const { data: message, error: fetchError } = await supabaseClient
        .from('crm_messages')
        .select('metadata')
        .eq('id', messageId)
        .single()

      if (fetchError) throw fetchError

      const reactions = message.metadata?.reactions || {}
      const userReactions = reactions[emoji] || []
      
      // Add user to reactions if not already there
      if (!userReactions.includes(session.user.id)) {
        userReactions.push(session.user.id)
        reactions[emoji] = userReactions

        const { error } = await supabaseClient
          .from('crm_messages')
          .update({
            metadata: { ...message.metadata, reactions }
          })
          .eq('id', messageId)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Get current message
      const { data: message, error: fetchError } = await supabaseClient
        .from('crm_messages')
        .select('metadata')
        .eq('id', messageId)
        .single()

      if (fetchError) throw fetchError

      const reactions = message.metadata?.reactions || {}
      const userReactions = reactions[emoji] || []
      
      // Remove user from reactions
      const updatedReactions = userReactions.filter(id => id !== session.user.id)
      
      if (updatedReactions.length === 0) {
        delete reactions[emoji]
      } else {
        reactions[emoji] = updatedReactions
      }

      const { error } = await supabaseClient
        .from('crm_messages')
        .update({
          metadata: { ...message.metadata, reactions }
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing reaction:', error)
    }
  }

  const markAsRead = async (channelId: string) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // This would typically update a read_receipts table
      // For now, we'll just log it
      console.log(`Marking channel ${channelId} as read for user ${session.user.id}`)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const value: MessageSocketContextType = {
    messages,
    channels,
    activeChannel,
    onlineUsers,
    isConnected,
    sendMessage,
    joinChannel,
    leaveChannel,
    setActiveChannel,
    addReaction,
    removeReaction,
    markAsRead
  }

  return (
    <MessageSocketContext.Provider value={value}>
      {children}
    </MessageSocketContext.Provider>
  )
}
