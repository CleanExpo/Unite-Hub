'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { DriveFile } from '@/lib/integrations/google-drive'
import { cn } from '@/lib/utils'

interface FileTreeProps {
  files: DriveFile[]
  onSelectFile: (fileId: string) => void
}

export function FileTree({ files, onSelectFile }: FileTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-surface-elevated flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="px-3 py-2 rounded-sm bg-surface-elevated text-color-text-primary text-sm placeholder-color-text-muted focus:outline-none focus:ring-1 focus:ring-cyan-400"
      />

      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <div className="text-color-text-muted text-sm p-4">
            {files.length === 0 ? 'No notes found. Connect Google Drive.' : 'No matches.'}
          </div>
        ) : (
          filtered.map(file => (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-sm text-sm transition-colors',
                'hover:bg-surface-elevated',
                'flex items-center gap-2'
              )}
            >
              <FileText size={16} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-color-text-primary">{file.name}</div>
                <div className="text-xs text-color-text-muted">
                  {new Date(file.modifiedTime).toLocaleDateString('en-AU')}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
