'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps {
  id: string
  title: string
  businessKey: string
  businessColor: string
}

export function KanbanCard({ id, title, businessKey, businessColor }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: 'var(--surface-card)',
    border: '1px solid rgba(255,255,255,0.06)',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-sm p-3 cursor-grab active:cursor-grabbing select-none hover:bg-[#161616] transition-colors duration-150"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: businessColor }}
          aria-label={businessKey}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </span>
      </div>
    </div>
  )
}
