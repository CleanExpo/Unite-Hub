'use client'

import { useState, useEffect } from 'react'
import { Zap, Code2, Palette, Lightbulb, Plus, ExternalLink } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: 'ai-agent' | 'developer' | 'designer' | 'advisor'
  email: string | null
  github_login: string | null
  linear_user_id: string | null
  avatar_url: string | null
  active: boolean
  metadata: Record<string, string>
  created_at: string
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  'ai-agent':  <Zap size={13} style={{ color: '#00F5FF' }} />,
  'developer': <Code2 size={13} style={{ color: '#a855f7' }} />,
  'designer':  <Palette size={13} style={{ color: '#f97316' }} />,
  'advisor':   <Lightbulb size={13} style={{ color: '#eab308' }} />,
}

const ROLE_COLORS: Record<string, string> = {
  'ai-agent':  '#00F5FF',
  'developer': '#a855f7',
  'designer':  '#f97316',
  'advisor':   '#eab308',
}

export function TeamPanel() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', role: 'developer', email: '', github_login: '', linear_user_id: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/boardroom/team')
      const d = await res.json() as { members: TeamMember[] }
      setMembers(d.members ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function addMember() {
    if (!form.name.trim() || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/boardroom/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          email: form.email || undefined,
          github_login: form.github_login || undefined,
          linear_user_id: form.linear_user_id || undefined,
        }),
      })
      setForm({ name: '', role: 'developer', email: '', github_login: '', linear_user_id: '' })
      setShowForm(false)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
          {members.length} team member{members.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-sm"
          style={{ background: '#00F5FF', color: '#050505' }}
        >
          <Plus size={11} />
          Add Member
        </button>
      </div>

      {showForm && (
        <div className="rounded-sm border p-4 space-y-3" style={{ borderColor: 'rgba(0,245,255,0.2)', background: 'var(--surface-card)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name *"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
            />
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {['developer', 'designer', 'advisor', 'ai-agent'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
            />
            <input
              value={form.github_login}
              onChange={(e) => setForm((f) => ({ ...f, github_login: e.target.value }))}
              placeholder="GitHub login"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
            />
            <input
              value={form.linear_user_id}
              onChange={(e) => setForm((f) => ({ ...f, linear_user_id: e.target.value }))}
              placeholder="Linear user ID"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void addMember()}
              disabled={!form.name.trim() || submitting}
              className="px-4 h-8 rounded-sm text-[12px] font-medium disabled:opacity-40"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              Add to Team
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 h-8 rounded-sm text-[12px] border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {members.map((m) => {
          const roleColor = ROLE_COLORS[m.role] ?? '#6b7280'
          const isAI = m.role === 'ai-agent'
          return (
            <div
              key={m.id}
              className="rounded-sm border p-4"
              style={{
                borderColor: isAI ? 'rgba(0,245,255,0.3)' : 'var(--color-border)',
                background: 'var(--surface-card)',
                borderLeft: `3px solid ${roleColor}`,
              }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center text-[12px] font-medium flex-shrink-0"
                  style={{
                    background: `${roleColor}20`,
                    color: roleColor,
                    border: `1px solid ${roleColor}40`,
                  }}
                >
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt={m.name} className="w-full h-full rounded-sm object-cover" />
                  ) : (
                    getInitials(m.name)
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{m.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {ROLE_ICONS[m.role]}
                    <span className="text-[10px]" style={{ color: roleColor }}>{m.role}</span>
                  </div>
                </div>
              </div>

              {m.metadata?.description && (
                <p className="text-[11px] mb-3" style={{ color: 'var(--color-text-muted)' }}>{m.metadata.description}</p>
              )}

              {/* Links */}
              <div className="flex gap-2 flex-wrap">
                {m.github_login && (
                  <a
                    href={`https://github.com/${m.github_login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px]"
                    style={{ color: 'var(--color-text-disabled)' }}
                  >
                    <ExternalLink size={9} />
                    GitHub
                  </a>
                )}
                {m.email && (
                  <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>{m.email}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
