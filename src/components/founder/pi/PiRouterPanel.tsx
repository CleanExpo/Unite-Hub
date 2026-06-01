'use client'

import { useState } from 'react'
import Card, { CardDescription, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { FounderContextPack, FounderTaskPacket, MachineAssignment } from '@/lib/founder-os'

interface PiRouteReceipt {
  id: string
  status: string
  generatedAt: string
  source: string
  requiresHumanApproval: boolean
  nextRecommendedAction: string
}

interface PiRouteResponse {
  taskPacket: FounderTaskPacket
  contextPack: FounderContextPack
  routingReasons: string[]
  machineAssignment: MachineAssignment
  receipt: PiRouteReceipt
}

const EXAMPLE_MESSAGE =
  'Build the Unite-Hub command centre panel for run queue visibility, then test it before moving to the next build.'

export function PiRouterPanel() {
  const [message, setMessage] = useState(EXAMPLE_MESSAGE)
  const [result, setResult] = useState<PiRouteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRouting, setIsRouting] = useState(false)

  async function routeMessage() {
    setIsRouting(true)
    setError(null)

    try {
      const response = await fetch('/api/pi/route', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to route founder message')
      }

      setResult(body)
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Unable to route founder message')
    } finally {
      setIsRouting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <Card variant="bordered" padding="lg" className="space-y-5">
        <div>
          <CardTitle>Founder command intake</CardTitle>
          <CardDescription>
            Type the non-coder instruction once. Pi converts it into a task packet, context pack, risk gate, agent lane, and machine assignment.
          </CardDescription>
        </div>

        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={8}
          className="bg-black/20 text-white/90"
          placeholder="Tell Pi what you want built, checked, researched, routed, or approved..."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={routeMessage} loading={isRouting} disabled={!message.trim()}>
            Route through Pi
          </Button>
          <span className="text-sm text-white/45">No execution starts here. This is the founder-safe routing gate.</span>
        </div>

        {error && <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      </Card>

      <Card variant="bordered" padding="lg" className="space-y-4">
        <div>
          <CardTitle>Senior-engineer guardrails</CardTitle>
          <CardDescription>Every routed task must carry scope, tests, evidence, approval state, and a clear next action.</CardDescription>
        </div>
        <ul className="space-y-3 text-sm text-white/65">
          <li>1. Classify portfolio and lane before build.</li>
          <li>2. Create durable context pack before execution.</li>
          <li>3. Assign the correct machine for the work.</li>
          <li>4. Gate high-risk/account/browser/finance work.</li>
          <li>5. Finish evidence before starting the next build.</li>
        </ul>
      </Card>

      {result && (
        <div className="lg:col-span-2 grid gap-4 lg:grid-cols-3">
          <ResultCard title="Task packet">
            <ResultRow label="Target" value={result.taskPacket.portfolioTarget} />
            <ResultRow label="Lane" value={result.taskPacket.lane} />
            <ResultRow label="Type" value={result.taskPacket.taskType} />
            <ResultRow label="Risk" value={result.taskPacket.riskLevel} />
            <ResultRow label="Agents" value={result.taskPacket.requiredAgents.join(', ')} />
          </ResultCard>

          <ResultCard title="Machine assignment">
            <ResultRow label="Status" value={result.machineAssignment.status} />
            <ResultRow label="Device" value={result.machineAssignment.assignedDeviceName ?? 'Waiting'} />
            <ResultRow label="Role" value={result.machineAssignment.assignedRole ?? 'Unassigned'} />
            <ResultRow label="Approval" value={result.receipt.requiresHumanApproval ? 'Required' : 'Not required'} />
          </ResultCard>

          <ResultCard title="Next action">
            <p className="text-sm text-white/80">{result.receipt.nextRecommendedAction}</p>
            <div className="mt-4 rounded-sm bg-white/[0.03] p-3 text-xs text-white/45">Receipt: {result.receipt.id}</div>
          </ResultCard>

          <Card variant="bordered" padding="lg" className="lg:col-span-3">
            <CardTitle>Context pack</CardTitle>
            <p className="mt-3 text-sm text-white/70">{result.contextPack.durableSummary}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.contextPack.constraints.map((constraint) => (
                <div key={constraint} className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-3 text-sm text-white/65">
                  {constraint}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="bordered" padding="lg">
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 space-y-3">{children}</div>
    </Card>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-2 text-sm last:border-0">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white/80">{value}</span>
    </div>
  )
}
