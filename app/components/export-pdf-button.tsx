"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

interface ExportPdfButtonProps {
  content?: string
  filename?: string
  label?: string
  type?: "generic" | "project" | "task" | "user"
  data?: any
  options?: {
    headerText?: string
    footerText?: string
    colorScheme?: "default" | "dark" | "modern"
  }
}

export function ExportPdfButton({
  content = "",
  filename = "export.pdf",
  label = "Export PDF",
  type = "generic",
  data = {},
  options = {},
}: ExportPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/errors/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, filename, type, data, options }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to generate PDF")
      }

      // Create a download link
      const link = document.createElement("a")
      link.href = result.data
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Failed to export PDF. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? "Generating..." : label}
      {!isLoading && <FileDown className="ml-2 h-4 w-4" />}
    </Button>
  )
}
