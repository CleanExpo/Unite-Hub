"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, Star } from "lucide-react"
import type { GalleryTemplate } from "@/types/template-gallery"

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  template: GalleryTemplate
  onImport: (template: GalleryTemplate) => Promise<void>
  isImporting: boolean
}

export function TemplatePreviewModal({ isOpen, onClose, template, onImport, isImporting }: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<string>("preview")

  const handleImport = async () => {
    await onImport(template)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{template.name}</DialogTitle>
            {template.isPremium && <Badge className="bg-amber-500 hover:bg-amber-600">Premium</Badge>}
          </div>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-grow">
            <div className="h-full border rounded-md overflow-hidden">
              <iframe src={template.previewUrl} className="w-full h-full" title={`${template.name} Preview`} />
            </div>
          </TabsContent>

          <TabsContent value="details" className="flex-grow overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Template Information</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Style</dt>
                    <dd className="font-medium capitalize">{template.templateStyle}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Font</dt>
                    <dd className="font-medium capitalize">{template.fontFamily}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium">{new Date(template.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Author</dt>
                    <dd className="font-medium">
                      {template.authorUrl ? (
                        <a href={template.authorUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                          {template.author}
                        </a>
                      ) : (
                        template.author
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Popularity</dt>
                    <dd className="font-medium flex items-center">
                      <Star className="h-4 w-4 text-amber-500 mr-1 fill-amber-500" />
                      {template.popularity}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-medium mb-2">Colors</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: template.primaryColor }} />
                    <span>Primary: {template.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: template.secondaryColor }} />
                    <span>Secondary: {template.secondaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: template.accentColor }} />
                    <span>Accent: {template.accentColor}</span>
                  </div>
                </div>

                <h3 className="font-medium mt-6 mb-2">Features</h3>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <span className={template.includeCoverPage ? "text-green-500" : "text-red-500"}>
                      {template.includeCoverPage ? "✓" : "✗"}
                    </span>
                    <span className="ml-2">Cover Page</span>
                  </li>
                  <li className="flex items-center">
                    <span className={template.includePageNumbers ? "text-green-500" : "text-red-500"}>
                      {template.includePageNumbers ? "✓" : "✗"}
                    </span>
                    <span className="ml-2">Page Numbers</span>
                  </li>
                  <li className="flex items-center">
                    <span className={template.includeTimestamp ? "text-green-500" : "text-red-500"}>
                      {template.includeTimestamp ? "✓" : "✗"}
                    </span>
                    <span className="ml-2">Timestamp</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Import Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
