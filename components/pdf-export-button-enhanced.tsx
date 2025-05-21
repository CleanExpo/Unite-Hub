"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface PdfExportButtonProps {
  projectId: string
  templates?: { id: string; name: string }[]
  defaultTemplateId?: string
}

export function PdfExportButtonEnhanced({ projectId, templates = [], defaultTemplateId }: PdfExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId || "default")

  const exportPdf = async (templateId: string) => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/architecture/export/${projectId}?templateId=${templateId}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to export PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `architecture-blueprint-${projectId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: "Your PDF has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // If no templates are provided, just show a simple button
  if (templates.length === 0) {
    return (
      <Button onClick={() => exportPdf(selectedTemplateId)} disabled={isExporting} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export PDF"}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2" disabled={isExporting}>
            <span>Template</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => setSelectedTemplateId(template.id)}
              className={selectedTemplateId === template.id ? "bg-muted" : ""}
            >
              {template.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={() => exportPdf(selectedTemplateId)} disabled={isExporting} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export PDF"}
      </Button>
    </div>
  )
}
