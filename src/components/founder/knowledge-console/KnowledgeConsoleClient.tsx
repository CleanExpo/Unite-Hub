'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  AlertCircle,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  GitBranch,
  Inbox,
  ListChecks,
  Loader2,
  Map,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import type { KnowledgeNote, KnowledgeProject } from '@/types/database'

type ProjectStatus = KnowledgeProject['status'] | 'mapped' | 'watching' | 'planned'

type ConsoleProject = Pick<
  KnowledgeProject,
  'id' | 'key' | 'label' | 'description' | 'note_count' | 'status' | 'last_ingested_at'
> & {
  path: string
  tags: string[]
}

type NoteSummary = Pick<
  KnowledgeNote,
  | 'id'
  | 'vault_path'
  | 'title'
  | 'slug'
  | 'project_key'
  | 'note_type'
  | 'tags'
  | 'word_count'
  | 'confidence'
  | 'quality'
  | 'ai_optimized'
  | 'created_at'
  | 'updated_at'
> & {
  content?: string
}

type NoteDetail = NoteSummary &
  Pick<
    KnowledgeNote,
    'content' | 'content_html' | 'frontmatter' | 'sources' | 'obsidian_source' | 'obsidian_mtime'
  >

type LoadSource = 'api' | 'fallback'

const FALLBACK_PROJECTS: ConsoleProject[] = [
  {
    id: 'fallback-restoreassist',
    key: 'restoreassist',
    label: 'RestoreAssist',
    description: 'Insurance restoration claim management platform with AI automation.',
    note_count: 42,
    status: 'active',
    last_ingested_at: null,
    path: '/02-Projects/RestoreAssist',
    tags: ['app-store', 'disaster-recovery', 'handoffs'],
  },
  {
    id: 'fallback-synthex',
    key: 'synthex',
    label: 'Synthex',
    description: 'Multi-channel publishing, campaigns, and operating intelligence.',
    note_count: 35,
    status: 'watching',
    last_ingested_at: null,
    path: '/02-Projects/Synthex',
    tags: ['automation', 'crm', 'campaigns'],
  },
  {
    id: 'fallback-nexus',
    key: 'unite-hub',
    label: 'Unite-Hub',
    description: 'Founder dashboard, governance console, and agent handoff layer.',
    note_count: 57,
    status: 'active',
    last_ingested_at: null,
    path: '/02-Projects/Unite-Hub',
    tags: ['founder-os', 'hermes', 'codex'],
  },
  {
    id: 'fallback-carsi',
    key: 'carsi',
    label: 'CARSI',
    description: 'Customer automotive relationship and sales intelligence research.',
    note_count: 18,
    status: 'planned',
    last_ingested_at: null,
    path: '/02-Projects/CARSI',
    tags: ['research', 'market'],
  },
  {
    id: 'fallback-nrpg',
    key: 'nrpg',
    label: 'Disaster Recovery / NRPG',
    description: 'Operational field response, restoration process, and partner notes.',
    note_count: 31,
    status: 'watching',
    last_ingested_at: null,
    path: '/02-Projects/Disaster-Recovery-NRPG',
    tags: ['ops', 'response', 'field-work'],
  },
]

const FALLBACK_NOTE_CONTENT = [
  '# Knowledge Console Phase 1',
  '',
  'Obsidian stays local-first. Nexus renders the operational view.',
  '',
  '## Source model',
  '- Git/filesystem sync bridge for production ingestion',
  '- Obsidian URI links for local convenience',
  '- Local plugin bridge only after security review',
  '',
  '## Guardrails',
  '- Read-only by default',
  '- Founder-scoped records only',
  '- Hermes must cite note paths',
].join('\n')

const FALLBACK_NOTES: NoteDetail[] = FALLBACK_PROJECTS.map((project) => ({
  id: `fallback-note-${project.key}`,
  vault_path: `${project.path}/Knowledge Console Phase 1.md`,
  title: `${project.label} Knowledge Console Phase 1`,
  slug: `${project.key}-knowledge-console-phase-1`,
  project_key: project.key,
  note_type: 'project',
  tags: project.tags,
  word_count: 142,
  confidence: 'medium',
  quality: 'draft',
  ai_optimized: false,
  created_at: '2026-06-03T00:00:00.000Z',
  updated_at: '2026-06-03T00:00:00.000Z',
  content: FALLBACK_NOTE_CONTENT,
  content_html: null,
  frontmatter: {
    source: 'obsidian',
    note_type: 'handoff',
    status: 'draft',
    visibility: 'internal',
    owner: 'phill',
  },
  sources: [],
  obsidian_source: null,
  obsidian_mtime: null,
}))

