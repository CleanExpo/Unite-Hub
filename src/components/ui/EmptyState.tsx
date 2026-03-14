'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string; onClick?: () => void }
  hint?: string
}

export function EmptyState({ icon: Icon, title, description, action, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Icon
        size={48}
        strokeWidth={1.2}
        style={{ color: 'var(--color-text-disabled)' }}
      />
      <div className="flex flex-col items-center gap-1.5">
        <h3
          className="text-base font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
        <p
          className="text-sm text-center max-w-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      </div>
      {action && (
        action.onClick ? (
          <button
            onClick={action.onClick}
            className="text-[12px] font-medium px-4 py-2 rounded-sm transition-colors"
            style={{
              background: '#00F5FF18',
              color: '#00F5FF',
              border: '1px solid #00F5FF30',
            }}
          >
            {action.label}
          </button>
        ) : (
          <Link
            href={action.href}
            className="text-[12px] font-medium px-4 py-2 rounded-sm transition-colors"
            style={{
              background: '#00F5FF18',
              color: '#00F5FF',
              border: '1px solid #00F5FF30',
            }}
          >
            {action.label}
          </Link>
        )
      )}
      {hint && (
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-disabled)' }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
