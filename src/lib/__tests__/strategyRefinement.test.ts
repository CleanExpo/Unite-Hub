/**
 * Strategy Refinement Unit Tests
 * Phase 11 Week 7-8: Tests for adaptive strategy refinement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create chainable mock with vi.hoisted
const { mockSupabaseInstance, mockGetSupabaseServer, resetMockChain } = vi.hoisted(() => {
  const queryResults: any[] = [];

  // The query builder is a separate thenable object returned by chain methods
  // The supabase client itself must NOT be thenable (no .then) or await will consume it
  const createQueryBuilder = (): any => {
    const builder: any = {};
    const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'range', 'match', 'not', 'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps'];
    chainMethods.forEach(m => { builder[m] = vi.fn().mockReturnValue(builder); });
    builder.single = vi.fn().mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    builder.maybeSingle = vi.fn().mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    builder.then = (resolve: any, reject?: any) => {
      const result = queryResults.shift() || { data: [], error: null };
      return Promise.resolve(resolve(result));
    };
    return builder;
  };

  const queryBuilder = createQueryBuilder();

  // The supabase client - NO .then property here to avoid thenable issues with await
  const mock: any = {
    _setResults: (results: any[]) => { queryResults.length = 0; queryResults.push(...results); },
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockReturnValue(queryBuilder),
    auth: { getUser: vi.fn(), getSession: vi.fn() },
  };

  // Also expose query builder methods on mock for direct access in tests
  Object.keys(queryBuilder).forEach(k => {
    if (k !== 'then') mock[k] = queryBuilder[k];
  });

  const mockGSS = vi.fn().mockResolvedValue(mock);
  const resetFn = () => {
    queryResults.length = 0;
    const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'range', 'match', 'not', 'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps'];
    chainMethods.forEach(m => { queryBuilder[m].mockReturnValue(queryBuilder); });
    mock.from.mockReturnValue(queryBuilder);
    queryBuilder.single.mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    queryBuilder.maybeSingle.mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    mockGSS.mockResolvedValue(mock);
  };
  return {
    mockSupabaseInstance: mock,
    mockGetSupabaseServer: mockGSS,
    resetMockChain: resetFn,
  };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: mockGetSupabaseServer,
  getSupabaseAdmin: vi.fn(),
  getSupabaseServerWithAuth: vi.fn(),
  supabase: { auth: { getUser: vi.fn(), getSession: vi.fn() }, from: vi.fn() },
  supabaseBrowser: { auth: { getUser: vi.fn(), getSession: vi.fn() }, from: vi.fn() },
  supabaseAdmin: { from: vi.fn() },
}));

// Import after mocking
import {
  StrategyRefinementService,
  CycleType,
  CycleStatus,
  DriftSeverity,
  SignalType,
} from '../strategy/strategyRefinementService';

import {
  CrossDomainCoordinatorService,
  Domain,
} from '../strategy/crossDomainCoordinatorService';

import {
  ReinforcementAdjustmentEngine,
  AdjustmentTarget,
  AdjustmentType,
  ReinforcementSignal,
} from '../strategy/reinforcementAdjustmentEngine';

describe('StrategyRefinementService', () => {
  let service: StrategyRefinementService;

  beforeEach(() => {
    resetMockChain();
    service = new StrategyRefinementService();
  });

  describe('startRefinementCycle', () => {
    it('should create a new refinement cycle', async () => {
      const mockCycle = {
        id: 'cycle-123',
        organization_id: 'org-123',
        cycle_number: 1,
        cycle_type: 'MANUAL',
        status: 'IN_PROGRESS',
      };

      // Query 1: get last cycle number (.single())
      // Query 2: insert new cycle (.select().single())
      mockSupabaseInstance._setResults([
        { data: null, error: null },
        { data: mockCycle, error: null },
      ]);

      const result = await service.startRefinementCycle('org-123', 'MANUAL');

      expect(result.cycle_type).toBe('MANUAL');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should increment cycle number', async () => {
      // Query 1: get last cycle (has cycle_number 5)
      // Query 2: insert new cycle (returns cycle_number 6)
      mockSupabaseInstance._setResults([
        { data: { cycle_number: 5 }, error: null },
        { data: { id: 'cycle-456', cycle_number: 6 }, error: null },
      ]);

      const result = await service.startRefinementCycle('org-123', 'SCHEDULED');

      expect(result.cycle_number).toBe(6);
    });
  });

  describe('calculatePerformanceGrade', () => {
    it('should return A for achievement >= 90%', () => {
      const grade = (service as any).calculatePerformanceGrade(95);
      expect(grade).toBe('A');
    });

    it('should return B for achievement >= 80%', () => {
      const grade = (service as any).calculatePerformanceGrade(85);
      expect(grade).toBe('B');
    });

    it('should return C for achievement >= 70%', () => {
      const grade = (service as any).calculatePerformanceGrade(75);
      expect(grade).toBe('C');
    });

    it('should return D for achievement >= 60%', () => {
      const grade = (service as any).calculatePerformanceGrade(65);
      expect(grade).toBe('D');
    });

    it('should return F for achievement < 60%', () => {
      const grade = (service as any).calculatePerformanceGrade(50);
      expect(grade).toBe('F');
    });
  });

  describe('calculateSeverity', () => {
    it('should return CRITICAL for drift > 30%', () => {
      const severity = (service as any).calculateSeverity(35);
      expect(severity).toBe('CRITICAL');
    });

    it('should return HIGH for drift > 20%', () => {
      const severity = (service as any).calculateSeverity(25);
      expect(severity).toBe('HIGH');
    });

    it('should return MEDIUM for drift > 10%', () => {
      const severity = (service as any).calculateSeverity(15);
      expect(severity).toBe('MEDIUM');
    });

    it('should return LOW for drift <= 10%', () => {
      const severity = (service as any).calculateSeverity(8);
      expect(severity).toBe('LOW');
    });
  });

  describe('calculateReinforcementScore', () => {
    it('should return positive score for over-achievement', () => {
      const score = (service as any).calculateReinforcementScore(120);
      expect(score).toBe(20);
    });

    it('should return negative score for under-achievement', () => {
      const score = (service as any).calculateReinforcementScore(60);
      expect(score).toBe(-40);
    });

    it('should cap at -100', () => {
      const score = (service as any).calculateReinforcementScore(0);
      expect(score).toBe(-100);
    });

    it('should cap at +100', () => {
      const score = (service as any).calculateReinforcementScore(250);
      expect(score).toBe(100);
    });
  });
});

describe('CrossDomainCoordinatorService', () => {
  let service: CrossDomainCoordinatorService;

  beforeEach(() => {
    resetMockChain();
    service = new CrossDomainCoordinatorService();
  });

  describe('getDomainDependencies', () => {
    it('should return all dependencies when no domain specified', () => {
      const deps = service.getDomainDependencies();
      expect(deps.length).toBeGreaterThan(0);
    });

    it('should filter dependencies by domain', () => {
      const seoDeps = service.getDomainDependencies('SEO');
      expect(seoDeps.every(d => d.source === 'SEO' || d.target === 'SEO')).toBe(true);
    });

    it('should include CONTENT -> SEO dependency', () => {
      const deps = service.getDomainDependencies('SEO');
      const contentToSeo = deps.find(d => d.source === 'CONTENT' && d.target === 'SEO');
      expect(contentToSeo).toBeDefined();
      expect(contentToSeo?.strength).toBeGreaterThan(0);
    });
  });

  describe('calculateEntropy', () => {
    it('should return 1 for perfectly balanced allocation', () => {
      const entropy = (service as any).calculateEntropy([20, 20, 20, 20, 20]);
      expect(entropy).toBeCloseTo(1, 2);
    });

    it('should return 0 for completely unbalanced allocation', () => {
      const entropy = (service as any).calculateEntropy([100, 0, 0, 0, 0]);
      expect(entropy).toBe(0);
    });

    it('should return intermediate value for partial balance', () => {
      const entropy = (service as any).calculateEntropy([40, 30, 15, 10, 5]);
      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThan(1);
    });
  });

  describe('calculateGini', () => {
    it('should return 0 for perfect equality', () => {
      const gini = (service as any).calculateGini([20, 20, 20, 20, 20]);
      expect(gini).toBeCloseTo(0, 2);
    });

    it('should return high value for high inequality', () => {
      const gini = (service as any).calculateGini([80, 10, 5, 3, 2]);
      expect(gini).toBeGreaterThan(0.5);
    });
  });

  describe('identifyImbalances', () => {
    it('should identify over-optimized domains', () => {
      const allocations = { SEO: 40, GEO: 20, CONTENT: 20, ADS: 10, CRO: 10 };
      const performance = { SEO: 50, GEO: 70, CONTENT: 70, ADS: 70, CRO: 70 };

      const { overOptimized, underInvested } = (service as any).identifyImbalances(
        allocations,
        performance
      );

      expect(overOptimized).toContain('SEO');
    });

    it('should identify under-invested domains', () => {
      const allocations = { SEO: 30, GEO: 30, CONTENT: 30, ADS: 5, CRO: 5 };
      const performance = { SEO: 50, GEO: 50, CONTENT: 50, ADS: 70, CRO: 70 };

      const { overOptimized, underInvested } = (service as any).identifyImbalances(
        allocations,
        performance
      );

      expect(underInvested).toContain('ADS');
      expect(underInvested).toContain('CRO');
    });
  });
});

describe('ReinforcementAdjustmentEngine', () => {
  let engine: ReinforcementAdjustmentEngine;

  beforeEach(() => {
    resetMockChain();
    engine = new ReinforcementAdjustmentEngine();
  });

  describe('generateExecutionSignals', () => {
    it('should generate positive signal for exceeding target', () => {
      const signals = engine.generateExecutionSignals(120, true, 8, 10);

      const performanceSignal = signals.find(s => s.reason === 'Target exceeded');
      expect(performanceSignal).toBeDefined();
      expect(performanceSignal?.strength).toBeGreaterThan(0);
    });

    it('should generate negative signal for under-achievement', () => {
      const signals = engine.generateExecutionSignals(50, true, 8, 10);

      const performanceSignal = signals.find(s => s.reason === 'Target underachieved');
      expect(performanceSignal).toBeDefined();
      expect(performanceSignal?.strength).toBeLessThan(0);
    });

    it('should generate negative signal for missed deadline', () => {
      const signals = engine.generateExecutionSignals(100, false, 10, 10);

      const timingSignal = signals.find(s => s.reason === 'Deadline missed');
      expect(timingSignal).toBeDefined();
      expect(timingSignal?.strength).toBeLessThan(0);
    });

    it('should generate signal for resource over-utilization', () => {
      const signals = engine.generateExecutionSignals(100, true, 15, 10);

      const resourceSignal = signals.find(s => s.reason === 'Over-utilized resources');
      expect(resourceSignal).toBeDefined();
      expect(resourceSignal?.strength).toBeLessThan(0);
    });
  });

  describe('generateSimulationSignals', () => {
    it('should generate positive signal for high confidence best path', () => {
      const signals = engine.generateSimulationSignals(0.9, 1, 5);

      const confidenceSignal = signals.find(s => s.reason === 'High confidence best path');
      expect(confidenceSignal).toBeDefined();
      expect(confidenceSignal?.strength).toBeGreaterThan(0);
    });

    it('should generate negative signal for low confidence', () => {
      const signals = engine.generateSimulationSignals(0.3, 1, 5);

      const confidenceSignal = signals.find(s => s.reason === 'Low simulation confidence');
      expect(confidenceSignal).toBeDefined();
      expect(confidenceSignal?.strength).toBeLessThan(0);
    });
  });

  describe('calculateAdjustment', () => {
    it('should return STRENGTHEN for strongly positive signals', () => {
      const signals: ReinforcementSignal[] = [
        { source: 'EXECUTION', strength: 0.8, confidence: 0.9, reason: 'Test', data: {} },
        { source: 'HISTORICAL', strength: 0.6, confidence: 0.8, reason: 'Test', data: {} },
      ];

      const result = (engine as any).calculateAdjustment(signals);

      expect(result.adjustmentType).toBe('STRENGTHEN');
    });

    it('should return WEAKEN for moderately negative signals', () => {
      const signals: ReinforcementSignal[] = [
        { source: 'EXECUTION', strength: -0.4, confidence: 0.8, reason: 'Test', data: {} },
      ];

      const result = (engine as any).calculateAdjustment(signals);

      expect(result.adjustmentType).toBe('WEAKEN');
    });

    it('should return PAUSE for strongly negative signals', () => {
      const signals: ReinforcementSignal[] = [
        { source: 'EXECUTION', strength: -0.8, confidence: 0.9, reason: 'Test', data: {} },
        { source: 'FEEDBACK', strength: -0.6, confidence: 0.85, reason: 'Test', data: {} },
      ];

      const result = (engine as any).calculateAdjustment(signals);

      expect(result.adjustmentType).toBe('PAUSE');
    });

    it('should return MAINTAIN for neutral signals', () => {
      const signals: ReinforcementSignal[] = [
        { source: 'EXECUTION', strength: 0.05, confidence: 0.7, reason: 'Test', data: {} },
      ];

      const result = (engine as any).calculateAdjustment(signals);

      expect(result.adjustmentType).toBe('MAINTAIN');
    });
  });
});

describe('Type definitions', () => {
  it('should have valid CycleType values', () => {
    const validTypes: CycleType[] = ['SCHEDULED', 'DRIFT_TRIGGERED', 'MANUAL', 'PERFORMANCE'];
    expect(validTypes).toHaveLength(4);
  });

  it('should have valid CycleStatus values', () => {
    const validStatuses: CycleStatus[] = ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
    expect(validStatuses).toHaveLength(4);
  });

  it('should have valid DriftSeverity values', () => {
    const validSeverities: DriftSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    expect(validSeverities).toHaveLength(4);
  });

  it('should have valid SignalType values', () => {
    const validTypes: SignalType[] = [
      'KPI_DRIFT',
      'TIMELINE_DRIFT',
      'RESOURCE_DRIFT',
      'DEPENDENCY_DRIFT',
      'EXTERNAL_DRIFT',
    ];
    expect(validTypes).toHaveLength(5);
  });

  it('should have valid Domain values', () => {
    const validDomains: Domain[] = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO'];
    expect(validDomains).toHaveLength(5);
  });

  it('should have valid AdjustmentTarget values', () => {
    const validTargets: AdjustmentTarget[] = [
      'STEP',
      'DOMAIN',
      'KPI_TARGET',
      'TIMELINE',
      'RESOURCE',
      'PRIORITY',
    ];
    expect(validTargets).toHaveLength(6);
  });

  it('should have valid AdjustmentType values', () => {
    const validTypes: AdjustmentType[] = [
      'STRENGTHEN',
      'WEAKEN',
      'MAINTAIN',
      'REDIRECT',
      'PAUSE',
      'ACCELERATE',
    ];
    expect(validTypes).toHaveLength(6);
  });
});
