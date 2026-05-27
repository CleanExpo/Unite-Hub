import type { MargotActionClass } from './decision-router'

export type DeployState = 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | 'UNKNOWN'
export type GateState = 'pass' | 'fail' | 'unknown'

export interface RoadmapItem {
  id: string
  title: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  hasOwner: boolean
  hasNextAction: boolean
  hasEvidence: boolean
  includesOperatingBrainContext?: boolean
}

export interface OperatingBrainHealthSnapshot {
  deployState: DeployState
  sandboxEnvReady: boolean
  localGates: {
    lint: GateState
    typeCheck: GateState
    test: GateState
  }
  staleTaskCount: number
  integrationHealth: GateState
  secondBrainSyncReady: boolean
  roadmapItems: RoadmapItem[]
}

export interface OnePercentImprovement {
  title: string
  priority: RoadmapItem['priority']
  actionClass: MargotActionClass
  requiresApproval: boolean
  owner: 'Margot' | 'Hermes' | 'Pi-Dev-Ops' | 'Senior PM' | 'Board'
  evidenceRequired: string[]
  rationale: string
  nextAction: string
}

export function chooseNextOnePercentImprovement(
  snapshot: OperatingBrainHealthSnapshot,
): OnePercentImprovement {
  if (snapshot.deployState !== 'READY' || !snapshot.sandboxEnvReady) {
    return {
      title: 'Stabilize unite-hub-sandbox deploy gate',
      priority: 'P0',
      actionClass: 'ask_board',
      requiresApproval: true,
      owner: 'Pi-Dev-Ops',
      evidenceRequired: ['Vercel project binding', 'Required env var presence check', 'Latest deploy READY state'],
      rationale: 'Deploy health is the first gate because feature work should not pile onto a broken delivery lane.',
      nextAction: 'Prepare an approval-gated Vercel remediation brief; do not mutate env vars without approval.',
    }
  }

  const failingGate = Object.entries(snapshot.localGates).find(([, state]) => state === 'fail')
  if (failingGate) {
    return {
      title: `Repair failing local ${failingGate[0]} gate`,
      priority: 'P0',
      actionClass: 'delegate',
      requiresApproval: false,
      owner: 'Hermes',
      evidenceRequired: [`pnpm run ${gateScriptName(failingGate[0])}`, 'Files touched', 'Remaining risk'],
      rationale: 'A failing local gate blocks trustworthy automation and release readiness.',
      nextAction: `Assign a scoped fix for the ${failingGate[0]} gate and require the command output as evidence.`,
    }
  }

  const unreadyCriticalItem = snapshot.roadmapItems.find(
    (item) =>
      item.priority === 'P1' &&
      item.status !== 'done' &&
      (!item.hasOwner || !item.hasNextAction || !item.hasEvidence || !item.includesOperatingBrainContext),
  )
  if (unreadyCriticalItem) {
    return {
      title: `Triage ${unreadyCriticalItem.id}: ${unreadyCriticalItem.title}`,
      priority: 'P1',
      actionClass: 'draft',
      requiresApproval: false,
      owner: 'Senior PM',
      evidenceRequired: ['Owner', 'Status', 'Blocker', 'Next action', 'Operating Brain context'],
      rationale: 'Active roadmap items must carry Hermes/Pi-Dev-Ops context instead of becoming side projects.',
      nextAction: `Update ${unreadyCriticalItem.id} with owner, blocker, next action, evidence, and Operating Brain dependency.`,
    }
  }

  if (!snapshot.secondBrainSyncReady) {
    return {
      title: 'Repair 2nd Brain update path',
      priority: 'P1',
      actionClass: 'auto_execute',
      requiresApproval: false,
      owner: 'Margot',
      evidenceRequired: ['Canonical memory location', 'No-secret storage rule', 'Linked playbook or repo doc'],
      rationale: 'The Operating Brain needs a durable memory path before recurring ticks can learn safely.',
      nextAction: 'Document the current repo-doc path and Hermes wiki handoff without introducing a semantic store yet.',
    }
  }

  if (snapshot.staleTaskCount > 0 || snapshot.integrationHealth !== 'pass') {
    return {
      title: 'Refresh stale delivery and integration health',
      priority: 'P2',
      actionClass: 'delegate',
      requiresApproval: false,
      owner: 'Pi-Dev-Ops',
      evidenceRequired: ['Stale task list', 'Integration health summary', 'Digest item'],
      rationale: 'Stale tasks and unknown integrations create hidden drag in the command cockpit.',
      nextAction: 'Create a bounded health review task and record the evidence in Margot digest format.',
    }
  }

  return {
    title: 'Run routine Operating Brain evidence tick',
    priority: 'P3',
    actionClass: 'auto_execute',
    requiresApproval: false,
    owner: 'Hermes',
    evidenceRequired: ['Decision', 'Evidence', 'Tests', 'Files touched', 'Remaining risk', 'Next 1%'],
    rationale: 'All hard gates are healthy, so Hermes can make the safest verified incremental improvement.',
    nextAction: 'Pick the smallest reversible improvement, verify it, and update Margot command-center evidence.',
  }
}

function gateScriptName(gate: string): string {
  if (gate === 'typeCheck') {
    return 'type-check'
  }

  return gate
}
