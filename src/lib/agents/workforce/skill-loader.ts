/**
 * Skill Loader — Runtime Skill Parser & Manager (Workforce Engine)
 *
 * Parses `.claude/skills/` SKILL.md files at runtime, resolves dependencies,
 * and supports auto-invocation based on task keyword matching.
 *
 * Implements the priority system from `.claude/skills/FRAMEWORK.md`:
 * - Priority 1: Auto-load for every invocation
 * - Priority 2: On-demand, loaded when task keywords match
 * - Priority 3: Manual, loaded by explicit request
 * - Priority 4: Deprecated, never loaded
 *
 * @module lib/agents/workforce/skill-loader
 */

import * as fs from 'fs';
import * as path from 'path';

import type { SkillManifest, LoadedSkill } from './types';

// ============================================================================
// YAML Frontmatter Parser (lightweight, no external dependency)
// ============================================================================

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

/**
 * Parse simple YAML frontmatter from a SKILL.md file.
 * Handles strings, numbers, booleans, and simple arrays.
 */
function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    return { meta: {}, body: raw };
  }

  const [, yamlBlock, body] = match;
  const meta: Record<string, unknown> = {};

  const lines = yamlBlock.split('\n');
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of lines) {
    // Array item: "  - value"
    const arrayMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrayMatch && currentKey && currentArray) {
      currentArray.push(arrayMatch[1].trim());
      continue;
    }

    // If we were collecting an array and hit a non-array line, save it
    if (currentArray && currentKey) {
      meta[currentKey] = currentArray;
      currentArray = null;
      currentKey = null;
    }

    // Key-value pair: "key: value"
    const kvMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const [, key, rawValue] = kvMatch;
      const value = rawValue.trim();

      // Empty value followed by array items
      if (value === '' || value === '[]') {
        currentKey = key;
        currentArray = [];
        if (value === '[]') {
          meta[key] = [];
          currentKey = null;
          currentArray = null;
        }
        continue;
      }

      // Inline array: [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        const items = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        meta[key] = items;
        continue;
      }

      // Boolean
      if (value === 'true') { meta[key] = true; continue; }
      if (value === 'false') { meta[key] = false; continue; }

      // Number
      if (/^\d+(\.\d+)?$/.test(value)) {
        meta[key] = Number(value);
        continue;
      }

      // String (strip surrounding quotes)
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  // Flush any trailing array
  if (currentArray && currentKey) {
    meta[currentKey] = currentArray;
  }

  return { meta, body: body.trim() };
}

/**
 * Convert raw parsed metadata to a SkillManifest.
 */
function toSkillManifest(meta: Record<string, unknown>, filePath: string): SkillManifest {
  return {
    name: (meta.name as string) || path.basename(path.dirname(filePath)),
    description: (meta.description as string) || '',
    category: (meta.category as string) || undefined,
    priority: (typeof meta.priority === 'number' ? meta.priority : 3) as 1 | 2 | 3 | 4,
    version: (meta.version as string) || '1.0.0',
    status: (meta.status as 'active' | 'deprecated') || 'active',
    dependencies: (meta.dependencies as string[]) || [],
    autoLoadFor: (meta.auto_load_for as string[]) || (meta.autoLoadFor as string[]) || [],
    compatibleAgents: (meta.compatible_agents as string[]) || (meta.compatibleAgents as string[]) || [],
    estimatedTokens: (typeof meta.estimated_tokens === 'number' ? meta.estimated_tokens : 0) ||
      (typeof meta.estimatedTokens === 'number' ? meta.estimatedTokens : 0),
  };
}

// ============================================================================
// Skill Loader
// ============================================================================

/**
 * Default skills root directory (relative to project root).
 */
const DEFAULT_SKILLS_ROOT = path.resolve(process.cwd(), '.claude', 'skills');

export class SkillLoader {
  private cache: Map<string, LoadedSkill> = new Map();
  private skillIndex: Map<string, SkillManifest> = new Map();
  private skillPaths: Map<string, string> = new Map(); // name -> filePath
  private readonly skillsRoot: string;

