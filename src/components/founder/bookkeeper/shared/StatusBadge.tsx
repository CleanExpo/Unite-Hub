'use client'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  auto_matched:    { label: 'Auto',       color: '#00F5FF', bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)' },
  suggested_match: { label: 'Suggested',  color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
  unmatched:       { label: 'Unmatched',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  manual_review:   { label: 'Review',     color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  reconciled:      { label: 'Reconciled', color: '#00F5FF', bg: 'rgba(0,245,255,0.12)', border: 'rgba(0,245,255,0.3)' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: '#555', bg: 'rgba(85,85,85,0.08)', border: 'rgba(85,85,85,0.2)' }
  return (
    <span
      className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm"
      style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  )
}
