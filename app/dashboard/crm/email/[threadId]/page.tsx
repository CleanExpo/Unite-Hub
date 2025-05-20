"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EmailSidebar } from "@/components/crm/email/email-sidebar"
import { EmailThreadView } from "@/components/crm/email/email-thread-view"
import { EmailComposer } from "@/components/crm/email/email-composer"
import { getEmailThread, type EmailThread } from "@/lib/email-integration"

export default function EmailThreadPage({ params }: { params: { threadId: string } }) {
  const [thread, setThread] = useState<EmailThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadThread() {
      setLoading(true)
      try {
        const data = await getEmailThread(params.threadId)
        setThread(data)
      } catch (error) {
        console.error("Failed to load email thread:", error)
        // Redirect to inbox if thread not found
        router.push("/dashboard/crm/email")
      } finally {
        setLoading(false)
      }
    }

    if (params.threadId) {
      loadThread()
    }
  }, [params.threadId, router])

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <EmailSidebar selectedThreadId={params.threadId} onComposeClick={() => setIsComposerOpen(true)} />

      <div className="flex-1 overflow-hidden">
        <EmailThreadView threadId={params.threadId} thread={thread || undefined} />
      </div>

      <EmailComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} threadId={params.threadId} />
    </div>
  )
}
