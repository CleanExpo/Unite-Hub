'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Reply,
  Hash,
  Users,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  editedAt?: string
  isDeleted: boolean
  parentId?: string
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

interface Channel {
  id: string
  name: string
  description?: string
  type: 'public' | 'private' | 'direct'
  memberCount?: number
}

interface MessageViewProps {
  channel: Channel
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => void
  onEditMessage?: (messageId: string, content: string) => void
  onDeleteMessage?: (messageId: string) => void
  onReactToMessage?: (messageId: string, emoji: string) => void
  typingUsers?: { userId: string; userName: string }[]
}

export function MessageView({
  channel,
  messages,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  typingUsers = []
}: MessageViewProps) {
  const [message, setMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const handleSaveEdit = () => {
    if (editingMessageId && editingContent.trim() && onEditMessage) {
      onEditMessage(editingMessageId, editingContent.trim())
      setEditingMessageId(null)
      setEditingContent('')
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const getChannelIcon = () => {
    switch (channel.type) {
      case 'private':
        return <Lock className="w-5 h-5" />
      case 'direct':
        return <Users className="w-5 h-5" />
      default:
        return <Hash className="w-5 h-5" />
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      {/* Header */}
      <CardHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">
              {getChannelIcon()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{channel.name}</h2>
              {channel.description && (
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {channel.memberCount && (
              <span className="text-sm text-muted-foreground">
                {channel.memberCount} members
              </span>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
        <div className="py-4 space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">
                  {date}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Messages for this date */}
              {dateMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 group",
                    msg.isDeleted && "opacity-50"
                  )}
                >
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarImage src={msg.userAvatar} />
                    <AvatarFallback>
                      {msg.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {msg.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.editedAt && (
                        <span className="text-xs text-muted-foreground">
                          (edited)
                        </span>
                      )}
                    </div>

                    {editingMessageId === msg.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveEdit()
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-7"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-7"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {msg.isDeleted ? (
                          <p className="text-sm text-muted-foreground italic">
                            This message was deleted
                          </p>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
                              >
                                <Paperclip className="h-4 w-4" />
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  {attachment.fileName}
                                </a>
                                <span className="text-xs text-muted-foreground">
                                  ({Math.round(attachment.fileSize / 1024)} KB)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {msg.reactions.map((reaction, idx) => (
                              <button
                                key={idx}
                                className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs hover:bg-accent"
                                onClick={() => onReactToMessage?.(msg.id, reaction.emoji)}
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message actions */}
                  {!msg.isDeleted && msg.userId === currentUserId && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditMessage(msg.id, msg.content)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteMessage?.(msg.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-2 text-sm text-muted-foreground">
          {typingUsers.map((user) => user.userName).join(', ')} 
          {typingUsers.length === 1 ? ' is' : ' are'} typing...
        </div>
      )}

      {/* Input */}
      <CardContent className="border-t p-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            placeholder={`Message #${channel.name}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
            <Smile className="h-5 w-5" />
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="h-10 w-10 p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
