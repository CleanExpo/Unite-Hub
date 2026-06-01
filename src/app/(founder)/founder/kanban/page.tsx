export const dynamic = 'force-dynamic'

import { HermesKanbanStatus } from '@/components/founder/kanban/HermesKanbanStatus'
import { KanbanBoard } from '@/components/founder/kanban/KanbanBoard'
import { PageHeader } from '@/components/ui/PageHeader'

export default function KanbanPage() {
  return (
    <div className="p-6" style={{ background: 'var(--surface-canvas)', minHeight: '100%' }}>
      <PageHeader
        title="Kanban"
        subtitle="Linear plus Hermes Kanban — execution stays visible across the Unite-Group ecosystem"
        className="mb-6"
      />
      <div className="mb-6">
        <HermesKanbanStatus />
      </div>
      <div className="overflow-x-auto">
        <KanbanBoard />
      </div>
    </div>
  )
}
