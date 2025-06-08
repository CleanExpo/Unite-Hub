'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { ChannelList } from '@/components/crm/messaging/ChannelList'
import { EnhancedMessageView } from '@/components/crm/messaging/EnhancedMessageView'
import { MessageComposer } from '@/components/crm/messaging/MessageComposer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Settings, 
  Users, 
  Phone, 
  Video, 
  Info, 
  Pin,
  Search,
  Hash,
  Bell,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Enhanced types with Teams-like features
interface Channel {
  id: string
  name: string
  description?: string
  type: 'public' | 'private' | 'direct'
  unreadCount: number
  lastMessage?: {
    content: string
    createdAt: string
    userName: string
  }
  members?: number
  isPinned?: boolean
  isFavorite?: boolean
  settings?: {
    notifications: boolean
    allowThreads: boolean
    allowReactions: boolean
    allowFileUploads: boolean
  }
}

interface Message {
  id: string
  content: string
  formatted_content?: any
  user_id: string
  channel_id: string
  created_at: string
  edited_at?: string
  deleted_at?: string
  thread_id?: string
  is_edited: boolean
  user: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
  reactions?: Array<{
    id: string
    emoji: string
    users: Array<{
      id: string
      name: string
      avatar?: string
    }>
  }>
  attachments?: Array<{
    id: string
    file_name: string
    file_type: string
    file_size: number
    file_url: string
    thumbnail_url?: string
  }>
  read_by?: string[]
  thread?: {
    id: string
    reply_count: number
    last_reply_at: string
    participants: Array<{
      id: string
      name: string
      avatar?: string
    }>
  }
  mentions?: string[]
}

