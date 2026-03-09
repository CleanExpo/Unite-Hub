'use client'

import { EditorRoot, EditorContent, type JSONContent } from 'novel'

interface NovelEditorProps {
  businessKey: string
  pageId: string
}

const DEFAULT_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Untitled' }],
    },
  ],
}

export function NovelEditor({ businessKey: _businessKey, pageId: _pageId }: NovelEditorProps) {
  return (
    <div
      className="min-h-[calc(100vh-112px)]" /* 112px = 64px topbar + 48px (h-12) page toolbar */
      style={{ background: 'var(--surface-canvas)' }}
    >
      <EditorRoot>
        <EditorContent
          className="novel-editor"
          initialContent={DEFAULT_CONTENT}
        />
      </EditorRoot>
    </div>
  )
}
