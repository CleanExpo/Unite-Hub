'use client'

import { EditorRoot, EditorContent, type JSONContent, StarterKit } from 'novel'
import { Placeholder } from 'novel'

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

const EXTENSIONS = [
  StarterKit,
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === 'heading' ? `Heading ${node.attrs.level}` : "Press '/' for commands",
    includeChildren: true,
  }),
]

export function NovelEditor({ businessKey: _businessKey, pageId: _pageId }: NovelEditorProps) {
  return (
    <div
      className="min-h-[calc(100vh-112px)]"
      style={{ background: 'var(--surface-canvas)' }}
    >
      <EditorRoot>
        <EditorContent
          className="novel-editor"
          initialContent={DEFAULT_CONTENT}
          extensions={EXTENSIONS}
        />
      </EditorRoot>
    </div>
  )
}
