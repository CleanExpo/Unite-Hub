/**
 * MAOS Orchestrator - Multi-Agent Operating System Core
 * Coordinates all 12 engines with Deep Agent abstraction
 * Phase 79 - Abacus Deep Agent Integration
 */

import { createClient } from '@supabase/supabase-js';
import { asrsEngine } from './ASRSEngine';
import { mcseEngine } from './MCSEEngine';
import { upeweEngine } from './UPEWEEngine';
import { aireEngine } from './AIREEngine';
import { sorieEngine } from './SORIEEngine';
import { egcbiEngine } from './EGCBIEngine';
import { grhEngine } from './GRHEngine';
import { raaoeEngine } from './RAAOEEngine';
import { gslpieEngine } from './GSLPIEEngine';
import { aglbasEngine } from './AGLBASEngine';
import { tcpqelEngine } from './TCPQELEngine';
import { ucscelEngine } from './UCSCELEngine';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }
  return _supabase;
}

// Engine Manifest - All registered MAOS engines
export const ENGINE_MANIFEST = {
  ASRS: {
    name: 'Autonomous Safety & Risk Supervisor',
    service: asrsEngine,
    category: 'safety',
    priority: 1,
    regions: ['global'],
    actions: ['evaluateRisk', 'getBlockDecisions', 'getPolicyRules']
  },
  MCSE: {
    name: 'MAOS Cognitive Supervisor Engine',
    service: mcseEngine,
    category: 'cognitive',
    priority: 2,
    regions: ['global'],
    actions: ['validateReasoning', 'checkHallucination', 'scoreLogic']
  },
  UPEWE: {
    name: 'Unified Prediction & Early-Warning Engine',
    service: upeweEngine,
    category: 'prediction',
    priority: 3,
    regions: ['global'],
    actions: ['generateForecast', 'getSignals', 'predictEvent']
  },
  AIRE: {
    name: 'Autonomous Incident Response & Remediation Engine',
    service: aireEngine,
    category: 'incident',
    priority: 4,
    regions: ['global'],
    actions: ['createIncident', 'resolveIncident', 'getActiveIncidents', 'autoRemediate']
  },
  SORIE: {
    name: 'Strategic Objective & Roadmap Intelligence Engine',
    service: sorieEngine,
    category: 'strategy',
    priority: 5,
    regions: ['global'],
    actions: ['createObjective', 'getObjectives', 'generateRoadmap', 'trackProgress']
  },
  EGCBI: {
    name: 'Enterprise Governance, Compliance & Board Intelligence',
    service: egcbiEngine,
    category: 'governance',
    priority: 6,
    regions: ['global'],
    actions: ['checkCompliance', 'getPolicies', 'createPolicy', 'generateBoardReport', 'runAudit']
  },
  GRH: {
    name: 'Global Regulatory Harmonisation & Region-Aware Policy Engine',
    service: grhEngine,
    category: 'regulatory',
    priority: 7,
    regions: ['us', 'eu', 'uk', 'apac', 'au', 'ca'],
    actions: ['getRegionalRegulations', 'checkHarmonisation', 'createRegulation', 'generatePolicyMapping']
  },
  RAAOE: {
    name: 'Region-Aware Autonomous Operations Engine',
    service: raaoeEngine,
    category: 'operations',
    priority: 8,
    regions: ['us', 'eu', 'apac', 'au', 'ca'],
    actions: ['submitOperation', 'getRegionStatus', 'optimizeRegionalRouting']
  },
  GSLPIE: {
    name: 'Global SLA, Latency & Performance Intelligence Engine',
    service: gslpieEngine,
    category: 'performance',
    priority: 9,
    regions: ['us', 'eu', 'apac', 'au', 'ca'],
    actions: ['captureMetrics', 'analysePerformance', 'forecastSLA', 'routeToOptimalRegion']
  },
  AGLBASE: {
    name: 'Autonomous Global Load Balancing & Agent Scaling Engine',
    service: aglbasEngine,
    category: 'scaling',
    priority: 10,
    regions: ['us', 'eu', 'apac', 'au', 'ca'],
    actions: ['assessCapacity', 'selectRegionForWorkload', 'scalePool', 'rebalance']
  },
  TCPQEL: {
    name: 'Tenant Commercial Plans, Quotas & Engine Licensing',
    service: tcpqelEngine,
    category: 'billing',
    priority: 11,
    regions: ['global'],
    actions: ['checkQuota', 'allocatePlan', 'chargeUsage', 'isEngineLicensed', 'getUsageStats']
  },
  UCSCEL: {
    name: 'Unified Compliance, SLA & Contract Enforcement Layer',
    service: ucscelEngine,
    category: 'compliance',
    priority: 12,
    regions: ['global'],
    actions: ['checkContractCompliance', 'checkSLAAdherence', 'enforceContract', 'getViolations']
  }
} as const;

