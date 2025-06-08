'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Hash, Lock, Users, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Channel {
  id: string
  name: string
  description?: string
  type: 'public' | 'private' | 'direct'
  unreadCount?: number
  lastMessage?: {
    content: string
    createdAt: string
    userName?: string
  }
  members?: number
}

interface ChannelListProps {
  channels: Channel[]
  activeChannelId?: string
  onChannelSelect: (channelId: string) => void
  onCreateChannel?: () => void
}

export function ChannelList({
  channels,
  activeChannelId,
  onChannelSelect,
  onCreateChannel
}: ChannelListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredChannels, setFilteredChannels] = useState(channels)

  useEffect(() => {
    const filtered = channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredChannels(filtered)
  }, [searchTerm, channels])

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <Lock className="w-4 h-4" />
      case 'direct':
        return <Users className="w-4 h-4" />
      default:
        return <Hash className="w-4 h-4" />
    }
  }

  const formatLastMessage = (channel: Channel) => {
    if (!channel.lastMessage) return 'No messages yet'
    
    const { content, userName } = channel.lastMessage
    const preview = content.length > 50 ? `${content.substring(0, 50)}...` : content
    
    return userName ? `${userName}: ${preview}` : preview
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Card className="h-full border-0 rounded-none">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Channels</h2>
          {onCreateChannel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCreateChannel}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg mb-1 transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                activeChannelId === channel.id && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                  {getChannelIcon(channel.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{channel.name}</span>
                    {channel.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(channel.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {formatLastMessage(channel)}
                    </p>
                    {channel.unreadCount && channel.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 h-5 px-1.5">
                        {channel.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
