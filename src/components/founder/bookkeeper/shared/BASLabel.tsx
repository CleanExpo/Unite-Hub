'use client'

import { formatAUD } from './formatters'

const LABEL_DESCRIPTIONS: Record<string, string> = {
  '1A': 'Total sales',
  '1B': 'GST on sales',
  '7':  'Total purchases',
  '9':  'GST on purchases',
  '11': 'GST payable',
}

export function BASLabel({ label, amountCents }: { label: string; amountCents: number }) {
  const isPayable = label === '11'
  const isRefund = isPayable && amountCents < 0
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono w-6" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className="text-[12px] text-white/60">{LABEL_DESCRIPTIONS[label] ?? label}</span>
      </div>
      <span
        className="text-[13px] font-medium tabular-nums"
        style={{ color: isRefund ? 'var(--color-success)' : isPayable ? 'var(--color-danger)' : 'var(--color-text-primary)' }}
      >
        {formatAUD(Math.abs(amountCents))}
        {isRefund && <span className="text-[10px] ml-1" style={{ color: 'var(--color-text-secondary)' }}>refund</span>}
      </span>
    </div>
  )
}