// Routing table for engine selection
export const ROUTING_TABLE = {
  safety: ['ASRS'],
  cognitive: ['MCSE'],
  prediction: ['UPEWE'],
  incident: ['AIRE'],
  strategy: ['SORIE'],
  governance: ['EGCBI'],
  regulatory: ['GRH'],
  operations: ['RAAOE'],
  performance: ['GSLPIE'],
  scaling: ['AGLBASE'],
  billing: ['TCPQEL'],
  compliance: ['UCSCEL', 'EGCBI', 'GRH']
};

// Region profiles with constraints
export const REGION_PROFILES = {
  us: { dataResidency: true, gdpr: false, ccpa: true, latencyTarget: 50 },
  eu: { dataResidency: true, gdpr: true, ccpa: false, latencyTarget: 80 },
  uk: { dataResidency: true, gdpr: true, ccpa: false, latencyTarget: 70 },
  apac: { dataResidency: true, gdpr: false, ccpa: false, latencyTarget: 120 },
  au: { dataResidency: true, gdpr: false, ccpa: false, latencyTarget: 100 },
  ca: { dataResidency: true, gdpr: false, ccpa: false, latencyTarget: 60 },
  global: { dataResidency: false, gdpr: false, ccpa: false, latencyTarget: 100 }
};

export interface OrchestratorRequest {
  tenantId: string;
  action: string;
  engine?: string;
  category?: string;
  region?: string;
  params: Record<string, any>;
}

export interface OrchestratorResponse {
  success: boolean;
  engine: string;
  action: string;
  result: any;
  metadata: {
    executionTime: number;
    region: string;
    safetyScore?: number;
    cognitiveScore?: number;
  };
}

export class MAOSOrchestrator {
  /**
   * Execute an action through the MAOS orchestrator
   */
  async execute(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    const region = request.region || 'global';

    // Step 1: Check quota before execution
    const quotaCheck = await tcpqelEngine.checkQuota(request.tenantId, request.engine || 'maos', 1);
    if (!quotaCheck.allowed) {
      throw new Error(`Quota exceeded: ${quotaCheck.reason}`);
    }

    // Step 2: Safety check via ASRS
    const safetyResult = await asrsEngine.evaluateRisk(request.tenantId, request.action, request.params);
    if (safetyResult.blocked) {
      throw new Error(`Action blocked by ASRS: Risk score ${safetyResult.risk_score}`);
    }

    // Step 3: Route to appropriate engine
    const engine = request.engine || this.selectEngine(request.category, request.action);
    const engineConfig = ENGINE_MANIFEST[engine as keyof typeof ENGINE_MANIFEST];

    if (!engineConfig) {
      throw new Error(`Unknown engine: ${engine}`);
    }

    // Step 4: Check regional constraints via GRH
    if (region !== 'global') {
      const compliance = await grhEngine.checkRegionalCompliance(request.tenantId, region);
      if (!compliance.compliant) {
        console.warn(`[MAOS] Regional compliance warning for ${region}:`, compliance.gaps);
      }
    }

    // Step 5: Execute action on engine
    let result: any;
    try {
      result = await this.executeEngineAction(engine, request.action, request.params);
    } catch (error) {
      // Step 5a: Auto-remediation via AIRE
      await aireEngine.createIncident(
        request.tenantId,
        'engine_error',
        'medium',
        `Engine ${engine} failed on action ${request.action}: ${error}`
      );
      throw error;
    }

    // Step 6: Cognitive validation via MCSE (for AI outputs)
    let cognitiveScore: number | undefined;
    if (this.requiresCognitiveValidation(engine, request.action)) {
      const validation = await mcseEngine.validateReasoning(
        request.tenantId,
        engine,
        JSON.stringify(request.params),
        JSON.stringify(result)
      );
      cognitiveScore = validation.logic_score;
    }

    // Step 7: Charge usage
    await tcpqelEngine.chargeUsage(request.tenantId, engine, 1);

    // Step 8: Log execution
    await this.logExecution(request.tenantId, engine, request.action, startTime);

    return {
      success: true,
      engine,
      action: request.action,
      result,
      metadata: {
        executionTime: Date.now() - startTime,
        region,
        safetyScore: safetyResult.risk_score,
        cognitiveScore
      }
    };
  }

