import { Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  tip?: string | null
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, tip, actions, className }: PageHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-light"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subtitle}
          </p>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {tip && (
        <div
          className="flex items-start gap-2 mt-3 px-3 py-2 rounded-sm text-xs"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <Lightbulb size={13} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <span>{tip}</span>
        </div>
      )}
    </div>
  )
}
