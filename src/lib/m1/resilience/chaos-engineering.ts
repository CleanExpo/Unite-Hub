/**
 * M1 Chaos Engineering Engine
 *
 * Fault injection and chaos testing for system resilience validation
 *
 * Version: v3.2.0
 * Phase: 19B - Chaos Engineering & Fault Injection
 */

import { v4 as generateUUID } from 'uuid';

export type FaultType = 'latency' | 'error' | 'timeout' | 'partition' | 'resource_exhaustion';
export type ExperimentStatus = 'created' | 'running' | 'paused' | 'completed' | 'failed';
export type InjectionMode = 'targeted' | 'random' | 'gradual';

/**
 * Fault injection configuration
 */
export interface FaultInjection {
  id: string;
  type: FaultType;
  targetService: string;
  enabled: boolean;
  probability: number; // 0-1
  parameters: Record<string, unknown>;
  createdAt: number;
}

/**
 * Chaos experiment
 */
export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  faults: FaultInjection[];
  duration: number; // milliseconds
  startedAt?: number;
  completedAt?: number;
  results: {
    totalRequests: number;
    failedRequests: number;
    affectedServices: string[];
    averageLatencyIncrease: number;
    failureRate: number;
  };
}

/**
 * Chaos scenario
 */
export interface ChaosScenario {
  id: string;
  name: string;
  description: string;
  stages: Array<{
    name: string;
    faults: FaultInjection[];
    duration: number;
    goals: string[];
  }>;
  metrics: {
    targetSuccessRate: number;
    maxLatencyMs: number;
    allowedDowntimeMs: number;
  };
}

/**
 * Experiment result
 */
export interface ExperimentResult {
  experimentId: string;
  timestamp: number;
  status: 'success' | 'failure' | 'partial';
  observations: Array<{
    service: string;
    metricName: string;
    baselineValue: number;
    observedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

/**
 * Chaos Engineering Engine
 */
export class ChaosEngineeringEngine {
  private experiments: Map<string, ChaosExperiment> = new Map();
  private scenarios: Map<string, ChaosScenario> = new Map();
  private activeInjections: Map<string, FaultInjection> = new Map();
  private results: ExperimentResult[] = [];
  private baselineMetrics: Map<string, Record<string, number>> = new Map();

  /**
   * Create fault injection
   */
  createFaultInjection(
    type: FaultType,
    targetService: string,
    probability: number,
    parameters: Record<string, unknown>
  ): string {
    const id = `fault_${generateUUID()}`;

    const injection: FaultInjection = {
      id,
      type,
      targetService,
      enabled: false,
      probability: Math.min(1, Math.max(0, probability)),
      parameters,
      createdAt: Date.now(),
    };

    this.activeInjections.set(id, injection);
    return id;
  }

  /**
   * Enable fault injection
   */
  enableFaultInjection(injectionId: string): boolean {
    const injection = this.activeInjections.get(injectionId);
    if (!injection) {
return false;
}

    injection.enabled = true;
    return true;
  }

  /**
   * Disable fault injection
   */
  disableFaultInjection(injectionId: string): boolean {
    const injection = this.activeInjections.get(injectionId);
    if (!injection) {
return false;
}

    injection.enabled = false;
    return true;
  }

  /**
   * Create chaos experiment
   */
  createExperiment(
    name: string,
    description: string,
    faults: FaultInjection[],
    durationMs: number
  ): string {
    const id = `exp_${generateUUID()}`;

    const experiment: ChaosExperiment = {
      id,
      name,
      description,
      status: 'created',
      faults,
      duration: durationMs,
      results: {
        totalRequests: 0,
        failedRequests: 0,
        affectedServices: [],
        averageLatencyIncrease: 0,
        failureRate: 0,
      },
    };

    this.experiments.set(id, experiment);
    return id;
  }

  /**
   * Start chaos experiment
   */
  startExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'created') {
return false;
}

    experiment.status = 'running';
    experiment.startedAt = Date.now();

    // Enable all fault injections
    for (const fault of experiment.faults) {
      this.enableFaultInjection(fault.id);
    }

    return true;
  }

  /**
   * Stop chaos experiment
   */
  stopExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
return false;
}

    experiment.status = 'completed';
    experiment.completedAt = Date.now();

    // Disable all fault injections
    for (const fault of experiment.faults) {
      this.disableFaultInjection(fault.id);
    }

    return true;
  }

  /**
   * Pause chaos experiment
   */
  pauseExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
