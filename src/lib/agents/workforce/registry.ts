/**
 * Workforce Registry (Workforce Engine)
 *
 * Unified registry of all skills, agents, hooks, and their relationships.
 * Wraps and extends `unified-registry.ts` — does not replace it.
 * Adds skill and hook dimensions to capability matching.
 *
 * @module lib/agents/workforce/registry
 */

import type { AgentCard } from '../protocol';
import { validateAgentCard } from '../protocol';
import {
  getAgent,
  getAgentCard,
  getAllAgentCards,
  routeTask,
  type AgentDefinition,
  type UnifiedAgentId,
} from '../unified-registry';
import type { SkillManifest, HookDefinition, LoadedSkill } from './types';
import { skillLoader } from './skill-loader';
import { hookSystem } from './hooks';

// ============================================================================
// Types
// ============================================================================

/**
 * A matched capability combining agent + skills.
 */
export interface WorkforceCapability {
  /** Capability ID */
  id: string;
  /** Agent that provides this capability */
  agentId: string;
  /** Skills that support this capability */
  skillIds: string[];
  /** Keywords for capability matching */
  keywords: string[];
  /** Combined confidence score (0-1) */
  confidence: number;
}

/**
 * Full workforce status snapshot.
 */
export interface WorkforceStatus {
  agents: {
    total: number;
    active: number;
    idle: number;
    busy: number;
    degraded: number;
    offline: number;
  };
  skills: {
    total: number;
    loaded: number;
    byPriority: Record<number, number>;
  };
  hooks: {
    total: number;
    enabled: number;
    byPhase: Record<string, number>;
  };
  memory: {
    workspaceEntries: number;
    agentEntries: number;
    sessionEntries: number;
  };
}

/**
 * Result of matching a task to the best agent+skills combination.
 */
export interface WorkforceMatch {
  agentId: string;
  confidence: number;
  skills: string[];
  hooks: string[];
  reasoning: string;
}

// ============================================================================
// Workforce Registry
// ============================================================================

export class WorkforceRegistry {
  private capabilityIndex: WorkforceCapability[] = [];
  private initialized = false;

  /**
   * Initialize the registry: scan skills, validate agents, register default hooks.
   */
  async initialize(workspaceId: string): Promise<WorkforceStatus> {
    // 1. Build skill index
    await skillLoader.buildIndex();

    // 2. Validate all agent cards
    const cards = getAllAgentCards();
    const validationErrors: string[] = [];
    for (const card of cards) {
      const result = validateAgentCard(card);
      if (!result.valid) {
        validationErrors.push(...result.errors.map((e) => `[${card.id}] ${e}`));
      }
    }

    if (validationErrors.length > 0) {
      console.warn('[WorkforceRegistry] Agent card validation warnings:', validationErrors);
    }

    // 3. Build capability index
    this.buildCapabilityIndex(cards);

    this.initialized = true;

    // 4. Return status
    return this.getStatus();
  }

  /**
   * Build the capability index from agent cards and skills.
   */
  private buildCapabilityIndex(cards: AgentCard[]): void {
    this.capabilityIndex = [];

    for (const card of cards) {
      for (const capability of card.capabilities) {
        // Find skills that match this capability
        const matchingSkills: string[] = [];
        const skillIndex = skillLoader.getIndex();

        for (const [skillName, manifest] of skillIndex) {
          if (manifest.status !== 'active') continue;

          // Check if skill is compatible with this agent
          const isCompatible =
            manifest.compatibleAgents.length === 0 ||
            manifest.compatibleAgents.includes(card.id) ||
            manifest.compatibleAgents.includes('*');

          if (isCompatible) {
            // Check keyword overlap between capability and skill
            const capKeywords = new Set(capability.keywords.map((k) => k.toLowerCase()));
            const hasOverlap = manifest.autoLoadFor.some((k) =>
              capKeywords.has(k.toLowerCase())
            );

            if (hasOverlap || skillName.includes(card.id)) {
              matchingSkills.push(skillName);
            }
          }
        }

        this.capabilityIndex.push({
          id: capability.name,
          agentId: card.id,
          skillIds: matchingSkills,
          keywords: capability.keywords,
          confidence: capability.confidence,
        });
      }
    }
  }

  // --- Agent Operations ---

  /**
   * Get Agent Card (delegates to unified-registry).
   */
  getAgentCard(agentId: string): AgentCard {
    return getAgentCard(agentId as UnifiedAgentId);
  }

  /**
   * Get Agent Definition (delegates to unified-registry).
   */
  getAgentDefinition(agentId: string): AgentDefinition {
    return getAgent(agentId as UnifiedAgentId);
  }

  /**
   * Find agents capable of handling a task, scored by relevance.
   */
  findCapableAgents(taskDescription: string): WorkforceCapability[] {
    const taskLower = taskDescription.toLowerCase();
    const taskWords = new Set(
      taskLower.split(/\s+/).filter((w) => w.length > 2)
    );

    const scored = this.capabilityIndex
      .map((cap) => {
        // Score based on keyword overlap
        const matchCount = cap.keywords.filter(
          (k) => taskLower.includes(k.toLowerCase()) || taskWords.has(k.toLowerCase())
        ).length;

        const score =
          matchCount > 0
            ? (matchCount / cap.keywords.length) * cap.confidence
            : 0;

        return { ...cap, confidence: score };
      })
      .filter((cap) => cap.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence);

    // De-duplicate by agentId (keep highest confidence per agent)
    const seen = new Set<string>();
    return scored.filter((cap) => {
      if (seen.has(cap.agentId)) return false;
      seen.add(cap.agentId);
      return true;
    });
  }

