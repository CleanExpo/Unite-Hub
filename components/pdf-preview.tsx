"use client"

import { useState, useEffect } from "react"
import type { PDFBrandingFormData } from "@/types/pdf-branding"
import { Loader2 } from "lucide-react"

interface PDFPreviewProps {
  settings: PDFBrandingFormData
}

export function PDFPreview({ settings }: PDFPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Debounce the preview generation to avoid too many requests
    const timer = setTimeout(() => {
      generatePreview()
    }, 500)

    return () => {
      clearTimeout(timer)
      // Clean up the previous preview URL to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [settings])

  const generatePreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the API to generate a preview PDF with the current settings
      const response = await fetch("/api/architecture/pdf-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF preview")
      }

      // Get the PDF blob from the response
      const pdfBlob = await response.blob()

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob)
      setPreviewUrl(url)
    } catch (err) {
      console.error("Error generating PDF preview:", err)
      setError(err instanceof Error ? err.message : "Failed to generate preview")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center border rounded-md bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Generating preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center border rounded-md bg-gray-50">
        <div className="text-center max-w-md px-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={generatePreview}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="flex h-[600px] items-center justify-center border rounded-md bg-gray-50">
        <p className="text-gray-500">No preview available</p>
      </div>
    )
  }

  return (
    <div className="h-[600px] border rounded-md overflow-hidden">
      <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full" title="PDF Preview" />
    </div>
  )
}
