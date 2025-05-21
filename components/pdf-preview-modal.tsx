"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Download } from "lucide-react"
import { saveAs } from "file-saver"

interface PDFPreviewModalProps {
  projectId: string
  projectName: string
}

export function PDFPreviewModal({ projectId, projectName }: PDFPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    if (open && !pdfUrl) {
      loadPdf()
    }
  }

  const loadPdf = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the API endpoint to generate the PDF
      const response = await fetch(`/api/architecture/export/${projectId}`)

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`)
      }

      // Get the PDF blob from the response
      const pdfBlob = await response.blob()

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
    } catch (err) {
      console.error("Error loading PDF:", err)
      setError(err instanceof Error ? err.message : "Failed to load PDF preview")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (pdfUrl) {
      fetch(pdfUrl)
        .then((response) => response.blob())
        .then((blob) => {
          saveAs(blob, `${projectName.replace(/\s+/g, "-").toLowerCase()}-blueprint.pdf`)
        })
        .catch((err) => {
          console.error("Error downloading PDF:", err)
        })
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Preview Blueprint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Blueprint Preview: {projectName}</span>
            <Button size="sm" onClick={handleDownload} disabled={!pdfUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded border border-gray-200 bg-white">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Generating PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-md">
                <p className="text-red-500">{error}</p>
                <Button variant="outline" className="mt-4" onClick={loadPdf}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe src={`${pdfUrl}#toolbar=0`} className="h-full w-full" title={`${projectName} Blueprint`} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No preview available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
