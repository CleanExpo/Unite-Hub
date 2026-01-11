/**
 * Real-Time Threat Feed Component
 * WebSocket-powered list of detected security and SEO threats
 *
 * Features:
 * - Live threat updates via WebSocket
 * - Severity-based color coding
 * - Threat type badges
 * - Connection status awareness
 * - Empty and loading states
 */

'use client';

import { AlertTriangle, AlertCircle, Info, Shield, TrendingDown, Eye, Zap } from 'lucide-react';

interface Threat {
  id: string;
  threat?: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    title: string;
    description: string;
    domain?: string;
    impact?: string;
    detected_at?: string;
  };
}

interface ThreatSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface RealTimeThreatFeedProps {
  threats: Threat[];
  summary?: ThreatSummary;
  isConnected: boolean;
}

export function RealTimeThreatFeed({
  threats,
  summary,
  isConnected,
}: RealTimeThreatFeedProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-600" />;
      default:
        return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'ranking_drop':
        return <TrendingDown className="w-3.5 h-3.5" />;
      case 'competitor_surge':
        return <Zap className="w-3.5 h-3.5" />;
      case 'cwv_degradation':
        return <Eye className="w-3.5 h-3.5" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  // Loading state
  if (!isConnected && threats.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg border border-border p-8 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-bg-primary mb-3">
          <div className="w-6 h-6 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-text-secondary text-sm">Connecting to threat feed...</p>
      </div>
    );
  }

  // Empty state
  if (threats.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg border border-border p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-semibold text-text-primary mb-1">No Threats Detected</h3>
        <p className="text-text-secondary text-sm">Your website is monitoring clean</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-bg-card p-3 rounded-lg border border-border text-center">
            <div className="text-lg font-bold text-text-primary">{summary.critical}</div>
            <div className="text-xs text-red-600 font-medium">Critical</div>
          </div>
          <div className="bg-bg-card p-3 rounded-lg border border-border text-center">
            <div className="text-lg font-bold text-text-primary">{summary.high}</div>
            <div className="text-xs text-orange-600 font-medium">High</div>
          </div>
          <div className="bg-bg-card p-3 rounded-lg border border-border text-center">
            <div className="text-lg font-bold text-text-primary">{summary.medium}</div>
            <div className="text-xs text-yellow-600 font-medium">Medium</div>
          </div>
          <div className="bg-bg-card p-3 rounded-lg border border-border text-center">
            <div className="text-lg font-bold text-text-primary">{summary.low}</div>
            <div className="text-xs text-blue-600 font-medium">Low</div>
          </div>
        </div>
      )}

      {/* Threat List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {threats.map((item) => {
          const threat = item.threat;
          if (!threat) return null;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${getSeverityColor(threat.severity)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {getSeverityIcon(threat.severity)}
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">{threat.title}</h4>
                    <p className="text-xs text-text-secondary">{threat.domain || 'N/A'}</p>
                  </div>
                </div>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${getSeverityBadgeColor(
                    threat.severity,
                  )}`}
                >
                  {getThreatIcon(threat.type)}
                  {threat.severity}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-text-secondary mb-2">{threat.description}</p>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span className="capitalize">{threat.type.replace(/_/g, ' ')}</span>
                {threat.detected_at && (
                  <span>
                    {new Date(threat.detected_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {/* Impact */}
              {threat.impact && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs font-medium text-text-primary">
                    Impact: <span className="font-normal">{threat.impact}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
