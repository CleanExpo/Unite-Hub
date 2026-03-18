'use client'

import type { GmailThread } from '@/lib/integrations/google'
import type { TriageCategory } from '@/lib/ai/capabilities/email-triage'
import { TriageBadge } from './TriageBadge'

interface TriageInfo {
  category: TriageCategory
  action: string
}

interface Props {
  thread: GmailThread
  selected: boolean
  active: boolean
  triageInfo?: TriageInfo
  onCheck: (id: string, checked: boolean) => void
  onClick: (id: string) => void
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
    if (diffDays === 0) return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    if (diffDays < 7) return d.toLocaleDateString('en-AU', { weekday: 'short' })
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}

export function ThreadRow({ thread, selected, active, triageInfo, onCheck, onClick }: Props) {
  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2',
        active
          ? 'bg-[#00F5FF]/5 border-l-[#00F5FF]'
          : 'border-l-transparent hover:bg-white/[0.03]',
        thread.unread ? 'border-b border-white/[0.06]' : 'border-b border-white/[0.04]',
      ].join(' ')}
      onClick={() => onClick(thread.id)}
    >
      {/* Checkbox */}
      <div
        className="mt-0.5 flex-shrink-0"
        onClick={e => { e.stopPropagation(); onCheck(thread.id, !selected) }}
      >
        <div className={[
          'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors',
          selected ? 'bg-[#00F5FF] border-[#00F5FF]' : 'border-white/20 hover:border-white/40',
        ].join(' ')}>
          {selected && (
            <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12">
              <path d="M1 6l4 4L11 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      <div
        className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: thread.unread ? '#00F5FF' : 'transparent',
          border: thread.unread ? 'none' : '1px solid rgba(255,255,255,0.15)',
        }}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-sm truncate flex-1 ${thread.unread ? 'text-white font-medium' : 'text-white/60'}`}>
            {thread.subject}
          </p>
          <span className="text-[10px] text-white/30 flex-shrink-0">{formatDate(thread.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-white/40 truncate flex-1">{thread.from} · {thread.snippet}</p>
          {triageInfo && <TriageBadge category={triageInfo.category} />}
        </div>
      </div>
    </div>
  )
}
