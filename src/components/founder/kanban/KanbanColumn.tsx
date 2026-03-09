'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'

interface Card {
  id: string
  title: string
  businessKey: string
  businessColor: string
}

interface KanbanColumnProps {
  id: string
  title: string
  cards: Card[]
  isDone?: boolean
}

export function KanbanColumn({ id, title, cards, isDone }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className="flex flex-col gap-2 min-w-[240px] rounded-sm p-3 transition-colors duration-150"
      style={{
        background: isOver ? 'var(--color-accent-dim)' : 'var(--surface-sidebar)',
        border: isOver ? '1px solid var(--color-accent-border)' : '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {title}
        </span>
        <span
          className="text-xs rounded-sm px-1.5 py-0.5"
          style={{ background: 'var(--surface-elevated)', color: 'var(--color-text-muted)' }}
        >
          {cards.length}
        </span>
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[120px]">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              id={card.id}
              title={card.title}
              businessKey={card.businessKey}
              businessColor={card.businessColor}
              isDone={isDone}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
