'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2, 
  Pin, 
  Smile,
  Check,
  CheckCheck,
  Paperclip,
  MessageSquare,
  Clock,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageComposer } from './MessageComposer'

interface Reaction {
  id: string
  emoji: string
  users: Array<{
    id: string
    name: string
    avatar?: string
  }>
}

interface Attachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  thumbnail_url?: string
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
  reactions?: Reaction[]
  attachments?: Attachment[]
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

interface EnhancedMessageViewProps {
  messages: Message[]
  currentUserId: string
  channelMembers: Array<{ id: string; name: string; email: string; avatar?: string }>
  onReaction: (messageId: string, emoji: string) => void
  onReply: (messageId: string) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  onPin?: (messageId: string) => void
  typingUsers?: Array<{ id: string; name: string }>
  showThreads?: boolean
}

export function EnhancedMessageView({
  messages,
  currentUserId,
  channelMembers,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  typingUsers = [],
  showThreads = true
}: EnhancedMessageViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderFormattedContent = (content: string, formatted?: any) => {
    // Simple markdown parsing
    const formatted_text = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\_(.*?)\_/g, '<em>$1</em>')
      .replace(/\`(.*?)\`/g, '<code>$1</code>')
      .replace(/@(\w+)/g, (match, username) => {
        const member = channelMembers.find(m => 
          m.name.toLowerCase() === username.toLowerCase()
        )
        if (member) {
          return `<span class="text-blue-600 font-medium">@${username}</span>`
        }
        return match
      })
    
    return <div dangerouslySetInnerHTML={{ __html: formatted_text }} />
  }

  const handleReaction = (messageId: string, emoji: string) => {
    onReaction(messageId, emoji)
    setShowReactionPicker(null)
  }

  const handleEdit = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setEditingMessage(messageId)
      setEditContent(message.content)
    }
  }

  const saveEdit = () => {
    if (editingMessage && onEdit) {
      onEdit(editingMessage, editContent)
      setEditingMessage(null)
      setEditContent('')
    }
  }

  const cancelEdit = () => {
    setEditingMessage(null)
    setEditContent('')
  }

  const getReadStatus = (message: Message) => {
    if (message.user_id === currentUserId) {
      const readByOthers = (message.read_by || []).filter(id => id !== currentUserId)
      if (readByOthers.length === channelMembers.length - 1) {
        return 'all'
      } else if (readByOthers.length > 0) {
        return 'some'
      }
    }
    return null
  }

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.user_id === currentUserId
    const readStatus = getReadStatus(message)
    const showAvatar = index === 0 || messages[index - 1]?.user_id !== message.user_id
    
    return (
      <div
        key={message.id}
        className={cn(
          "group relative mb-4",
          isCurrentUser && "flex justify-end"
        )}
        onMouseEnter={() => setHoveredMessageId(message.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        <div className={cn(
          "flex gap-3 max-w-[70%]",
          isCurrentUser && "flex-row-reverse"
        )}>
          {/* Avatar */}
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              {message.user.avatar_url ? (
                <AvatarImage src={message.user.avatar_url} />
              ) : (
                <AvatarFallback>
                  {message.user.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex-1 space-y-1">
            {/* Message Header */}
            {showAvatar && (
              <div className={cn(
                "flex items-center gap-2 text-sm",
                isCurrentUser && "justify-end"
              )}>
                <span className="font-semibold">{message.user.full_name}</span>
                <span className="text-gray-500">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
                {message.is_edited && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>
            )}

            {/* Message Content */}
            {editingMessage === message.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-lg resize-none"
                  rows={3}
                  autoFocus
                  aria-label="Edit message"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className={cn(
                "rounded-lg px-4 py-2",
                isCurrentUser 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-900",
                message.deleted_at && "opacity-50 italic"
              )}>
                {message.deleted_at ? (
                  <span className="text-sm">This message was deleted</span>
                ) : (
                  <div className="break-words">
                    {renderFormattedContent(message.content, message.formatted_content)}
                  </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 p-2 bg-white/10 rounded"
                      >
                        <Paperclip className="h-4 w-4" />
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          {attachment.file_name}
                        </a>
                        <span className="text-xs opacity-70">
                          {formatFileSize(attachment.file_size)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Read Status */}
                {isCurrentUser && readStatus && (
                  <div className="flex justify-end mt-1">
                    {readStatus === 'all' ? (
                      <CheckCheck className="h-3 w-3 text-blue-300" />
                    ) : (
                      <Check className="h-3 w-3 text-gray-300" />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {message.reactions.map((reaction) => (
                  <Popover key={reaction.id}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                          "bg-gray-100 hover:bg-gray-200 transition-colors",
                          reaction.users.some(u => u.id === currentUserId) && "ring-2 ring-blue-500"
                        )}
                        onClick={() => handleReaction(message.id, reaction.emoji)}
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.users.length}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                      <div className="text-xs space-y-1">
                        {reaction.users.map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            )}

            {/* Thread Preview */}
            {showThreads && message.thread && (
              <button
                className="flex items-center gap-2 mt-2 text-sm text-blue-600 hover:underline"
                onClick={() => onReply(message.id)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{message.thread.reply_count} replies</span>
                <span className="text-gray-500">
                  Last reply {formatDistanceToNow(new Date(message.thread.last_reply_at), { addSuffix: true })}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Hover Actions */}
        {hoveredMessageId === message.id && !editingMessage && (
          <div className={cn(
            "absolute top-0 flex items-center gap-1 p-1 bg-white border rounded-lg shadow-sm",
            isCurrentUser ? "left-0" : "right-0"
          )}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setShowReactionPicker(message.id)}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onReply(message.id)}
            >
              <Reply className="h-4 w-4" />
            </Button>
            {message.user_id === currentUserId && onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleEdit(message.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onPin && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onPin(message.id)}
              >
                <Pin className="h-4 w-4" />
              </Button>
            )}
            {message.user_id === currentUserId && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-600"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactionPicker === message.id && (
          <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg p-2 z-10">
            <div className="grid grid-cols-6 gap-1">
              {['ðŸ‘', 'â¤ï¸', 'ðŸ˜‚', 'ðŸ˜®', 'ðŸ˜¢', 'ðŸŽ‰'].map((emoji) => (
                <button
                  key={emoji}
                  className="text-xl hover:bg-gray-100 rounded p-1"
                  onClick={() => handleReaction(message.id, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-4">
        {messages.map((message, index) => renderMessage(message, index))}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Clock className="h-3 w-3 animate-pulse" />
            <span>
              {typingUsers.map(u => u.name).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Reply Composer */}
      {replyingTo && (
        <div className="border-t p-2 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Replying to {messages.find(m => m.id === replyingTo)?.user.full_name}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
          <MessageComposer
            channelId={messages[0]?.channel_id || ''}
            threadId={replyingTo}
            onSend={() => setReplyingTo(null)}
            Unite Group="Reply to thread..."
            channelMembers={channelMembers}
          />
        </div>
      )}
    </div>
  )
}
