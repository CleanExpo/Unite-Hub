/**
 * Horizon Planning Unit Tests
 * Phase 11 Week 5-6: Tests for long-horizon planning services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create chainable mock with vi.hoisted
const { mockSupabaseInstance, mockGetSupabaseServer, resetMockChain } = vi.hoisted(() => {
  const queryResults: any[] = [];

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

  const mock: any = {
    _setResults: (results: any[]) => { queryResults.length = 0; queryResults.push(...results); },
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockReturnValue(queryBuilder),
    auth: { getUser: vi.fn(), getSession: vi.fn() },
  };

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
  LongHorizonPlannerService,
  HorizonType,
  PlanStatus,
  StepStatus,
} from '../strategy/longHorizonPlannerService';

import {
  KPITrackingService,
  SnapshotType,
  KPIDomain,
  Trend,
} from '../strategy/kpiTrackingService';

// resetChain is now resetMockChain from vi.hoisted

describe('LongHorizonPlannerService', () => {
  let service: LongHorizonPlannerService;

  beforeEach(() => {
    resetMockChain();
    service = new LongHorizonPlannerService();
  });

  describe('createPlan', () => {
    it('should create a horizon plan with correct defaults', async () => {
      const mockPlan = {
        id: 'plan-123',
        organization_id: 'org-123',
        name: 'Test Plan',
        horizon_type: 'MEDIUM',
        days_total: 60,
        status: 'DRAFT',
      };

      mockSupabaseInstance._setResults([
        { data: mockPlan, error: null },
      ]);

      const result = await service.createPlan({
        organization_id: 'org-123',
        name: 'Test Plan',
        horizon_type: 'MEDIUM',
      });

      expect(result.id).toBe('plan-123');
      expect(result.status).toBe('DRAFT');
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith('horizon_plans');
    });

    it('should handle custom horizon type with specified days', async () => {
      const mockPlan = {
        id: 'plan-456',
        organization_id: 'org-123',
        name: 'Custom Plan',
        horizon_type: 'CUSTOM',
        days_total: 45,
      };

      mockSupabaseInstance._setResults([
        { data: mockPlan, error: null },
      ]);

      const result = await service.createPlan({
        organization_id: 'org-123',
        name: 'Custom Plan',
        horizon_type: 'CUSTOM',
        custom_days: 45,
      });

      expect(result.days_total).toBe(45);
    });
  });

  describe('horizon type days calculation', () => {
    it('should return 30 days for SHORT horizon', () => {
      const days = (service as any).horizonDays['SHORT'];
      expect(days).toBe(30);
    });

    it('should return 60 days for MEDIUM horizon', () => {
      const days = (service as any).horizonDays['MEDIUM'];
      expect(days).toBe(60);
    });

    it('should return 90 days for LONG horizon', () => {
      const days = (service as any).horizonDays['LONG'];
      expect(days).toBe(90);
    });

    it('should return 90 days for QUARTERLY horizon', () => {
      const days = (service as any).horizonDays['QUARTERLY'];
      expect(days).toBe(90);
    });
  });

  describe('generatePlan', () => {
    it('should generate steps for all priority domains', async () => {
      const mockPlan = {
        id: 'plan-789',
        organization_id: 'org-123',
        name: 'Generated Plan',
        horizon_type: 'SHORT',
        days_total: 30,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_rolling: true,
        roll_frequency_days: 7,
      };

      // generatePlan flow:
      // 1. createPlan: insert().select().single() -> plan
      // 2. For each domain (5 default): stepsPerDomain = ceil(30/15)=2, so 2 steps each
      //    - generateDomainSteps: 2 x insert().select().single() per domain = 10 total
      // 3. Dependencies within domain: 1 per domain = 5 deps, insert().select().single()
      // 4. Cross-domain dep (SEO depends on CONTENT if CONTENT processed first)
      // 5. calculatePlanScores + updatePlanScores (then-able)
      const results: any[] = [
        // Plan creation
        { data: mockPlan, error: null },
      ];

      // 5 domains x 2 steps = 10 step inserts
      for (let d = 0; d < 5; d++) {
        const domains = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO'];
        for (let s = 0; s < 2; s++) {
          results.push({
            data: {
              id: `step-${d}-${s}`,
              horizon_plan_id: 'plan-789',
              name: `Step ${s}`,
              step_number: d * 2 + s + 1,
              domain: domains[d],
              start_day: s * 15,
              end_day: (s + 1) * 15 - 1,
              duration_days: 15,
              target_kpis: {},
              risk_level: 'LOW',
              risk_factors: { complexity: 0.1 },
            },
            error: null,
          });
        }
      }

      // 5 within-domain deps + possible cross-domain deps
      for (let i = 0; i < 8; i++) {
        results.push({
          data: {
            id: `dep-${i}`,
            horizon_plan_id: 'plan-789',
            source_step_id: `step-${i}`,
            target_step_id: `step-${i + 1}`,
            link_type: 'FINISH_TO_START',
            lag_days: 0,
            is_critical: true,
          },
          error: null,
        });
      }

      mockSupabaseInstance._setResults(results);

      const result = await service.generatePlan('org-123', 'SHORT');

      expect(result.plan.id).toBe('plan-789');
      expect(result.steps.length).toBeGreaterThan(0);
    });
  });

  describe('resolveDependencies', () => {
    it('should identify critical path', async () => {
      const mockSteps = [
        { id: 'step-1', step_number: 1, start_day: 0, end_day: 5, duration_days: 5 },
        { id: 'step-2', step_number: 2, start_day: 5, end_day: 10, duration_days: 5 },
        { id: 'step-3', step_number: 3, start_day: 10, end_day: 15, duration_days: 5 },
      ];

      const mockDeps = [
        { source_step_id: 'step-1', target_step_id: 'step-2', link_type: 'FINISH_TO_START', lag_days: 0 },
        { source_step_id: 'step-2', target_step_id: 'step-3', link_type: 'FINISH_TO_START', lag_days: 0 },
      ];

      // getPlan calls:
      // 1. horizon_plans select().eq().single() -> plan
      // 2. horizon_steps select().eq().order() -> then-able (steps)
      // 3. dependency_links select().eq() -> then-able (deps)
      mockSupabaseInstance._setResults([
        { data: { id: 'plan-123', organization_id: 'org-123' }, error: null },
        { data: mockSteps, error: null },
        { data: mockDeps, error: null },
      ]);

      const result = await service.resolveDependencies('plan-123');

      expect(result.criticalPath).toBeDefined();
      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.parallelGroups).toBeDefined();
    });
  });
});

describe('KPITrackingService', () => {
  let service: KPITrackingService;

  beforeEach(() => {
    resetMockChain();
    service = new KPITrackingService();
  });

  describe('createSnapshot', () => {
    it('should create snapshot with calculated change percent', async () => {
      const mockSnapshot = {
        id: 'snapshot-123',
        organization_id: 'org-123',
        snapshot_type: 'CURRENT',
        metric_name: 'organic_traffic',
        metric_value: 1200,
        baseline_value: 1000,
        change_percent: 20,
        trend: 'UP',
      };

      mockSupabaseInstance._setResults([
        { data: mockSnapshot, error: null },
      ]);

      const result = await service.createSnapshot({
        organization_id: 'org-123',
        snapshot_type: 'CURRENT',
        domain: 'SEO',
        metric_name: 'organic_traffic',
        metric_value: 1200,
        baseline_value: 1000,
      });

      expect(result.change_percent).toBe(20);
      expect(result.trend).toBe('UP');
    });
  });

  describe('calculateTrend', () => {
    it('should return UP for positive change > 5%', () => {
      const trend = (service as any).calculateTrend(10);
      expect(trend).toBe('UP');
    });

    it('should return DOWN for negative change < -5%', () => {
      const trend = (service as any).calculateTrend(-10);
      expect(trend).toBe('DOWN');
    });

    it('should return STABLE for change between -5% and 5%', () => {
      const trend = (service as any).calculateTrend(3);
      expect(trend).toBe('STABLE');
    });
  });

  describe('getKPIDefinitions', () => {
    it('should return all definitions when no domain specified', () => {
      const definitions = service.getKPIDefinitions();
      expect(definitions.length).toBeGreaterThan(0);
    });

    it('should filter definitions by domain', () => {
      const seoDefinitions = service.getKPIDefinitions('SEO');
      expect(seoDefinitions.every((d) => d.domain === 'SEO')).toBe(true);
    });

    it('should include expected SEO metrics', () => {
      const seoDefinitions = service.getKPIDefinitions('SEO');
      const metricNames = seoDefinitions.map((d) => d.name);

      expect(metricNames).toContain('organic_traffic');
      expect(metricNames).toContain('domain_authority');
      expect(metricNames).toContain('backlinks');
    });

    it('should include expected CRO metrics', () => {
      const croDefinitions = service.getKPIDefinitions('CRO');
      const metricNames = croDefinitions.map((d) => d.name);

      expect(metricNames).toContain('conversion_rate');
      expect(metricNames).toContain('cart_abandonment');
    });
  });

  describe('getDomainSummary', () => {
    it('should calculate overall score and health status', async () => {
      const mockTrends = [
        {
          metric_name: 'organic_traffic',
          domain: 'SEO',
          current_value: 1500,
          baseline_value: 1000,
          target_value: 2000,
          change_percent: 50,
          trend: 'UP',
          on_track: true,
        },
      ];

      // Mock getKPITrends
      vi.spyOn(service, 'getKPITrends').mockResolvedValue(mockTrends as any);

      const result = await service.getDomainSummary('org-123', 'SEO');

      expect(result.domain).toBe('SEO');
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']).toContain(
        result.health_status
      );
    });
  });

  describe('projectKPIs', () => {
    it('should generate projections for specified number of days', async () => {
      const mockTrends = [
        {
          metric_name: 'organic_traffic',
          domain: 'SEO',
          current_value: 1000,
          baseline_value: 800,
          target_value: 1500,
          change_percent: 25,
          trend: 'UP',
          on_track: true,
          confidence: 0.8,
        },
      ];

      vi.spyOn(service, 'getKPITrends').mockResolvedValue(mockTrends as any);

      // projectKPIs calls supabase for historical data (then-able)
      mockSupabaseInstance._setResults([
        { data: [], error: null },
      ]);

      const result = await service.projectKPIs('org-123', 'SEO', 30);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].projected_values.length).toBe(30);
      expect(result[0].projected_values[0].day).toBe(1);
      expect(result[0].projected_values[29].day).toBe(30);
    });
  });
});

describe('Horizon Planning Integration', () => {
  describe('Type definitions', () => {
    it('should have valid HorizonType values', () => {
      const validTypes: HorizonType[] = ['SHORT', 'MEDIUM', 'LONG', 'QUARTERLY', 'CUSTOM'];
      expect(validTypes).toHaveLength(5);
    });

    it('should have valid PlanStatus values', () => {
      const validStatuses: PlanStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'];
      expect(validStatuses).toHaveLength(5);
    });

    it('should have valid StepStatus values', () => {
      const validStatuses: StepStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED'];
      expect(validStatuses).toHaveLength(5);
    });

    it('should have valid SnapshotType values', () => {
      const validTypes: SnapshotType[] = ['BASELINE', 'CURRENT', 'PROJECTED', 'TARGET', 'MILESTONE'];
      expect(validTypes).toHaveLength(5);
    });

    it('should have valid KPIDomain values', () => {
      const validDomains: KPIDomain[] = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO', 'EMAIL', 'SOCIAL', 'OVERALL'];
      expect(validDomains).toHaveLength(8);
    });

    it('should have valid Trend values', () => {
      const validTrends: Trend[] = ['UP', 'DOWN', 'STABLE', 'VOLATILE'];
      expect(validTrends).toHaveLength(4);
    });
  });

  describe('KPI weight validation', () => {
    it('should have SEO KPI weights that sum to 1.0', () => {
      const service = new KPITrackingService();
      const seoKPIs = service.getKPIDefinitions('SEO');
      const totalWeight = seoKPIs.reduce((sum, kpi) => sum + kpi.weight, 0);

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should have GEO KPI weights that sum to 1.0', () => {
      const service = new KPITrackingService();
      const geoKPIs = service.getKPIDefinitions('GEO');
      const totalWeight = geoKPIs.reduce((sum, kpi) => sum + kpi.weight, 0);

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should have CONTENT KPI weights that sum to 1.0', () => {
      const service = new KPITrackingService();
      const contentKPIs = service.getKPIDefinitions('CONTENT');
      const totalWeight = contentKPIs.reduce((sum, kpi) => sum + kpi.weight, 0);

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should have ADS KPI weights that sum to 1.0', () => {
      const service = new KPITrackingService();
      const adsKPIs = service.getKPIDefinitions('ADS');
      const totalWeight = adsKPIs.reduce((sum, kpi) => sum + kpi.weight, 0);

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should have CRO KPI weights that sum to 1.0', () => {
      const service = new KPITrackingService();
      const croKPIs = service.getKPIDefinitions('CRO');
      const totalWeight = croKPIs.reduce((sum, kpi) => sum + kpi.weight, 0);

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
});
