'use client'

import type { TriageCategory } from '@/lib/ai/capabilities/email-triage'

const BADGE_STYLES: Record<TriageCategory, { bg: string; text: string; label: string }> = {
  IMPORTANT:   { bg: 'bg-cyan-500/20',   text: 'text-cyan-300',  label: 'Important' },
  INVOICE:     { bg: 'bg-amber-500/20',  text: 'text-amber-300', label: 'Invoice' },
  TASK:        { bg: 'bg-violet-500/20', text: 'text-violet-300',label: 'Task' },
  NEWSLETTER:  { bg: 'bg-zinc-500/20',   text: 'text-zinc-400',  label: 'Newsletter' },
  PROMOTIONAL: { bg: 'bg-zinc-500/20',   text: 'text-zinc-400',  label: 'Promo' },
  SOCIAL:      { bg: 'bg-blue-500/20',   text: 'text-blue-300',  label: 'Social' },
  SPAM:        { bg: 'bg-red-500/20',    text: 'text-red-400',   label: 'Spam' },
}

export function TriageBadge({ category }: { category: TriageCategory }) {
  const style = BADGE_STYLES[category] ?? BADGE_STYLES.NEWSLETTER
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-wider font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}
