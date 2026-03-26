'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BUSINESSES } from '@/lib/businesses'

interface KanbanCardProps {
  id: string
  title: string
  businessKey: string
  businessColor: string
  isDone?: boolean
  onClick?: (id: string) => void
}

export function KanbanCard({ id, title, businessKey, businessColor, isDone, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const didDrag = useRef(false)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: 'var(--surface-card)',
    border: '1px solid var(--color-border)',
  }

  // Track whether a drag actually occurred so clicks don't fire after drags
  const handlePointerDown = () => { didDrag.current = false }
  const handlePointerMove = () => { didDrag.current = true }
  const handleClick = () => {
    if (!didDrag.current && onClick) {
      onClick(id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className="rounded-sm p-3 cursor-grab active:cursor-grabbing select-none hover:bg-[#161616] transition-colors duration-150"
    >
      <div className={`flex items-center gap-2 ${isDone ? 'opacity-50' : ''}`}>
        <span
          className="w-2 h-2 rounded-sm flex-shrink-0"
          style={{ background: businessColor }}
          aria-label={BUSINESSES.find((b) => b.key === businessKey)?.name ?? businessKey}
        />
        <span
          className="text-[13px]"
          style={{
            color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {title}
        </span>
      </div>
    </div>
  )
}
