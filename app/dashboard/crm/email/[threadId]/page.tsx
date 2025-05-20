"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EmailSidebar } from "@/components/crm/email/email-sidebar"
import { EmailThreadView } from "@/components/crm/email/email-thread-view"
import { EmailComposer } from "@/components/crm/email/email-composer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function EmailThreadPage({
  params,
}: {
  params: { threadId: string }
}) {
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b flex items-center">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/crm/email")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
        <h1 className="text-xl font-semibold">Email Thread</h1>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="hidden md:block">
          <EmailSidebar selectedThreadId={params.threadId} onComposeClick={() => setIsComposerOpen(true)} />
        </div>

        <div className="flex-1 overflow-hidden">
          <EmailThreadView threadId={params.threadId} />
        </div>
      </div>

      <EmailComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} />
    </div>
  )
}