  constructor(skillsRoot?: string) {
    this.skillsRoot = skillsRoot || DEFAULT_SKILLS_ROOT;
  }

  /**
   * Parse a single SKILL.md file and return a LoadedSkill.
   */
  async parseSkillFile(filePath: string): Promise<LoadedSkill> {
    // Check cache first
    const cached = this.cache.get(filePath);
    if (cached) return cached;

    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const manifest = toSkillManifest(meta, filePath);
    const tokenCount = Math.ceil(body.length / 4);

    const skill: LoadedSkill = {
      manifest,
      content: body,
      filePath,
      dependenciesResolved: manifest.dependencies.length === 0,
      loadedAt: new Date().toISOString(),
      tokenCount: manifest.estimatedTokens || tokenCount,
    };

    this.cache.set(filePath, skill);
    return skill;
  }

  /**
   * Scan .claude/skills/ directory and build the skill index.
   * Returns the complete skill manifest map.
   */
  async buildIndex(): Promise<Map<string, SkillManifest>> {
    this.skillIndex.clear();
    this.skillPaths.clear();

    await this.scanDirectory(this.skillsRoot);

    return new Map(this.skillIndex);
  }

  /**
   * Recursively scan a directory for SKILL.md files.
   */
  private async scanDirectory(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      // Directory doesn't exist or can't be read
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.name === 'SKILL.md' || entry.name.endsWith('.skill.md')) {
        try {
          const skill = await this.parseSkillFile(fullPath);
          this.skillIndex.set(skill.manifest.name, skill.manifest);
          this.skillPaths.set(skill.manifest.name, fullPath);
        } catch {
          // Skip unparseable skill files
          console.warn(`[SkillLoader] Failed to parse: ${fullPath}`);
        }
      }
    }
  }

  /**
   * Load all skills at a given priority level.
   */
  async loadByPriority(priority: 1 | 2 | 3 | 4): Promise<LoadedSkill[]> {
    const skills: LoadedSkill[] = [];

    for (const [name, manifest] of this.skillIndex) {
      if (manifest.priority === priority && manifest.status === 'active') {
        const filePath = this.skillPaths.get(name);
        if (filePath) {
          const skill = await this.parseSkillFile(filePath);
          skills.push(skill);
        }
      }
    }

    return skills;
  }

  /**
   * Find skills whose autoLoadFor keywords match the task description.
   * Returns skills sorted by priority (lowest number first).
   */
  async matchSkillsForTask(taskDescription: string): Promise<LoadedSkill[]> {
    const taskLower = taskDescription.toLowerCase();
    const taskWords = new Set(taskLower.split(/\s+/).filter((w) => w.length > 2));
    const matched: LoadedSkill[] = [];

    for (const [name, manifest] of this.skillIndex) {
      if (manifest.status !== 'active') continue;
      if (manifest.priority === 4) continue; // Skip deprecated

      // Check autoLoadFor keywords
      const hasMatch = manifest.autoLoadFor.some((keyword) => {
        const keyLower = keyword.toLowerCase();
        return taskLower.includes(keyLower) || taskWords.has(keyLower);
      });

      // Also match on skill name and description
      const nameMatch = taskLower.includes(name.toLowerCase());
      const descMatch = manifest.description
        ? taskLower.includes(manifest.description.toLowerCase().split(' ')[0])
        : false;

      if (hasMatch || nameMatch || descMatch) {
        const filePath = this.skillPaths.get(name);
        if (filePath) {
          const skill = await this.parseSkillFile(filePath);
          matched.push(skill);
        }
      }
    }

    // Sort by priority (1 first, then 2, then 3)
    return matched.sort((a, b) => a.manifest.priority - b.manifest.priority);
  }

  /**
   * Load a specific skill by name, resolving its dependencies.
   */
  async loadSkill(skillName: string): Promise<LoadedSkill> {
    const filePath = this.skillPaths.get(skillName);
    if (!filePath) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const skill = await this.parseSkillFile(filePath);

    // Resolve dependencies
    if (skill.manifest.dependencies.length > 0) {
      await this.resolveDependencies([skill]);
    }

    return skill;
  }

  /**
   * Resolve the dependency tree for a set of skills using topological sort.
   * Detects circular dependencies.
   */
  async resolveDependencies(
    skills: LoadedSkill[],
    visited: Set<string> = new Set(),
    inStack: Set<string> = new Set()
  ): Promise<LoadedSkill[]> {
    const resolved: LoadedSkill[] = [];

    for (const skill of skills) {
      const name = skill.manifest.name;

      if (inStack.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      if (visited.has(name)) continue;

      visited.add(name);
      inStack.add(name);

      // Load dependencies first
      for (const depPath of skill.manifest.dependencies) {
        // Extract skill name from dependency path
        const depName = path.basename(depPath, '.skill.md').replace('/SKILL', '');
        const depFilePath = this.skillPaths.get(depName);
        if (depFilePath) {
          const depSkill = await this.parseSkillFile(depFilePath);
          const depResolved = await this.resolveDependencies([depSkill], visited, inStack);
          resolved.push(...depResolved);
        }
      }

      inStack.delete(name);
      skill.dependenciesResolved = true;
      resolved.push(skill);
    }

    // De-duplicate (keep first occurrence)
    const seen = new Set<string>();
    return resolved.filter((s) => {
      if (seen.has(s.manifest.name)) return false;
      seen.add(s.manifest.name);
      return true;
    });
  }

  /**
   * Load skills required by a specific agent (from agent.md skills_required).
   */
  async loadForAgent(agentId: string): Promise<LoadedSkill[]> {
    const skills: LoadedSkill[] = [];

    // Find skills that list this agent in compatibleAgents
    for (const [name, manifest] of this.skillIndex) {
      if (manifest.status !== 'active') continue;
      if (manifest.priority === 4) continue;

      if (
        manifest.compatibleAgents.length === 0 || // Compatible with all
        manifest.compatibleAgents.includes(agentId) ||
        manifest.compatibleAgents.includes('*')
      ) {
        // Only auto-load Priority 1 skills for agents
        if (manifest.priority === 1) {
          const filePath = this.skillPaths.get(name);
          if (filePath) {
            const skill = await this.parseSkillFile(filePath);
            skills.push(skill);
          }
        }
      }
    }

    // Also load the agent's own skill if it exists (e.g., "email-agent" → email-agent/SKILL.md)
    const agentSkillPath = this.skillPaths.get(agentId);
    if (agentSkillPath) {
      const agentSkill = await this.parseSkillFile(agentSkillPath);
      if (!skills.find((s) => s.manifest.name === agentSkill.manifest.name)) {
        skills.push(agentSkill);
      }
    }

    return skills;
  }

  /**
   * Calculate total token budget for a set of loaded skills.
   */
  getTokenBudget(skills: LoadedSkill[]): number {
    return skills.reduce((sum, s) => sum + s.tokenCount, 0);
  }

  /**
   * Get a cached skill (no reload from disk).
   */
  getCached(skillName: string): LoadedSkill | undefined {
    const filePath = this.skillPaths.get(skillName);
    return filePath ? this.cache.get(filePath) : undefined;
  }

  /**
   * Get the full skill index.
   */
  getIndex(): Map<string, SkillManifest> {
    return new Map(this.skillIndex);
  }

  /**
   * Clear the cache (for hot reload).
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get count of indexed skills.
   */
  get skillCount(): number {
    return this.skillIndex.size;
  }

  /**
   * Get counts by priority level.
   */
  getCountsByPriority(): Record<number, number> {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const manifest of this.skillIndex.values()) {
      counts[manifest.priority] = (counts[manifest.priority] || 0) + 1;
    }
    return counts;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const skillLoader = new SkillLoader();
