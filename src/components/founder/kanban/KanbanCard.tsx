'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BUSINESSES } from '@/lib/businesses'

interface KanbanCardProps {
  id: string
  title: string
  businessKey: string
  businessColor: string
  isDone?: boolean
}

export function KanbanCard({ id, title, businessKey, businessColor, isDone }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: 'var(--surface-card)',
    border: '1px solid var(--color-border)',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-sm p-3 cursor-grab active:cursor-grabbing select-none hover:bg-[#161616] transition-colors duration-150"
    >
      <div className={`flex items-center gap-2 ${isDone ? 'opacity-50' : ''}`}>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: businessColor }}
          aria-label={BUSINESSES.find((b) => b.key === businessKey)?.name ?? businessKey}
        />
        <span
          className="text-sm"
          style={{
            color: isDone ? '#888888' : 'var(--color-text-primary)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {title}
        </span>
      </div>
    </div>
  )
}
