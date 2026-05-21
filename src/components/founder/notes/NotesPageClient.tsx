'use client'

import { useState } from 'react'
import { DriveFile } from '@/lib/integrations/google-drive'
import { FileTree } from './FileTree'
import { NoteViewer } from './NoteViewer'
import { PageHeader } from '@/components/ui/PageHeader'

interface NotesPageClientProps {
  files: DriveFile[]
}

export function NotesPageClient({ files }: NotesPageClientProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4">
      <PageHeader
        title="Notes"
        subtitle="Google Drive documents synced to Nexus"
        tip="Connect a Google account via Email settings to see files here"
        className="mb-4"
      />
      <div className="flex flex-1 gap-4 min-h-0">
        <FileTree files={files} onSelectFile={setSelectedFileId} />
        <NoteViewer fileId={selectedFileId} />
      </div>
    </div>
  )
}
