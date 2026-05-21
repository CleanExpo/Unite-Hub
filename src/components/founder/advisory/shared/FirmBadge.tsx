'use client'

import type { FirmKey } from '@/lib/advisory/types'
import { FIRM_META } from '@/lib/advisory/types'

interface FirmBadgeProps {
  firm: FirmKey
  size?: 'sm' | 'md'
}

export function FirmBadge({ firm, size = 'sm' }: FirmBadgeProps) {
  const meta = FIRM_META[firm]
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm font-medium tracking-wide ${px}`}
      style={{
        background: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      {meta.name}
    </span>
  )
}
