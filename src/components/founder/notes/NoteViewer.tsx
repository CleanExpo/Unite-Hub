'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface NoteViewerProps {
  fileId: string | null
}

export function NoteViewer({ fileId }: NoteViewerProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!fileId) {
      setContent('')
      return
    }

    setLoading(true)
    setError('')

    fetch(`/api/notes/content?fileId=${fileId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setContent(data.content || '')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [fileId])

  if (!fileId) {
    return (
      <div className="flex-1 flex items-center justify-center text-color-text-muted">
        Select a note to view
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-color-text-muted">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto prose prose-invert max-w-none px-4">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-color-text-primary mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-color-text-primary mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-color-text-primary mt-4 mb-2">{children}</h3>,
          code: ({ children }) => <code className="bg-surface-elevated text-color-text-primary px-2 py-1 rounded-sm text-sm">{children}</code>,
          a: ({ href, children }) => <a href={href} className="text-cyan-400 hover:underline">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
