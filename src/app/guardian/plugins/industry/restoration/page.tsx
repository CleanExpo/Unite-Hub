'use client';

/**
 * Guardian Plugin: Restoration Operations Dashboard
 *
 * Industry-specific intelligence for water/mould/fire restoration workflows.
 * Displays:
 * - Top-level status cards (alerts/incidents/correlations/risk)
 * - Signal detection results with severity badges
 * - Links back to core Guardian pages (insights, risk scoring, triage queue)
 * - Clear disclaimer: signals are heuristic, not compliance determinations
 * - Governance watermarks (INTERNAL if external sharing disabled)
 *
 * Read-only plugin; all data sourced from deriveRestorationSignals() service.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplet,
  Wind,
  Zap,
  Clock,
  Package,
  Repeat2,
  Moon,
  ArrowRight,
  ShieldAlert,
  Info,
  Lock
} from 'lucide-react';
import { RestorationOpsSignal, RestorationOpsSnapshot, SignalSeverity } from '@/lib/guardian/plugins/industry-restoration-pack/types';
import { deriveRestorationSignals, collectAggregateData } from '@/lib/guardian/plugins/industry-restoration-pack/signalService';
import { generateNarrative, formatNarrativeForUI } from '@/lib/guardian/plugins/narrativeService';
import type { NarrativeResponse } from '@/lib/guardian/plugins/narrativeService';

/**
 * Signal key to icon map
 */
const SIGNAL_ICON_MAP: Record<string, React.ReactNode> = {
  water_spike: <Droplet className="w-5 h-5" />,
  mould_risk_spike: <Wind className="w-5 h-5" />,
  fire_event_spike: <Zap className="w-5 h-5" />,
  sla_drift: <Clock className="w-5 h-5" />,
  equipment_overload: <Package className="w-5 h-5" />,
  repeat_incident_cluster: <Repeat2 className="w-5 h-5" />,
  afterhours_surge: <Moon className="w-5 h-5" />,
};

/**
 * Signal severity to color map
 */
const SEVERITY_COLOR_MAP: Record<SignalSeverity, { bg: string; text: string; border: string }> = {
  high: {
    bg: 'bg-error-950',
    text: 'text-error-300',
    border: 'border-error-700'
  },
  medium: {
    bg: 'bg-warning-950',
    text: 'text-warning-300',
    border: 'border-warning-700'
  },
  low: {
    bg: 'bg-info-950',
    text: 'text-info-300',
    border: 'border-info-700'
  }
};

/**
 * Status card component (top metrics)
 */
