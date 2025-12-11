/**
 * Guardian I06: Change Diff Collector
 *
 * Captures high-level diffs in Guardian rules, playbooks, and thresholds
 * for change impact analysis. Operates on read-only snapshots, no modifications.
 *
 * Diff format: { rules: {added, removed, modified}, playbooks: {...}, thresholds: {...} }
 * All identifiers only, no PII or raw payloads.
 */

export interface GuardianChangeDiff {
  rules?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  playbooks?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  thresholds?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  impactHints?: string[];
  raw?: Record<string, unknown>;
}

export interface GuardianRuleSnapshot {
  id: string;
  key: string;
  name?: string;
  severity?: string;
  enabled?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

export interface GuardianPlaybookSnapshot {
  id: string;
  key: string;
  name?: string;
  enabled?: boolean;
  triggers?: string[];
  actions?: string[];
  [key: string]: unknown;
}

export interface GuardianThresholdSnapshot {
  id?: string;
  key: string;
  name?: string;
  value?: number;
  severity?: string;
  [key: string]: unknown;
}

/**
 * Compare rule snapshots and classify changes as added/removed/modified
 * Only examines identifiers and key metadata (severity, enabled, tags)
 */
export function collectRuleDiff(
  beforeSnapshot: GuardianRuleSnapshot[],
  afterSnapshot: GuardianRuleSnapshot[]
): Partial<GuardianChangeDiff> {
  const beforeMap = new Map(beforeSnapshot.map((r) => [r.key, r]));
  const afterMap = new Map(afterSnapshot.map((r) => [r.key, r]));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  // Find added and modified
  for (const [key, after] of afterMap) {
    const before = beforeMap.get(key);
    if (!before) {
      added.push(key);
    } else if (
      before.severity !== after.severity ||
      before.enabled !== after.enabled ||
      JSON.stringify(before.tags) !== JSON.stringify(after.tags)
    ) {
      modified.push(key);
    }
  }

  // Find removed
  for (const key of beforeMap.keys()) {
    if (!afterMap.has(key)) {
      removed.push(key);
    }
  }

  return {
    rules: { added, removed, modified },
  };
}

/**
 * Compare playbook snapshots and classify changes
 */
export function collectPlaybookDiff(
  beforeSnapshot: GuardianPlaybookSnapshot[],
  afterSnapshot: GuardianPlaybookSnapshot[]
): Partial<GuardianChangeDiff> {
  const beforeMap = new Map(beforeSnapshot.map((p) => [p.key, p]));
  const afterMap = new Map(afterSnapshot.map((p) => [p.key, p]));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const [key, after] of afterMap) {
    const before = beforeMap.get(key);
    if (!before) {
      added.push(key);
    } else if (
      before.enabled !== after.enabled ||
      JSON.stringify(before.triggers) !== JSON.stringify(after.triggers) ||
      JSON.stringify(before.actions) !== JSON.stringify(after.actions)
    ) {
      modified.push(key);
    }
  }

  for (const key of beforeMap.keys()) {
    if (!afterMap.has(key)) {
      removed.push(key);
    }
  }

  return {
    playbooks: { added, removed, modified },
  };
}

/**
 * Compare threshold snapshots and classify changes
 */
export function collectThresholdDiff(
  beforeSnapshot: GuardianThresholdSnapshot[],
  afterSnapshot: GuardianThresholdSnapshot[]
): Partial<GuardianChangeDiff> {
  const beforeMap = new Map(beforeSnapshot.map((t) => [t.key, t]));
  const afterMap = new Map(afterSnapshot.map((t) => [t.key, t]));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const [key, after] of afterMap) {
    const before = beforeMap.get(key);
    if (!before) {
      added.push(key);
    } else if (
      before.value !== after.value ||
      before.severity !== after.severity
    ) {
      modified.push(key);
    }
  }

  for (const key of beforeMap.keys()) {
    if (!afterMap.has(key)) {
      removed.push(key);
    }
  }

  return {
    thresholds: { added, removed, modified },
  };
}

/**
 * Merge multiple diff categories into a single GuardianChangeDiff
 */
export function mergeDiffs(
  ...diffs: Partial<GuardianChangeDiff>[]
): GuardianChangeDiff {
  const merged: GuardianChangeDiff = {
    impactHints: [],
  };

  for (const diff of diffs) {
    if (diff.rules) {
      merged.rules = diff.rules;
    }
    if (diff.playbooks) {
      merged.playbooks = diff.playbooks;
    }
    if (diff.thresholds) {
      merged.thresholds = diff.thresholds;
    }
    if (diff.impactHints) {
      merged.impactHints = [...(merged.impactHints || []), ...diff.impactHints];
    }
    if (diff.raw) {
      merged.raw = diff.raw;
    }
  }

  return merged;
}

/**
 * Generate impact hints based on diff content
 * Helps classify the change (e.g., 'risk_threshold_change', 'new_high_severity_rule')
 */
export function generateImpactHints(diff: GuardianChangeDiff): string[] {
  const hints: string[] = [];

  if (diff.rules) {
    if (diff.rules.added.length > 0) {
      hints.push(`added_${diff.rules.added.length}_rules`);
    }
    if (diff.rules.removed.length > 0) {
      hints.push(`removed_${diff.rules.removed.length}_rules`);
    }
    if (diff.rules.modified.length > 0) {
      hints.push(`modified_${diff.rules.modified.length}_rules`);
    }
  }

  if (diff.playbooks) {
    if (diff.playbooks.added.length > 0) {
      hints.push('added_playbooks');
    }
    if (diff.playbooks.modified.length > 0) {
      hints.push('modified_playbooks');
    }
  }

  if (diff.thresholds) {
    if (diff.thresholds.modified.length > 0) {
      hints.push('threshold_changes');
    }
  }

  return hints;
}
