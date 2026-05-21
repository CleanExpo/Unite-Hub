export const dynamic = 'force-dynamic'

import { KanbanBoard } from '@/components/founder/kanban/KanbanBoard'
import { PageHeader } from '@/components/ui/PageHeader'

export default function KanbanPage() {
  return (
    <div className="p-6" style={{ background: 'var(--surface-canvas)', minHeight: '100%' }}>
      <PageHeader
        title="Kanban"
        subtitle="Synced with Linear — issues update in real time"
        className="mb-6"
      />
      <div className="overflow-x-auto">
        <KanbanBoard />
      </div>
    </div>
  )
}
