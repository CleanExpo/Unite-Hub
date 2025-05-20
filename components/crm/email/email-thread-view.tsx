"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Reply, ReplyAll, Forward, Archive, Trash, Download, ChevronDown, ChevronUp, Paperclip } from "lucide-react"
import { getEmailMessages, markThreadAsRead, type EmailMessage, type EmailThread } from "@/lib/email-integration"
import { EmailComposer } from "./email-composer"

interface EmailThreadViewProps {
  threadId: string
  thread?: EmailThread
  clientId?: number
}

export function EmailThreadView({ threadId, thread, clientId }: EmailThreadViewProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({})
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [replyType, setReplyType] = useState<"reply" | "replyAll" | "forward">("reply")
  const [replyToMessage, setReplyToMessage] = useState<EmailMessage | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadMessages() {
      setLoading(true)
      try {
        const data = await getEmailMessages(threadId)
        setMessages(data)

        // Mark thread as read
        await markThreadAsRead(threadId)

        // Expand the last message by default
        if (data.length > 0) {
          setExpandedMessages({
            [data[data.length - 1].id]: true,
          })
        }
      } catch (error) {
        console.error("Failed to load email messages:", error)
      } finally {
        setLoading(false)
      }
    }

    if (threadId) {
      loadMessages()
    }
  }, [threadId])

  const toggleMessageExpand = (messageId: string) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const handleReply = (message: EmailMessage, type: "reply" | "replyAll" | "forward") => {
    setReplyType(type)
    setReplyToMessage(message)
    setIsComposerOpen(true)
  }

  const getReplyDetails = () => {
    if (!replyToMessage) return { to: "", subject: "", body: "" }

    let to = ""
    let subject = ""
    let body = ""

    if (replyType === "reply") {
      to = replyToMessage.from_email
      subject = `Re: ${replyToMessage.subject}`
    } else if (replyType === "replyAll") {
      // Include original sender and all recipients except current user
      const allRecipients = [
        replyToMessage.from_email,
        ...replyToMessage.to_recipients.map((r) => r.email),
        ...(replyToMessage.cc_recipients?.map((r) => r.email) || []),
      ]
      // TODO: Filter out current user's email
      to = allRecipients.join(", ")
      subject = `Re: ${replyToMessage.subject}`
    } else if (replyType === "forward") {
      to = ""
      subject = `Fwd: ${replyToMessage.subject}`
    }

    // Create quoted reply
    const date = new Date(replyToMessage.sent_at || replyToMessage.created_at).toLocaleString()
    const sender = replyToMessage.from_name || replyToMessage.from_email

    body = `
<br><br>
<div style="padding-left: 1em; border-left: 2px solid #ccc; margin: 1em 0;">
  <p>On ${date}, ${sender} wrote:</p>
  ${replyToMessage.body_html || replyToMessage.body_text || ""}
</div>
`

    return { to, subject, body }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
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

  if (messages.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No messages found in this thread</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(clientId ? `/dashboard/crm/clients/${clientId}/email` : "/dashboard/crm/email")}
        >
          Back to Inbox
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">{thread?.subject || messages[0].subject}</h2>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => handleReply(messages[messages.length - 1], "reply")}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleReply(messages[messages.length - 1], "replyAll")}>
            <ReplyAll className="h-4 w-4 mr-2" />
            Reply All
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleReply(messages[messages.length - 1], "forward")}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="icon">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {messages.map((message, index) => {
            const isExpanded = expandedMessages[message.id] || false
            const isLastMessage = index === messages.length - 1

            return (
              <div
                key={message.id}
                className={`border rounded-lg ${isLastMessage ? "border-gray-300 bg-gray-50" : "border-gray-200"}`}
              >
                <div
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleMessageExpand(message.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <div className="bg-primary text-primary-foreground rounded-full h-full w-full flex items-center justify-center text-sm font-medium">
                        {message.from_name?.[0] || message.from_email[0]}
                      </div>
                    </Avatar>
                    <div>
                      <div className="font-medium">{message.from_name || message.from_email}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(message.sent_at || message.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {message.has_attachments && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="text-sm mb-2">
                      <span className="font-medium">To:</span>{" "}
                      {message.to_recipients.map((r) => r.name || r.email).join(", ")}
                    </div>

                    {message.cc_recipients && message.cc_recipients.length > 0 && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Cc:</span>{" "}
                        {message.cc_recipients.map((r) => r.name || r.email).join(", ")}
                      </div>
                    )}

                    <div
                      className="mt-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: message.body_html || message.body_text || "" }}
                    />

                    {message.has_attachments && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium mb-2">Attachments</h4>
                        <div className="flex flex-wrap gap-2">
                          {/* Placeholder for attachments */}
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-sm">
                            <Paperclip className="h-4 w-4" />
                            <span>attachment.pdf</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReply(message, "reply")
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReply(message, "replyAll")
                        }}
                      >
                        <ReplyAll className="h-3 w-3 mr-1" />
                        Reply All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReply(message, "forward")
                        }}
                      >
                        <Forward className="h-3 w-3 mr-1" />
                        Forward
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        initialTo={getReplyDetails().to}
        initialSubject={getReplyDetails().subject}
        initialBody={getReplyDetails().body}
        threadId={replyType !== "forward" ? threadId : undefined}
        clientId={clientId}
      />
    </div>
  )
}