function StatusCard({
  title,
  value,
  subtext,
  icon,
  trend,
  color = 'accent'
}: {
  title: string;
  value: number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  color?: 'accent' | 'success' | 'warning' | 'error';
}) {
  const colorClasses = {
    accent: 'bg-accent-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    error: 'bg-error-500 text-white'
  };

  return (
    <Card className="bg-bg-card border-border-base hover:border-accent-500 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-text-secondary text-sm font-medium mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">{value}</span>
              {trend && (
                <div className="flex items-center gap-1 text-xs font-medium">
                  {trend === 'up' && <TrendingUp className="w-4 h-4 text-error-500" />}
                  {trend === 'down' && <TrendingDown className="w-4 h-4 text-success-500" />}
                  {trend === 'flat' && <Minus className="w-4 h-4 text-text-secondary" />}
                  <span className={trend === 'up' ? 'text-error-500' : trend === 'down' ? 'text-success-500' : 'text-text-secondary'}>
                    {trend === 'up' ? 'Rising' : trend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              )}
            </div>
            {subtext && <p className="text-text-secondary text-xs mt-1">{subtext}</p>}
          </div>
          <div className={`${colorClasses[color]} rounded-lg p-3 flex-shrink-0`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Signal row component (for signals table)
 */
function SignalRow({ signal, onLearnMore }: { signal: RestorationOpsSignal; onLearnMore: () => void }) {
  const colors = SEVERITY_COLOR_MAP[signal.severity];
  const icon = SIGNAL_ICON_MAP[signal.key];

  return (
    <div className={`border ${colors.border} ${colors.bg} rounded-lg p-4 flex items-start justify-between gap-4 transition-all hover:border-accent-500`}>
      <div className="flex gap-4 flex-1">
        <div className={`${colors.text} flex-shrink-0 mt-1`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`${colors.text} font-semibold text-sm`}>
              {signal.key.replace(/_/g, ' ').toUpperCase()}
            </h4>
            <Badge
              className={`${colors.bg} ${colors.text} border ${colors.border} capitalize text-xs`}
              variant="outline"
            >
              {signal.severity}
            </Badge>
            <Badge variant="outline" className="text-xs text-text-secondary bg-bg-hover border-border-subtle">
              {signal.window}
            </Badge>
          </div>
          <p className="text-text-secondary text-sm mb-2">{signal.rationale}</p>
          {signal.suggestedAction && <p className="text-accent-400 text-xs font-medium">→ {signal.suggestedAction}</p>}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLearnMore}
        className="flex-shrink-0 text-accent-400 hover:text-accent-500 hover:bg-bg-hover"
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * Main dashboard component
 */
export default function RestorationOpsDashboard() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [snapshot, setSnapshot] = useState<RestorationOpsSnapshot | null>(null);
  const [narrative, setNarrative] = useState<NarrativeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [governance, setGovernance] = useState<{ allowExternal: boolean; allowAI: boolean }>({
    allowExternal: false,
    allowAI: true
  });

  /**
   * Load snapshot on mount
   */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // In production, this would fetch from API:
        // const res = await fetch(`/api/guardian/plugins/industry/restoration/signals?workspaceId=${workspaceId}`);
        // For now, use placeholder data from collectAggregateData()
        const aggregateData = await collectAggregateData();
        const snap = await deriveRestorationSignals(aggregateData);
        
        // Generate AI narrative brief
        const narrativeResult = await generateNarrative({
          workspaceId: searchParams.get("workspaceId") || "mock-workspace",
          pluginKey: "industry_restoration_pack",
          pluginName: "Restoration Operations",
          signals: snap.signals,
          riskLabel: snap.totals.riskLabel,
          totals: snap.totals,
          allowExternal: isExternal
        });
        setNarrative(narrativeResult);
        setSnapshot(snap);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      load();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-hover rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-bg-hover rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="p-8">
        <Card className="bg-error-500/10 border-error-500/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-error-400">Failed to load signals</h3>
                <p className="text-text-secondary text-sm mt-1">{error || 'Unknown error'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totals, signals, warnings, disclaimer } = snapshot;
  const riskColors = {
    high: { bg: 'bg-error-500/10', text: 'text-error-500', border: 'border-error-500/50' },
    medium: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/50' },
    low: { bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/50' },
    unknown: { bg: 'bg-text-secondary/10', text: 'text-text-secondary', border: 'border-text-secondary/50' }
  };
  const riskColor = riskColors[totals.riskLabel];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Restoration Operations Dashboard</h1>
          <p className="text-text-secondary mt-1">Industry-specific operational intelligence for water, mould, and fire workflows</p>
        </div>
        {!governance.allowExternal && (
          <Badge className="bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-2 px-3 py-1">
            <Lock className="w-3 h-3" />
            INTERNAL
          </Badge>
        )}
      </div>

      {/* Top-Level Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Alerts (24h)"
          value={totals.alerts}
          subtext="Last 24 hours"
          icon={<AlertCircle className="w-6 h-6" />}
          color="accent"
        />
        <StatusCard
          title="Incidents (24h)"
          value={totals.incidents}
          subtext="Last 24 hours"
          icon={<ShieldAlert className="w-6 h-6" />}
          color="error"
        />
        <StatusCard
          title="Correlations (24h)"
          value={totals.correlations}
          subtext="Related events"
          icon={<Repeat2 className="w-6 h-6" />}
          color="warning"
        />
        <Card className={`${riskColor.bg} border ${riskColor.border}`}>
          <CardContent className="pt-6">
            <p className="text-text-secondary text-sm font-medium mb-2">Overall Risk</p>
            <p className={`${riskColor.text} text-2xl font-bold uppercase tracking-wider`}>{totals.riskLabel}</p>
            <p className="text-text-secondary text-xs mt-1">Current status</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment Section */}
      {totals.riskLabel === 'high' && (
        <Card className="bg-error-500/10 border border-error-500/50">
          <CardHeader>
            <CardTitle className="text-error-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              High Risk Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Multiple high-severity signals detected. Review operational load and consider escalation procedures.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Operational Signals</h2>
          <Badge variant="outline" className="bg-bg-hover border-border-subtle">
            {signals.length} detected
          </Badge>
        </div>

        {signals.length === 0 ? (
          <Card className="bg-bg-card border-border-base">
            <CardContent className="pt-6 text-center">
              <Info className="w-8 h-8 text-text-secondary mx-auto mb-2" />
              <p className="text-text-secondary">No operational signals detected. All systems nominal.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <SignalRow
                key={signal.key}
                signal={signal}
                onLearnMore={() => {
                  // In production, could navigate to detailed signal page or open modal
                  console.log(`Learn more about ${signal.key}`);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Warnings Section */}
      {warnings && warnings.length > 0 && (
        <Card className="bg-warning-500/10 border border-warning-500/50">
          <CardHeader>
            <CardTitle className="text-warning-500 text-base flex items-center gap-2">
              <Info className="w-4 h-4" />
              Data Quality Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-text-secondary text-sm">
              {warnings.map((warning, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-warning-500 flex-shrink-0">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Links Section */}
      <Card className="bg-bg-card border-border-base">
        <CardHeader>
          <CardTitle className="text-base">Related Resources</CardTitle>
          <CardDescription>Jump to core Guardian features for deeper analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-border-base hover:border-accent-500 text-left h-auto p-3 justify-start"
              asChild
            >
              <a href={`/guardian/admin/intelligence?workspaceId=${workspaceId}`}>
                <div>
                  <div className="font-medium text-text-primary">Intelligence Dashboard</div>
                  <div className="text-text-secondary text-xs">View H01-H05 insights</div>
                </div>
              </a>
            </Button>
            <Button
              variant="outline"
              className="border-border-base hover:border-accent-500 text-left h-auto p-3 justify-start"
              asChild
            >
              <a href={`/guardian/admin/risk?workspaceId=${workspaceId}`}>
                <div>
                  <div className="font-medium text-text-primary">Risk Scoring</div>
                  <div className="text-text-secondary text-xs">Check current risk metrics</div>
                </div>
              </a>
            </Button>
            <Button
              variant="outline"
              className="border-border-base hover:border-accent-500 text-left h-auto p-3 justify-start"
              asChild
            >
              <a href={`/guardian/admin/triage?workspaceId=${workspaceId}`}>
                <div>
                  <div className="font-medium text-text-primary">Triage Queue (H04)</div>
                  <div className="text-text-secondary text-xs">Review incident scores</div>
                </div>
              </a>
            </Button>
            <Button
              variant="outline"
              className="border-border-base hover:border-accent-500 text-left h-auto p-3 justify-start"
              asChild
            >
              <a href={`/guardian/admin/anomalies?workspaceId=${workspaceId}`}>
                <div>
                  <div className="font-medium text-text-primary">Anomalies (H02)</div>
                  <div className="text-text-secondary text-xs">View detected anomalies</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer Section */}
      <Card className="bg-bg-hover border-border-subtle">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-sm">
            <Info className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
            <div className="text-text-secondary">
              <p className="font-medium text-text-primary mb-1">Important Disclaimer</p>
              <p>{disclaimer}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
