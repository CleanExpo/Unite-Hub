'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface Card {
  id: string
  title: string
  businessKey: string
  businessColor: string
}

interface Column {
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

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'today',
    title: 'TODAY',
    cards: [
      { id: 'card-1', title: 'Review DR claims report', businessKey: 'dr', businessColor: BUSINESS_COLORS.dr },
      { id: 'card-2', title: 'Post Synthex content brief', businessKey: 'synthex', businessColor: BUSINESS_COLORS.synthex },
    ],
  },
  {
    id: 'hot',
    title: 'HOT',
    cards: [
      { id: 'card-3', title: 'CCW quarterly invoice run', businessKey: 'ccw', businessColor: BUSINESS_COLORS.ccw },
    ],
  },
  {
    id: 'pipeline',
    title: 'PIPELINE',
    cards: [
      { id: 'card-4', title: 'NRPG member portal update', businessKey: 'nrpg', businessColor: BUSINESS_COLORS.nrpg },
      { id: 'card-5', title: 'CARSI course module 3', businessKey: 'carsi', businessColor: BUSINESS_COLORS.carsi },
    ],
  },
  {
    id: 'someday',
    title: 'SOMEDAY',
    cards: [
      { id: 'card-6', title: 'ATO entity structure review', businessKey: 'ato', businessColor: BUSINESS_COLORS.ato },
    ],
  },
  {
    id: 'done',
    title: 'DONE',
    cards: [
      { id: 'card-7', title: 'RestoreAssist pricing update', businessKey: 'restore', businessColor: BUSINESS_COLORS.restore },
    ],
  },
]

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function findColumnByCardId(cardId: string): string | undefined {
    return columns.find((col) => col.cards.some((c) => c.id === cardId))?.id
  }

  function handleDragStart(event: DragStartEvent) {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === event.active.id)
    setActiveCard(card ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeColId = findColumnByCardId(String(active.id))
    const overColId = columns.find((col) => col.id === over.id)
      ? String(over.id)
      : findColumnByCardId(String(over.id))

    if (!activeColId || !overColId || activeColId === overColId) return

    setColumns((cols) => {
      const activeCol = cols.find((c) => c.id === activeColId)!
      const overCol = cols.find((c) => c.id === overColId)!
      const draggedCard = activeCol.cards.find((c) => c.id === active.id)!

      return cols.map((col) => {
        if (col.id === activeColId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== active.id) }
        }
        if (col.id === overColId) {
          const overIndex = overCol.cards.findIndex((c) => c.id === over.id)
          const insertAt = overIndex === -1 ? overCol.cards.length : overIndex
          const newCards = [...overCol.cards]
          newCards.splice(insertAt, 0, draggedCard)
          return { ...col, cards: newCards }
        }
        return col
      })
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeColId = findColumnByCardId(String(active.id))
    const overColId = findColumnByCardId(String(over.id))

    if (!activeColId || !overColId || activeColId !== overColId) return

    setColumns((cols) =>
      cols.map((col) => {
        if (col.id !== activeColId) return col
        const oldIndex = col.cards.findIndex((c) => c.id === active.id)
        const newIndex = col.cards.findIndex((c) => c.id === over.id)
        return { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) }
      })
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full">
        {columns.map((col) => (
          <KanbanColumn key={col.id} id={col.id} title={col.title} cards={col.cards} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <KanbanCard
            id={activeCard.id}
            title={activeCard.title}
            businessKey={activeCard.businessKey}
            businessColor={activeCard.businessColor}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