const ACTIONS = [
  { label: 'Summarise selected note', icon: Sparkles, state: 'Planned' },
  { label: 'Extract action items', icon: ListChecks, state: 'Approval gated' },
  { label: 'Generate Codex handoff', icon: Bot, state: 'Planned' },
  { label: 'Prepare project briefing', icon: FileSearch, state: 'Planned' },
]

function statusLabel(status: ProjectStatus) {
  if (status === 'mapped') return 'Mapped'
  if (status === 'watching') return 'Watching'
  if (status === 'planned') return 'Planned'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function projectPath(project: Pick<KnowledgeProject, 'key'>) {
  return `/02-Projects/${project.key}`
}

function normalizeProject(project: KnowledgeProject): ConsoleProject {
  const metadata = project.metadata
  const metadataRecord =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {}
  const path = typeof metadataRecord.path === 'string' ? metadataRecord.path : projectPath(project)
  const tags = Array.isArray(metadataRecord.tags)
    ? metadataRecord.tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  return {
    id: project.id,
    key: project.key,
    label: project.label,
    description: project.description,
    note_count: project.note_count,
    status: project.status,
    last_ingested_at: project.last_ingested_at,
    path,
    tags,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatDate(value: string | null) {
  if (!value) return 'Not ingested'
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function fallbackNotesFor(projectKey: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  return FALLBACK_NOTES.filter((note) => {
    const matchesProject = note.project_key === projectKey
    if (!normalizedQuery) return matchesProject

    const haystack = `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase()
    return matchesProject && haystack.includes(normalizedQuery)
  })
}

export function KnowledgeConsoleClient() {
  const pathname = usePathname()
  const previewMode = pathname.startsWith('/preview/')
  const [projects, setProjects] = useState<ConsoleProject[]>(FALLBACK_PROJECTS)
  const [activeProjectKey, setActiveProjectKey] = useState(FALLBACK_PROJECTS[2].key)
  const [notes, setNotes] = useState<NoteSummary[]>(fallbackNotesFor(FALLBACK_PROJECTS[2].key, ''))
  const [selectedNoteId, setSelectedNoteId] = useState<string>(FALLBACK_NOTES[2].id)
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(FALLBACK_NOTES[2])
  const [source, setSource] = useState<LoadSource>('fallback')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [loadingSelectedNote, setLoadingSelectedNote] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      setLoadingProjects(true)
      setError(null)

      if (previewMode) {
        setSource('fallback')
        setProjects(FALLBACK_PROJECTS)
        setActiveProjectKey((current) => current || FALLBACK_PROJECTS[0].key)
        setLoadingProjects(false)
        return
      }

      try {
        const response = await fetch('/api/knowledge/projects?limit=100', {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Projects API returned ${response.status}`)

        const payload = await response.json() as { projects?: KnowledgeProject[] }
        const loadedProjects = payload.projects?.map(normalizeProject) ?? []

        if (loadedProjects.length === 0) {
          setSource('fallback')
          setProjects(FALLBACK_PROJECTS)
          setActiveProjectKey((current) => current || FALLBACK_PROJECTS[0].key)
          return
        }

        setSource('api')
        setProjects(loadedProjects)
        setActiveProjectKey((current) => {
          if (loadedProjects.some((project) => project.key === current)) return current
          return loadedProjects[0].key
        })
      } catch (loadError) {
        if (controller.signal.aborted) return
        setSource('fallback')
        setProjects(FALLBACK_PROJECTS)
        setError(loadError instanceof Error ? loadError.message : 'Knowledge API unavailable')
      } finally {
        if (!controller.signal.aborted) setLoadingProjects(false)
      }
    }

    void loadProjects()

    return () => controller.abort()
  }, [previewMode])

  useEffect(() => {
    const controller = new AbortController()

    async function loadNotes() {
      if (!activeProjectKey) return
      setLoadingNotes(true)

      if (source === 'fallback') {
        const fallbackNotes = fallbackNotesFor(activeProjectKey, searchQuery)
        setNotes(fallbackNotes)
        setSelectedNoteId(fallbackNotes[0]?.id ?? '')
        setSelectedNote(fallbackNotes[0] ?? null)
        setLoadingNotes(false)
        return
      }

      const params = new URLSearchParams({
        project: activeProjectKey,
        limit: '30',
      })
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      try {
        const response = await fetch(`/api/knowledge/notes?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Notes API returned ${response.status}`)

        const payload = await response.json() as { notes?: NoteSummary[] }
        const loadedNotes = payload.notes ?? []
        setNotes(loadedNotes)
        setSelectedNoteId(loadedNotes[0]?.id ?? '')
        setSelectedNote(null)
      } catch (loadError) {
        if (controller.signal.aborted) return
        const fallbackNotes = fallbackNotesFor(activeProjectKey, searchQuery)
        setSource('fallback')
        setNotes(fallbackNotes)
        setSelectedNoteId(fallbackNotes[0]?.id ?? '')
        setSelectedNote(fallbackNotes[0] ?? null)
        setError(loadError instanceof Error ? loadError.message : 'Knowledge notes unavailable')
      } finally {
        if (!controller.signal.aborted) setLoadingNotes(false)
      }
    }

    void loadNotes()

    return () => controller.abort()
  }, [activeProjectKey, searchQuery, source])

  useEffect(() => {
    const controller = new AbortController()

    async function loadSelectedNote() {
      if (!selectedNoteId) {
        setSelectedNote(null)
        return
      }

      if (source === 'fallback') {
        setSelectedNote(FALLBACK_NOTES.find((note) => note.id === selectedNoteId) ?? null)
        return
      }

      setLoadingSelectedNote(true)
      try {
        const response = await fetch(`/api/knowledge/notes/${selectedNoteId}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Note API returned ${response.status}`)

        const note = await response.json() as NoteDetail
        setSelectedNote(note)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setSelectedNote(notes.find((note) => note.id === selectedNoteId) as NoteDetail | undefined ?? null)
        setError(loadError instanceof Error ? loadError.message : 'Selected note unavailable')
      } finally {
        if (!controller.signal.aborted) setLoadingSelectedNote(false)
      }
    }

    void loadSelectedNote()

    return () => controller.abort()
  }, [notes, selectedNoteId, source])

  const activeProject = useMemo(
    () => projects.find((project) => project.key === activeProjectKey) ?? projects[0],
    [activeProjectKey, projects],
  )

  const totalNotes = useMemo(
    () => projects.reduce((sum, project) => sum + project.note_count, 0),
    [projects],
  )

  const visibleTags = useMemo(() => {
    if (!activeProject) return []
    if (activeProject.tags.length > 0) return activeProject.tags

    return Array.from(new Set(notes.flatMap((note) => note.tags))).slice(0, 4)
  }, [activeProject, notes])

  const frontmatter = isRecord(selectedNote?.frontmatter) ? selectedNote.frontmatter : {}

  return (
    <div className="flex min-h-full flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Knowledge Console"
        subtitle="Read-only command centre for Obsidian-sourced project knowledge, Hermes handoffs, and future RAG."
        tip={
          source === 'api'
            ? 'Live knowledge data is loaded through founder-scoped API routes.'
            : 'Preview mode is active until the knowledge schema is applied and seeded.'
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Projects" value={projects.length.toString()} icon={Boxes} />
        <MetricCard label="Notes indexed" value={totalNotes.toString()} icon={Database} />
        <MetricCard label="Active source" value={source === 'api' ? 'Live DB' : 'Preview'} icon={Network} />
        <MetricCard label="Selected note" value={selectedNote ? 'Loaded' : 'None'} icon={FileSearch} />
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-sm border px-3 py-2 text-[12px]"
          style={{
            background: 'rgba(255, 180, 0, 0.08)',
            borderColor: 'rgba(255, 180, 0, 0.24)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" strokeWidth={1.7} />
          <span>Knowledge API fallback active: {error}</span>
        </div>
      )}

      <div className="grid min-h-[calc(100vh-250px)] gap-4 xl:grid-cols-[330px_minmax(0,1fr)_320px]">
        <aside
          className="flex min-h-[560px] flex-col rounded-sm border"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
        >
          <div className="border-b p-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
              <Boxes size={14} strokeWidth={1.7} />
              Vault Explorer
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-sm border px-2" style={{ borderColor: 'var(--color-border)' }}>
              <Search size={14} strokeWidth={1.7} style={{ color: 'var(--color-text-disabled)' }} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notes"
                className="h-9 min-w-0 flex-1 bg-transparent text-[12px] outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingProjects ? (
              <LoadingLine label="Loading projects" />
            ) : (
              projects.map((project) => {
                const active = project.key === activeProject?.key
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProjectKey(project.key)}
                    className="mb-1 flex w-full items-start gap-3 rounded-sm px-3 py-3 text-left transition-colors"
                    style={{
                      background: active ? 'var(--color-accent-10)' : 'transparent',
                      border: active ? '1px solid var(--color-accent-border)' : '1px solid transparent',
                      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <Network size={15} className="mt-0.5 shrink-0" strokeWidth={1.6} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{project.label}</span>
                      <span className="mt-1 block truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        {project.path}
                      </span>
                      <span className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
                        <span>{project.note_count} notes</span>
                        <span aria-hidden="true">/</span>
                        <span>{statusLabel(project.status)}</span>
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <main className="grid min-h-[560px] gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
          <section
            className="rounded-sm border p-4"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
                  <Map size={14} strokeWidth={1.7} />
                  Project Knowledge Map
                </div>
                <h2 className="mt-2 text-[18px] font-light" style={{ color: 'var(--color-text-primary)' }}>
                  {activeProject?.label ?? 'No project selected'}
                </h2>
                <p className="mt-1 max-w-2xl text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {activeProject?.description ?? 'Apply and seed the knowledge schema to begin indexing notes.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border px-2 py-1 text-[11px]"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="grid min-h-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div
              className="flex min-h-[460px] flex-col rounded-sm border"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="border-b p-3" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
                  Notes
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loadingNotes ? (
                  <LoadingLine label="Loading notes" />
                ) : notes.length === 0 ? (
                  <EmptyState title="No notes indexed" body="Ingestion has not populated this project yet." />
                ) : (
                  notes.map((note) => {
                    const active = note.id === selectedNoteId
                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => setSelectedNoteId(note.id)}
                        className="mb-1 w-full rounded-sm border px-3 py-3 text-left"
                        style={{
                          background: active ? 'var(--color-accent-10)' : 'transparent',
                          borderColor: active ? 'var(--color-accent-border)' : 'transparent',
                        }}
                      >
                        <span className="block truncate text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {note.title}
                        </span>
                        <span className="mt-1 block truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          {note.vault_path}
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
                          <span>{note.note_type}</span>
                          <span aria-hidden="true">/</span>
                          <span>{note.word_count} words</span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div
              className="flex min-h-[460px] flex-col overflow-hidden rounded-sm border"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
                    Markdown Note Preview
                  </p>
                  <p className="mt-1 truncate text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    {selectedNote?.vault_path ?? 'No note selected'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!selectedNote?.obsidian_source}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-sm border px-3 text-[12px] opacity-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  title="Enabled later when a safe Obsidian URI is stored from ingestion metadata."
                >
                  <ExternalLink size={13} strokeWidth={1.7} />
                  Open in Obsidian
                </button>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 2xl:grid-cols-[minmax(0,1fr)_250px]">
                <pre
                  className="min-h-0 overflow-auto whitespace-pre-wrap p-4 font-mono text-[12px] leading-6"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {loadingSelectedNote ? 'Loading selected note...' : selectedNote?.content ?? 'Select a note to inspect its markdown.'}
                </pre>

                <div className="border-t p-4 2xl:border-l 2xl:border-t-0" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                    Frontmatter
                  </p>
                  <dl className="mt-3 space-y-3 text-[12px]">
                    {Object.entries(frontmatter).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <dt style={{ color: 'var(--color-text-disabled)' }}>{key}</dt>
                        <dd className="truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                    {Object.keys(frontmatter).length === 0 && (
                      <p style={{ color: 'var(--color-text-disabled)' }}>No frontmatter loaded</p>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className="grid min-h-[560px] content-start gap-4">
          <Panel title="Hermes Actions" icon={Bot}>
            {ACTIONS.map(({ label, icon: Icon, state }) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-sm border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
                <span className="flex min-w-0 items-center gap-2 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                  <Icon size={13} className="shrink-0" strokeWidth={1.7} />
                  <span className="truncate">{label}</span>
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-disabled)' }}>
                  {state}
                </span>
              </div>
            ))}
          </Panel>

          <Panel title="Agent Handoffs" icon={GitBranch}>
            {['Hermes', 'Codex', 'Rana', 'Margot'].map((agent) => (
              <div key={agent} className="flex items-center justify-between text-[12px]">
                <span style={{ color: 'var(--color-text-secondary)' }}>{agent}</span>
                <span style={{ color: 'var(--color-text-disabled)' }}>Queued model</span>
              </div>
            ))}
          </Panel>

          <Panel title="Research Inbox" icon={Inbox}>
            <p className="text-[12px] leading-5" style={{ color: 'var(--color-text-secondary)' }}>
              Captured research will land here for project classification before Hermes or Codex handoff.
            </p>
          </Panel>

          <Panel title="Integration Posture" icon={ShieldCheck}>
            {[
              source === 'api' ? 'Founder API active' : 'Preview fallback active',
              'No local API exposure',
              'No write-back enabled',
              `Last ingest: ${formatDate(activeProject?.last_ingested_at ?? null)}`,
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                <CheckCircle2 size={13} strokeWidth={1.7} style={{ color: 'var(--color-accent)' }} />
                {item}
              </div>
            ))}
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <section
      className="rounded-sm border p-3"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <Icon size={14} strokeWidth={1.7} style={{ color: 'var(--color-accent)' }} />
      </div>
      <p className="mt-2 truncate text-[18px] font-light" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
    </section>
  )
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-3 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
      <Loader2 size={14} className="animate-spin" strokeWidth={1.7} />
      {label}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sm border p-3 text-[12px]" style={{ borderColor: 'var(--color-border)' }}>
      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
      <p className="mt-1 leading-5" style={{ color: 'var(--color-text-secondary)' }}>{body}</p>
    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section
      className="rounded-sm border p-4"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
        <Icon size={14} strokeWidth={1.7} />
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
