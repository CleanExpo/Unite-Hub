"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, Inbox, Archive } from "lucide-react"
import { getEmailThreads, type EmailThread } from "@/lib/email-integration"

interface EmailSidebarProps {
  selectedThreadId?: string
  clientId?: number
  onComposeClick: () => void
}

export function EmailSidebar({ selectedThreadId, clientId, onComposeClick }: EmailSidebarProps) {
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("inbox")
  const router = useRouter()

  useEffect(() => {
    async function loadThreads() {
      setLoading(true)
      try {
        const options = clientId ? { client_id: clientId } : undefined
        const data = await getEmailThreads(options)
        setThreads(data)
      } catch (error) {
        console.error("Failed to load email threads:", error)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [clientId])

  const filteredThreads = threads.filter((thread) => {
    // Filter by search query
    if (searchQuery && !thread.subject.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Filter by tab
    if (activeTab === "inbox") {
      return true // Show all in inbox for now
    } else if (activeTab === "unread") {
      return !thread.is_read
    } else if (activeTab === "attachments") {
      return thread.has_attachments
    }

    return true
  })

  const handleThreadClick = (threadId: string) => {
    if (clientId) {
      router.push(`/dashboard/crm/clients/${clientId}/email/${threadId}`)
    } else {
      router.push(`/dashboard/crm/email/${threadId}`)
    }
  }

  return (
    <div className="w-full md:w-80 border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Button onClick={onComposeClick} className="w-full flex items-center justify-center gap-2">
          <Plus size={16} />
          <span>Compose</span>
        </Button>

        <div className="mt-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="inbox" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <div className="border-b border-gray-200">
          <TabsList className="w-full justify-start p-0 h-auto bg-transparent border-b-0">
            <TabsTrigger value="inbox" className="data-[state=active]:bg-gray-100 rounded-none py-2 px-4">
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-gray-100 rounded-none py-2 px-4">
              <Badge variant="secondary" className="mr-2">
                {threads.filter((t) => !t.is_read).length}
              </Badge>
              Unread
            </TabsTrigger>
            <TabsTrigger value="attachments" className="data-[state=active]:bg-gray-100 rounded-none py-2 px-4">
              <Archive className="h-4 w-4 mr-2" />
              Attachments
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="inbox" className="m-0 p-0 h-full">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No emails match your search" : "No emails found"}
              </div>
            ) : (
              <div>
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedThreadId === thread.id ? "bg-gray-100" : ""
                    } ${!thread.is_read ? "font-semibold" : ""}`}
                    onClick={() => handleThreadClick(thread.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm truncate">{thread.subject}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(thread.last_message_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {thread.snippet || "No preview available"}
                    </p>
                    <div className="flex items-center mt-1 gap-2">
                      {!thread.is_read && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          New
                        </Badge>
                      )}
                      {thread.has_attachments && <Archive className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {thread.message_count} {thread.message_count === 1 ? "message" : "messages"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="m-0 p-0 h-full">
            {/* Same structure as inbox but filtered for unread */}
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No unread emails</div>
            ) : (
              <div>{/* Thread list - same as inbox tab */}</div>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="m-0 p-0 h-full">
            {/* Same structure as inbox but filtered for attachments */}
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No emails with attachments</div>
            ) : (
              <div>{/* Thread list - same as inbox tab */}</div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
