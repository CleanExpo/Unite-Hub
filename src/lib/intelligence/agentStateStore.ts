/**
 * Agent State Store
 *
 * Maintains real-time state of all agents including health, status, and workload.
 * Used by the meta-reasoner to make global decisions.
 */

export type AgentStatus = 'idle' | 'running' | 'degraded' | 'error';

export interface AgentState {
  id: string;
  agent: string;
  status: AgentStatus;
  lastActivityAt: string;
  healthScore: number; // 0–100
  activeWorkflows: number;
  errorCount?: number;
  lastError?: string | null;
  cpuUsage?: number; // percentage
  memoryUsage?: number; // percentage
}

// In-memory state store (would use database in production)
let agentStates: Record<string, AgentState> = {};

/**
 * Update or create agent state
 */
export function updateAgentState(update: {
  agent: string;
  status?: AgentStatus;
  healthScore?: number;
  activeWorkflows?: number;
  errorCount?: number;
  lastError?: string | null;
  cpuUsage?: number;
  memoryUsage?: number;
}): AgentState {
  const existing = agentStates[update.agent];
  const now = new Date().toISOString();

  const state: AgentState = {
    id: existing?.id ?? crypto.randomUUID(),
    agent: update.agent,
    status: update.status ?? existing?.status ?? 'idle',
    lastActivityAt: now,
    healthScore: update.healthScore ?? existing?.healthScore ?? 100,
    activeWorkflows: update.activeWorkflows ?? existing?.activeWorkflows ?? 0,
    errorCount: update.errorCount ?? existing?.errorCount ?? 0,
    lastError: update.lastError !== undefined ? update.lastError : (existing?.lastError ?? null),
    cpuUsage: update.cpuUsage ?? existing?.cpuUsage,
    memoryUsage: update.memoryUsage ?? existing?.memoryUsage,
  };

  agentStates[update.agent] = state;
  return state;
}

/**
 * Get state for a specific agent
 */
export function getAgentState(agent: string): AgentState | null {
  return agentStates[agent] ?? null;
}

/**
 * List all agent states
 */
export function listAgentStates(): AgentState[] {
  return Object.values(agentStates).sort((a, b) => a.agent.localeCompare(b.agent));
}

/**
 * Get agents with health issues
 */
export function getUnhealthyAgents(minHealthScore = 70): AgentState[] {
  return Object.values(agentStates)
    .filter(s => s.healthScore < minHealthScore || s.status === 'degraded' || s.status === 'error')
    .sort((a, b) => a.healthScore - b.healthScore);
}

/**
 * Get system health summary
 */
export function getSystemHealthSummary() {
  const states = Object.values(agentStates);
  if (states.length === 0) {
return null;
}

  const avgHealth = states.reduce((sum, s) => sum + s.healthScore, 0) / states.length;
  const totalWorkflows = states.reduce((sum, s) => sum + s.activeWorkflows, 0);
  const errorAgents = states.filter(s => s.status === 'error').length;
  const degradedAgents = states.filter(s => s.status === 'degraded').length;

  return {
    systemHealth: avgHealth,
    totalActiveWorkflows: totalWorkflows,
    agentCount: states.length,
    healthyAgents: states.length - errorAgents - degradedAgents,
    degradedAgents,
    errorAgents,
    avgCpuUsage: states.filter(s => s.cpuUsage !== undefined).length > 0
      ? states.filter(s => s.cpuUsage !== undefined).reduce((sum, s) => sum + (s.cpuUsage ?? 0), 0) /
        states.filter(s => s.cpuUsage !== undefined).length
      : undefined,
    avgMemoryUsage: states.filter(s => s.memoryUsage !== undefined).length > 0
      ? states.filter(s => s.memoryUsage !== undefined).reduce((sum, s) => sum + (s.memoryUsage ?? 0), 0) /
        states.filter(s => s.memoryUsage !== undefined).length
      : undefined,
  };
}

/**
 * Reset an agent state
 */
export function resetAgentState(agent: string): AgentState {
  const existing = agentStates[agent];
  const state: AgentState = {
    id: existing?.id ?? crypto.randomUUID(),
    agent,
    status: 'idle',
    lastActivityAt: new Date().toISOString(),
    healthScore: 100,
    activeWorkflows: 0,
    errorCount: 0,
    lastError: null,
  };
  agentStates[agent] = state;
  return state;
}

/**
 * Clear all agent states
 */
export function clearAllAgentStates(): void {
  agentStates = {};
}
