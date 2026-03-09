export const dynamic = 'force-dynamic'

import { KanbanBoard } from '@/components/founder/kanban/KanbanBoard'

export default function KanbanPage() {
  return (
    <div className="p-6" style={{ background: 'var(--surface-canvas)', minHeight: '100%' }}>
      <h1
        className="text-[24px] font-semibold tracking-tight mb-6"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Kanban
      </h1>
      <div className="overflow-x-auto">
        <KanbanBoard />
      </div>
    </div>
  )
}
