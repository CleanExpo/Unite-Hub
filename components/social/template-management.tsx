"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash, Edit, Copy, Eye, Facebook, Twitter, Linkedin, Youtube } from "lucide-react"
import {
  getUserTemplates,
  getPublicTemplates,
  getTemplateCategories,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  extractVariables,
} from "@/lib/social-templates"
import type { SocialTemplate, SocialTemplateCategory } from "@/types/social-templates"
import { useToast } from "@/components/ui/use-toast"

export function TemplateManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("my-templates")
  const [myTemplates, setMyTemplates] = useState<SocialTemplate[]>([])
  const [publicTemplates, setPublicTemplates] = useState<SocialTemplate[]>([])
  const [categories, setCategories] = useState<SocialTemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<SocialTemplate | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateContent, setTemplateContent] = useState("")
  const [templateCategory, setTemplateCategory] = useState("")
  const [templatePlatforms, setTemplatePlatforms] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [previewMode, setPreviewMode] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<SocialTemplate | null>(null)
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [userTemplates, publicTemps, cats] = await Promise.all([
        getUserTemplates(user?.id || ""),
        getPublicTemplates(),
        getTemplateCategories(),
      ])
      setMyTemplates(userTemplates)
      setPublicTemplates(publicTemps.filter((t) => t.user_id !== user?.id))
      setCategories(cats)
    } catch (error) {
      console.error("Error loading templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!user) return

    try {
      const extractedVars = extractVariables(templateContent)
      const varsObject: Record<string, string> = {}

      extractedVars.forEach((v) => {
        varsObject[v] = ""
      })

      const newTemplate = await createTemplate({
        user_id: user.id,
        name: templateName,
        description: templateDescription || null,
        content: templateContent,
        variables: varsObject,
        category: templateCategory || null,
        platforms: templatePlatforms,
        is_public: isPublic,
      })

      setMyTemplates([newTemplate, ...myTemplates])
      resetForm()
      setIsCreating(false)

      toast({
        title: "Success",
        description: "Template created successfully!",
      })
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!currentTemplate) return

    try {
      const extractedVars = extractVariables(templateContent)
      const varsObject: Record<string, string> = {}

      extractedVars.forEach((v) => {
        varsObject[v] = currentTemplate.variables[v] || ""
      })

      const updatedTemplate = await updateTemplate(currentTemplate.id, {
        name: templateName,
        description: templateDescription || null,
        content: templateContent,
        variables: varsObject,
        category: templateCategory || null,
        platforms: templatePlatforms,
        is_public: isPublic,
      })

      setMyTemplates(myTemplates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))
      resetForm()
      setIsEditing(false)

      toast({
        title: "Success",
        description: "Template updated successfully!",
      })
    } catch (error) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await deleteTemplate(templateId)
      setMyTemplates(myTemplates.filter((t) => t.id !== templateId))

      toast({
        title: "Success",
        description: "Template deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = (template: SocialTemplate) => {
    setCurrentTemplate(template)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setTemplateContent(template.content)
    setTemplateCategory(template.category || "")
    setTemplatePlatforms(template.platforms)
    setIsPublic(template.is_public)
    setIsEditing(true)
  }

  const handleDuplicateTemplate = (template: SocialTemplate) => {
    setTemplateName(`${template.name} (Copy)`)
    setTemplateDescription(template.description || "")
    setTemplateContent(template.content)
    setTemplateCategory(template.category || "")
    setTemplatePlatforms(template.platforms)
    setIsPublic(false)
    setIsCreating(true)
  }

  const handlePreviewTemplate = (template: SocialTemplate) => {
    setPreviewTemplate(template)
    setPreviewVariables({ ...template.variables })
    setPreviewMode(true)
  }

  const resetForm = () => {
    setTemplateName("")
    setTemplateDescription("")
    setTemplateContent("")
    setTemplateCategory("")
    setTemplatePlatforms([])
    setIsPublic(false)
    setCurrentTemplate(null)
  }

  const handlePlatformToggle = (platform: string) => {
    if (templatePlatforms.includes(platform)) {
      setTemplatePlatforms(templatePlatforms.filter((p) => p !== platform))
    } else {
      setTemplatePlatforms([...templatePlatforms, platform])
    }
  }

  const getPlatformIcon = (platform: string, size = 5) => {
    switch (platform) {
      case "facebook":
        return <Facebook className={`h-${size} w-${size} text-[#1877F2]`} />
      case "twitter":
        return <Twitter className={`h-${size} w-${size} text-[#1DA1F2]`} />
      case "linkedin":
        return <Linkedin className={`h-${size} w-${size} text-[#0A66C2]`} />
      case "youtube":
        return <Youtube className={`h-${size} w-${size} text-[#FF0000]`} />
      default:
        return null
    }
  }

  const renderPreviewContent = () => {
    if (!previewTemplate) return ""

    let content = previewTemplate.content

    for (const [key, value] of Object.entries(previewVariables)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `{{${key}}}`)
    }

    return content
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <Tabs defaultValue="my-templates" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="my-templates">My Templates</TabsTrigger>
            <TabsTrigger value="public-templates">Public Templates</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              resetForm()
              setIsCreating(true)
            }}
            className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        <TabsContent value="my-templates">
          {myTemplates.length === 0 ? (
            <div className="text-center py-12 bg-[#001428]/50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No Templates Yet</h3>
              <p className="text-gray-400 mb-4">Create your first template to get started</p>
              <Button
                onClick={() => {
                  resetForm()
                  setIsCreating(true)
                }}
                className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTemplates.map((template) => (
                <Card key={template.id} className="bg-[#001428]/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        {template.platforms.map((platform) => (
                          <div key={platform}>{getPlatformIcon(platform, 4)}</div>
                        ))}
                      </div>
                    </div>
                    {template.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-3 text-gray-400 mb-2">
                      {template.description || "No description"}
                    </p>
                    <div className="bg-[#002a42] p-2 rounded-md text-sm line-clamp-3">{template.content}</div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="text-xs text-gray-400">Used {template.times_used} times</div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public-templates">
          {publicTemplates.length === 0 ? (
            <div className="text-center py-12 bg-[#001428]/50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No Public Templates Available</h3>
              <p className="text-gray-400">Check back later or create your own templates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicTemplates.map((template) => (
                <Card key={template.id} className="bg-[#001428]/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        {template.platforms.map((platform) => (
                          <div key={platform}>{getPlatformIcon(platform, 4)}</div>
                        ))}
                      </div>
                    </div>
                    {template.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-3 text-gray-400 mb-2">
                      {template.description || "No description"}
                    </p>
                    <div className="bg-[#002a42] p-2 rounded-md text-sm line-clamp-3">{template.content}</div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="text-xs text-gray-400">Used {template.times_used} times</div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={isCreating || isEditing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setIsEditing(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] bg-[#001428]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your social media template details."
                : "Create a reusable template for your social media posts."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="Template name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="col-span-3"
                placeholder="Template description (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="col-span-3 min-h-32"
                placeholder="Template content with {{variables}}"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Platforms</Label>
              <div className="col-span-3 flex flex-wrap gap-3">
                {["facebook", "twitter", "linkedin", "youtube"].map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={templatePlatforms.includes(platform)}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                    />
                    <Label htmlFor={`platform-${platform}`} className="flex items-center gap-1 cursor-pointer">
                      {getPlatformIcon(platform, 4)}
                      <span className="capitalize">{platform}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-public" className="text-right">
                Public
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked === true)}
                />
                <Label htmlFor="is-public" className="cursor-pointer">
                  Make this template available to all users
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setIsEditing(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              onClick={isEditing ? handleUpdateTemplate : handleCreateTemplate}
              disabled={!templateName || !templateContent || templatePlatforms.length === 0}
            >
              {isEditing ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog
        open={previewMode}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewMode(false)
            setPreviewTemplate(null)
            setPreviewVariables({})
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] bg-[#001428]">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>Preview how your template will look with variable values.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {previewTemplate && Object.keys(previewTemplate.variables).length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Template Variables</h4>
                {Object.keys(previewTemplate.variables).map((key) => (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`var-${key}`} className="text-right">
                      {key}
                    </Label>
                    <Input
                      id={`var-${key}`}
                      value={previewVariables[key] || ""}
                      onChange={(e) => setPreviewVariables({ ...previewVariables, [key]: e.target.value })}
                      className="col-span-3"
                      placeholder={`Value for ${key}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Preview</h4>
              <div className="bg-[#002a42] p-4 rounded-md whitespace-pre-wrap">{renderPreviewContent()}</div>
            </div>
            <div className="flex gap-2">
              <h4 className="text-sm font-medium">Platforms:</h4>
              <div className="flex gap-1">
                {previewTemplate?.platforms.map((platform) => (
                  <div key={platform}>{getPlatformIcon(platform, 4)}</div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewMode(false)
                setPreviewTemplate(null)
                setPreviewVariables({})
              }}
            >
              Close
            </Button>
            <Button
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              onClick={() => {
                if (previewTemplate) {
                  handleDuplicateTemplate(previewTemplate)
                  setPreviewMode(false)
                  setPreviewTemplate(null)
                  setPreviewVariables({})
                }
              }}
            >
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
