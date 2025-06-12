'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Bold, 
  Italic, 
  Code, 
  Link2, 
  AtSign,
  Hash,
  X,
  Image as ImageIcon,
  FileText,
  Film
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MessageComposerProps {
  channelId: string
  threadId?: string
  onSend: (message: MessageData) => void
  onTyping?: () => void
  Unite Group?: string
  disabled?: boolean
  channelMembers?: Array<{ id: string; name: string; email: string }>
}

interface MessageData {
  content: string
  formatted_content?: any
  attachments?: File[]
  mentions?: string[]
  thread_id?: string
}

interface Attachment {
  file: File
  preview?: string
  uploading?: boolean
  progress?: number
}

export function MessageComposer({
  channelId,
  threadId,
  onSend,
  onTyping,
  Unite Group = 'Type a message...',
  disabled = false,
  channelMembers = []
}: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isFormatting, setIsFormatting] = useState({
    bold: false,
    italic: false,
    code: false
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Handle typing indicator
  useEffect(() => {
    if (content && onTyping) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Notify typing
      onTyping()
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        // In real implementation, this would notify to stop typing
      }, 3000)
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [content, onTyping])

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return
    
    // Extract mentions from content
    const mentions = [...content.matchAll(/@(\w+)/g)].map(match => match[1])
    
    onSend({
      content: content.trim(),
      formatted_content: parseFormattedContent(content),
      attachments: attachments.map(a => a.file),
      mentions,
      thread_id: threadId
    })
    
    // Reset state
    setContent('')
    setAttachments([])
    setIsFormatting({ bold: false, italic: false, code: false })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    
    // Handle @ mentions
    if (e.key === '@') {
      setShowMentions(true)
      setMentionSearch('')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const newAttachments: Attachment[] = files.map(file => {
      const attachment: Attachment = { file }
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachments(prev => 
            prev.map(a => a.file === file 
              ? { ...a, preview: e.target?.result as string }
              : a
            )
          )
        }
        reader.readAsDataURL(file)
      }
      
      return attachment
    })
    
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const insertEmoji = (emoji: any) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.slice(0, start) + emoji.native + content.slice(end)
    
    setContent(newContent)
    setShowEmojiPicker(false)
    
    // Refocus and set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length)
    }, 0)
  }

  const insertMention = (member: typeof channelMembers[0]) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const lastAtSymbol = content.lastIndexOf('@', start)
    const newContent = content.slice(0, lastAtSymbol) + `@${member.name} ` + content.slice(start)
    
    setContent(newContent)
    setShowMentions(false)
    
    // Refocus
    setTimeout(() => {
      textarea.focus()
    }, 0)
  }

  const applyFormatting = (type: 'bold' | 'italic' | 'code') => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.slice(start, end)
    let wrapper = ''
    
    switch (type) {
      case 'bold':
        wrapper = '**'
        break
      case 'italic':
        wrapper = '_'
        break
      case 'code':
        wrapper = '`'
        break
    }
    
    const newContent = content.slice(0, start) + wrapper + selectedText + wrapper + content.slice(end)
    setContent(newContent)
    
    // Update formatting state
    setIsFormatting(prev => ({ ...prev, [type]: !prev[type] }))
    
    // Refocus and select formatted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + wrapper.length,
        start + wrapper.length + selectedText.length
      )
    }, 0)
  }

  const parseFormattedContent = (text: string) => {
    // In a real implementation, this would parse markdown and return structured data
    return {
      text,
      formatting: {
        bold: [...text.matchAll(/\*\*(.*?)\*\*/g)],
        italic: [...text.matchAll(/\_(.*?)\_/g)],
        code: [...text.matchAll(/\`(.*?)\`/g)],
        mentions: [...text.matchAll(/@(\w+)/g)]
      }
    }
  }

  const filteredMembers = channelMembers.filter(member =>
    member.name.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith('video/')) return <Film className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group bg-gray-100 rounded-lg p-2 pr-8"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {getFileIcon(attachment.file)}
                    <span className="text-sm truncate max-w-[100px]">
                      {attachment.file.name}
                    </span>
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                {attachment.uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                    <div className="text-xs">{attachment.progress || 0}%</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 mb-2">
          <Button
            size="sm"
            variant={isFormatting.bold ? 'secondary' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => applyFormatting('bold')}
            disabled={disabled}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={isFormatting.italic ? 'secondary' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => applyFormatting('italic')}
            disabled={disabled}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={isFormatting.code ? 'secondary' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => applyFormatting('code')}
            disabled={disabled}
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {['ðŸ˜€', 'ðŸ˜ƒ', 'ðŸ˜„', 'ðŸ˜', 'ðŸ˜…', 'ðŸ˜‚', 'ðŸ¤£', 'ðŸ˜Š', 
                  'ðŸ˜‡', 'ðŸ™‚', 'ðŸ˜‰', 'ðŸ˜Œ', 'ðŸ˜', 'ðŸ¥°', 'ðŸ˜˜', 'ðŸ˜—',
                  'ðŸ˜™', 'ðŸ˜š', 'ðŸ˜‹', 'ðŸ˜›', 'ðŸ˜œ', 'ðŸ¤ª', 'ðŸ˜', 'ðŸ¤‘',
                  'ðŸ¤—', 'ðŸ¤­', 'ðŸ¤«', 'ðŸ¤”', 'ðŸ¤', 'ðŸ¤¨', 'ðŸ˜', 'ðŸ˜‘',
                  'ðŸ˜¶', 'ðŸ˜', 'ðŸ˜’', 'ðŸ™„', 'ðŸ˜¬', 'ðŸ˜®', 'ðŸ˜¯', 'ðŸ˜²',
                  'ðŸ˜³', 'ðŸ¥º', 'ðŸ˜¦', 'ðŸ˜§', 'ðŸ˜¨', 'ðŸ˜°', 'ðŸ˜¥', 'ðŸ˜¢',
                  'ðŸ˜­', 'ðŸ˜±', 'ðŸ˜–', 'ðŸ˜£', 'ðŸ˜ž', 'ðŸ˜“', 'ðŸ˜©', 'ðŸ˜«',
                  'ðŸ‘', 'ðŸ‘Ž', 'ðŸ‘Œ', 'âœŒï¸', 'ðŸ¤ž', 'ðŸ¤Ÿ', 'ðŸ¤˜', 'ðŸ¤™',
                  'ðŸ‘', 'ðŸ™Œ', 'ðŸ‘', 'ðŸ¤²', 'ðŸ™', 'ðŸ’ª', 'â¤ï¸', 'ðŸ’¯'
                ].map((emoji) => (
                  <button
                    key={emoji}
                    className="text-xl hover:bg-gray-100 rounded p-1"
                    onClick={() => insertEmoji({ native: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              Unite Group={Unite Group}
              disabled={disabled}
              className="min-h-[80px] resize-none pr-10"
              rows={3}
            />
            
            {/* Mentions Dropdown */}
            {showMentions && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-500 mb-1">People</div>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => insertMention(member)}
                    >
                      <AtSign className="h-3 w-3" />
                      <span className="text-sm">{member.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSend}
            disabled={disabled || (!content.trim() && attachments.length === 0)}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
          aria-label="Upload files"
        />
      </div>
    </Card>
  )
}
