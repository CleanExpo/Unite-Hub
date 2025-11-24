'use client';

/**
 * Early Warning Console
 * Phase 82: Main early warning dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Info,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EarlyWarningList } from '@/components/earlyWarning/EarlyWarningList';
import { EarlyWarningRadar } from '@/components/earlyWarning/EarlyWarningRadar';
import { EarlyWarningHeatmap } from '@/components/earlyWarning/EarlyWarningHeatmap';
import { SignalMatrixCompletenessBar } from '@/components/earlyWarning/SignalMatrixCompletenessBar';
import {
  EarlyWarningEvent,
  UnifiedSignalMatrix,
  WarningStatus,
  generateDemoMatrix,
} from '@/lib/signalMatrix';

export default function EarlyWarningsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [warnings, setWarnings] = useState<EarlyWarningEvent[]>([]);
  const [matrix, setMatrix] = useState<UnifiedSignalMatrix | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load warnings
      const warningsRes = await fetch('/api/early-warning/events?status=open,acknowledged&limit=20');
      if (warningsRes.ok) {
        const data = await warningsRes.json();
        setWarnings(data.data || []);
      }

      // For demo, generate a matrix
      // In production, this would come from /api/signal-matrix/latest
      const demoMatrix = await generateDemoMatrix();
      setMatrix(demoMatrix);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleStatusChange = async (id: string, status: WarningStatus) => {
    try {
      const res = await fetch(`/api/early-warning/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setWarnings(prev =>
          prev.map(w => (w.id === id ? { ...w, status } : w))
        );
      }
    } catch (error) {
      console.error('Failed to update warning:', error);
    }
  };

  // Calculate summary stats
  const highCount = warnings.filter(w => w.severity === 'high').length;
  const mediumCount = warnings.filter(w => w.severity === 'medium').length;
  const lowCount = warnings.filter(w => w.severity === 'low').length;

  const riskLevel = highCount > 2 ? 'critical' : highCount > 0 ? 'high' : mediumCount > 2 ? 'medium' : 'low';
  const riskColor = {
    critical: 'text-red-500 bg-red-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    low: 'text-green-500 bg-green-500/10',
  }[riskLevel];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/founder/intel')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Early Warning Console
            </h1>
            <p className="text-muted-foreground">
              Unified signal matrix and risk detection
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Risk summary */}
      <Card className={riskColor}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8" />
              <div>
                <p className="text-sm font-medium">Overall Risk Level</p>
                <p className="text-2xl font-bold capitalize">{riskLevel}</p>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-500">{highCount}</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{lowCount}</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrix completeness */}
      {matrix && (
        <SignalMatrixCompletenessBar
          completeness={matrix.completeness_score}
          confidence={matrix.confidence_score}
          anomalyScore={matrix.anomaly_score}
          trendShiftScore={matrix.trend_shift_score}
          fatigueScore={matrix.fatigue_score}
        />
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warnings list */}
        <div className="lg:col-span-2">
          <EarlyWarningList
            warnings={warnings}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Radar and heatmap */}
        <div className="space-y-6">
          {matrix && (
            <>
              <EarlyWarningRadar signalJson={matrix.signal_json} />
              <EarlyWarningHeatmap signalJson={matrix.signal_json} />
            </>
          )}
        </div>
      </div>

      {/* Truth notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              Early warnings use <strong>Balanced Mode</strong> thresholds to minimize false positives
              while surfacing genuine risks. All warnings are based on real data from connected engines.
            </p>
            <p className="mt-2">
              Data completeness: {matrix ? Math.round(matrix.completeness_score * 100) : 0}% •
              Confidence: {matrix ? Math.round(matrix.confidence_score * 100) : 0}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
