'use client'

import { BUSINESSES, type BusinessKey } from '@/lib/businesses'

const BOOKKEEPER_BUSINESS_KEYS = ['dr', 'nrpg', 'carsi', 'synthex', 'restore'] as const
const BOOKKEEPER_BUSINESSES = BUSINESSES.filter(b =>
  (BOOKKEEPER_BUSINESS_KEYS as readonly string[]).includes(b.key)
)

interface BusinessFilterProps {
  value: BusinessKey | 'all'
  onChange: (value: BusinessKey | 'all') => void
}

export function BusinessFilter({ value, onChange }: BusinessFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BusinessKey | 'all')}
      className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 appearance-none cursor-pointer focus:outline-none focus:border-[#00F5FF]/40"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
    >
      <option value="all">All businesses</option>
      {BOOKKEEPER_BUSINESSES.map(b => (
        <option key={b.key} value={b.key}>{b.name}</option>
      ))}
    </select>
  )
}
