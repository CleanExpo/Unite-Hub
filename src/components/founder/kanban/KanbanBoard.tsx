'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { BUSINESSES } from '@/lib/businesses'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

const bizColor = (key: string): string => BUSINESSES.find((b) => b.key === key)?.color ?? '#555555'

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

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'today',
    title: 'TODAY',
    cards: [
      { id: 'card-1', title: 'Review DR claims report', businessKey: 'dr', businessColor: bizColor('dr') },
      { id: 'card-2', title: 'Post Synthex content brief', businessKey: 'synthex', businessColor: bizColor('synthex') },
    ],
  },
  {
    id: 'hot',
    title: 'HOT',
    cards: [
      { id: 'card-3', title: 'CCW quarterly invoice run', businessKey: 'ccw', businessColor: bizColor('ccw') },
    ],
  },
  {
    id: 'pipeline',
    title: 'PIPELINE',
    cards: [
      { id: 'card-4', title: 'NRPG member portal update', businessKey: 'nrpg', businessColor: bizColor('nrpg') },
      { id: 'card-5', title: 'CARSI course module 3', businessKey: 'carsi', businessColor: bizColor('carsi') },
    ],
  },
  {
    id: 'someday',
    title: 'SOMEDAY',
    cards: [
      { id: 'card-6', title: 'ATO entity structure review', businessKey: 'ato', businessColor: bizColor('ato') },
    ],
  },
  {
    id: 'done',
    title: 'DONE',
    cards: [
      { id: 'card-7', title: 'RestoreAssist pricing update', businessKey: 'restore', businessColor: bizColor('restore') },
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeColId = findColumnByCardId(String(active.id))
    const overColId = columns.find((col) => col.id === over.id)
      ? String(over.id)
      : findColumnByCardId(String(over.id))

    if (!activeColId || !overColId) return

    if (activeColId !== overColId) {
      // Cross-column move
      setColumns((cols) => {
        const activeCol = cols.find((c) => c.id === activeColId)!
        const overCol = cols.find((c) => c.id === overColId)!
        const card = activeCol.cards.find((c) => c.id === active.id)!
        const overIndex = overCol.cards.findIndex((c) => c.id === over.id)
        const insertAt = overIndex === -1 ? overCol.cards.length : overIndex
        return cols.map((col) => {
          if (col.id === activeColId) return { ...col, cards: col.cards.filter((c) => c.id !== active.id) }
          if (col.id === overColId) {
            const newCards = [...overCol.cards]
            newCards.splice(insertAt, 0, card)
            return { ...col, cards: newCards }
          }
          return col
        })
      })
    } else {
      // Same-column reorder
      setColumns((cols) =>
        cols.map((col) => {
          if (col.id !== activeColId) return col
          const oldIndex = col.cards.findIndex((c) => c.id === active.id)
          const newIndex = col.cards.findIndex((c) => c.id === over.id)
          return { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) }
        })
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            cards={col.cards}
            isDone={col.id === 'done'}
          />
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
