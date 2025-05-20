"use client"

import { useState, useEffect } from "react"
import { Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendEmail, getEmailTemplates, type EmailTemplate } from "@/lib/email-integration"

interface EmailComposerProps {
  isOpen: boolean
  onClose: () => void
  threadId?: string
  initialTo?: { email: string; name?: string }[]
  initialSubject?: string
  initialBody?: string
}

export function EmailComposer({
  isOpen,
  onClose,
  threadId,
  initialTo = [],
  initialSubject = "",
  initialBody = "",
}: EmailComposerProps) {
  const [to, setTo] = useState(initialTo.map((p) => p.email).join(", "))
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await getEmailTemplates()
        setTemplates(data)
      } catch (error) {
        console.error("Failed to load email templates:", error)
      }
    }

    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTo(initialTo.map((p) => p.email).join(", "))
      setSubject(initialSubject)
      setBody(initialBody)
    } else {
      setTo("")
      setCc("")
      setBcc("")
      setSubject("")
      setBody("")
      setShowCcBcc(false)
      setSelectedTemplate("")
    }
  }, [isOpen, initialTo, initialSubject, initialBody])

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate)
      if (template) {
        setSubject(template.subject)
        setBody(template.body)
      }
    }
  }, [selectedTemplate, templates])

  const handleSend = async () => {
    if (!to.trim()) {
      alert("Please specify at least one recipient")
      return
    }

    setIsSending(true)
    try {
      const toRecipients = to.split(",").map((email) => ({
        email: email.trim(),
      }))

      const ccRecipients = cc
        ? cc.split(",").map((email) => ({
            email: email.trim(),
          }))
        : undefined

      const bccRecipients = bcc
        ? bcc.split(",").map((email) => ({
            email: email.trim(),
          }))
        : undefined

      const result = await sendEmail({
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
        subject,
        body,
        threadId,
      })

      if (result.success) {
        onClose()
      } else {
        alert(`Failed to send email: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  // Sample templates for demonstration
  const sampleTemplates: EmailTemplate[] = [
    {
      id: "1",
      name: "Meeting Follow-up",
      subject: "Follow-up: Our Meeting on {{date}}",
      body: "Dear {{name}},\n\nThank you for taking the time to meet with me today. I wanted to follow up on our discussion about {{topic}}.\n\nAs discussed, I will {{action}} by {{deadline}}.\n\nPlease let me know if you have any questions or need any additional information.\n\nBest regards,\n{{sender}}",
      isShared: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Project Update",
      subject: "Project Update: {{project}}",
      body: "Hi {{name}},\n\nI wanted to provide you with an update on the {{project}} project.\n\nCurrent Status:\n- {{status}}\n\nNext Steps:\n- {{next_steps}}\n\nTimeline:\n- {{timeline}}\n\nPlease let me know if you have any questions or concerns.\n\nBest regards,\n{{sender}}",
      isShared: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Use sample templates for now
  const displayTemplates = templates.length > 0 ? templates : sampleTemplates

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <label htmlFor="to" className="w-12 text-right text-sm font-medium">
              To:
            </label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </div>

          {showCcBcc && (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="cc" className="w-12 text-right text-sm font-medium">
                  Cc:
                </label>
                <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com" />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="bcc" className="w-12 text-right text-sm font-medium">
                  Bcc:
                </label>
                <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@example.com" />
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            {!showCcBcc && (
              <Button variant="link" className="w-12 justify-end p-0 h-auto text-xs" onClick={() => setShowCcBcc(true)}>
                Cc/Bcc
              </Button>
            )}
            {showCcBcc && <div className="w-12" />}
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="template" className="w-12 text-right text-sm font-medium">
              Template:
            </label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {displayTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-hidden">
            <Textarea
              className="h-full resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div>
            <Button variant="outline" size="sm" className="mr-2">
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
          </div>
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2">
              Discard
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
