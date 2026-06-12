#!/usr/bin/env node
//
// scripts/cfo-gate-review.ts
//
// Lane spec'd in 2nd-brain/.agentic_nexus/HERMES_PROFILES_ORCHESTRATOR_ARCHITECTURE_2026-06-12.md
// Section "PR #X+2: nexus-cfo profile + gate-review packet generator"
//
// The CFO profile: takes an authority packet (or a flagged gate) and
// produces a typed "this gate can be safely lifted with these guardrails"
// packet for Phill's typed sign-off. This is the bounded gate-lift
// mechanism: the CFO cannot lift the gate itself; it produces a packet
// that Phill types yes/no on.
//
// Bounded: no secrets, no operator gates crossed, no writes to remote
// without ORCHESTRATOR_DECOMPOSE_OUTPUT=1 style guard.

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

const OUTPUT_DIR = '/Users/phillmcgurk/2nd-brain/.agentic_nexus/outputs/cfo-gate-review'

export interface GateReviewInput {
  /** The lane id (e.g. "12") or gate name being reviewed. */
  gate: string
  /** The original authority packet (markdown content). */
  packet: string
  /** Optional: a specific question Phill is asking. */
  question?: string
}

export interface GateLiftAssessment {
  can_lift: boolean
  guardrails: string[]
  blast_radius: 'NONE' | 'LOCAL' | 'NAMESPACE' | 'PROD'
  reversibility: 'TRIVIAL' | 'MODERATE' | 'EXPENSIVE'
  effort_to_undo: string
  audit_chain_impact: string
}

export interface GateReviewPacket {
  ran_at: string
  profile: 'nexus-cfo'
  input: { gate: string; question?: string; packet_chars: number }
  assessment: GateLiftAssessment
  recommendation: 'LIFT' | 'LIFT_WITH_GUARDRAILS' | 'KEEP_GATED' | 'NEED_MORE_INFO'
  packet: string
  decision_request: {
    question_to_phill: string
    type_options: string[]
    estimated_phill_time_seconds: number
  }
  evidence_references: string[]
  safety: {
    production_db_touched: false
    deployment_occurred: false
    secrets_accessed: false
    external_activation: false
    browser_or_computer_use: false
    destructive_action: false
  }
}

// ── Heuristic gate-lift assessment (bounded, no LLM) ─────────────────────

const GATE_KEYWORDS: Array<{ kw: RegExp; can_lift: boolean; blast: GateLiftAssessment['blast_radius']; guardrails: string[] }> = [
  {
    // Order matters: most-restrictive first. Move the rule with the widest
    // blast-radius (PROD) BEFORE the NAMESPACE rule, so a packet that
    // matches BOTH (e.g. "production authority AND deploy to prod") gets
    // classified as PROD, not NAMESPACE.
    kw: /production authority|prod.*deploy|rotate.*password|rotate.*key|sign in to 1password|read.*secret value|vercel env pull/i,
    can_lift: false,
    blast: 'PROD',
    guardrails: [
      'Signing in to 1Password as Phill is identity-bound; cannot be lifted without breaking the audit chain.',
      'Reading env var VALUES via Vercel env pull is identity-bound.',
      'Rotating keys requires Supabase dashboard access (operator-only).',
    ],
  },
  {
    kw: /email to (a |an )?(real )?client|client comm|publish to|deploy to prod|production authority|send (an? )?email|impersonat/i,
    can_lift: false,
    blast: 'NAMESPACE',
    guardrails: [
      'Client-facing comms are identity-bound; the agent impersonating Phill to a real client breaks trust.',
      'Production deploys require typed operator sign-off per §5B.',
      'Production authority grants are explicitly operator-only per the existing autonomous-loop contract.',
    ],
  },
  {
    kw: /read.*env.*name|read.*social_channels|read.*credentials_vault|kanban|ci.*re-?trigger|docs-only.*pr|re-trigger.*ci/i,
    can_lift: true,
    blast: 'NONE',
    guardrails: [
      'Read-only env var NAMES (no values): safe to lift; Vercel env ls returns names only by default.',
      'Read social_channels (founder-scoped) with redaction: safe to lift; existing RLS scopes the read.',
      'Read credentials_vault with redaction (provider + business_key + connected_at, no tokens): safe to lift; function returns name+date only.',
      'Post to kanban with typed context: safe to lift; the board provides audit.',
      'Re-trigger CI run with typed reason: safe to lift; no code change.',
      'Open docs-only PR: already lifted per §5A.',
    ],
  },
  {
    // This is the LAST rule; only reached if no other rule matched.
    // (We put the can_lift=false at the END so specific matches win first.)
    kw: /THIS_SHOULD_NEVER_MATCH_BUT_KEEPS_THE_TYPE_TIGHT/i,
    can_lift: false,
    blast: 'LOCAL',
    guardrails: ['Default assessment (no specific keywords matched). Recommend KEEP_GATED until more information.'],
  },
]

