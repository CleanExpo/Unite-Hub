/**
 * Agent Army — Commander registry + skill helpers
 *
 * Exports all commander configs and utility functions for agent lookup,
 * skill resolution, and model routing across the three-commander hierarchy.
 *
 * UNI-1446: Commander configs index
 */

export { COMMANDER_REVENUE } from './commanders/revenue';
export { COMMANDER_GROWTH }  from './commanders/growth';
export { COMMANDER_AUTHORITY } from './commanders/authority';

export type { RevenueSkillId }  from './commanders/revenue';
export type { GrowthSkillId }   from './commanders/growth';
export type { AuthoritySkillId } from './commanders/authority';

import { COMMANDER_REVENUE }   from './commanders/revenue';
import { COMMANDER_GROWTH }    from './commanders/growth';
import { COMMANDER_AUTHORITY } from './commanders/authority';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillConfig {
  id: string;
  name: string;
  model: string;
  schedule: string;
  description: string;
  outputTable: string;
  urgent: boolean;
  targets?: readonly string[];
}

export interface CommanderConfig {
  id: string;
  name: string;
  model: string;
  role: string;
  briefTime: string;
  colour: string;
  orchestrator: {
    id: string;
    model: string;
    role: string;
  };
  skills: readonly SkillConfig[];
}

// ---------------------------------------------------------------------------
// Commander registry
// ---------------------------------------------------------------------------

export const ALL_COMMANDERS: readonly CommanderConfig[] = [
  COMMANDER_REVENUE as unknown as CommanderConfig,
  COMMANDER_GROWTH  as unknown as CommanderConfig,
  COMMANDER_AUTHORITY as unknown as CommanderConfig,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns all skills across every commander as a flat array.
 */
export function getAllSkills(): SkillConfig[] {
  return ALL_COMMANDERS.flatMap((c) => c.skills as unknown as SkillConfig[]);
}

/**
 * Look up a skill by its ID across all commanders.
 * Returns undefined when not found.
 */
export function findSkillById(id: string): SkillConfig | undefined {
  return getAllSkills().find((s) => s.id === id);
}

/**
 * Look up a commander by skill ID.
 * Returns undefined when not found.
 */
export function findCommanderBySkillId(skillId: string): CommanderConfig | undefined {
  return ALL_COMMANDERS.find((c) =>
    (c.skills as unknown as SkillConfig[]).some((s) => s.id === skillId),
  );
}

/**
 * Look up a commander by its own ID.
 */
export function findCommanderById(id: string): CommanderConfig | undefined {
  return ALL_COMMANDERS.find((c) => c.id === id);
}

/**
 * Resolve the correct model string for an agent ID.
 * Commanders use sonnet-4-6; orchestrators and skills use haiku-4-5.
 */
export function resolveModel(agentId: string): string {
  const commander = findCommanderById(agentId);
  if (commander) return commander.model;

  // Check orchestrator IDs
  for (const c of ALL_COMMANDERS) {
    if (c.orchestrator.id === agentId) return c.orchestrator.model;
  }

  // Default to skill model
  const skill = findSkillById(agentId);
  return skill?.model ?? 'claude-haiku-4-5-20251001';
}