  /**
   * Match a task description to the best agent+skills combination.
   * Primary entry point for the Workforce Orchestrator.
   */
  matchWorkforce(taskDescription: string): WorkforceMatch {
    // Use unified registry routing as the baseline
    const routedAgentId = routeTask(taskDescription);

    // Enhance with capability index
    const capabilities = this.findCapableAgents(taskDescription);
    const bestCap = capabilities[0];

    // Determine which agent to use
    const agentId = bestCap?.agentId || routedAgentId;
    const confidence = bestCap?.confidence || 0.5;

    // Collect skills for this agent and task
    const agentSkills = this.getAgentSkills(agentId);
    const taskSkills = this.searchSkills(taskDescription);
    const allSkillIds = [
      ...new Set([
        ...agentSkills.map((s) => s.name),
        ...taskSkills.map((s) => s.name),
        ...(bestCap?.skillIds || []),
      ]),
    ];

    // Collect hooks for this agent
    const agentHooks = hookSystem.getHooksForAgent(agentId);
    const hookIds = agentHooks.map((h) => h.id);

    return {
      agentId,
      confidence,
      skills: allSkillIds,
      hooks: hookIds,
      reasoning: bestCap
        ? `Matched capability "${bestCap.id}" with ${confidence.toFixed(2)} confidence. ` +
          `${allSkillIds.length} skills, ${hookIds.length} hooks available.`
        : `Routed to ${agentId} via unified registry. ` +
          `${allSkillIds.length} skills, ${hookIds.length} hooks available.`,
    };
  }

  // --- Skill Operations ---

  /**
   * Get skills compatible with a specific agent.
   */
  getAgentSkills(agentId: string): SkillManifest[] {
    const results: SkillManifest[] = [];
    const skillIndex = skillLoader.getIndex();

    for (const [, manifest] of skillIndex) {
      if (manifest.status !== 'active') continue;
      if (
        manifest.compatibleAgents.length === 0 ||
        manifest.compatibleAgents.includes(agentId) ||
        manifest.compatibleAgents.includes('*')
      ) {
        results.push(manifest);
      }
    }

    return results;
  }

  /**
   * Get a skill manifest by name.
   */
  getSkill(skillName: string): SkillManifest | undefined {
    return skillLoader.getIndex().get(skillName);
  }

  /**
   * Search skills by keyword matching.
   */
  searchSkills(query: string): SkillManifest[] {
    const queryLower = query.toLowerCase();
    const results: SkillManifest[] = [];
    const skillIndex = skillLoader.getIndex();

    for (const [, manifest] of skillIndex) {
      if (manifest.status !== 'active') continue;

      const nameMatch = manifest.name.toLowerCase().includes(queryLower);
      const descMatch = manifest.description?.toLowerCase().includes(queryLower);
      const keywordMatch = manifest.autoLoadFor.some((k) =>
        queryLower.includes(k.toLowerCase())
      );

      if (nameMatch || descMatch || keywordMatch) {
        results.push(manifest);
      }
    }

    return results;
  }

  /**
   * Get all skills for a category.
   */
  getSkillsByCategory(category: string): SkillManifest[] {
    const results: SkillManifest[] = [];
    const skillIndex = skillLoader.getIndex();

    for (const [, manifest] of skillIndex) {
      if (manifest.category === category && manifest.status === 'active') {
        results.push(manifest);
      }
    }

    return results;
  }

  // --- Hook Operations ---

  /**
   * Get all hooks for an agent+phase combination.
   */
  getHooksFor(agentId: string, phase: string): HookDefinition[] {
    return hookSystem.getHooksForAgent(agentId).filter((h) => h.phase === phase);
  }

  // --- Status ---

  /**
   * Get full workforce status snapshot.
   */
  getStatus(): WorkforceStatus {
    const cards = getAllAgentCards();
    const stateCounts: Record<string, number> = {
      active: 0,
      idle: 0,
      busy: 0,
      degraded: 0,
      offline: 0,
    };

    for (const card of cards) {
      stateCounts[card.currentState] = (stateCounts[card.currentState] || 0) + 1;
    }

    return {
      agents: {
        total: cards.length,
        active: stateCounts.active || 0,
        idle: stateCounts.idle || 0,
        busy: stateCounts.busy || 0,
        degraded: stateCounts.degraded || 0,
        offline: stateCounts.offline || 0,
      },
      skills: {
        total: skillLoader.skillCount,
        loaded: skillLoader.skillCount, // All indexed = loaded into manifest
        byPriority: skillLoader.getCountsByPriority(),
      },
      hooks: {
        total: hookSystem.hookCount,
        enabled: hookSystem.listHooks().filter((h) => h.enabled).length,
        byPhase: hookSystem.getCountsByPhase(),
      },
      memory: {
        // Memory counts are async — provide placeholder
        // Call memoryManager.list() for accurate counts
        workspaceEntries: 0,
        agentEntries: 0,
        sessionEntries: 0,
      },
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const workforceRegistry = new WorkforceRegistry();