  /**
   * Select engine based on category and action
   */
  private selectEngine(category?: string, action?: string): string {
    if (category && ROUTING_TABLE[category as keyof typeof ROUTING_TABLE]) {
      return ROUTING_TABLE[category as keyof typeof ROUTING_TABLE][0];
    }

    // Default routing based on action patterns
    if (action?.includes('risk') || action?.includes('safety')) return 'ASRS';
    if (action?.includes('forecast') || action?.includes('predict')) return 'UPEWE';
    if (action?.includes('incident') || action?.includes('remediat')) return 'AIRE';
    if (action?.includes('compliance') || action?.includes('govern')) return 'EGCBI';
    if (action?.includes('regulat') || action?.includes('region')) return 'GRH';
    if (action?.includes('performance') || action?.includes('latency')) return 'GSLPIE';
    if (action?.includes('scale') || action?.includes('capacity')) return 'AGLBASE';
    if (action?.includes('quota') || action?.includes('plan')) return 'TCPQEL';
    if (action?.includes('contract') || action?.includes('sla')) return 'UCSCEL';

    return 'MCSE'; // Default to cognitive engine
  }

  /**
   * Execute action on specific engine
   */
  private async executeEngineAction(engine: string, action: string, params: Record<string, any>): Promise<any> {
    const engineConfig = ENGINE_MANIFEST[engine as keyof typeof ENGINE_MANIFEST];
    const service = engineConfig.service as any;

    if (typeof service[action] === 'function') {
      return await service[action](...Object.values(params));
    }

    throw new Error(`Action ${action} not found on engine ${engine}`);
  }

  /**
   * Check if action requires cognitive validation
   */
  private requiresCognitiveValidation(engine: string, action: string): boolean {
    const cognitiveActions = ['generateForecast', 'generateRoadmap', 'generateBoardReport', 'generatePolicyMapping'];
    return cognitiveActions.includes(action);
  }

  /**
   * Log execution to database
   */
  private async logExecution(tenantId: string, engine: string, action: string, startTime: number): Promise<void> {
    await getSupabase()
      .from('maos_execution_logs')
      .insert({
        tenant_id: tenantId,
        engine,
        action,
        execution_time_ms: Date.now() - startTime,
        executed_at: new Date().toISOString()
      });
  }

  /**
   * Get forecasts from UPEWE for proactive actions
   */
  async getProactiveForecasts(tenantId: string): Promise<any[]> {
    const forecasts = [];
    for (const window of ['5m', '1h', '24h']) {
      const forecast = await upeweEngine.generateForecast(tenantId, window);
      if (forecast.probability > 0.5) {
        forecasts.push(forecast);
      }
    }
    return forecasts;
  }

  /**
   * Get system health across all engines
   */
  async getSystemHealth(tenantId: string): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    // Get capacity from AGLBASE
    health.capacity = await aglbasEngine.assessCapacity(tenantId);

    // Get compliance from EGCBI
    health.compliance = await egcbiEngine.checkCompliance(tenantId, 'overall');

    // Get active incidents from AIRE
    health.incidents = await aireEngine.getActiveIncidents(tenantId);

    // Get quota status from TCPQEL
    health.quota = await tcpqelEngine.getUsageStats(tenantId);

    return health;
  }

  /**
   * Apply strategic alignment via SORIE
   */
  async applyStrategicAlignment(tenantId: string): Promise<any> {
    const objectives = await sorieEngine.getObjectives(tenantId);
    const roadmap = await sorieEngine.generateRoadmap(tenantId);

    return {
      activeObjectives: objectives.length,
      roadmap,
      alignment: objectives.filter(o => o.status === 'on_track' || o.status === 'ahead').length / objectives.length
    };
  }
}

export const maosOrchestrator = new MAOSOrchestrator();
