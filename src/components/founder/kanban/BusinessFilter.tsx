'use client'

import { BUSINESSES } from '@/lib/businesses'

interface BusinessFilterProps {
  activeFilter: string | null
  onFilterChange: (businessKey: string | null) => void
}

export function BusinessFilter({ activeFilter, onFilterChange }: BusinessFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      {/* All pill */}
      <button
        onClick={() => onFilterChange(null)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-sm flex-shrink-0 transition-colors duration-150"
        style={{
          border: activeFilter === null
            ? '1px solid #00F5FF'
            : '1px solid var(--color-border)',
          background: 'var(--surface-card)',
          color: activeFilter === null
            ? '#e2e8f0'
            : 'var(--color-text-muted)',
          fontSize: '11px',
        }}
      >
        All
      </button>

      {BUSINESSES.map((biz) => {
        const isActive = activeFilter === biz.key

        return (
          <button
            key={biz.key}
            onClick={() => onFilterChange(isActive ? null : biz.key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm flex-shrink-0 transition-colors duration-150"
            style={{
              border: isActive
                ? '1px solid #00F5FF'
                : '1px solid var(--color-border)',
              background: 'var(--surface-card)',
              color: isActive
                ? '#e2e8f0'
                : 'var(--color-text-muted)',
              fontSize: '11px',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: biz.color }}
            />
            {biz.name}
          </button>
        )
      })}
    </div>
  )
}
