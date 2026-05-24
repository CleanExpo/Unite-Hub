'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, GitBranch, Target, Users, RefreshCw, Send } from 'lucide-react'
import { MeetingCard, type BoardMeeting } from './MeetingCard'
import { GanttChart } from './GanttChart'
import { DecisionLog } from './DecisionLog'
import { TeamPanel } from './TeamPanel'
import { DispatchPanel } from './DispatchPanel'

type Tab = 'meeting' | 'gantt' | 'decisions' | 'team' | 'dispatch'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'meeting',   label: "Today's Meeting", icon: <Building2 size={13} /> },
  { id: 'gantt',     label: 'Gantt',           icon: <GitBranch size={13} /> },
  { id: 'decisions', label: 'Decisions',        icon: <Target size={13} /> },
  { id: 'team',      label: 'Team',             icon: <Users size={13} /> },
  { id: 'dispatch',  label: 'Dispatch',         icon: <Send size={13} /> },
]

export function BoardroomClient() {
  const [tab, setTab] = useState<Tab>('meeting')
  const [meetings, setMeetings] = useState<BoardMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boardroom/meetings?limit=30')
      const d = await res.json() as { meetings: BoardMeeting[] }
      setMeetings(d.meetings ?? [])
      setLastRefresh(new Date())
    } catch {
      // Silently retain stale data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMeetings()
  }, [fetchMeetings])

  // Poll every 60s for new daily meetings
  useEffect(() => {
    const id = setInterval(() => void fetchMeetings(), 60_000)
    return () => clearInterval(id)
  }, [fetchMeetings])

  function handleStatusChange(id: string, status: BoardMeeting['status']) {
    setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, status } : m))
  }

  return (
    <div className="space-y-5">
      {/* Tab strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-0.5 p-0.5 rounded-sm border" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] transition-colors"
              style={{
                background: tab === t.id ? 'var(--surface-card)' : 'transparent',
                color: tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'meeting' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
              {lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => void fetchMeetings()}
              disabled={loading}
              className="p-1.5 rounded-sm border transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-disabled)' }}
              aria-label="Refresh meetings"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      {tab === 'meeting' && (
        <div className="space-y-3">
          {loading && meetings.length === 0 && (
            <div className="space-y-3 animate-pulse" aria-label="Loading board meetings">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-sm border px-4 py-3 flex items-start gap-3" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)', borderLeft: '3px solid var(--surface-elevated)' }}>
                  <div className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0" style={{ background: 'var(--surface-elevated)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-sm w-48" style={{ background: 'var(--surface-elevated)' }} />
                    <div className="h-2.5 rounded-sm w-72" style={{ background: 'var(--surface-elevated)' }} />
                  </div>
                  <div className="h-5 w-16 rounded-sm flex-shrink-0" style={{ background: 'var(--surface-elevated)' }} />
                </div>
              ))}
            </div>
          )}
          {!loading && meetings.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="text-[13px]" style={{ color: 'var(--color-text-disabled)' }}>No board meetings yet.</p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>The first meeting generates at 11:50 AEST. You can also trigger it manually via the API.</p>
            </div>
          )}
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {tab === 'gantt' && <GanttChart />}
      {tab === 'decisions' && <DecisionLog />}
      {tab === 'team' && <TeamPanel />}
      {tab === 'dispatch' && <DispatchPanel />}
    </div>
  )
}
