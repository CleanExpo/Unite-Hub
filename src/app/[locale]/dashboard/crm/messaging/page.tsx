'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChannelList } from '@/components/crm/messaging/ChannelList'
import { MessageView } from '@/components/crm/messaging/MessageView'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

// Define proper types
interface Message {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  isDeleted: boolean
  editedAt?: string
  reactions?: {
    emoji: string
    users: string[]
  }[]
  attachments?: {
    id: string
    fileName: string
    fileSize: number
    fileType: string
    fileUrl: string
  }[]
}

// Mock data - in production, this would come from Supabase
const mockChannels = [
  {
    id: '1',
    name: 'general',
    description: 'General discussion for the team',
    type: 'public' as const,
    unreadCount: 2,
    lastMessage: {
      content: 'Welcome to the team messaging system!',
      createdAt: new Date().toISOString(),
      userName: 'System'
    },
    members: 15
  },
  {
    id: '2',
    name: 'sales-team',
    description: 'Sales team coordination',
    type: 'public' as const,
    unreadCount: 0,
    lastMessage: {
      content: 'Great job on closing that deal!',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      userName: 'Sarah Johnson'
    },
    members: 8
  },
  {
    id: '3',
    name: 'project-alpha',
    description: 'Private channel for Project Alpha',
    type: 'private' as const,
    unreadCount: 5,
    lastMessage: {
      content: 'The client approved the latest designs',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      userName: 'Mike Chen'
    },
    members: 5
  },
  {
    id: '4',
    name: 'John Doe',
    type: 'direct' as const,
    unreadCount: 1,
    lastMessage: {
      content: "Let's schedule a meeting for tomorrow",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      userName: 'John Doe'
    }
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    userId: '1',
    userName: 'System',
    userAvatar: undefined,
    content: 'Welcome to the Unite Group CRM messaging system! This is your central hub for team communication.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isDeleted: false,
    reactions: undefined,
    attachments: undefined
  },
  {
    id: '2',
    userId: '2',
    userName: 'Sarah Johnson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Hey team! Excited to use this new messaging system. It looks great!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isDeleted: false,
    reactions: [
      { emoji: '👍', users: ['3', '4'] },
      { emoji: '🎉', users: ['5'] }
    ]
  },
  {
    id: '3',
    userId: '3',
    userName: 'Mike Chen',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    content: "I agree! The interface is really clean and intuitive. Love the real-time updates.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    isDeleted: false
  },
  {
    id: '4',
    userId: '4',
    userName: 'Emma Wilson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    content: 'Just uploaded the Q4 sales report. Check it out when you get a chance!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isDeleted: false,
    attachments: [
      {
        id: 'a1',
        fileName: 'Q4_Sales_Report_2025.pdf',
        fileSize: 2048000,
        fileType: 'application/pdf',
        fileUrl: '#'
      }
    ]
  },
  {
    id: '5',
    userId: 'current',
    userName: 'You',
    userAvatar: undefined,
    content: 'Thanks Emma! I\'ll review it this afternoon.',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isDeleted: false,
    reactions: undefined,
    attachments: undefined
  }
]

export default function MessagingPage() {
  const [activeChannelId, setActiveChannelId] = useState('1')
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])
  const [isMobileChannelListOpen, setIsMobileChannelListOpen] = useState(false)

  const activeChannel = mockChannels.find(c => c.id === activeChannelId) || mockChannels[0]

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      userId: 'current',
      userName: 'You',
      content,
      createdAt: new Date().toISOString(),
      isDeleted: false
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, editedAt: new Date().toISOString() }
        : msg
    ))
  }, [])

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isDeleted: true }
        : msg
    ))
  }, [])

  const handleReactToMessage = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg
      
      const reactions = msg.reactions || []
      const existingReaction = reactions.find(r => r.emoji === emoji)
      
      if (existingReaction) {
        const userIndex = existingReaction.users.indexOf('current')
        if (userIndex > -1) {
          existingReaction.users.splice(userIndex, 1)
          if (existingReaction.users.length === 0) {
            return {
              ...msg,
              reactions: reactions.filter(r => r.emoji !== emoji)
            }
          }
        } else {
          existingReaction.users.push('current')
        }
      } else {
        reactions.push({ emoji, users: ['current'] })
      }
      
      return { ...msg, reactions }
    }))
  }, [])

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId)
    setIsMobileChannelListOpen(false)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Mobile channel toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileChannelListOpen(!isMobileChannelListOpen)}
        className="md:hidden fixed bottom-4 left-4 z-50 h-12 w-12 rounded-full shadow-lg"
      >
        <Users className="h-5 w-5" />
      </Button>

      {/* Channel list */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r h-full",
        "fixed md:relative inset-0 md:inset-auto bg-background z-40",
        "transition-transform duration-200 ease-in-out",
        isMobileChannelListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-2xl font-bold">Messages</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChannelList
              channels={mockChannels}
              activeChannelId={activeChannelId}
              onChannelSelect={handleChannelSelect}
              onCreateChannel={() => console.log('Create channel')}
            />
          </div>
        </div>
      </div>

      {/* Message view */}
      <div className="flex-1 h-full">
        <MessageView
          channel={activeChannel}
          messages={messages}
          currentUserId="current"
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReactToMessage={handleReactToMessage}
          typingUsers={typingUsers}
        />
      </div>

      {/* Mobile overlay */}
      {isMobileChannelListOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileChannelListOpen(false)}
        />
      )}
    </div>
  )
}
