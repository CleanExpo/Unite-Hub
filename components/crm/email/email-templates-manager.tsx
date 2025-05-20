"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getEmailTemplates, saveEmailTemplate, deleteEmailTemplate, type EmailTemplate } from "@/lib/email-integration"

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateSubject, setTemplateSubject] = useState("")
  const [templateBody, setTemplateBody] = useState("")
  const [isShared, setIsShared] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true)
      try {
        const data = await getEmailTemplates()
        setTemplates(data)
      } catch (error) {
        console.error("Failed to load email templates:", error)
        setTemplates([])
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [])

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
    {
      id: "3",
      name: "Invoice Reminder",
      subject: "Reminder: Invoice #{{invoice_number}} Due",
      body: "Dear {{name}},\n\nThis is a friendly reminder that invoice #{{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nIf you have already made the payment, please disregard this message.\n\nIf you have any questions about the invoice, please don't hesitate to contact us.\n\nThank you for your business.\n\nBest regards,\n{{sender}}",
      isShared: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Use sample templates for now
  const displayTemplates = templates.length > 0 ? templates : sampleTemplates

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateName("")
    setTemplateSubject("")
    setTemplateBody("")
    setIsShared(false)
    setIsDialogOpen(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateSubject(template.subject)
    setTemplateBody(template.body)
    setIsShared(template.isShared)
    setIsDialogOpen(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      const result = await deleteEmailTemplate(templateId)
      if (result.success) {
        setTemplates(templates.filter((t) => t.id !== templateId))
      } else {
        alert(`Failed to delete template: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("Failed to delete template. Please try again.")
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name")
      return
    }

    if (!templateSubject.trim()) {
      alert("Please enter a subject")
      return
    }

    if (!templateBody.trim()) {
      alert("Please enter a body")
      return
    }

    setIsSaving(true)
    try {
      const result = await saveEmailTemplate({
        id: editingTemplate?.id,
        name: templateName,
        subject: templateSubject,
        body: templateBody,
        isShared,
      })

      if (result.success) {
        // Update templates list
        if (editingTemplate) {
          setTemplates(
            templates.map((t) =>
              t.id === editingTemplate.id
                ? {
                    ...t,
                    name: templateName,
                    subject: templateSubject,
                    body: templateBody,
                    isShared,
                    updatedAt: new Date().toISOString(),
                  }
                : t,
            ),
          )
        } else {
          const newTemplate: EmailTemplate = {
            id: result.templateId!,
            name: templateName,
            subject: templateSubject,
            body: templateBody,
            isShared,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setTemplates([...templates, newTemplate])
        }

        setIsDialogOpen(false)
      } else {
        alert(`Failed to save template: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Failed to save template. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <p>Loading templates...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable email templates</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {displayTemplates.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">No templates found</p>
          <Button onClick={handleCreateTemplate}>Create your first template</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="mr-2">{template.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {template.subject}
                  {template.isShared && (
                    <span className="ml-2 inline-flex items-center">
                      <Share className="h-3 w-3 mr-1" />
                      Shared
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">{template.body}</div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Updated {new Date(template.updatedAt).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Meeting Follow-up"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="e.g., Follow-up: Our Meeting on {{date}}"
              />
              <p className="text-xs text-muted-foreground">Use {{ variable }} syntax for placeholders</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                placeholder="Dear {{name}},

Thank you for your time. I wanted to follow up on our discussion about {{topic}}.

Best regards,
{{sender}}"
                className="min-h-[200px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="shared" checked={isShared} onCheckedChange={(checked) => setIsShared(checked === true)} />
              <Label htmlFor="shared">Share with team members</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
