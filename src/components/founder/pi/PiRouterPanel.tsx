'use client'

import { useEffect, useMemo, useState } from 'react'
import Card, { CardDescription, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { FounderContinuationEnforcement, FounderRunQueueAction, FounderRunQueueItem, FounderRunQueueSummary } from '@/lib/founder-os'

interface PiQueueReceipt {
  id: string
  status?: string
  generatedAt?: string
  source?: string
  requiresHumanApproval?: boolean
  nextRecommendedAction?: string
  type?: string
  actor?: string
  note?: string
  evidenceLink?: string
  at?: string
}

interface PiRunQueueResponse {
  queueItem: FounderRunQueueItem
  routingReasons?: string[]
  receipt: PiQueueReceipt | null
  summary?: FounderRunQueueSummary
  enforcement?: FounderContinuationEnforcement
}

interface PiRunQueueListResponse {
  items: FounderRunQueueItem[]
  summary: FounderRunQueueSummary
  enforcement: FounderContinuationEnforcement
}

interface PiWorkflowState {
  workflowId: string
  evidenceId: string | null
  status: string
  currentGate: string
  changedFileCount: number
  verificationSummary: string
  nextAction: string
  modelRoute: {
    planner: string
    implementer: string
    challenger: string
    opusUltrathink: string
  }
  requiresMargotReview: boolean
  threeLoopRequired: boolean
}

interface PiWorkflowResponse {
  workflow: PiWorkflowState
}

const EXAMPLE_MESSAGE =
  'Build the Unite-Hub command centre panel for run queue visibility, then test it before moving to the next build.'

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  waiting_for_approval: 'Approval',
  waiting_for_device: 'Waiting',
  ready: 'Ready',
  in_progress: 'Running',
  blocked: 'Blocked',
  completed: 'Completed',
}

