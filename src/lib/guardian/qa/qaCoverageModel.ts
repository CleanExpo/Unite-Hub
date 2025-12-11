/**
 * Guardian I08: QA Coverage Model
 *
 * Defines risk classification, coverage scoring, and blind-spot detection logic.
 * Purely computational — no database writes.
 */

export type EntityType = 'rule' | 'playbook' | 'scenario' | 'regression_pack' | 'playbook_sim' | 'drill';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface QACoverageEntity {
  id: string;
  name: string;
  type: EntityType;
  metadata?: Record<string, unknown>;
}

export interface TestCoverageBreakdown {
  scenarios: number;
  regressionPacks: number;
  playbookSims: number;
  drills: number;
}

export interface CoverageItem {
  entity: QACoverageEntity;
  riskLevel: RiskLevel;
  coverageScore: number; // 0.0 - 1.0
  testCoverage: TestCoverageBreakdown;
  isBlindSpot: boolean;
  lastTestedAt?: Date;
  consecutiveUncoveredDays?: number;
}

export interface CoverageSnapshot {
  snapshotDate: Date;
  rulesCoverage: number;
  playbooksCoverage: number;
  scenariosCoverage: number;
  regressionPacksCoverage: number;
  playbookSimsCoverage: number;
  drillsCoverage: number;
  overallCoverage: number;
  criticalBlindSpots: number;
  highBlindSpots: number;
  mediumBlindSpots: number;
  items: CoverageItem[];
}

/**
 * Deterministic risk classification based on entity metadata
 */
export function classifyRisk(entity: QACoverageEntity): RiskLevel {
  const meta = entity.metadata || {};

  // Critical: System-critical, high-impact rules
  if (meta.is_critical === true || meta.scope === 'system_critical') {
    return 'critical';
  }

  // High: Cross-service, governance, or authentication rules
  if (
    meta.impact_scope === 'cross_service' ||
    meta.category === 'governance' ||
    meta.category === 'authentication'
  ) {
    return 'high';
  }

  // Medium: Service-scoped, operational rules
  if (meta.impact_scope === 'service' || meta.category === 'operational') {
    return 'medium';
  }

  // Low: Informational, single-component rules
  return 'low';
}

/**
 * Calculate coverage score for an entity
 * Score = min(testCount / targetTests, 1.0) * coverageWeight
 */
export function calculateCoverageScore(breakdown: TestCoverageBreakdown): number {
  const totalTests = breakdown.scenarios + breakdown.regressionPacks + breakdown.playbookSims + breakdown.drills;

  // Target: at least 2 test instances per entity
  const targetTests = 2;
  const rawScore = Math.min(totalTests / targetTests, 1.0);

  return rawScore;
}

/**
 * Determine if entity is a blind spot
 *
 * Blind spot = untested high-risk entity OR critical rule with <2 test instances
 */
export function isBlindSpot(entity: QACoverageEntity, breakdown: TestCoverageBreakdown, riskLevel: RiskLevel): boolean {
  const totalTests = breakdown.scenarios + breakdown.regressionPacks + breakdown.playbookSims + breakdown.drills;

  // Critical with insufficient coverage
  if (riskLevel === 'critical' && totalTests < 2) {
    return true;
  }

  // High-risk with zero coverage
  if (riskLevel === 'high' && totalTests === 0) {
    return true;
  }

  // Any entity completely untested and non-low-risk
  if (totalTests === 0 && riskLevel !== 'low') {
    return true;
  }

  return false;
}

/**
 * Calculate aggregate coverage by entity type
 */
export function aggregateCoverageBySector(items: CoverageItem[]): Record<EntityType, number> {
  const sectors: Record<EntityType, { total: number; covered: number }> = {
    rule: { total: 0, covered: 0 },
    playbook: { total: 0, covered: 0 },
    scenario: { total: 0, covered: 0 },
    regression_pack: { total: 0, covered: 0 },
    playbook_sim: { total: 0, covered: 0 },
    drill: { total: 0, covered: 0 },
  };

  items.forEach((item) => {
    sectors[item.entity.type].total += 1;
    sectors[item.entity.type].covered += item.coverageScore > 0 ? 1 : 0;
  });

  const result: Record<EntityType, number> = {} as Record<EntityType, number>;
  Object.entries(sectors).forEach(([type, { total, covered }]) => {
    result[type as EntityType] = total > 0 ? covered / total : 0;
  });

  return result;
}

/**
 * Calculate overall coverage score (weighted average)
 */
export function calculateOverallCoverage(sectorCoverage: Record<EntityType, number>): number {
  const weights: Record<EntityType, number> = {
    rule: 0.25,
    playbook: 0.2,
    scenario: 0.15,
    regression_pack: 0.15,
    playbook_sim: 0.15,
    drill: 0.1,
  };

  let weighted = 0;
  let totalWeight = 0;

  Object.entries(sectorCoverage).forEach(([type, coverage]) => {
    const weight = weights[type as EntityType] || 0;
    weighted += coverage * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weighted / totalWeight : 0;
}

/**
 * Detect blind spots by risk level
 */
export function countBlindSpotsByRisk(items: CoverageItem[]): { critical: number; high: number; medium: number } {
  return {
    critical: items.filter((i) => i.isBlindSpot && i.riskLevel === 'critical').length,
    high: items.filter((i) => i.isBlindSpot && i.riskLevel === 'high').length,
    medium: items.filter((i) => i.isBlindSpot && i.riskLevel === 'medium').length,
  };
}

/**
 * Generate coverage snapshot from entity list
 */
export function generateCoverageSnapshot(entities: QACoverageEntity[], now: Date): CoverageSnapshot {
  // Map entities to coverage items
  const items: CoverageItem[] = entities.map((entity) => {
    const riskLevel = classifyRisk(entity);
    const breakdown: TestCoverageBreakdown = {
      scenarios: 0,
      regressionPacks: 0,
      playbookSims: 0,
      drills: 0,
    };

    const coverageScore = calculateCoverageScore(breakdown);
    const blind = isBlindSpot(entity, breakdown, riskLevel);

    return {
      entity,
      riskLevel,
      coverageScore,
      testCoverage: breakdown,
      isBlindSpot: blind,
    };
  });

  // Calculate aggregate metrics
  const sectorCoverage = aggregateCoverageBySector(items);
  const overallCoverage = calculateOverallCoverage(sectorCoverage);
  const blindSpots = countBlindSpotsByRisk(items);

  return {
    snapshotDate: now,
    rulesCoverage: sectorCoverage.rule,
    playbooksCoverage: sectorCoverage.playbook,
    scenariosCoverage: sectorCoverage.scenario,
    regressionPacksCoverage: sectorCoverage.regression_pack,
    playbookSimsCoverage: sectorCoverage.playbook_sim,
    drillsCoverage: sectorCoverage.drill,
    overallCoverage,
    criticalBlindSpots: blindSpots.critical,
    highBlindSpots: blindSpots.high,
    mediumBlindSpots: blindSpots.medium,
    items,
  };
}
