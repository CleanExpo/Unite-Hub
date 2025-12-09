/**
 * Negotiation Client Utilities
 * Provides type-safe API communication for negotiation dashboard
 */

import type { NegotiationSession, AgentProposal, ConsensusScore, ArbitrationDecision } from '@/state/useNegotiationStore';

export async function fetchNegotiationStatus(
  workspaceId: string,
  accessToken: string
): Promise<{
  hasActiveNegotiation: boolean;
  session?: NegotiationSession;
  consensusBreakdown?: ConsensusScore[];
  recentDecisions?: ArbitrationDecision[];
}> {
  const response = await fetch(`/api/negotiation/status?workspaceId=${workspaceId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
throw new Error('Failed to fetch negotiation status');
}
  return response.json();
}

export async function startNegotiation(
  workspaceId: string,
  objective: string,
  participatingAgents: string[],
  proposals: Array<{
    agentId: string;
    action: string;
    confidence: number;
    riskScore: number;
    estimatedCost?: number;
    estimatedBenefit?: number;
    rationale?: string;
  }>,
  accessToken: string
): Promise<{
  success: boolean;
  session: NegotiationSession;
  consensusScores: ConsensusScore[];
  conflicts: Array<{ agentIds: string[]; conflictType: string; severity: number }>;
}> {
  const response = await fetch(`/api/negotiation/start?workspaceId=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      objective,
      participatingAgents,
      proposals,
    }),
  });

  if (!response.ok) {
throw new Error('Failed to start negotiation');
}
  return response.json();
}

export async function submitArbitrationDecision(
  workspaceId: string,
  sessionId: string,
  proposals: AgentProposal[],
  objective: string,
  accessToken: string
): Promise<{
  success: boolean;
  decision: ArbitrationDecision;
  rationale: string;
  alternatives: Array<{ agentId: string; action: string; score: number }>;
}> {
  const response = await fetch(`/api/negotiation/decision?workspaceId=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      sessionId,
      proposals,
      objective,
    }),
  });

  if (!response.ok) {
throw new Error('Failed to submit decision');
}
  return response.json();
}

export function formatConsensusPercentage(score: number): string {
  if (score >= 65) {
return `${score.toFixed(0)}% (Consensus)`;
}
  if (score >= 50) {
return `${score.toFixed(0)}% (Moderate)`;
}
  return `${score.toFixed(0)}% (Low)`;
}

export function getConsensusColor(score: number): string {
  if (score >= 65) {
return 'text-green-600 dark:text-green-400';
}
  if (score >= 50) {
return 'text-yellow-600 dark:text-yellow-400';
}
  return 'text-red-600 dark:text-red-400';
}

export function getRiskColor(riskScore: number): string {
  if (riskScore >= 80) {
return 'text-red-600 dark:text-red-400';
}
  if (riskScore >= 60) {
return 'text-orange-600 dark:text-orange-400';
}
  if (riskScore >= 40) {
return 'text-yellow-600 dark:text-yellow-400';
}
  return 'text-green-600 dark:text-green-400';
}

export function isSafetyVetoed(riskScore: number): boolean {
  return riskScore >= 80;
}
