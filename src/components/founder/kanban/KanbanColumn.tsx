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
}

const BUSINESS_COLORS: Record<string, string> = {
  dr: '#ef4444',
  nrpg: '#f97316',
  carsi: '#eab308',
  restore: '#22c55e',
  synthex: '#a855f7',
  ato: '#3b82f6',
  ccw: '#06b6d4',
}

export function KanbanColumn({ id, title, cards }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-2 min-w-[240px] rounded-sm p-3 transition-colors duration-150"
      style={{
        background: isOver ? 'var(--color-accent-dim)' : 'var(--surface-sidebar)',
        border: isOver ? '1px solid var(--color-accent-border)' : '1px solid rgba(255,255,255,0.04)',
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
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              id={card.id}
              title={card.title}
              businessKey={card.businessKey}
              businessColor={BUSINESS_COLORS[card.businessKey] ?? '#ffffff'}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