export function PiRouterPanel() {
  const [message, setMessage] = useState(EXAMPLE_MESSAGE)
  const [result, setResult] = useState<PiRunQueueResponse | null>(null)
  const [queueItems, setQueueItems] = useState<FounderRunQueueItem[]>([])
  const [summary, setSummary] = useState<FounderRunQueueSummary | null>(null)
  const [enforcement, setEnforcement] = useState<FounderContinuationEnforcement | null>(null)
  const [workflowState, setWorkflowState] = useState<PiWorkflowState | null>(null)
  const [transitionNote, setTransitionNote] = useState('')
  const [evidenceLink, setEvidenceLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const [activeAction, setActiveAction] = useState<FounderRunQueueAction | null>(null)

  useEffect(() => {
    void loadQueue()
    void loadWorkflowState()
  }, [])

  async function loadWorkflowState() {
    const response = await fetch('/api/pi/workflows')
    if (!response.ok) return
    const body = (await response.json()) as PiWorkflowResponse
    setWorkflowState(body.workflow)
  }

  async function loadQueue() {
    const response = await fetch('/api/pi/run-queue')
    if (!response.ok) return
    const body = (await response.json()) as PiRunQueueListResponse
    setQueueItems(body.items)
    setSummary(body.summary)
    setEnforcement(body.enforcement)
  }

  async function routeMessage() {
    setIsRouting(true)
    setError(null)

    try {
      const response = await fetch('/api/pi/run-queue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to route founder message')
      }

      setResult(body)
      setEnforcement(body.enforcement ?? null)
      await loadQueue()
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Unable to route founder message')
    } finally {
      setIsRouting(false)
    }
  }

  async function transitionActiveItem(action: FounderRunQueueAction) {
    if (!activeItem) return
    setActiveAction(action)
    setError(null)

    try {
      const response = await fetch(`/api/pi/run-queue/${activeItem.id}/transition`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          actor: action === 'approve' ? 'Margot' : 'Pi-Dev-Ops',
          note: transitionNote || undefined,
          evidenceLink: action === 'complete' ? evidenceLink : undefined,
        }),
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to update queue item')
      }

      setResult(body)
      setEnforcement(body.enforcement ?? null)
      setTransitionNote('')
      if (action === 'complete') setEvidenceLink('')
      await loadQueue()
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : 'Unable to update queue item')
    } finally {
      setActiveAction(null)
    }
  }

  const activeItem = result?.queueItem
  const latestReceipt = result?.receipt ?? activeItem?.receipts.at(-1) ?? null
  const queueCounts = useMemo(
    () => [
      { label: 'Total', value: summary?.total ?? queueItems.length, tone: 'neutral' as const },
      { label: 'Approval', value: summary?.waitingForApproval ?? 0, tone: 'warning' as const },
      { label: 'Waiting', value: summary?.waitingForDevice ?? 0, tone: 'info' as const },
      { label: 'Queued', value: summary?.queued ?? 0, tone: 'neutral' as const },
    ],
    [queueItems.length, summary]
  )

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <Card variant="bordered" padding="lg" className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/60">Command intake</p>
              <CardTitle className="mt-2">Route before execution</CardTitle>
              <CardDescription>
                One founder instruction becomes a task packet, context pack, risk gate, machine assignment, and queue item.
              </CardDescription>
            </div>
            <StatusPill status="safe_gate" label="No auto-run" />
          </div>

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={7}
            className="border-white/[0.08] bg-black/30 text-white/90 placeholder:text-white/30"
            placeholder="Tell Pi what you want built, checked, researched, routed, or approved..."
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={routeMessage} loading={isRouting} disabled={!message.trim()}>
              Route + queue
            </Button>
            <span className="text-xs text-white/45">Founder-safe: queue first, execute after evidence path is clear.</span>
          </div>

          {error && <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        </Card>

        <Card variant="bordered" padding="lg" className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">Run queue</p>
            <CardTitle className="mt-2">Control tower</CardTitle>
            <CardDescription>Select one queued run to inspect context, controls, and evidence.</CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {queueCounts.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
            ))}
          </div>

          <div className="space-y-2">
            {queueItems.slice(0, 8).map((item) => {
              const selected = activeItem?.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setResult({ queueItem: item, receipt: item.receipts.at(-1) ?? null })}
                  className={`w-full rounded-sm border p-3 text-left transition ${
                    selected
                      ? 'border-cyan-300/40 bg-cyan-300/[0.07]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/35">{item.taskPacket.portfolioTarget}</span>
                    <StatusPill status={item.status} />
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-white/78">{item.taskPacket.objective}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                    <span>{item.machineAssignment.assignedDeviceName ?? 'Device pending'}</span>
                    <span>{item.receipts.length} receipts</span>
                  </div>
                </button>
              )
            })}
            {queueItems.length === 0 && (
              <div className="rounded-sm border border-dashed border-white/[0.12] bg-white/[0.02] p-4 text-sm text-white/45">
                No queued Pi tasks yet. Route a command to create the first operational run.
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        {activeItem ? (
          <>
            <Card variant="bordered" padding="lg" className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/60">Selected run</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-white/90">{activeItem.taskPacket.objective}</h2>
                </div>
                <StatusPill status={activeItem.status} />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="Lane" value={activeItem.taskPacket.lane} />
                <InfoTile label="Type" value={activeItem.taskPacket.taskType} />
                <InfoTile label="Risk" value={activeItem.taskPacket.riskLevel} />
                <InfoTile label="Agents" value={activeItem.taskPacket.requiredAgents.join(', ')} />
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <ResultCard title="Machine assignment">
                <ResultRow label="Device" value={activeItem.machineAssignment.assignedDeviceName ?? 'Waiting'} />
                <ResultRow label="Role" value={activeItem.machineAssignment.assignedRole ?? 'Unassigned'} />
                <ResultRow label="Approvals" value={`${activeItem.approvals.length}`} />
                <ResultRow label="Receipts" value={`${activeItem.receipts.length}`} />
              </ResultCard>

              <ResultCard title="Next action">
                <p className="text-sm leading-6 text-white/76">{activeItem.contextPack.nextRecommendedAction}</p>
                <div className="mt-4 rounded-sm border border-white/[0.08] bg-black/20 p-3 font-mono text-xs text-white/45">
                  {latestReceipt?.id ?? 'receipt pending'}
                </div>
              </ResultCard>
            </div>

            <Card variant="bordered" padding="lg" className="space-y-4">
              <div>
                <CardTitle>Context pack</CardTitle>
                <CardDescription>Durable summary, constraints, blockers, and evidence attached to the run.</CardDescription>
              </div>
              <p className="text-sm leading-6 text-white/70">{activeItem.contextPack.durableSummary}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {activeItem.contextPack.constraints.map((constraint) => (
                  <div key={constraint} className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-3 text-sm text-white/62">
                    {constraint}
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card variant="bordered" padding="lg" className="flex min-h-[360px] flex-col justify-center border-dashed text-center">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">No selected run</p>
            <h2 className="mt-3 text-2xl font-semibold text-white/90">Route or select a task</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/50">
              The cockpit keeps the queue visible while one selected run exposes task packet, context, machine assignment, and evidence controls.
            </p>
          </Card>
        )}
      </section>

      <aside className="space-y-4">
        <Card variant="bordered" padding="lg" className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/60">Pi-Dev-Ops workflow</p>
              <CardTitle className="mt-2">Senior engineer gate</CardTitle>
              <CardDescription>Dynamic Workflow evidence surfaced before the next build lane moves.</CardDescription>
            </div>
            <StatusPill status={workflowState?.status ?? 'waiting'} />
          </div>

          {workflowState ? (
            <div className="space-y-3">
              <ResultRow label="Workflow" value={workflowState.workflowId} />
              <ResultRow label="Current gate" value={workflowState.currentGate} />
              <ResultRow label="Changed files" value={`${workflowState.changedFileCount}`} />
              <ResultRow label="Planner" value={workflowState.modelRoute.planner} />
              <ResultRow label="Challenger" value={workflowState.modelRoute.challenger} />
              <div className="rounded-sm border border-green-400/20 bg-green-500/10 p-3 text-xs leading-5 text-green-100/80">
                {workflowState.verificationSummary}
              </div>
              <div className="rounded-sm border border-cyan-300/20 bg-cyan-300/[0.06] p-3 text-sm leading-6 text-cyan-50/80">
                {workflowState.nextAction}
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-white/[0.12] p-3 text-sm text-white/45">
              Workflow evidence not loaded yet.
            </div>
          )}
        </Card>

        <Card variant="bordered" padding="lg" className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">Control rail</p>
            <CardTitle className="mt-2">Approvals + evidence</CardTitle>
            <CardDescription>Completion requires evidence. Blocking requires a clear note.</CardDescription>
          </div>

          {enforcement && (
            <div className={`rounded-sm border p-3 text-sm leading-6 ${
              enforcement.canOpenNextLane
                ? 'border-green-400/20 bg-green-500/10 text-green-100/85'
                : 'border-amber-300/25 bg-amber-400/10 text-amber-100/85'
            }`}>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">Continue-until-complete enforcement</div>
              <div className="mt-2">{enforcement.requiredAction}</div>
              <div className="mt-2 font-mono text-xs text-white/45">
                open={enforcement.openWorkCount} blocked={enforcement.blockedCount} completed={enforcement.completedCount}
              </div>
            </div>
          )}

          <Textarea
            value={transitionNote}
            onChange={(event) => setTransitionNote(event.target.value)}
            rows={3}
            placeholder="Transition note, blocker, or completion summary..."
            disabled={!activeItem}
            className="border-white/[0.08] bg-black/20"
          />
          <Textarea
            value={evidenceLink}
            onChange={(event) => setEvidenceLink(event.target.value)}
            rows={2}
            placeholder="Evidence required for Complete, e.g. loop:3x-green or CI URL..."
            disabled={!activeItem}
            className="border-white/[0.08] bg-black/20"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => transitionActiveItem('approve')} loading={activeAction === 'approve'} disabled={!activeItem}>
              Approve
            </Button>
            <Button variant="secondary" onClick={() => transitionActiveItem('start')} loading={activeAction === 'start'} disabled={!activeItem}>
              Start
            </Button>
            <Button variant="danger" onClick={() => transitionActiveItem('block')} loading={activeAction === 'block'} disabled={!activeItem}>
              Block
            </Button>
            <Button onClick={() => transitionActiveItem('complete')} loading={activeAction === 'complete'} disabled={!activeItem || !evidenceLink.trim()}>
              Complete
            </Button>
          </div>
        </Card>

        <Card variant="bordered" padding="lg" className="space-y-4">
          <div>
            <CardTitle>Receipts</CardTitle>
            <CardDescription>Latest operational proof attached to the selected run.</CardDescription>
          </div>
          {latestReceipt ? (
            <div className="rounded-sm border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
              <div className="font-mono text-xs text-cyan-100/80">{latestReceipt.id}</div>
              <div className="mt-2 text-sm text-white/70">{latestReceipt.note ?? latestReceipt.type ?? 'Receipt recorded'}</div>
              {latestReceipt.evidenceLink && <div className="mt-2 break-all text-xs text-green-200">{latestReceipt.evidenceLink}</div>}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-white/[0.12] p-3 text-sm text-white/45">No receipt selected yet.</div>
          )}

          {activeItem?.contextPack.evidenceLinks.map((link) => (
            <div key={link} className="rounded-sm border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-200">
              Evidence: {link}
            </div>
          ))}
          {activeItem?.blockers.map((blocker) => (
            <div key={blocker} className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              Blocker: {blocker}
            </div>
          ))}
        </Card>
      </aside>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'warning' | 'info' }) {
  const toneClass = tone === 'warning' ? 'text-amber-200' : tone === 'info' ? 'text-sky-200' : 'text-white/85'
  return (
    <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-3">
      <div className="text-xs text-white/40">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  )
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="bordered" padding="lg" className="h-full">
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 space-y-3">{children}</div>
    </Card>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-2 text-sm last:border-0">
      <span className="text-white/42">{label}</span>
      <span className="text-right text-white/80">{value}</span>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-2 line-clamp-2 text-sm text-white/78">{value}</div>
    </div>
  )
}

function StatusPill({ status, label }: { status: string; label?: string }) {
  const color =
    status.includes('blocked')
      ? 'border-red-400/30 bg-red-500/10 text-red-200'
      : status.includes('approval') || status.includes('waiting')
        ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
        : status.includes('running') || status.includes('ready')
          ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
          : status.includes('completed')
            ? 'border-green-300/30 bg-green-400/10 text-green-100'
            : 'border-white/[0.12] bg-white/[0.04] text-white/60'

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${color}`}>
      {label ?? STATUS_LABELS[status] ?? status.replaceAll('_', ' ')}
    </span>
  )
}
