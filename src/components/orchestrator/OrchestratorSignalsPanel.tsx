'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Signal {
  id: string;
  taskId: string;
  severity: 'P0' | 'P1' | 'P2';
  message: string;
  type: 'risk_escalation' | 'uncertainty_alert' | 'step_failure' | 'approval_required' | 'info';
  context?: Record<string, any>;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface OrchestratorSignalsPanelProps {
  signals: Signal[];
  taskId: string;
  isLoading?: boolean;
  onResolve?: (signalId: string) => Promise<void>;
  onPause?: () => Promise<void>;
  onHalt?: () => Promise<void>;
}

export function OrchestratorSignalsPanel({
  signals,
  taskId,
  isLoading = false,
  onResolve,
  onPause,
  onHalt,
}: OrchestratorSignalsPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'P1':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'P2':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'P0':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'P1':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'P2':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSignalTypeLabel = (type: string) => {
    switch (type) {
      case 'risk_escalation':
        return 'Risk Escalation';
      case 'uncertainty_alert':
        return 'Uncertainty Alert';
      case 'step_failure':
        return 'Step Failure';
      case 'approval_required':
        return 'Approval Required';
      case 'info':
        return 'Information';
      default:
        return type;
    }
  };

  const activeSignals = signals.filter((s) => !s.resolvedAt);
  const resolvedSignals = signals.filter((s) => s.resolvedAt);

  const p0Signals = activeSignals.filter((s) => s.severity === 'P0');
  const p1Signals = activeSignals.filter((s) => s.severity === 'P1');
  const p2Signals = activeSignals.filter((s) => s.severity === 'P2');

  const hasP0 = p0Signals.length > 0;
  const hasP1 = p1Signals.length > 0;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {hasP0 && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Critical Issues Detected</h3>
              <p className="text-sm text-red-800 mt-1">
                {p0Signals.length} P0 signal{p0Signals.length !== 1 ? 's' : ''} require immediate action.
                Workflow may be halted automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasP1 && !hasP0 && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">High Risk Signals</h3>
              <p className="text-sm text-yellow-800 mt-1">
                {p1Signals.length} P1 signal{p1Signals.length !== 1 ? 's' : ''} detected. Approval may be required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions */}
      {(hasP0 || hasP1) && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {onPause && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  disabled={isLoading}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  ⏸ Pause Workflow
                </Button>
              )}
              {onHalt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onHalt}
                  disabled={isLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  ⏹ Halt Workflow
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Active Signals {activeSignals.length > 0 && `(${activeSignals.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSignals.length === 0 ? (
            <p className="text-sm text-gray-500">No active signals</p>
          ) : (
            <div className="space-y-4">
              {[...p0Signals, ...p1Signals, ...p2Signals].map((signal) => (
                <div
                  key={signal.id}
                  className={`p-4 border rounded-lg ${getSeverityColor(signal.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(signal.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getSignalTypeLabel(signal.type)}
                        </Badge>
                        <Badge className="text-xs">{signal.severity}</Badge>
                      </div>
                      <p className="font-medium text-sm mb-1">{signal.message}</p>
                      {signal.context && Object.keys(signal.context).length > 0 && (
                        <details className="text-xs mt-2 cursor-pointer">
                          <summary className="opacity-70 hover:opacity-100">View context</summary>
                          <pre className="bg-black bg-opacity-5 p-2 rounded mt-2 text-xs overflow-x-auto max-h-24">
                            {JSON.stringify(signal.context, null, 2)}
                          </pre>
                        </details>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs opacity-70">
                          {new Date(signal.createdAt).toLocaleTimeString()}
                        </span>
                        {onResolve && !signal.resolvedAt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onResolve(signal.id)}
                            disabled={isLoading}
                            className="h-7 text-xs"
                          >
                            ✓ Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Severity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signal Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* P0 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Critical (P0)
                </span>
                <span className="text-sm font-semibold text-red-700">{p0Signals.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (p0Signals.length / Math.max(activeSignals.length, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* P1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  High (P1)
                </span>
                <span className="text-sm font-semibold text-yellow-700">{p1Signals.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (p1Signals.length / Math.max(activeSignals.length, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* P2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Low (P2)
                </span>
                <span className="text-sm font-semibold text-blue-700">{p2Signals.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (p2Signals.length / Math.max(activeSignals.length, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolved Signals */}
      {resolvedSignals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolved Signals ({resolvedSignals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {resolvedSignals.map((signal) => (
                <div key={signal.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{signal.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(signal.createdAt).toLocaleTimeString()} • Resolved by {signal.resolvedBy}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {signal.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
