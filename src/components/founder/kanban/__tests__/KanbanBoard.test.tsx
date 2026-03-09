import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock dnd-kit — JSDOM doesn't support pointer events or drag
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: () => null,
  PointerSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn(),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

import { KanbanBoard } from '../KanbanBoard'

describe('KanbanBoard', () => {
  it('renders 5 column headers', () => {
    render(<KanbanBoard />)
    expect(screen.getByText('TODAY')).toBeInTheDocument()
    expect(screen.getByText('HOT')).toBeInTheDocument()
    expect(screen.getByText('PIPELINE')).toBeInTheDocument()
    expect(screen.getByText('SOMEDAY')).toBeInTheDocument()
    expect(screen.getByText('DONE')).toBeInTheDocument()
  })
})
