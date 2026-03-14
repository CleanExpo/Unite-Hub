'use client'

import type { Experiment, ExperimentVariant } from '@/lib/experiments/types'

interface Props {
  experiment: Experiment
  winnerVariant?: ExperimentVariant | null
}

interface TimelineEvent {
  label: string
  date: string | null
  active: boolean
}

function formatDateTimeAU(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ExperimentTimeline({ experiment, winnerVariant }: Props) {
  const events: TimelineEvent[] = [
    {
      label: 'Created',
      date: experiment.createdAt,
      active: true,
    },
    {
      label: 'Activated',
      date: experiment.startedAt,
      active: !!experiment.startedAt,
    },
    {
      label: 'Completed',
      date: experiment.endedAt,
      active: !!experiment.endedAt,
    },
  ]

  if (experiment.winnerVariantId) {
    events.push({
      label: winnerVariant
        ? `Winner: ${winnerVariant.variantKey} — ${winnerVariant.label}`
        : 'Winner declared',
      date: experiment.endedAt,
      active: true,
    })
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Vertical line + dot */}
          <div className="flex flex-col items-center">
            <span
              className="rounded-full shrink-0"
              style={{
                width: 8,
                height: 8,
                background: event.active ? '#00F5FF' : 'rgba(255,255,255,0.1)',
                boxShadow: event.active ? '0 0 6px rgba(0,245,255,0.4)' : 'none',
                marginTop: 3,
              }}
            />
            {i < events.length - 1 && (
              <div
                style={{
                  width: 1,
                  height: 28,
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
            )}
          </div>

          {/* Label + date */}
          <div className="pb-4">
            <span
              className="text-[11px] block"
              style={{
                color: event.active
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-disabled)',
              }}
            >
              {event.label}
            </span>
            {event.date && (
              <span
                className="text-[10px]"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                {formatDateTimeAU(event.date)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
