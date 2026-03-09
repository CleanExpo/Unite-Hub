import { KanbanBoard } from '@/components/founder/kanban/KanbanBoard'

export default function KanbanPage() {
  return (
    <div className="h-full overflow-x-auto" style={{ background: 'var(--surface-canvas)' }}>
      <KanbanBoard />
    </div>
  )
}
