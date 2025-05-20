"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Paperclip, X, LayoutTemplateIcon as Template } from "lucide-react"
import {
  getEmailAccounts,
  getEmailTemplates,
  sendEmail,
  type EmailAccount,
  type EmailTemplate,
} from "@/lib/email-integration"

interface EmailComposerProps {
  isOpen: boolean
  onClose: () => void
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  threadId?: string
  clientId?: number
  opportunityId?: number
  contactId?: number
}

export function EmailComposer({
  isOpen,
  onClose,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  threadId,
  clientId,
  opportunityId,
  contactId,
}: EmailComposerProps) {
  const [to, setTo] = useState(initialTo)
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [fromAccount, setFromAccount] = useState<string>("")
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        // Load email accounts
        const accountsData = await getEmailAccounts()
        setAccounts(accountsData)

        // Set default from account (primary)
        const primaryAccount = accountsData.find((a) => a.is_primary)
        if (primaryAccount) {
          setFromAccount(primaryAccount.id)
        } else if (accountsData.length > 0) {
          setFromAccount(accountsData[0].id)
        }

        // Load email templates
        const templatesData = await getEmailTemplates()
        setTemplates(templatesData)
      } catch (error) {
        console.error("Failed to load email data:", error)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTo(initialTo)
      setSubject(initialSubject)
      setBody(initialBody)
    } else {
      setTo("")
      setCc("")
      setBcc("")
      setSubject("")
      setBody("")
      setAttachments([])
      setShowCcBcc(false)
    }
  }, [isOpen, initialTo, initialSubject, initialBody])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    }
  }

  const handleSend = async () => {
    if (!to || !subject || !body || !fromAccount) {
      alert("Please fill in all required fields")
      return
    }

    setIsSending(true)

    try {
      const account = accounts.find((a) => a.id === fromAccount)
      if (!account) throw new Error("Selected email account not found")

      // Parse recipients
      const toRecipients = to.split(",").map((email) => {
        const trimmed = email.trim()
        return { email: trimmed }
      })

      const ccRecipients = cc
        ? cc.split(",").map((email) => {
            const trimmed = email.trim()
            return { email: trimmed }
          })
        : []

      const bccRecipients = bcc
        ? bcc.split(",").map((email) => {
            const trimmed = email.trim()
            return { email: trimmed }
          })
        : []

      // Send the email
      await sendEmail({
        thread_id: threadId,
        user_id: account.user_id,
        from_email: account.email,
        from_name: account.name,
        to_recipients: toRecipients,
        cc_recipients: ccRecipients,
        bcc_recipients: bccRecipients,
        subject,
        body_html: body,
        body_text: body.replace(/<[^>]*>/g, ""), // Simple HTML to text conversion
        is_read: true,
        has_attachments: attachments.length > 0,
        is_draft: false,
        is_sent_by_user: true,
        client_id: clientId,
        opportunity_id: opportunityId,
        contact_id: contactId,
      })

      // TODO: Handle attachments upload

      // Close the composer and refresh the page
      onClose()
      router.refresh()
    } catch (error) {
      console.error("Failed to send email:", error)
      alert("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="from" className="w-16">
                From:
              </Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an email account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="to" className="w-16">
                To:
              </Label>
              <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
            </div>

            {showCcBcc && (
              <>
                <div className="flex items-center gap-4">
                  <Label htmlFor="cc" className="w-16">
                    Cc:
                  </Label>
                  <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com" />
                </div>

                <div className="flex items-center gap-4">
                  <Label htmlFor="bcc" className="w-16">
                    Bcc:
                  </Label>
                  <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@example.com" />
                </div>
              </>
            )}

            {!showCcBcc && (
              <div className="ml-20">
                <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setShowCcBcc(true)}>
                  Add Cc/Bcc
                </Button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Label htmlFor="subject" className="w-16">
                Subject:
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Template className="h-4 w-4 mr-2" />
                        Templates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0">
                      <div className="p-2">
                        <p className="text-sm font-medium">Apply Template</p>
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {templates.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-2">No templates available</p>
                        ) : (
                          templates.map((template) => (
                            <Button
                              key={template.id}
                              variant="ghost"
                              className="w-full justify-start text-sm p-2 h-auto"
                              onClick={() => applyTemplate(template.id)}
                            >
                              {template.name}
                            </Button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" className="h-8" type="button">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach
                    </Button>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email here..."
                className="min-h-[200px] mt-2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
