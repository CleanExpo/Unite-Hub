"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { logError } from "@/lib/error-logger"

interface PdfExportButtonProps {
  documentId: string
  documentType: string
  fileName?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export default function PdfExportButton({
  documentId,
  documentType,
  fileName = "document.pdf",
  onSuccess,
  onError,
}: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Make API call to generate PDF
      const response = await fetch(`/api/pdf/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          documentType,
          fileName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate PDF")
      }

      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()

      // Clean up
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)

      // Log the error to our error logging system
      await logError({
        message: `Failed to export PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        category: "pdf",
        stackTrace: error instanceof Error ? error.stack : undefined,
        context: {
          documentId,
          documentType,
          fileName,
        },
      })

      if (onError && error instanceof Error) {
        onError(error)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  )
}