// Enhanced mock data
const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'general',
    description: 'General discussion for the team',
    type: 'public',
    unreadCount: 2,
    lastMessage: {
      content: 'Welcome to the Teams-like messaging system!',
      createdAt: new Date().toISOString(),
      userName: 'System'
    },
    members: 15,
    isPinned: true,
    isFavorite: true,
    settings: {
      notifications: true,
      allowThreads: true,
      allowReactions: true,
      allowFileUploads: true
    }
  },
  {
    id: '2',
    name: 'sales-team',
    description: 'Sales team coordination',
    type: 'public',
    unreadCount: 0,
    lastMessage: {
      content: 'Great job on closing that deal! 🎉',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      userName: 'Sarah Johnson'
    },
    members: 8,
    isPinned: true
  },
  {
    id: '3',
    name: 'project-alpha',
    description: 'Private channel for Project Alpha',
    type: 'private',
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
    type: 'direct',
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
    content: 'Welcome to the Unite Group CRM Teams-like messaging system! 🚀',
    user_id: '1',
    channel_id: '1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    is_edited: false,
    user: {
      id: '1',
      email: 'system@unite-group.com',
      full_name: 'System',
      avatar_url: undefined
    },
    reactions: [
      {
        id: 'r1',
        emoji: '🚀',
        users: [
          { id: '2', name: 'Sarah Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
          { id: '3', name: 'Mike Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' }
        ]
      }
    ]
  },
  {
    id: '2',
    content: 'Hey team! **Excited** to use this new messaging system. It looks _amazing_!',
    formatted_content: {
      text: 'Hey team! Excited to use this new messaging system. It looks amazing!',
      formatting: {
        bold: [['Excited']],
        italic: [['amazing']]
      }
    },
    user_id: '2',
    channel_id: '1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    is_edited: false,
    user: {
      id: '2',
      email: 'sarah@unite-group.com',
      full_name: 'Sarah Johnson',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    reactions: [
      { 
        id: 'r2',
        emoji: '👍', 
        users: [
          { id: '3', name: 'Mike Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
          { id: '4', name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' }
        ] 
      },
      { 
        id: 'r3',
        emoji: '🎉', 
        users: [
          { id: '5', name: 'David Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' }
        ] 
      }
    ],
    thread: {
      id: 't1',
      reply_count: 3,
      last_reply_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      participants: [
        { id: '3', name: 'Mike Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
        { id: '4', name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' }
      ]
    }
  },
  {
    id: '3',
    content: "I agree! The interface is really clean and intuitive. Love the real-time updates and the @mentions feature.",
    user_id: '3',
    channel_id: '1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    is_edited: false,
    user: {
      id: '3',
      email: 'mike@unite-group.com',
      full_name: 'Mike Chen',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
    },
    mentions: ['mentions']
  },
  {
    id: '4',
    content: 'Just uploaded the Q4 sales report. Check it out when you get a chance! 📊',
    user_id: '4',
    channel_id: '1',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    is_edited: false,
    user: {
      id: '4',
      email: 'emma@unite-group.com',
      full_name: 'Emma Wilson',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
    },
    attachments: [
      {
        id: 'a1',
        file_name: 'Q4_Sales_Report_2025.pdf',
        file_size: 2048000,
        file_type: 'application/pdf',
        file_url: '#',
        thumbnail_url: undefined
      }
    ],
    read_by: ['2', '3']
  },
  {
    id: '5',
    content: 'Thanks @Emma! I\'ll review it this afternoon. The numbers look promising! 📈',
    user_id: 'current',
    channel_id: '1',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    is_edited: true,
    edited_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    user: {
      id: 'current',
      email: 'you@unite-group.com',
      full_name: 'You',
      avatar_url: undefined
    },
    mentions: ['Emma'],
    read_by: ['2', '3', '4']
  }
]

const mockChannelMembers = [
  { id: '1', name: 'System', email: 'system@unite-group.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@unite-group.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: '3', name: 'Mike Chen', email: 'mike@unite-group.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
  { id: '4', name: 'Emma Wilson', email: 'emma@unite-group.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  { id: '5', name: 'David Lee', email: 'david@unite-group.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 'current', name: 'You', email: 'you@unite-group.com' }
]

export default function MessagingPage() {
  const [activeChannelId, setActiveChannelId] = useState('1')
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([])
  const [isMobileChannelListOpen, setIsMobileChannelListOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showChannelInfo, setShowChannelInfo] = useState(false)

  const activeChannel = mockChannels.find(c => c.id === activeChannelId) || mockChannels[0]

  // Handle sending messages
  const handleSendMessage = useCallback((messageData: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageData.content,
      formatted_content: messageData.formatted_content,
      user_id: 'current',
      channel_id: activeChannelId,
      created_at: new Date().toISOString(),
      is_edited: false,
      user: {
        id: 'current',
        email: 'you@unite-group.com',
        full_name: 'You',
        avatar_url: undefined
      },
      mentions: messageData.mentions,
      thread_id: messageData.thread_id
    }
    setMessages(prev => [...prev, newMessage])
  }, [activeChannelId])

  // Handle reactions
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg
      
      const reactions = [...(msg.reactions || [])]
      const existingReaction = reactions.find(r => r.emoji === emoji)
      
      if (existingReaction) {
        const currentUser = { id: 'current', name: 'You', avatar: undefined }
        const userIndex = existingReaction.users.findIndex(u => u.id === 'current')
        
        if (userIndex > -1) {
          existingReaction.users.splice(userIndex, 1)
          if (existingReaction.users.length === 0) {
            return {
              ...msg,
              reactions: reactions.filter(r => r.emoji !== emoji)
            }
          }
        } else {
          existingReaction.users.push(currentUser)
        }
      } else {
        reactions.push({
          id: Date.now().toString(),
          emoji,
          users: [{ id: 'current', name: 'You', avatar: undefined }]
        })
      }
      
      return { ...msg, reactions }
    }))
  }, [])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    // In real implementation, this would notify other users via WebSocket
    console.log('User is typing...')
  }, [])

  // Handle reply
  const handleReply = useCallback((messageId: string) => {
    console.log('Replying to message:', messageId)
  }, [])

  // Handle edit
  const handleEdit = useCallback((messageId: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, is_edited: true, edited_at: new Date().toISOString() }
        : msg
    ))
  }, [])

  // Handle delete
  const handleDelete = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, deleted_at: new Date().toISOString() }
        : msg
    ))
  }, [])

  // Handle pin
  const handlePin = useCallback((messageId: string) => {
    console.log('Pinning message:', messageId)
  }, [])

  // Handle channel selection
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

      {/* Channel list sidebar */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r h-full bg-gray-50/50",
        "fixed md:relative inset-0 md:inset-auto bg-background z-40",
        "transition-transform duration-200 ease-in-out",
        isMobileChannelListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Channel list header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Teams Messaging</h1>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search channels and messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Channel list */}
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

      {/* Message area */}
      <div className="flex-1 h-full flex flex-col">
        {/* Channel header */}
        <div className="border-b bg-white">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">{activeChannel.name}</h2>
                {activeChannel.isPinned && <Pin className="h-4 w-4 text-gray-400" />}
                {activeChannel.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
              {activeChannel.members && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {activeChannel.members}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowChannelInfo(!showChannelInfo)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {activeChannel.description && (
            <div className="px-4 pb-3 text-sm text-gray-600">
              {activeChannel.description}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 flex flex-col">
            <EnhancedMessageView
              messages={messages}
              currentUserId="current"
              channelMembers={mockChannelMembers}
              onReaction={handleReaction}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              typingUsers={typingUsers}
              showThreads={true}
            />

            {/* Message composer */}
            <div className="border-t">
              <MessageComposer
                channelId={activeChannelId}
                onSend={handleSendMessage}
                onTyping={handleTyping}
                placeholder={`Message #${activeChannel.name}`}
                channelMembers={mockChannelMembers}
              />
            </div>
          </div>

          {/* Channel info sidebar */}
          {showChannelInfo && (
            <div className="w-80 border-l bg-gray-50/50 p-4">
              <h3 className="font-semibold mb-4">Channel Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-sm">{activeChannel.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="text-sm">January 1, 2025</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Members ({activeChannel.members || 0})</p>
                  <div className="space-y-2">
                    {mockChannelMembers.slice(0, 5).map(member => (
                      <div key={member.id} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                          {member.name.charAt(0)}
                        </div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
