'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Send } from 'lucide-react'

interface AgendaSection {
  title: string
  items: string[]
  highlight?: string
}

export interface BoardMeeting {
  id: string
  meeting_date: string
  status: 'new' | 'reviewing' | 'acted' | 'archived'
  agenda: Record<string, AgendaSection>
  brief_md: string
  metrics: {
    decisionsRequired?: number
    openDecisions?: number
  }
  created_at: string
}

interface BoardNote {
  id: string
  content: string
  created_at: string
}

interface MeetingCardProps {
  meeting: BoardMeeting
  onStatusChange: (id: string, status: BoardMeeting['status']) => void
}

const STATUS_COLORS: Record<string, string> = {
  new: '#00F5FF',
  reviewing: '#f97316',
  acted: '#22c55e',
  archived: '#6b7280',
}

const AGENDA_ORDER = ['shipped', 'linear', 'github', 'financials', 'strategy', 'decisions', 'gantt']

export function MeetingCard({ meeting, onStatusChange }: MeetingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState<BoardNote[]>([])
  const [noteText, setNoteText] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [submittingNote, setSubmittingNote] = useState(false)

  const formattedDate = new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  async function openMeeting() {
    setExpanded(true)
    if (notes.length === 0 && !loadingNotes) {
      setLoadingNotes(true)
      try {
        const res = await fetch(`/api/boardroom/meetings/${meeting.id}`)
        const d = await res.json() as { notes: BoardNote[] }
        setNotes(d.notes ?? [])
      } finally {
        setLoadingNotes(false)
      }
    }
    if (meeting.status === 'new') {
      await fetch(`/api/boardroom/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewing' }),
      })
      onStatusChange(meeting.id, 'reviewing')
    }
  }

  async function submitNote() {
    if (!noteText.trim() || submittingNote) return
    setSubmittingNote(true)
    try {
      const res = await fetch(`/api/boardroom/meetings/${meeting.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText.trim() }),
      })
      const d = await res.json() as { note: BoardNote }
      if (d.note) { setNotes((p) => [...p, d.note]); setNoteText('') }
    } finally {
      setSubmittingNote(false)
    }
  }

  const agendaSections = Object.entries(meeting.agenda)
    .sort(([a], [b]) => AGENDA_ORDER.indexOf(a) - AGENDA_ORDER.indexOf(b))

  return (
    <div
      className="rounded-sm border overflow-hidden transition-all"
      style={{
        borderColor: expanded ? 'rgba(0,245,255,0.2)' : 'var(--color-border)',
        background: 'var(--surface-card)',
        borderLeft: `3px solid ${STATUS_COLORS[meeting.status]}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => expanded ? setExpanded(false) : openMeeting()} className="flex-1 flex items-center gap-3 text-left">
          <span style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          <div className="flex-1">
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {formattedDate}
            </p>
            {!expanded && agendaSections.length > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-disabled)' }}>
                {agendaSections.slice(0, 3).map(([, s]) => s.title).join(' · ')}
              </p>
            )}
          </div>
        </button>
        <span
          className="text-[10px] px-2 py-0.5 rounded-sm border flex-shrink-0"
          style={{ color: STATUS_COLORS[meeting.status], borderColor: `${STATUS_COLORS[meeting.status]}40` }}
        >
          {meeting.status.toUpperCase()}
        </span>
        {(meeting.metrics.decisionsRequired ?? 0) > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm flex-shrink-0" style={{ background: '#ef444420', color: '#ef4444' }}>
            {meeting.metrics.decisionsRequired} decisions
          </span>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Agenda sections */}
          {agendaSections.map(([key, section]) => (
            <div key={key}>
              <p className="text-[10px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>
                {section.title}
              </p>
              {section.highlight && (
                <p className="text-[12px] mb-1 font-medium" style={{ color: '#00F5FF' }}>
                  {section.highlight}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-[12px] leading-relaxed flex gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Status advance */}
          {meeting.status === 'reviewing' && (
            <button
              onClick={async () => {
                await fetch(`/api/boardroom/meetings/${meeting.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'acted' }),
                })
                onStatusChange(meeting.id, 'acted')
              }}
              className="text-[11px] px-3 py-1.5 rounded-sm border transition-colors"
              style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', background: 'rgba(34,197,94,0.06)' }}
            >
              → Mark as Acted
            </button>
          )}

          {/* Board notes */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-disabled)' }}>
              Board Notes
            </p>
            {loadingNotes && <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>Loading…</p>}
            {notes.map((n) => (
              <div key={n.id} className="text-[12px] px-3 py-2 mb-2 rounded-sm" style={{ background: 'var(--surface-canvas)', borderLeft: '2px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <span className="text-[10px] mr-2" style={{ color: 'var(--color-text-disabled)' }}>
                  {new Date(n.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {n.content}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void submitNote() }}
                placeholder="Add board note…"
                className="flex-1 h-8 px-3 rounded-sm border text-[12px] outline-none"
                style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
              />
              <button
                onClick={() => void submitNote()}
                disabled={!noteText.trim() || submittingNote}
                className="px-3 rounded-sm flex items-center transition-colors disabled:opacity-40"
                style={{ background: '#00F5FF', color: '#050505' }}
              >
                {submittingNote ? <Plus size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
