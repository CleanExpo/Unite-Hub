"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, ChevronDown, Loader2 } from "lucide-react"
import type { PDFBrandingSettings } from "@/types/pdf-branding"

interface PDFExportButtonProps {
  projectId: string
  onExport?: () => void
}

export function PDFExportButtonEnhanced({ projectId, onExport }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [templates, setTemplates] = useState<PDFBrandingSettings[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      // In a real app, fetch from your API
      // For demo, we'll use mock data
      const mockTemplates: PDFBrandingSettings[] = [
        {
          id: "default",
          name: "Default Template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: true,
          primaryColor: "#2c3e50",
          secondaryColor: "#3498db",
          accentColor: "#e74c3c",
          fontFamily: "helvetica",
          includeTimestamp: true,
          includePageNumbers: true,
          includeCoverPage: true,
          templateStyle: "classic",
        },
        {
          id: "modern",
          name: "Modern Template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: false,
          primaryColor: "#1a202c",
          secondaryColor: "#4299e1",
          accentColor: "#f56565",
          fontFamily: "arial",
          headerTitle: "Architecture Blueprint",
          footerText: "Confidential & Proprietary",
          includeTimestamp: true,
          includePageNumbers: true,
          includeCoverPage: true,
          templateStyle: "modern",
          companyName: "Modern Solutions Inc.",
        },
        {
          id: "minimal",
          name: "Minimal Template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: false,
          primaryColor: "#000000",
          secondaryColor: "#718096",
          accentColor: "#f56565",
          fontFamily: "helvetica",
          includeTimestamp: false,
          includePageNumbers: true,
          includeCoverPage: false,
          templateStyle: "minimal",
        },
      ]

      setTemplates(mockTemplates)
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (templateId?: string) => {
    setIsExporting(true)
    try {
      // Call the API to generate the PDF
      const response = await fetch(`/api/architecture/export/${projectId}?templateId=${templateId || ""}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      // Get the PDF blob from the response
      const pdfBlob = await response.blob()

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob)

      // Create a link element
      const link = document.createElement("a")
      link.href = url
      link.download = `architecture-blueprint-${projectId}.pdf`

      // Append the link to the body
      document.body.appendChild(link)

      // Click the link to download the file
      link.click()

      // Remove the link from the body
      document.body.removeChild(link)

      // Clean up the URL object
      URL.revokeObjectURL(url)

      // Call the onExport callback if provided
      if (onExport) {
        onExport()
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Failed to export PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  // Find the default template
  const defaultTemplate = templates.find((t) => t.isDefault)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport()}>
          {isExporting ? (
            <>
              Exporting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            "Export with Default Template"
          )}
        </DropdownMenuItem>
        {templates
          .filter((t) => !t.isDefault)
          .map((template) => (
            <DropdownMenuItem key={template.id} onClick={() => handleExport(template.id)}>
              {isExporting ? (
                <>
                  Exporting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                `Export with ${template.name}`
              )}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
