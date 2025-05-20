"use client"

import { useState, useEffect } from "react"
import { Reply, Forward, Archive, Trash, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getEmailThread, getEmailMessages, type EmailThread, type EmailMessage } from "@/lib/email-integration"

interface EmailThreadViewProps {
  threadId: string
  thread?: EmailThread
}

export function EmailThreadView({ threadId, thread: initialThread }: EmailThreadViewProps) {
  const [thread, setThread] = useState<EmailThread | null>(initialThread || null)
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadThreadAndMessages() {
      setLoading(true)
      try {
        // Load thread if not provided
        let threadData = initialThread
        if (!threadData) {
          threadData = await getEmailThread(threadId)
          if (threadData) {
            setThread(threadData)
          }
        }

        // Load messages
        const messagesData = await getEmailMessages(threadId)
        setMessages(messagesData)
      } catch (error) {
        console.error("Failed to load email thread or messages:", error)
      } finally {
        setLoading(false)
      }
    }

    if (threadId) {
      loadThreadAndMessages()
    }
  }, [threadId, initialThread])

  // Sample data for demonstration
  const sampleThread: EmailThread = {
    id: threadId,
    subject: "Project Proposal Discussion",
    snippet: "I've reviewed the proposal and have some feedback...",
    participants: [
      { email: "client@example.com", name: "John Client" },
      { email: "me@streamline.com", name: "Me" },
    ],
    unread: false,
    lastMessageAt: new Date().toISOString(),
    folder: "inbox",
    labels: ["important"],
  }

  const sampleMessages: EmailMessage[] = [
    {
      id: "1",
      threadId,
      from: { email: "client@example.com", name: "John Client" },
      to: [{ email: "me@streamline.com", name: "Me" }],
      subject: "Project Proposal Discussion",
      body: "Hi,\n\nI've reviewed the proposal you sent over and I have some feedback. Overall, I think it looks good, but I have a few questions about the timeline and budget.\n\nCould we schedule a call to discuss these points?\n\nBest regards,\nJohn",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "2",
      threadId,
      from: { email: "me@streamline.com", name: "Me" },
      to: [{ email: "client@example.com", name: "John Client" }],
      subject: "Re: Project Proposal Discussion",
      body: "Hi John,\n\nThank you for reviewing the proposal. I'd be happy to schedule a call to discuss your questions about the timeline and budget.\n\nHow does tomorrow at 2 PM your time sound?\n\nBest regards,\nMe",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    },
    {
      id: "3",
      threadId,
      from: { email: "client@example.com", name: "John Client" },
      to: [{ email: "me@streamline.com", name: "Me" }],
      subject: "Re: Project Proposal Discussion",
      body: "That works for me. I'll send a calendar invite with the meeting details.\n\nTalk to you tomorrow!\n\nJohn",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    },
  ]

  // Use sample data for now
  const displayThread = thread || sampleThread
  const displayMessages = messages.length > 0 ? messages : sampleMessages

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{displayThread.subject}</h2>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <span>
            {displayThread.participants
              .filter((p) => p.email !== "me@streamline.com")
              .map((p) => p.name || p.email)
              .join(", ")}
          </span>
          <span className="mx-2">•</span>
          <span>{new Date(displayThread.lastMessageAt).toLocaleDateString()}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {displayMessages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback>{(message.from.name || message.from.email).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{message.from.name || message.from.email}</div>
                    <div className="text-xs text-muted-foreground">{new Date(message.sentAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Button variant="ghost" size="icon">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Forward className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="pl-12 whitespace-pre-wrap">{message.body}</div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex space-x-2">
        <Button>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
        <Button variant="outline">
          <Forward className="h-4 w-4 mr-2" />
          Forward
        </Button>
      </div>
    </div>
  )
}
