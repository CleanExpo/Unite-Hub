'use client';

/**
 * Posting Safety Summary
 * Phase 85: Displays guardrail evaluations for each attempt
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface SafetyCheck {
  name: string;
  passed: boolean;
  reason?: string;
  severity: 'info' | 'warning' | 'error';
}

interface SafetyCheckResults {
  all_passed: boolean;
  checks: SafetyCheck[];
  blocked_by?: string;
  warnings: string[];
  timestamp: string;
}

interface PostingSafetySummaryProps {
  safetyResults: SafetyCheckResults;
  className?: string;
}

export function PostingSafetySummary({
  safetyResults,
  className = '',
}: PostingSafetySummaryProps) {
  const getCheckIcon = (check: SafetyCheck) => {
    if (check.passed) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    switch (check.severity) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  const getCheckName = (name: string) => {
    const names: Record<string, string> = {
      engine_enabled: 'Engine Enabled',
      early_warnings: 'Early Warnings',
      confidence_threshold: 'Confidence',
      channel_fatigue: 'Channel Fatigue',
      approval_required: 'Approval',
      rate_limit: 'Rate Limits',
      channel_connection: 'Connection',
      truth_compliance: 'Truth Layer',
    };
    return names[name] || name;
  };

  const passedCount = safetyResults.checks.filter(c => c.passed).length;
  const totalCount = safetyResults.checks.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Safety Evaluation
          <Badge
            variant={safetyResults.all_passed ? 'default' : 'destructive'}
            className="ml-auto"
          >
            {passedCount}/{totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Overall status */}
          <div
            className={`p-2 rounded-lg ${
              safetyResults.all_passed
                ? 'bg-green-500/10 text-green-700'
                : 'bg-red-500/10 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {safetyResults.all_passed ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  All checks passed
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Blocked by: {safetyResults.blocked_by || 'Safety check'}
                </>
              )}
            </div>
          </div>

          {/* Individual checks */}
          <div className="space-y-1">
            {safetyResults.checks.map((check, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {getCheckIcon(check)}
                  <span className="text-sm">{getCheckName(check.name)}</span>
                </div>
                {check.reason && (
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {check.reason}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Warnings */}
          {safetyResults.warnings.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-yellow-500 mb-1">Warnings:</p>
              <ul className="space-y-1">
                {safetyResults.warnings.map((warning, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground">
              Evaluated: {new Date(safetyResults.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
