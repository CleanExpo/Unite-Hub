/**
 * Proactive Monitor — Health, Version & Performance Monitoring
 *
 * Watches agent performance, system resources, integration health,
 * and business metric anomalies. Generates prioritized suggestions
 * like "Update to latest Anthropic SDK" or "Agent X degraded — restart".
 *
 * @module agents/proactive-monitor
 */

import { AGENT_CARDS } from '@/lib/agents/unified-registry';
import type { UnifiedAgentId } from '@/lib/agents/unified-registry';
import { readFileSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SuggestionCategory =
  | 'performance'
  | 'health'
  | 'security'
  | 'version'
  | 'cost'
  | 'integration'
  | 'anomaly';

export interface MonitorSuggestion {
  id: string;
  priority: SuggestionPriority;
  category: SuggestionCategory;
  title: string;
  description: string;
  action?: string; // Actionable next step
  metadata?: Record<string, unknown>;
  detectedAt: string;
}

export interface AgentPerformanceSnapshot {
  agentId: UnifiedAgentId;
  state: string;
  successRate: number;
  avgExecutionTimeMs: number;
  totalExecutions: number;
  activeExecutions: number;
  issues: string[];
}

export interface SystemHealthReport {
  timestamp: string;
  agents: AgentPerformanceSnapshot[];
  system: {
    heapUsedMB: number;
    heapTotalMB: number;
    heapUsagePercent: number;
    uptimeSeconds: number;
  };
  integrations: IntegrationStatus[];
  suggestions: MonitorSuggestion[];
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  envVar: string;
  required: boolean;
}

export interface AnomalyDetection {
  metric: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  deviation: number; // Standard deviations from mean
  isAnomaly: boolean;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const INTEGRATION_CHECKS: Array<{
  name: string;
  envVar: string;
  required: boolean;
}> = [
  { name: 'Anthropic API', envVar: 'ANTHROPIC_API_KEY', required: true },
  { name: 'Supabase URL', envVar: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { name: 'Supabase Anon Key', envVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
  { name: 'Supabase Service Role', envVar: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
  { name: 'Google OAuth', envVar: 'GOOGLE_CLIENT_ID', required: true },
  { name: 'SendGrid', envVar: 'SENDGRID_API_KEY', required: false },
  { name: 'Resend', envVar: 'RESEND_API_KEY', required: false },
  { name: 'Perplexity (SEO)', envVar: 'PERPLEXITY_API_KEY', required: false },
  { name: 'OpenRouter', envVar: 'OPENROUTER_API_KEY', required: false },
  { name: 'Stripe', envVar: 'STRIPE_SECRET_KEY', required: false },
  { name: 'Redis', envVar: 'REDIS_URL', required: false },
];

const PERFORMANCE_THRESHOLDS = {
  successRateWarning: 0.85,
  successRateCritical: 0.5,
  executionTimeWarningMs: 30_000,
  executionTimeCriticalMs: 120_000,
  heapUsageWarning: 0.75,
  heapUsageCritical: 0.9,
} as const;

// ---------------------------------------------------------------------------
// ProactiveMonitor Class
// ---------------------------------------------------------------------------

export class ProactiveMonitor {
  private metricHistory: Map<string, number[]> = new Map();
  private lastReport: SystemHealthReport | null = null;

  // -------------------------------------------------------------------------
  // Agent Performance
  // -------------------------------------------------------------------------

  /**
   * Snapshot performance metrics from all registered agents.
   */
  getAgentPerformance(): AgentPerformanceSnapshot[] {
    const snapshots: AgentPerformanceSnapshot[] = [];

    for (const [id, card] of Object.entries(AGENT_CARDS)) {
      const metrics = card.metrics;
      const issues: string[] = [];

      // Check success rate
      if (
        metrics.totalExecutions > 0 &&
        metrics.successRate < PERFORMANCE_THRESHOLDS.successRateCritical
      ) {
        issues.push(
          `Critical: Success rate ${(metrics.successRate * 100).toFixed(0)}% (below ${PERFORMANCE_THRESHOLDS.successRateCritical * 100}%)`
        );
      } else if (
        metrics.totalExecutions > 0 &&
        metrics.successRate < PERFORMANCE_THRESHOLDS.successRateWarning
      ) {
        issues.push(
          `Warning: Success rate ${(metrics.successRate * 100).toFixed(0)}% (below ${PERFORMANCE_THRESHOLDS.successRateWarning * 100}%)`
        );
      }

      // Check execution time
      if (
        metrics.averageExecutionTimeMs >
        PERFORMANCE_THRESHOLDS.executionTimeCriticalMs
      ) {
        issues.push(
          `Critical: Avg execution ${(metrics.averageExecutionTimeMs / 1000).toFixed(1)}s (>${PERFORMANCE_THRESHOLDS.executionTimeCriticalMs / 1000}s)`
        );
      } else if (
        metrics.averageExecutionTimeMs >
        PERFORMANCE_THRESHOLDS.executionTimeWarningMs
      ) {
        issues.push(
          `Warning: Avg execution ${(metrics.averageExecutionTimeMs / 1000).toFixed(1)}s (>${PERFORMANCE_THRESHOLDS.executionTimeWarningMs / 1000}s)`
        );
      }

      // Check degraded state
      if (card.currentState === 'degraded') {
        issues.push('Agent in degraded state');
      }

      snapshots.push({
        agentId: id as UnifiedAgentId,
        state: card.currentState,
        successRate: metrics.successRate,
        avgExecutionTimeMs: metrics.averageExecutionTimeMs,
        totalExecutions: metrics.totalExecutions,
        activeExecutions: metrics.activeExecutions,
        issues,
      });
    }

    return snapshots;
  }

  // -------------------------------------------------------------------------
  // System Resources
  // -------------------------------------------------------------------------

  getSystemResources() {
    const mem = process.memoryUsage();
    return {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100) / 100,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  // -------------------------------------------------------------------------
  // Integration Health
  // -------------------------------------------------------------------------

  checkIntegrations(): IntegrationStatus[] {
    return INTEGRATION_CHECKS.map((check) => ({
      name: check.name,
      configured: !!process.env[check.envVar],
      envVar: check.envVar,
      required: check.required,
    }));
  }

  // -------------------------------------------------------------------------
  // Anomaly Detection
  // -------------------------------------------------------------------------

  /**
   * Record a metric value for trend analysis.
   */
  recordMetric(metricName: string, value: number): void {
    const history = this.metricHistory.get(metricName) ?? [];
    history.push(value);
    // Keep last 100 data points
    if (history.length > 100) history.shift();
    this.metricHistory.set(metricName, history);
  }

  /**
   * Check if a metric value is anomalous using statistical outlier detection.
   * Anomaly = value deviates > 2.5 standard deviations from the mean.
   */
  detectAnomaly(metricName: string, currentValue: number): AnomalyDetection {
    const history = this.metricHistory.get(metricName) ?? [];

    if (history.length < 5) {
      return {
        metric: metricName,
        currentValue,
        expectedRange: { min: 0, max: Infinity },
        deviation: 0,
        isAnomaly: false,
      };
    }

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance =
      history.reduce((sum, v) => sum + (v - mean) ** 2, 0) / history.length;
    const stdDev = Math.sqrt(variance);

    const deviation = stdDev > 0 ? Math.abs(currentValue - mean) / stdDev : 0;

    return {
      metric: metricName,
      currentValue,
      expectedRange: {
        min: Math.max(0, mean - 2.5 * stdDev),
        max: mean + 2.5 * stdDev,
      },
      deviation: Math.round(deviation * 100) / 100,
      isAnomaly: deviation > 2.5,
    };
  }

  // -------------------------------------------------------------------------
  // Suggestion Generation
  // -------------------------------------------------------------------------

  generateSuggestions(): MonitorSuggestion[] {
    const suggestions: MonitorSuggestion[] = [];
    const now = new Date().toISOString();
    let idCounter = 0;
    const nextId = () => `sug_${Date.now()}_${idCounter++}`;

    // 1. Agent performance suggestions
    const agentPerf = this.getAgentPerformance();
    for (const agent of agentPerf) {
      if (agent.issues.length > 0) {
        const isCritical = agent.issues.some((i) => i.startsWith('Critical'));
        suggestions.push({
          id: nextId(),
          priority: isCritical ? 'critical' : 'high',
          category: 'performance',
          title: `Agent "${agent.agentId}" performance degraded`,
          description: agent.issues.join('; '),
          action: isCritical
            ? `Restart agent ${agent.agentId} or investigate logs`
            : `Monitor agent ${agent.agentId} — may self-recover`,
          metadata: {
            agentId: agent.agentId,
            successRate: agent.successRate,
            avgMs: agent.avgExecutionTimeMs,
          },
          detectedAt: now,
        });
      }
    }

    // 2. System resource suggestions
    const system = this.getSystemResources();
    if (system.heapUsagePercent >= PERFORMANCE_THRESHOLDS.heapUsageCritical) {
      suggestions.push({
        id: nextId(),
        priority: 'critical',
        category: 'health',
        title: 'Memory usage critical',
        description: `Heap usage at ${(system.heapUsagePercent * 100).toFixed(0)}% (${system.heapUsedMB}MB / ${system.heapTotalMB}MB)`,
        action: 'Restart application or investigate memory leaks',
        metadata: { heapUsedMB: system.heapUsedMB },
        detectedAt: now,
      });
    } else if (
      system.heapUsagePercent >= PERFORMANCE_THRESHOLDS.heapUsageWarning
    ) {
      suggestions.push({
        id: nextId(),
        priority: 'high',
        category: 'health',
        title: 'Memory usage elevated',
        description: `Heap usage at ${(system.heapUsagePercent * 100).toFixed(0)}% (${system.heapUsedMB}MB / ${system.heapTotalMB}MB)`,
        action: 'Monitor memory trend — may need restart soon',
        metadata: { heapUsedMB: system.heapUsedMB },
        detectedAt: now,
      });
    }

    // 3. Integration health suggestions
    const integrations = this.checkIntegrations();
    const missingRequired = integrations.filter(
      (i) => i.required && !i.configured
    );
    const missingOptional = integrations.filter(
      (i) => !i.required && !i.configured
    );

    for (const missing of missingRequired) {
      suggestions.push({
        id: nextId(),
        priority: 'critical',
        category: 'integration',
        title: `Required integration missing: ${missing.name}`,
        description: `Environment variable ${missing.envVar} is not set`,
        action: `Set ${missing.envVar} in your .env file`,
        detectedAt: now,
      });
    }

    if (missingOptional.length > 0) {
      suggestions.push({
        id: nextId(),
        priority: 'info',
        category: 'integration',
        title: `${missingOptional.length} optional integration(s) not configured`,
        description: missingOptional.map((i) => i.name).join(', '),
        action: 'Configure these integrations to unlock additional features',
        metadata: {
          integrations: missingOptional.map((i) => ({
            name: i.name,
            envVar: i.envVar,
          })),
        },
        detectedAt: now,
      });
    }

    // 4. Security suggestions
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
        suggestions.push({
          id: nextId(),
          priority: 'critical',
          category: 'security',
          title: 'Weak or missing NEXTAUTH_SECRET',
          description:
            'NEXTAUTH_SECRET should be at least 32 characters in production',
          action: 'Generate a strong secret: openssl rand -base64 32',
          detectedAt: now,
        });
      }
    }

    // 5. Dependency version scanning
    const depSuggestions = this.scanDependencyVersions();
    suggestions.push(...depSuggestions);

    // 6. Idle agent suggestions
    const idleAgents = agentPerf.filter(
      (a) => a.totalExecutions === 0 && a.state === 'idle'
    );
    if (idleAgents.length > 5) {
      suggestions.push({
        id: nextId(),
        priority: 'low',
        category: 'cost',
        title: `${idleAgents.length} agents have never executed`,
        description: `Agents ${idleAgents
          .slice(0, 5)
          .map((a) => a.agentId)
          .join(', ')} have 0 executions`,
        action:
          'Review if these agents are needed or if routing is misconfigured',
        detectedAt: now,
      });
    }

    return suggestions.sort((a, b) => {
      const order: Record<SuggestionPriority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      };
      return order[a.priority] - order[b.priority];
    });
  }

  // -------------------------------------------------------------------------
  // Dependency & Version Scanning
  // -------------------------------------------------------------------------

  /**
   * Scan key dependencies for known version concerns.
   * Reads package.json at startup and checks against known ranges.
   */
  scanDependencyVersions(): MonitorSuggestion[] {
    const suggestions: MonitorSuggestion[] = [];
    const now = new Date().toISOString();
    let idCounter = 1000;
    const nextId = () => `dep_${Date.now()}_${idCounter++}`;

    try {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Critical packages to monitor
      const criticalPackages: Array<{
        name: string;
        minRecommended: string;
        reason: string;
      }> = [
        {
          name: '@anthropic-ai/sdk',
          minRecommended: '0.35.0',
          reason: 'Older SDK versions lack prompt caching and extended thinking support',
        },
        {
          name: 'next',
          minRecommended: '15.0.0',
          reason: 'Next.js 15+ includes Turbopack stable and React 19 support',
        },
        {
          name: '@supabase/supabase-js',
          minRecommended: '2.40.0',
          reason: 'Older versions have known auth edge cases with PKCE flow',
        },
        {
          name: 'typescript',
          minRecommended: '5.3.0',
          reason: 'TypeScript 5.3+ has import attributes and decorator support',
        },
      ];

      for (const check of criticalPackages) {
        const installed = deps[check.name];
        if (!installed) continue;

        // Extract major.minor from semver string (strip ^ ~ etc)
        const cleanVersion = installed.replace(/^[^0-9]*/, '');
        const installedMajor = parseInt(cleanVersion.split('.')[0] || '0', 10);
        const recommendedMajor = parseInt(
          check.minRecommended.split('.')[0] || '0',
          10
        );

        if (installedMajor < recommendedMajor) {
          suggestions.push({
            id: nextId(),
            priority: 'medium',
            category: 'version',
            title: `Update ${check.name}`,
            description: `Installed: ${installed}, recommended: >=${check.minRecommended}. ${check.reason}`,
            action: `Run: npm install ${check.name}@latest`,
            metadata: {
              package: check.name,
              installed,
              recommended: check.minRecommended,
            },
            detectedAt: now,
          });
        }
      }

      // Check for unused/deprecated packages
      const deprecatedPackages = [
        { name: 'styled-jsx', reason: 'Not used in project (Tailwind CSS used instead)' },
        { name: 'convex', reason: 'No imports found in codebase' },
        { name: 'react-player', reason: 'No imports found in codebase' },
        { name: 'amqplib', reason: 'Only referenced in unused base-agent.ts' },
      ];

      for (const dep of deprecatedPackages) {
        if (deps[dep.name]) {
          suggestions.push({
            id: nextId(),
            priority: 'low',
            category: 'cost',
            title: `Remove unused package: ${dep.name}`,
            description: dep.reason,
            action: `Run: npm uninstall ${dep.name}`,
            metadata: { package: dep.name },
            detectedAt: now,
          });
        }
      }

      // Node.js version check
      const nodeVersion = process.version;
      const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0] || '0', 10);
      if (nodeMajor < 20) {
        suggestions.push({
          id: nextId(),
          priority: 'high',
          category: 'version',
          title: 'Update Node.js',
          description: `Running Node.js ${nodeVersion}. Node 20+ LTS recommended for Next.js 15+.`,
          action: 'Update to Node.js 20 LTS or later',
          metadata: { nodeVersion },
          detectedAt: now,
        });
      }
    } catch {
      // package.json not accessible at runtime — skip
    }

    return suggestions;
  }

  // -------------------------------------------------------------------------
  // Full Health Report
  // -------------------------------------------------------------------------

  /**
   * Generate a comprehensive health report with all checks and suggestions.
   */
  generateReport(): SystemHealthReport {
    const agents = this.getAgentPerformance();
    const system = this.getSystemResources();
    const integrations = this.checkIntegrations();
    const suggestions = this.generateSuggestions();

    // Determine overall health
    const hasCritical = suggestions.some((s) => s.priority === 'critical');
    const hasHigh = suggestions.some((s) => s.priority === 'high');

    let overallHealth: SystemHealthReport['overallHealth'] = 'healthy';
    if (hasCritical) overallHealth = 'critical';
    else if (hasHigh) overallHealth = 'degraded';

    const report: SystemHealthReport = {
      timestamp: new Date().toISOString(),
      agents,
      system,
      integrations,
      suggestions,
      overallHealth,
    };

    this.lastReport = report;
    return report;
  }

  /**
   * Get the last generated report (if any).
   */
  getLastReport(): SystemHealthReport | null {
    return this.lastReport;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const proactiveMonitor = new ProactiveMonitor();
