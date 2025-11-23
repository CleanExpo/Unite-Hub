/**
 * Chaos Test Engine
 * Phase 65: Controlled fault injection for resilience testing
 */

export type ApprovedFault =
  | 'ai_latency_spike'
  | 'delayed_queue_processing'
  | 'db_slow_read'
  | 'api_throttling_simulation'
  | 'cron_overlap'
  | 'dns_delay_simulation';

export type ChaosMode = 'safe' | 'aggressive' | 'extreme';

export interface ChaosTestConfig {
  fault: ApprovedFault;
  mode: ChaosMode;
  duration_seconds: number;
  intensity: number; // 0-100
  affected_services: string[];
  auto_pause_threshold: number;
}

export interface ChaosEvent {
  id: string;
  workspace_id: string;
  fault: ApprovedFault;
  mode: ChaosMode;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'aborted';
  started_at: string;
  completed_at?: string;
  metrics: ChaosMetrics;
  observations: ChaosObservation[];
  recovery_status: RecoveryStatus;
}

export interface ChaosMetrics {
  baseline_response_time: number;
  peak_response_time: number;
  error_rate_increase: number;
  recovery_time_seconds: number;
  cascading_failures: number;
  auto_recovery_triggered: boolean;
  circuit_breakers_activated: number;
}

export interface ChaosObservation {
  timestamp: string;
  type: 'degradation' | 'failure' | 'recovery' | 'cascade' | 'circuit_break';
  service: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryStatus {
  fully_recovered: boolean;
  recovery_time_seconds: number;
  manual_intervention_required: boolean;
  remaining_issues: string[];
}

// Blocked faults - never execute these
const BLOCKED_FAULTS = [
  'data_deletion',
  'unauthorized_writes',
  'security_bypass_attempts',
  'production_data_corruption',
  'credential_exposure',
];

// Fault configurations
const FAULT_CONFIGS: Record<ApprovedFault, {
  description: string;
  affected_areas: string[];
  risk_level: 'low' | 'medium' | 'high';
  auto_recovery: boolean;
}> = {
  ai_latency_spike: {
    description: 'Simulate AI model response delays (200ms-5000ms)',
    affected_areas: ['content_generation', 'contact_intelligence', 'creative_quality'],
    risk_level: 'low',
    auto_recovery: true,
  },
  delayed_queue_processing: {
    description: 'Simulate queue processing delays',
    affected_areas: ['email_processing', 'campaign_execution', 'job_workers'],
    risk_level: 'medium',
    auto_recovery: true,
  },
  db_slow_read: {
    description: 'Simulate database read latency spikes',
    affected_areas: ['all_queries', 'dashboard_stats', 'contact_lists'],
    risk_level: 'medium',
    auto_recovery: true,
  },
  api_throttling_simulation: {
    description: 'Simulate rate limiting on API endpoints',
    affected_areas: ['external_apis', 'ai_providers', 'email_services'],
    risk_level: 'low',
    auto_recovery: true,
  },
  cron_overlap: {
    description: 'Simulate concurrent cron job execution',
    affected_areas: ['scheduled_tasks', 'batch_processing', 'sync_jobs'],
    risk_level: 'medium',
    auto_recovery: true,
  },
  dns_delay_simulation: {
    description: 'Simulate DNS resolution delays',
    affected_areas: ['external_services', 'webhooks', 'integrations'],
    risk_level: 'low',
    auto_recovery: true,
  },
};

// Mode intensity multipliers
const MODE_MULTIPLIERS: Record<ChaosMode, number> = {
  safe: 0.5,
  aggressive: 1.0,
  extreme: 2.0,
};

export class ChaosTestEngine {
  private currentEvent: ChaosEvent | null = null;
  private isPaused = false;
  private killSwitchActive = false;

