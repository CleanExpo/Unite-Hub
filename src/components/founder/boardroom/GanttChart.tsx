'use client'

import { useEffect, useState } from 'react'

interface GanttItem {
  id: string
  identifier: string
  title: string
  url: string
  dueDate: string
  createdAt: string
  isOverdue: boolean
  businessKey: string
  businessName: string
  color: string
  state: string
  priority: number
  assignee: string | null
}

interface GanttData {
  items: GanttItem[]
  today: string
}

// SVG dimensions
const ROW_H = 28
const LABEL_W = 200
const PADDING = { top: 32, bottom: 16 }
const WINDOW_DAYS = 90

export function GanttChart() {
  const [data, setData] = useState<GanttData | null>(null)
  const [loading, setLoading] = useState(true)
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    fetch('/api/boardroom/gantt')
      .then((r) => r.json())
      .then((d: GanttData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Responsive width
  useEffect(() => {
    function measure() {
      const el = document.getElementById('gantt-container')
      if (el) setContainerWidth(el.offsetWidth)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  if (loading) return (
    <div className="space-y-2 py-4 animate-pulse" aria-label="Loading Gantt chart">
      {/* Month header bar */}
      <div className="flex gap-2 mb-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-2.5 rounded-sm w-12" style={{ background: 'var(--surface-elevated)' }} />
        ))}
      </div>
      {/* Skeleton rows */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 rounded-sm w-40 flex-shrink-0" style={{ background: 'var(--surface-elevated)' }} />
          <div className="h-4 rounded-sm flex-1" style={{ background: 'var(--surface-elevated)', maxWidth: `${40 + (i % 3) * 20}%` }} />
        </div>
      ))}
    </div>
  )
  if (!data || data.items.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-[13px]" style={{ color: 'var(--color-text-disabled)' }}>No Linear issues with due dates.</p>
        <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>Set due dates in Linear to see them here.</p>
      </div>
    )
  }

  const chartW = Math.max(containerWidth - LABEL_W - 32, 300)
  const svgH = PADDING.top + data.items.length * ROW_H + PADDING.bottom

  const today = new Date(data.today + 'T00:00:00')
  const windowStart = new Date(today)
  windowStart.setDate(windowStart.getDate() - 14)  // 2 weeks before today
  const windowEnd = new Date(windowStart)
  windowEnd.setDate(windowEnd.getDate() + WINDOW_DAYS)

  function dateToX(dateStr: string): number {
    const d = new Date(dateStr + 'T00:00:00')
    const ratio = (d.getTime() - windowStart.getTime()) / (windowEnd.getTime() - windowStart.getTime())
    return Math.max(0, Math.min(1, ratio)) * chartW
  }

  const todayX = dateToX(data.today)

  // Month labels along X axis
  const monthLabels: { label: string; x: number }[] = []
  const cursor = new Date(windowStart)
  cursor.setDate(1)
  cursor.setMonth(cursor.getMonth() + 1)
  while (cursor < windowEnd) {
    monthLabels.push({
      label: cursor.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      x: dateToX(cursor.toISOString().split('T')[0]),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Group by business
  const byBusiness: Record<string, GanttItem[]> = {}
  for (const item of data.items) {
    if (!byBusiness[item.businessKey]) byBusiness[item.businessKey] = []
    byBusiness[item.businessKey].push(item)
  }

  // Flatten with business dividers
  const rows: Array<{ type: 'divider'; label: string; color: string } | { type: 'item'; item: GanttItem; rowIndex: number }> = []
  let rowIndex = 0
  for (const [, items] of Object.entries(byBusiness)) {
    rows.push({ type: 'divider', label: items[0].businessName, color: items[0].color })
    for (const item of items) {
      rows.push({ type: 'item', item, rowIndex })
      rowIndex++
    }
  }

  const totalRows = rowIndex
  const svgHeight = PADDING.top + totalRows * ROW_H + PADDING.bottom + rows.filter((r) => r.type === 'divider').length * 20

  let yOffset = PADDING.top

  return (
    <div id="gantt-container" className="w-full overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex" style={{ minWidth: LABEL_W + chartW + 32 }}>
        {/* Labels column */}
        <div style={{ width: LABEL_W, flexShrink: 0, paddingTop: PADDING.top }}>
          {rows.map((row, i) => {
            if (row.type === 'divider') {
              return (
                <div key={`div-${i}`} className="flex items-center gap-1.5 h-5 mb-0.5 px-2">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: row.color }} />
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-disabled)' }}>
                    {row.label}
                  </span>
                </div>
              )
            }
            return (
              <div
                key={row.item.id}
                className="flex items-center h-7 px-2"
                title={`${row.item.identifier}: ${row.item.title}`}
              >
                <span className="text-[10px] truncate" style={{ color: row.item.isOverdue ? '#ef4444' : 'var(--color-text-muted)', maxWidth: LABEL_W - 16 }}>
                  {row.item.identifier} {row.item.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* SVG chart */}
        <svg width={chartW} height={svgHeight} style={{ flexShrink: 0 }}>
          {/* Month grid lines */}
          {monthLabels.map((m) => (
            <g key={m.label}>
              <line x1={m.x} y1={0} x2={m.x} y2={svgHeight} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2,4" />
              <text x={m.x + 4} y={14} fontSize={10} fill="var(--color-text-disabled)">{m.label}</text>
            </g>
          ))}

          {/* Rows */}
          {(() => {
            let currentY = PADDING.top
            const elements: React.ReactNode[] = []

            rows.forEach((row, i) => {
              if (row.type === 'divider') {
                currentY += 20
                return
              }

              const item = row.item
              const startX = dateToX(item.createdAt.split('T')[0])
              const endX = dateToX(item.dueDate)
              const barW = Math.max(endX - startX, 6)
              const barColor = item.isOverdue ? '#ef4444' : item.color
              const y = currentY + (ROW_H - 16) / 2

              elements.push(
                <g
                  key={item.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.open(item.url, '_blank')}
                >
                  {/* Row background on hover */}
                  <rect x={0} y={currentY} width={chartW} height={ROW_H} fill="transparent" className="hover:fill-white/5" />
                  {/* Bar background */}
                  <rect
                    x={startX}
                    y={y}
                    width={barW}
                    height={16}
                    rx={3}
                    fill={`${barColor}30`}
                    stroke={barColor}
                    strokeWidth={1}
                  />
                  {/* Fill progress (dueDate vs today) */}
                  {!item.isOverdue && (
                    <rect
                      x={startX}
                      y={y}
                      width={Math.max(0, Math.min(todayX - startX, barW))}
                      height={16}
                      rx={3}
                      fill={`${barColor}60`}
                    />
                  )}
                </g>
              )

              currentY += ROW_H
            })

            // Update yOffset for today line
            yOffset = currentY
            return elements
          })()}

          {/* Today line */}
          <line x1={todayX} y1={0} x2={todayX} y2={svgHeight} stroke="#00F5FF" strokeWidth={1.5} />
          <text x={todayX + 3} y={14} fontSize={9} fill="#00F5FF" fontWeight="600">TODAY</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border" style={{ background: 'rgba(0,245,255,0.2)', borderColor: '#00F5FF' }} />
          <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>In progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border" style={{ background: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' }} />
          <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3" style={{ background: '#00F5FF' }} />
          <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>Today</span>
        </div>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-disabled)' }}>Click any bar to open in Linear</span>
      </div>
    </div>
  )
}
