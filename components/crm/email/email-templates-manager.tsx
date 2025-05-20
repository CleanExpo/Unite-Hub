"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash, Copy } from "lucide-react"
import { getEmailTemplates, saveEmailTemplate, type EmailTemplate } from "@/lib/email-integration"

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await getEmailTemplates()
      setTemplates(data)
    } catch (error) {
      console.error("Failed to load email templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: "",
      subject: "",
      body: "",
      is_shared: false,
    })
    setIsDialogOpen(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setIsDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.subject || !editingTemplate.body) {
      alert("Please fill in all required fields")
      return
    }

    try {
      await saveEmailTemplate({
        ...editingTemplate,
        user_id: editingTemplate.user_id || "current-user", // This will be set on the server
      })

      setIsDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error("Failed to save template:", error)
      alert("Failed to save template. Please try again.")
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable email templates</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {loading ? (
        <div>Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No templates match your search" : "No templates found"}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate">{template.name}</span>
                  {template.is_shared && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Shared</span>
                  )}
                </CardTitle>
                <CardDescription className="truncate">{template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-24 overflow-hidden text-sm text-muted-foreground">
                  {template.body.replace(/<[^>]*>/g, " ").substring(0, 150)}...
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={editingTemplate?.name || ""}
                    onChange={(e) => setEditingTemplate((prev) => ({ ...prev!, name: e.target.value }))}
                    placeholder="e.g., Welcome Email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={editingTemplate?.subject || ""}
                    onChange={(e) => setEditingTemplate((prev) => ({ ...prev!, subject: e.target.value }))}
                    placeholder="e.g., Welcome to {{company_name}}"
                  />
                  <p className="text-xs text-muted-foreground">Use {{ variable }} syntax for dynamic content</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={editingTemplate?.body || ""}
                    onChange={(e) => setEditingTemplate((prev) => ({ ...prev!, body: e.target.value }))}
                    placeholder="Write your email template here..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    HTML is supported. Use {{ variable }} syntax for dynamic content.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_shared"
                    checked={editingTemplate?.is_shared || false}
                    onCheckedChange={(checked) =>
                      setEditingTemplate((prev) => ({ ...prev!, is_shared: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_shared">Share this template with team members</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