return false;
}

    experiment.status = 'paused';

    // Disable all fault injections
    for (const fault of experiment.faults) {
      this.disableFaultInjection(fault.id);
    }

    return true;
  }

  /**
   * Resume chaos experiment
   */
  resumeExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'paused') {
return false;
}

    experiment.status = 'running';

    // Re-enable all fault injections
    for (const fault of experiment.faults) {
      this.enableFaultInjection(fault.id);
    }

    return true;
  }

  /**
   * Check if request should be injected with fault
   */
  shouldInjectFault(targetService: string): { shouldInject: boolean; fault?: FaultInjection } {
    for (const injection of this.activeInjections.values()) {
      if (
        injection.enabled &&
        injection.targetService === targetService &&
        Math.random() < injection.probability
      ) {
        return { shouldInject: true, fault: injection };
      }
    }

    return { shouldInject: false };
  }

  /**
   * Create chaos scenario
   */
  createScenario(
    name: string,
    description: string,
    stages: ChaosScenario['stages'],
    metrics: ChaosScenario['metrics']
  ): string {
    const id = `scenario_${generateUUID()}`;

    const scenario: ChaosScenario = {
      id,
      name,
      description,
      stages,
      metrics,
    };

    this.scenarios.set(id, scenario);
    return id;
  }

  /**
   * Execute chaos scenario
   */
  executeScenario(scenarioId: string): string {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
return '';
}

    const experimentId = this.createExperiment(
      `Scenario: ${scenario.name}`,
      scenario.description,
      scenario.stages.flatMap((stage) => stage.faults),
      scenario.stages.reduce((total, stage) => total + stage.duration, 0)
    );

    this.startExperiment(experimentId);
    return experimentId;
  }

  /**
   * Record experiment observation
   */
  recordObservation(
    experimentId: string,
    service: string,
    metricName: string,
    baselineValue: number,
    observedValue: number
  ): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
return;
}

    const deviation = Math.abs(observedValue - baselineValue) / baselineValue;

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (deviation > 0.5) {
severity = 'high';
} else if (deviation > 0.2) {
severity = 'medium';
}

    const result: ExperimentResult = {
      experimentId,
      timestamp: Date.now(),
      status: 'success',
      observations: [
        {
          service,
          metricName,
          baselineValue,
          observedValue,
          deviation,
          severity,
        },
      ],
      recommendations: this.generateRecommendations(severity, metricName),
    };

    this.results.push(result);

    // Update experiment results
    experiment.results.affectedServices = Array.from(
      new Set([...experiment.results.affectedServices, service])
    );
  }

  /**
   * Set baseline metrics
   */
  setBaselineMetrics(service: string, metrics: Record<string, number>): void {
    this.baselineMetrics.set(service, metrics);
  }

  /**
   * Get baseline metrics
   */
  getBaselineMetrics(service: string): Record<string, number> | null {
    return this.baselineMetrics.get(service) || null;
  }

  /**
   * Analyze chaos results
   */
  analyzeResults(experimentId: string): {
    resilient: boolean;
    affectedServices: string[];
    recommendations: string[];
  } {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return { resilient: false, affectedServices: [], recommendations: [] };
    }

    const experimentResults = this.results.filter((r) => r.experimentId === experimentId);

    const highSeverityIssues = experimentResults.flatMap((r) =>
      r.observations.filter((o) => o.severity === 'high')
    );

    const resilient = highSeverityIssues.length === 0;

    const affectedServices = Array.from(
      new Set(experimentResults.flatMap((r) => r.observations.map((o) => o.service)))
    );

    const recommendations = Array.from(
      new Set(experimentResults.flatMap((r) => r.recommendations))
    );

    return {
      resilient,
      affectedServices,
      recommendations,
    };
  }

  /**
   * Private: Generate recommendations
   */
  private generateRecommendations(severity: string, metricName: string): string[] {
    const recommendations: string[] = [];

    if (severity === 'high') {
      recommendations.push(`Critical degradation in ${metricName} - implement circuit breaker`);
      recommendations.push(`Add retry logic with exponential backoff for ${metricName}`);
      recommendations.push(`Consider timeout enforcement for ${metricName} operations`);
    } else if (severity === 'medium') {
      recommendations.push(`Monitor ${metricName} closely for further degradation`);
      recommendations.push(`Implement caching to reduce impact of ${metricName} latency`);
    }

    return recommendations;
  }

  /**
   * Get active injections
   */
  getActiveInjections(): FaultInjection[] {
    return Array.from(this.activeInjections.values()).filter((i) => i.enabled);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get chaos statistics
   */
  getStatistics(): Record<string, unknown> {
    const experiments = Array.from(this.experiments.values());
    const runningExperiments = experiments.filter((e) => e.status === 'running');
    const completedExperiments = experiments.filter((e) => e.status === 'completed');
    const failedExperiments = experiments.filter((e) => e.status === 'failed');

    const totalFaults = Array.from(this.activeInjections.values()).length;
    const enabledFaults = this.getActiveInjections().length;

    return {
      totalExperiments: experiments.length,
      runningExperiments: runningExperiments.length,
      completedExperiments: completedExperiments.length,
      failedExperiments: failedExperiments.length,
      totalFaultInjections: totalFaults,
      activeFaultInjections: enabledFaults,
      totalScenarios: this.scenarios.size,
      experimentResults: this.results.length,
      baselineMetricsRecorded: this.baselineMetrics.size,
    };
  }

  /**
   * Shutdown engine
   */
  shutdown(): void {
    this.experiments.clear();
    this.scenarios.clear();
    this.activeInjections.clear();
    this.results = [];
    this.baselineMetrics.clear();
  }
}

// Export singleton
export const chaosEngineeringEngine = new ChaosEngineeringEngine();
