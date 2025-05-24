"use client"

import { useState, useEffect } from "react"

interface PDFPreviewProps {
  data: string
}

export function PDFPreview({ data }: PDFPreviewProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Short timeout to ensure the iframe has time to load
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [data])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      <iframe src={data} className="w-full h-full border-0" style={{ minHeight: "400px" }} title="PDF Preview" />
    </div>
  )
}
