'use client';

/**
 * DriftPanel Component
 * Phase 11 Week 7-8: Adaptive Strategy Refinement UI
 *
 * Shows drift signals, corrections, and cross-domain balancing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Scale,
  Zap,
} from 'lucide-react';

interface DriftSignal {
  id: string;
  signal_type: string;
  domain: string;
  metric_name: string | null;
  expected_value: number | null;
  actual_value: number | null;
  drift_percent: number | null;
  drift_direction: string | null;
  severity: string;
  impact_score: number | null;
  recommended_actions: string[];
  auto_correctable: boolean;
  resolved: boolean;
  detected_at: string;
}

interface PendingAdjustment {
  id: string;
  adjustment_target: string;
  domain: string | null;
  adjustment_type: string;
  change_magnitude: number;
  trigger_reason: string;
  confidence: number;
  expected_impact: number | null;
  created_at: string;
}

interface DomainBalance {
  domain: string;
  allocation: number;
  performance: number;
}

interface DriftPanelProps {
  organizationId: string;
}

export function DriftPanel({ organizationId }: DriftPanelProps) {
  const [signals, setSignals] = useState<DriftSignal[]>([]);
  const [pendingAdjustments, setPendingAdjustments] = useState<PendingAdjustment[]>([]);
  const [domainBalances, setDomainBalances] = useState<DomainBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<DriftSignal | null>(null);
  const [selectedAdjustment, setSelectedAdjustment] = useState<PendingAdjustment | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load drift signals
      const signalsResponse = await fetch(
        `/api/strategy/drift?organization_id=${organizationId}&resolved=false`
      );
      const signalsData = await signalsResponse.json();
      if (signalsData.success) {
        setSignals(signalsData.signals);
        setPendingAdjustments(signalsData.pending_adjustments);
      }

      // Load balance data
      const balanceResponse = await fetch('/api/strategy/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          action: 'balance',
        }),
      });
      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        const balances: DomainBalance[] = [
          { domain: 'SEO', allocation: balanceData.data.current_allocations.SEO, performance: balanceData.data.current_performance.SEO },
          { domain: 'GEO', allocation: balanceData.data.current_allocations.GEO, performance: balanceData.data.current_performance.GEO },
          { domain: 'CONTENT', allocation: balanceData.data.current_allocations.CONTENT, performance: balanceData.data.current_performance.CONTENT },
          { domain: 'ADS', allocation: balanceData.data.current_allocations.ADS, performance: balanceData.data.current_performance.ADS },
          { domain: 'CRO', allocation: balanceData.data.current_allocations.CRO, performance: balanceData.data.current_performance.CRO },
        ];
        setDomainBalances(balances);
      }
    } catch (error) {
      console.error('Failed to load drift data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveSignal = async (action: string) => {
    if (!selectedSignal) return;

    try {
      await fetch('/api/strategy/drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          signal_id: selectedSignal.id,
          resolution_action: action,
        }),
      });

      setSignals(prev => prev.filter(s => s.id !== selectedSignal.id));
      setIsResolveOpen(false);
      setSelectedSignal(null);
    } catch (error) {
      console.error('Failed to resolve signal:', error);
    }
  };

  const approveAdjustment = async (approved: boolean) => {
    if (!selectedAdjustment) return;

    try {
      await fetch('/api/strategy/drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          adjustment_id: selectedAdjustment.id,
          feedback,
          approved,
        }),
      });

      setPendingAdjustments(prev => prev.filter(a => a.id !== selectedAdjustment.id));
      setIsApproveOpen(false);
      setSelectedAdjustment(null);
      setFeedback('');
    } catch (error) {
      console.error('Failed to approve adjustment:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'STRENGTHEN':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'WEAKEN':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'ACCELERATE':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategy Drift & Refinement</h2>
          <p className="text-sm text-muted-foreground">
            Monitor drift signals and approve strategy adjustments
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Signals</p>
                <p className="text-2xl font-bold">{signals.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-500">
                  {signals.filter(s => s.severity === 'CRITICAL').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{pendingAdjustments.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Correctable</p>
                <p className="text-2xl font-bold text-green-500">
                  {signals.filter(s => s.auto_correctable).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Domain Balance
          </CardTitle>
          <CardDescription>Resource allocation vs performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {domainBalances.map((balance) => (
              <div key={balance.domain} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{balance.domain}</span>
                  <span className="text-muted-foreground">
                    {balance.allocation.toFixed(1)}% allocation | {balance.performance.toFixed(0)} perf
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Progress value={balance.allocation} className="h-2" />
                  </div>
                  <div className="flex-1">
                    <Progress
                      value={balance.performance}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drift Signals */}
      <Card>
        <CardHeader>
          <CardTitle>Active Drift Signals</CardTitle>
          <CardDescription>Deviations from expected performance</CardDescription>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No active drift signals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(signal.severity)}>
                        {signal.severity}
                      </Badge>
                      <Badge variant="outline">{signal.domain}</Badge>
                      <Badge variant="secondary">{signal.signal_type}</Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {signal.metric_name || 'Timeline'} drift: {signal.drift_direction}
                    </p>
                    {signal.drift_percent && (
                      <p className="text-sm text-muted-foreground">
                        Expected: {signal.expected_value?.toFixed(2)} |
                        Actual: {signal.actual_value?.toFixed(2)} |
                        Drift: {signal.drift_percent.toFixed(1)}%
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Detected: {new Date(signal.detected_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedSignal(signal);
                      setIsResolveOpen(true);
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Adjustments */}
      {pendingAdjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Adjustments</CardTitle>
            <CardDescription>Recommended strategy changes awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAdjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getAdjustmentIcon(adjustment.adjustment_type)}
                      <span className="font-medium">{adjustment.adjustment_type}</span>
                      <Badge variant="outline">{adjustment.adjustment_target}</Badge>
                      {adjustment.domain && (
                        <Badge variant="secondary">{adjustment.domain}</Badge>
                      )}
                    </div>
                    <p className="text-sm">{adjustment.trigger_reason}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Magnitude: {adjustment.change_magnitude.toFixed(1)}%</span>
                      <span>Confidence: {(adjustment.confidence * 100).toFixed(0)}%</span>
                      {adjustment.expected_impact && (
                        <span>Expected Impact: {adjustment.expected_impact.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAdjustment(adjustment);
                      setIsApproveOpen(true);
                    }}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolve Signal Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Drift Signal</DialogTitle>
            <DialogDescription>
              Choose an action to resolve this drift signal
            </DialogDescription>
          </DialogHeader>
          {selectedSignal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedSignal.domain} - {selectedSignal.metric_name || 'Timeline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drift: {selectedSignal.drift_percent?.toFixed(1)}% {selectedSignal.drift_direction}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(selectedSignal.recommended_actions as string[]).map((action, idx) => (
                    <li key={idx}>• {action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => resolveSignal('Acknowledged and monitored')}>
              Acknowledge
            </Button>
            <Button onClick={() => resolveSignal('Applied recommended action')}>
              Apply Fix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Adjustment Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Adjustment</DialogTitle>
            <DialogDescription>
              Approve or reject this strategy adjustment
            </DialogDescription>
          </DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getAdjustmentIcon(selectedAdjustment.adjustment_type)}
                  <span className="font-medium">{selectedAdjustment.adjustment_type}</span>
                </div>
                <p className="text-sm">{selectedAdjustment.trigger_reason}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>Magnitude: {selectedAdjustment.change_magnitude.toFixed(1)}%</span>
                  <span>Confidence: {(selectedAdjustment.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Feedback (optional)</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add any notes about this adjustment..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => approveAdjustment(false)}>
              Reject
            </Button>
            <Button onClick={() => approveAdjustment(true)}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DriftPanel;
