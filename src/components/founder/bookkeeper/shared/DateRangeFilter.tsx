'use client'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/40"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', colorScheme: 'dark' }}
      />
      <span className="text-[11px] text-white/30">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/40"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', colorScheme: 'dark' }}
      />
    </div>
  )
}
