"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, ChevronDown } from "lucide-react"
import { saveAs } from "file-saver"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PDFBrandingSettings } from "@/types/pdf-branding"

interface PDFExportButtonProps {
  projectId: string
  projectName: string
}

export function PDFExportButton({ projectId, projectName }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    setError(null)

    try {
      // Call the API endpoint to generate the PDF
      const url = templateId
        ? `/api/architecture/export/${projectId}?templateId=${templateId}`
        : `/api/architecture/export/${projectId}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`)
      }

      // Get the PDF blob from the response
      const pdfBlob = await response.blob()

      // Use file-saver to save the PDF
      saveAs(pdfBlob, `${projectName.replace(/\s+/g, "-").toLowerCase()}-blueprint.pdf`)
    } catch (err) {
      console.error("Error exporting PDF:", err)
      setError(err instanceof Error ? err.message : "Failed to export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading || templates.length <= 1) {
    return (
      <div>
        <Button onClick={() => handleExport()} disabled={isExporting} className="flex items-center gap-2">
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export Blueprint
            </>
          )}
        </Button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isExporting} className="flex items-center gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Blueprint
                <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Choose Template</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handleExport(template.id)}
              className="flex items-center justify-between"
            >
              {template.name}
              {template.isDefault && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">Default</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/dashboard/architecture/branding" className="cursor-pointer">
              Manage Templates
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
