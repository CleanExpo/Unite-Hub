export const dynamic = 'force-dynamic'

import { NovelEditor } from '@/components/founder/editor/NovelEditor'

interface Props {
  params: Promise<{ businessKey: string; id: string }>
}

export default async function PageEditorPage({ params }: Props) {
  const { businessKey, id: pageId } = await params

  return (
    <div>
      {/* Toolbar */}
      <div
        className="h-12 border-b flex items-center px-6"
        style={{ background: 'var(--surface-sidebar)', borderColor: 'var(--color-border)' }}
      >
        <span className="text-[12px] capitalize" style={{ color: 'var(--color-text-muted)' }}>
          {businessKey} / Page
        </span>
      </div>

      {/* Editor — centred prose width */}
      <div className="max-w-[720px] mx-auto px-6 pt-12">
        <NovelEditor businessKey={businessKey} pageId={pageId} />
      </div>
    </div>
  )
}
