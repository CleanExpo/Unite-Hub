/**
 * Technical Audit Summary Component
 * Displays Core Web Vitals and security metrics
 *
 * Features:
 * - CWV metrics (LCP, CLS, INP)
 * - Security score
 * - Pass/fail indicators
 */

'use client';

import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface TechnicalAuditSummaryProps {
  technical: {
    lcp: number;
    cls: number;
    inp: number;
    security: number;
  };
}

export function TechnicalAuditSummary({ technical }: TechnicalAuditSummaryProps) {
  // LCP thresholds: <2.5s = good
  const lcpStatus = technical.lcp < 2500 ? 'good' : technical.lcp < 4000 ? 'warning' : 'poor';
  // CLS thresholds: <0.1 = good
  const clsStatus = technical.cls < 0.1 ? 'good' : technical.cls < 0.25 ? 'warning' : 'poor';
  // INP thresholds: <200ms = good
  const inpStatus = technical.inp < 200 ? 'good' : technical.inp < 500 ? 'warning' : 'poor';

  const getStatusIcon = (status: string) => {
    if (status === 'good') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-amber-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'good') return 'bg-green-50 border-green-200';
    if (status === 'warning') return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusText = (status: string) => {
    if (status === 'good') return 'Passing';
    if (status === 'warning') return 'Warning';
    return 'Failing';
  };

  const securityScore = technical.security || 0;
  const securityStatus = securityScore >= 80 ? 'good' : securityScore >= 60 ? 'warning' : 'poor';

  return (
    <div className="bg-bg-card rounded-lg border border-border p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Technical Audit</h2>

      <div className="space-y-4">
        {/* Core Web Vitals */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Core Web Vitals</h3>

          {/* LCP */}
          <div className={`p-4 rounded-lg border ${getStatusColor(lcpStatus)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(lcpStatus)}
                <span className="font-semibold text-text-primary">Largest Contentful Paint (LCP)</span>
              </div>
              <span className="text-sm font-medium text-text-secondary">{getStatusText(lcpStatus)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-primary">{(technical.lcp / 1000).toFixed(2)}s</span>
              <span className="text-xs text-text-secondary">Target: &lt;2.5s</span>
            </div>
          </div>

          {/* CLS */}
          <div className={`p-4 rounded-lg border ${getStatusColor(clsStatus)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(clsStatus)}
                <span className="font-semibold text-text-primary">Cumulative Layout Shift (CLS)</span>
              </div>
              <span className="text-sm font-medium text-text-secondary">{getStatusText(clsStatus)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-primary">{technical.cls.toFixed(3)}</span>
              <span className="text-xs text-text-secondary">Target: &lt;0.1</span>
            </div>
          </div>

          {/* INP */}
          <div className={`p-4 rounded-lg border ${getStatusColor(inpStatus)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(inpStatus)}
                <span className="font-semibold text-text-primary">Interaction to Next Paint (INP)</span>
              </div>
              <span className="text-sm font-medium text-text-secondary">{getStatusText(inpStatus)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-primary">{technical.inp}ms</span>
              <span className="text-xs text-text-secondary">Target: &lt;200ms</span>
            </div>
          </div>
        </div>

        {/* Security Score */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Security</h3>

          <div className={`p-4 rounded-lg border ${getStatusColor(securityStatus)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(securityStatus)}
                <span className="font-semibold text-text-primary">Security Score</span>
              </div>
              <span className="text-sm font-medium text-text-secondary">{getStatusText(securityStatus)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-primary">{securityScore}/100</span>
              <span className="text-xs text-text-secondary">HTTPS, headers, etc.</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
          <div className="text-center p-3 bg-bg-primary rounded-lg">
            <div className="text-lg font-bold text-accent-500">
              {[lcpStatus, clsStatus, inpStatus].filter((s) => s === 'good').length}
            </div>
            <div className="text-xs text-text-secondary">Metrics Passing</div>
          </div>
          <div className="text-center p-3 bg-bg-primary rounded-lg">
            <div className="text-lg font-bold text-amber-600">
              {[lcpStatus, clsStatus, inpStatus].filter((s) => s === 'warning').length}
            </div>
            <div className="text-xs text-text-secondary">Warnings</div>
          </div>
          <div className="text-center p-3 bg-bg-primary rounded-lg">
            <div className="text-lg font-bold text-red-600">
              {[lcpStatus, clsStatus, inpStatus].filter((s) => s === 'poor').length}
            </div>
            <div className="text-xs text-text-secondary">Failing</div>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        {`Technical metrics: LCP ${(technical.lcp / 1000).toFixed(2)} seconds, CLS ${technical.cls.toFixed(3)}, INP ${technical.inp} milliseconds, Security score ${securityScore} out of 100.`}
      </div>
    </div>
  );
}
