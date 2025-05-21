"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface PdfExportButtonProps {
  projectId: string
  className?: string
}

export function PdfExportButton({ projectId, className }: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch(`/api/architecture/export/${projectId}`)

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
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
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting} className={className} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export PDF"}
    </Button>
  )
}
