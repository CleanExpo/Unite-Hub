'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface Card {
  id: string
  title: string
  businessKey: string
  businessColor: string
  teamKey: string
  stateId: string
}

interface Column {
  id: string
  title: string
  cards: Card[]
}

const COLUMN_TITLES: Record<string, string> = {
  today:    'TODAY',
  hot:      'HOT',
  pipeline: 'PIPELINE',
  someday:  'SOMEDAY',
  done:     'DONE',
}

const COLUMN_ORDER = ['today', 'hot', 'pipeline', 'someday', 'done']

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([])
  const [stateMap, setStateMap] = useState<Record<string, Record<string, string>>>({})
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const loadIssues = useCallback(async () => {
    try {
      const res = await fetch('/api/linear/issues')
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as {
        columns: Record<string, Card[]>
        stateMap: Record<string, Record<string, string>>
      }
      setStateMap(data.stateMap)
      setColumns(
        COLUMN_ORDER.map((id) => ({
          id,
          title: COLUMN_TITLES[id],
          cards: data.columns[id] ?? [],
        }))
      )
      setStale(false)
      setLastSynced(new Date())
    } catch {
      setStale(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIssues()
    // Poll every 60s for inbound Linear changes
    const interval = setInterval(loadIssues, 60_000)
    return () => clearInterval(interval)
  }, [loadIssues])

  function findColumnByCardId(cardId: string): string | undefined {
    return columns.find((col) => col.cards.some((c) => c.id === cardId))?.id
  }

  function handleDragStart(event: DragStartEvent) {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === event.active.id)
    setActiveCard(card ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeColId = findColumnByCardId(String(active.id))
    const overColId = columns.find((col) => col.id === over.id)
      ? String(over.id)
      : findColumnByCardId(String(over.id))

    if (!activeColId || !overColId) return

    // Optimistic local update
    if (activeColId !== overColId) {
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

      // Sync to Linear
      const card = columns.flatMap((c) => c.cards).find((c) => c.id === String(active.id))
      if (card) {
        try {
          await fetch('/api/linear/issues', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issueId: card.id,
              columnId: overColId,
              teamKey: card.teamKey,
              stateMap,
            }),
          })
        } catch {
          // Revert on failure
          await loadIssues()
        }
      }
    } else {
      // Same-column reorder (local only)
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

  if (loading) {
    return (
      <div className="flex gap-4 h-full">
        {COLUMN_ORDER.map((id) => (
          <div
            key={id}
            className="w-64 flex-shrink-0 rounded-sm animate-pulse"
            style={{ background: 'var(--surface-card)', height: 200 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {stale && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs"
          style={{ background: '#1a1000', border: '1px solid #FFB800', color: '#FFB800' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
          Linear unreachable — showing cached data
          <button onClick={loadIssues} className="ml-auto underline opacity-70 hover:opacity-100">
            Retry
          </button>
        </div>
      )}
      {lastSynced && !stale && (
        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Synced with Linear — {lastSynced.toLocaleTimeString('en-AU')}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full">
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
    </div>
  )
}
