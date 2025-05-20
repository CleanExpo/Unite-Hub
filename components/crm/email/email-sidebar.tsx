"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Inbox, Send, Archive, Trash, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getEmailThreads, type EmailThread } from "@/lib/email-integration"

interface EmailSidebarProps {
  selectedThreadId?: string
  onThreadSelect?: (threadId: string) => void
  onComposeClick: () => void
}

export function EmailSidebar({ selectedThreadId, onThreadSelect, onComposeClick }: EmailSidebarProps) {
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("inbox")

  useEffect(() => {
    async function loadThreads() {
      setLoading(true)
      try {
        const data = await getEmailThreads({ folder: filter })
        setThreads(data)
      } catch (error) {
        console.error("Failed to load email threads:", error)
        setThreads([])
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [filter])

  // Sample data for demonstration
  const sampleThreads: EmailThread[] = [
    {
      id: "1",
      subject: "Project Proposal Discussion",
      snippet: "I've reviewed the proposal and have some feedback...",
      participants: [
        { email: "client@example.com", name: "John Client" },
        { email: "me@streamline.com", name: "Me" },
      ],
      unread: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      folder: "inbox",
      labels: ["important"],
    },
    {
      id: "2",
      subject: "Meeting Confirmation",
      snippet: "This is to confirm our meeting scheduled for tomorrow at 2 PM...",
      participants: [
        { email: "partner@example.com", name: "Business Partner" },
        { email: "me@streamline.com", name: "Me" },
      ],
      unread: false,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      folder: "inbox",
      labels: [],
    },
    {
      id: "3",
      subject: "Invoice #1234",
      snippet: "Please find attached the invoice for services rendered...",
      participants: [
        { email: "accounting@streamline.com", name: "Accounting" },
        { email: "client@example.com", name: "John Client" },
      ],
      unread: false,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      folder: "sent",
      labels: ["invoice"],
    },
  ]

  // Use sample data for now
  const displayThreads = loading ? [] : threads.length > 0 ? threads : sampleThreads

  // Filter threads based on the selected folder
  const filteredThreads = displayThreads.filter((thread) => {
    if (filter === "inbox") return thread.folder === "inbox"
    if (filter === "sent") return thread.folder === "sent"
    if (filter === "archive") return thread.folder === "archive"
    if (filter === "trash") return thread.folder === "trash"
    return true
  })

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onComposeClick} className="w-full justify-start" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Compose
        </Button>
        <div className="mt-2">
          <Input
            type="search"
            placeholder="Search emails..."
            className="h-8"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </div>

      <div className="p-2">
        <nav className="grid gap-1">
          <Button
            variant={filter === "inbox" ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => setFilter("inbox")}
          >
            <Inbox className="h-4 w-4 mr-2" />
            Inbox
            {filteredThreads.filter((t) => t.folder === "inbox" && t.unread).length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {filteredThreads.filter((t) => t.folder === "inbox" && t.unread).length}
              </span>
            )}
          </Button>
          <Button
            variant={filter === "sent" ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => setFilter("sent")}
          >
            <Send className="h-4 w-4 mr-2" />
            Sent
          </Button>
          <Button
            variant={filter === "archive" ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => setFilter("archive")}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button
            variant={filter === "trash" ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => setFilter("trash")}
          >
            <Trash className="h-4 w-4 mr-2" />
            Trash
          </Button>
          <Button
            variant={filter === "labels" ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => setFilter("labels")}
          >
            <Tag className="h-4 w-4 mr-2" />
            Labels
          </Button>
        </nav>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredThreads.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">No emails found</div>
          ) : (
            <div className="grid gap-1">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  className={`p-2 text-left rounded-md hover:bg-accent w-full ${
                    thread.id === selectedThreadId ? "bg-accent" : ""
                  } ${thread.unread ? "font-medium" : ""}`}
                  onClick={() => onThreadSelect?.(thread.id)}
                >
                  <div className="flex justify-between items-start">
                    <span className="block truncate font-medium">
                      {thread.participants
                        .filter((p) => p.email !== "me@streamline.com")
                        .map((p) => p.name || p.email)
                        .join(", ")}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="block truncate">{thread.subject}</span>
                  <span className="block truncate text-sm text-muted-foreground">{thread.snippet}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