export function assessGate(packet: string): GateLiftAssessment {
  for (const { kw, can_lift, blast: blast_radius, guardrails } of GATE_KEYWORDS) {
    if (kw.test(packet)) {
      return {
        can_lift,
        guardrails,
        blast_radius,
        reversibility: can_lift ? 'TRIVIAL' : 'EXPENSIVE',
        effort_to_undo: can_lift ? 'N/A (read-only)' : 'Rotate keys + audit log review',
        audit_chain_impact: can_lift
          ? 'NONE — read-only operations preserve the agent-vs-operator distinction in the audit chain.'
          : 'HIGH — operator identity is load-bearing; lifting this gate collapses the audit chain.',
      }
    }
  }
  // Fallback for packets that don't match any of the specific rules.
  // The can_lift=false, blast='LOCAL' is the safe default.
  return {
    can_lift: false,
    guardrails: ['No keyword matched; treat as KEEP_GATED pending more info.'],
    blast_radius: 'LOCAL',
    reversibility: 'MODERATE',
    effort_to_undo: 'Unknown; needs Phill review.',
    audit_chain_impact: 'Unknown.',
  }
}

export function makeRecommendation(a: GateLiftAssessment): GateReviewPacket['recommendation'] {
  if (a.can_lift && a.blast_radius === 'NONE') return 'LIFT'
  if (a.can_lift && (a.blast_radius === 'LOCAL' || a.blast_radius === 'NAMESPACE')) return 'LIFT_WITH_GUARDRAILS'
  if (!a.can_lift) return 'KEEP_GATED'
  return 'NEED_MORE_INFO'
}

// ── Main ────────────────────────────────────────────────────────────────

export async function runCfoGateReview(input: GateReviewInput): Promise<GateReviewPacket> {
  const assessment = assessGate(input.packet)
  const recommendation = makeRecommendation(assessment)
  const question = input.question || `Can the "${input.gate}" gate be safely lifted?`

  const typeOptions = (() => {
    if (recommendation === 'LIFT') return ['yes (lift)', 'no (keep gated)', 'lift with: <specific guardrails>']
    if (recommendation === 'LIFT_WITH_GUARDRAILS')
      return ['yes (with the listed guardrails)', 'no (keep gated)', 'lift with: <modified guardrails>']
    if (recommendation === 'KEEP_GATED')
      return ['no (keep gated — my recommendation)', 'override: yes (I accept the audit chain risk)', 'reconsider: <new constraint>']
    return ['need more info: <what to look at>', 'keep gated for now', 'no (do not lift)']
  })()

  const packet: GateReviewPacket = {
    ran_at: new Date().toISOString(),
    profile: 'nexus-cfo',
    input: { gate: input.gate, question: input.question, packet_chars: input.packet.length },
    assessment,
    recommendation,
    packet: input.packet,
    decision_request: {
      question_to_phill: question,
      type_options: typeOptions,
      estimated_phill_time_seconds: typeOptions.length * 8, // ~8 sec per option to read + type
    },
    evidence_references: [
      '/Users/phillmcgurk/2nd-brain/.agentic_nexus/SPEC_FINISH_EVERYTHING_2026-06-12.md',
      '/Users/phillmcgurk/2nd-brain/.agentic_nexus/AUTONOMOUS_LOOP_CONTRACT.md',
      '/Users/phillmcgurk/2nd-brain/.agentic_nexus/HERMES_PROFILES_ORCHESTRATOR_ARCHITECTURE_2026-06-12.md',
    ],
    safety: {
      production_db_touched: false,
      deployment_occurred: false,
      secrets_accessed: false,
      external_activation: false,
      browser_or_computer_use: false,
      destructive_action: false,
    },
  }

  if (process.env.CFO_GATE_REVIEW_OUTPUT === '1') {
    await mkdir(OUTPUT_DIR, { recursive: true })
    const safeGate = input.gate.replace(/[^a-z0-9_-]/gi, '_')
    const path = join(OUTPUT_DIR, `${safeGate}-${Date.now()}.json`)
    await writeFile(path, JSON.stringify(packet, null, 2))
    packet.evidence_references.push(`Wrote packet to: ${path}`)
  }

  return packet
}

// CLI entrypoint
if (typeof process !== 'undefined' && process.env.CFO_GATE_REVIEW === '1') {
  const gate = process.argv[2] || ''
  const packetPath = process.argv[3] || ''
  if (!gate || !packetPath) {
    console.error('Usage: CFO_GATE_REVIEW=1 npx tsx scripts/cfo-gate-review.ts <gate> <packet.md path>')
    process.exit(2)
  }
  readFile(packetPath, 'utf-8')
    .then((packet) => runCfoGateReview({ gate, packet }))
    .then((p) => {
      console.log(JSON.stringify(p, null, 2))
      process.exit(0)
    })
    .catch((err: unknown) => {
      console.error(`[cfo-gate-review] ${err instanceof Error ? err.message : 'unknown'}`)
      process.exit(2)
    })
}
