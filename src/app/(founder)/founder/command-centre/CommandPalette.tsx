'use client'

// Command palette (⌘K / Ctrl+K) for the Command Deck — READ-ONLY.
// Navigate sections, jump to a project's production URL, or copy a tool key.
// It never invokes a tool or mutates anything.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './command-palette.module.css'

type PaletteProject = { name: string; status: string; production_url: string | null }
type PaletteTool = { tool_key: string; source: string; risk_class: string }

type Item = {
  id: string
  group: 'Navigate' | 'Projects' | 'Tools'
  icon: string
  title: string
  sub: string
  tone?: string
  run: () => void
}

const RISK_TONE: Record<string, string> = {
  read: '#38e1ff',
  'write-local': '#34d399',
  'write-shared': '#fbbf24',
  external: '#fb923c',
  destructive: '#f87171',
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function focusIdeaConsole() {
  const el = document.getElementById('idea-console')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // Focus the first field once the smooth scroll is under way.
  requestAnimationFrame(() => {
    el?.querySelector('textarea')?.focus()
  })
}

export function CommandPalette({
  projects,
  tools,
}: {
  projects: PaletteProject[]
  tools: PaletteTool[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }, [])

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      { id: 'nav-idea', group: 'Navigate', icon: '▸', title: 'Submit an idea', sub: 'focus the idea console', run: focusIdeaConsole },
      { id: 'nav-portfolio', group: 'Navigate', icon: '▸', title: 'Portfolio Registry', sub: 'jump to projects', run: () => scrollTo('portfolio') },
      { id: 'nav-bus', group: 'Navigate', icon: '▸', title: 'Capability Bus', sub: 'jump to tools', run: () => scrollTo('capability-bus') },
      { id: 'nav-top', group: 'Navigate', icon: '▸', title: 'Status Strip', sub: 'back to top', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    ]
    const proj: Item[] = projects.map((p) => ({
      id: `proj-${p.name}`,
      group: 'Projects',
      icon: '◆',
      title: p.name,
      sub: p.production_url ? p.production_url.replace(/^https?:\/\//, '') : `${p.status} · no production URL`,
      tone: p.status === 'active' ? '#34d399' : p.status === 'stub' ? '#fbbf24' : '#6f879b',
      run: () => {
        if (p.production_url) window.open(p.production_url, '_blank', 'noopener,noreferrer')
      },
    }))
    const tool: Item[] = tools.map((t) => ({
      id: `tool-${t.tool_key}`,
      group: 'Tools',
      icon: '⬡',
      title: t.tool_key,
      sub: `${t.source} · ${t.risk_class} · copy key`,
      tone: RISK_TONE[t.risk_class] ?? '#6f879b',
      run: () => { void navigator.clipboard?.writeText(t.tool_key).catch(() => {}) },
    }))
    return [...nav, ...proj, ...tool]
  }, [projects, tools])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => `${it.title} ${it.sub} ${it.group}`.toLowerCase().includes(q))
  }, [items, query])

  // Global ⌘K / Ctrl+K toggle + Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape' && open) {
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  if (!open) return null

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const it = filtered[active]
      if (it) { it.run(); close() }
    }
  }

  // Group the filtered list while keeping a flat index for keyboard nav.
  const groups: Array<Item['group']> = ['Navigate', 'Projects', 'Tools']
  let flatIndex = -1

  return (
    <div className={styles.backdrop} onMouseDown={close} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.inputRow}>
          <span className={styles.caret}>▸</span>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search projects, tools, sections…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            aria-label="Command palette search"
          />
        </div>

        <div className={styles.results}>
          {filtered.length === 0 && <div className={styles.empty}>No matches</div>}
          {groups.map((g) => {
            const rows = filtered.filter((it) => it.group === g)
            if (rows.length === 0) return null
            return (
              <div key={g} className={styles.group}>
                <div className={styles.groupLabel}>{g}</div>
                {rows.map((it) => {
                  flatIndex += 1
                  const idx = flatIndex
                  return (
                    <div
                      key={it.id}
                      className={`${styles.row} ${idx === active ? styles.rowActive : ''}`}
                      aria-selected={idx === active}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => { it.run(); close() }}
                    >
                      {it.tone ? (
                        <span className={styles.dot} style={{ background: it.tone }} />
                      ) : (
                        <span className={styles.rowIcon}>{it.icon}</span>
                      )}
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>{it.title}</span>
                        <span className={styles.rowSub}>{it.sub}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className={styles.footer}>
          <span><b>↑↓</b> navigate</span>
          <span><b>↵</b> open</span>
          <span><b>esc</b> close</span>
          <span className={styles.spacer} />
          <span>read-only · no execution</span>
        </div>
      </div>
    </div>
  )
}
