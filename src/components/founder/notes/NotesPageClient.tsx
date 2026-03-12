'use client'

import { useState } from 'react'
import { DriveFile } from '@/lib/integrations/google-drive'
import { FileTree } from './FileTree'
import { NoteViewer } from './NoteViewer'

interface NotesPageClientProps {
  files: DriveFile[]
}

export function NotesPageClient({ files }: NotesPageClientProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      <FileTree files={files} onSelectFile={setSelectedFileId} />
      <NoteViewer fileId={selectedFileId} />
    </div>
  )
}