  /**
   * Start a chaos test (shadow mode only)
   */
  async startChaosTest(
    workspaceId: string,
    config: ChaosTestConfig
  ): Promise<ChaosEvent> {
    // Safety checks
    if (this.killSwitchActive) {
      throw new Error('Kill switch is active. Cannot start chaos test.');
    }

    if (BLOCKED_FAULTS.includes(config.fault as string)) {
      throw new Error(`Blocked fault type: ${config.fault}`);
    }

    const eventId = `chaos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentEvent = {
      id: eventId,
      workspace_id: workspaceId,
      fault: config.fault,
      mode: config.mode,
      status: 'active',
      started_at: new Date().toISOString(),
      metrics: {
        baseline_response_time: 150,
        peak_response_time: 0,
        error_rate_increase: 0,
        recovery_time_seconds: 0,
        cascading_failures: 0,
        auto_recovery_triggered: false,
        circuit_breakers_activated: 0,
      },
      observations: [],
      recovery_status: {
        fully_recovered: false,
        recovery_time_seconds: 0,
        manual_intervention_required: false,
        remaining_issues: [],
      },
    };

    // Run chaos simulation
    await this.runChaosSimulation(config);

    return this.currentEvent;
  }

  /**
   * Run chaos simulation (shadow mode)
   */
  private async runChaosSimulation(config: ChaosTestConfig): Promise<void> {
    if (!this.currentEvent) return;

    const faultConfig = FAULT_CONFIGS[config.fault];
    const intensityMultiplier = MODE_MULTIPLIERS[config.mode] * (config.intensity / 100);

    // Generate simulated observations
    const observations = this.generateObservations(config, faultConfig, intensityMultiplier);
    this.currentEvent.observations = observations;

    // Calculate metrics
    this.currentEvent.metrics = this.calculateChaosMetrics(config, intensityMultiplier);

    // Check auto-pause threshold
    if (this.currentEvent.metrics.error_rate_increase > config.auto_pause_threshold) {
      this.currentEvent.status = 'paused';
      this.currentEvent.observations.push({
        timestamp: new Date().toISOString(),
        type: 'circuit_break',
        service: 'chaos_engine',
        message: `Auto-paused: Error rate ${(this.currentEvent.metrics.error_rate_increase * 100).toFixed(1)}% exceeded threshold ${(config.auto_pause_threshold * 100).toFixed(1)}%`,
        severity: 'high',
      });
    } else {
      this.currentEvent.status = 'completed';
    }

    // Set recovery status
    this.currentEvent.recovery_status = this.calculateRecoveryStatus(config, faultConfig);
    this.currentEvent.completed_at = new Date().toISOString();
  }

  /**
   * Generate chaos observations
   */
  private generateObservations(
    config: ChaosTestConfig,
    faultConfig: typeof FAULT_CONFIGS[ApprovedFault],
    intensityMultiplier: number
  ): ChaosObservation[] {
    const observations: ChaosObservation[] = [];
    const duration = config.duration_seconds;

    // Initial degradation
    observations.push({
      timestamp: new Date(Date.now() - duration * 1000).toISOString(),
      type: 'degradation',
      service: faultConfig.affected_areas[0],
      message: `${config.fault} initiated in ${config.mode} mode`,
      severity: config.mode === 'extreme' ? 'high' : config.mode === 'aggressive' ? 'medium' : 'low',
    });

    // Peak impact
    const peakTime = duration * 0.4;
    observations.push({
      timestamp: new Date(Date.now() - (duration - peakTime) * 1000).toISOString(),
      type: 'failure',
      service: faultConfig.affected_areas[Math.floor(Math.random() * faultConfig.affected_areas.length)],
      message: `Peak degradation: ${Math.round(intensityMultiplier * 100)}% impact`,
      severity: intensityMultiplier > 1.5 ? 'critical' : intensityMultiplier > 1.0 ? 'high' : 'medium',
    });

    // Cascading effects (for aggressive/extreme modes)
    if (config.mode !== 'safe' && faultConfig.affected_areas.length > 1) {
      observations.push({
        timestamp: new Date(Date.now() - (duration * 0.3) * 1000).toISOString(),
        type: 'cascade',
        service: faultConfig.affected_areas[1],
        message: `Cascading effect detected in ${faultConfig.affected_areas[1]}`,
        severity: 'medium',
      });
    }

    // Circuit breaker activation
    if (intensityMultiplier > 0.8) {
      observations.push({
        timestamp: new Date(Date.now() - (duration * 0.2) * 1000).toISOString(),
        type: 'circuit_break',
        service: 'system',
        message: 'Circuit breaker activated to prevent cascading failures',
        severity: 'high',
      });
    }

    // Recovery
    observations.push({
      timestamp: new Date().toISOString(),
      type: 'recovery',
      service: 'system',
      message: `System recovering. Recovery time: ${Math.round(duration * 0.15)}s`,
      severity: 'low',
    });

    return observations;
  }

  /**
   * Calculate chaos metrics
   */
  private calculateChaosMetrics(
    config: ChaosTestConfig,
    intensityMultiplier: number
  ): ChaosMetrics {
    const baselineResponseTime = 150;
    const peakMultiplier = 1 + (intensityMultiplier * 4);

    return {
      baseline_response_time: baselineResponseTime,
      peak_response_time: baselineResponseTime * peakMultiplier,
      error_rate_increase: Math.min(intensityMultiplier * 0.1, 0.5),
      recovery_time_seconds: Math.round(config.duration_seconds * 0.15 * intensityMultiplier),
      cascading_failures: config.mode === 'safe' ? 0 : Math.round(intensityMultiplier * 2),
      auto_recovery_triggered: intensityMultiplier > 0.5,
      circuit_breakers_activated: intensityMultiplier > 0.8 ? Math.ceil(intensityMultiplier) : 0,
    };
  }

  /**
   * Calculate recovery status
   */
  private calculateRecoveryStatus(
    config: ChaosTestConfig,
    faultConfig: typeof FAULT_CONFIGS[ApprovedFault]
  ): RecoveryStatus {
    const recoveryTime = Math.round(config.duration_seconds * 0.15);
    const fullyRecovered = faultConfig.auto_recovery && config.mode !== 'extreme';

    return {
      fully_recovered: fullyRecovered,
      recovery_time_seconds: recoveryTime,
      manual_intervention_required: config.mode === 'extreme',
      remaining_issues: fullyRecovered
        ? []
        : ['Monitor for delayed cascading effects'],
    };
  }

  /**
   * Pause current chaos test
   */
  pauseTest(): void {
    this.isPaused = true;
    if (this.currentEvent) {
      this.currentEvent.status = 'paused';
      this.currentEvent.observations.push({
        timestamp: new Date().toISOString(),
        type: 'circuit_break',
        service: 'chaos_engine',
        message: 'Test paused by operator',
        severity: 'medium',
      });
    }
  }

  /**
   * Activate kill switch
   */
  activateKillSwitch(): void {
    this.killSwitchActive = true;
    if (this.currentEvent && this.currentEvent.status === 'active') {
      this.currentEvent.status = 'aborted';
      this.currentEvent.completed_at = new Date().toISOString();
      this.currentEvent.observations.push({
        timestamp: new Date().toISOString(),
        type: 'circuit_break',
        service: 'chaos_engine',
        message: 'KILL SWITCH ACTIVATED - All chaos tests aborted',
        severity: 'critical',
      });
    }
  }

  /**
   * Deactivate kill switch
   */
  deactivateKillSwitch(): void {
    this.killSwitchActive = false;
  }

  /**
   * Get current event
   */
  getCurrentEvent(): ChaosEvent | null {
    return this.currentEvent;
  }

  /**
   * Get available faults
   */
  getAvailableFaults(): ApprovedFault[] {
    return Object.keys(FAULT_CONFIGS) as ApprovedFault[];
  }

  /**
   * Get fault configuration
   */
  getFaultConfig(fault: ApprovedFault) {
    return FAULT_CONFIGS[fault];
  }

  /**
   * Check if fault is blocked
   */
  isFaultBlocked(fault: string): boolean {
    return BLOCKED_FAULTS.includes(fault);
  }

  /**
   * Get blocked faults list
   */
  getBlockedFaults(): string[] {
    return BLOCKED_FAULTS;
  }

  /**
   * Get mode multiplier
   */
  getModeMultiplier(mode: ChaosMode): number {
    return MODE_MULTIPLIERS[mode];
  }
}

export default ChaosTestEngine;
