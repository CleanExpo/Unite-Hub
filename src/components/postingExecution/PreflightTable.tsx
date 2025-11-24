'use client';

/**
 * Preflight Table
 * Phase 87: Display preflight check results
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PreflightCheck {
  passed: boolean;
  reason?: string;
  score?: number;
}

interface PreflightResult {
  id: string;
  createdAt: string;
  channel: string;
  passed: boolean;
  confidenceScore: number;
  riskLevel: string;
  blockedBy?: string;
  blockReason?: string;
  checks: {
    earlyWarning: PreflightCheck;
    performanceReality: PreflightCheck;
    scalingMode: PreflightCheck;
    clientPolicy: PreflightCheck;
    fatigue: PreflightCheck;
    compliance: PreflightCheck;
    truthLayer: PreflightCheck;
  };
}

interface PreflightTableProps {
  preflights: PreflightResult[];
  className?: string;
}

const channelColors: Record<string, string> = {
  fb: 'bg-blue-500',
  ig: 'bg-pink-500',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-500',
  gmb: 'bg-green-500',
  reddit: 'bg-orange-500',
  email: 'bg-gray-500',
  x: 'bg-black',
};

const riskColors: Record<string, string> = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

export function PreflightTable({ preflights, className = '' }: PreflightTableProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCheckIcon = (check: PreflightCheck) => {
    if (check.passed) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  if (preflights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Preflight Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No preflight checks yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Preflight Checks
          <Badge variant="secondary" className="ml-auto">
            {preflights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {preflights.map(preflight => (
            <div
              key={preflight.id}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {preflight.passed ? (
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <ShieldX className="h-4 w-4 text-red-500" />
                  )}
                  <Badge className={channelColors[preflight.channel] || 'bg-gray-500'}>
                    {preflight.channel.toUpperCase()}
                  </Badge>
                  <span className={`text-sm font-medium ${riskColors[preflight.riskLevel]}`}>
                    {(preflight.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTime(preflight.createdAt)}
                </span>
              </div>

              {/* Check results */}
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="flex items-center gap-1" title="Early Warning">
                  {getCheckIcon(preflight.checks.earlyWarning)}
                  <span className="text-[10px]">EW</span>
                </div>
                <div className="flex items-center gap-1" title="Performance Reality">
                  {getCheckIcon(preflight.checks.performanceReality)}
                  <span className="text-[10px]">PR</span>
                </div>
                <div className="flex items-center gap-1" title="Scaling Mode">
                  {getCheckIcon(preflight.checks.scalingMode)}
                  <span className="text-[10px]">SM</span>
                </div>
                <div className="flex items-center gap-1" title="Client Policy">
                  {getCheckIcon(preflight.checks.clientPolicy)}
                  <span className="text-[10px]">CP</span>
                </div>
                <div className="flex items-center gap-1" title="Fatigue">
                  {getCheckIcon(preflight.checks.fatigue)}
                  <span className="text-[10px]">FT</span>
                </div>
                <div className="flex items-center gap-1" title="Compliance">
                  {getCheckIcon(preflight.checks.compliance)}
                  <span className="text-[10px]">CO</span>
                </div>
                <div className="flex items-center gap-1" title="Truth Layer">
                  {getCheckIcon(preflight.checks.truthLayer)}
                  <span className="text-[10px]">TL</span>
                </div>
              </div>

              {/* Block reason */}
              {!preflight.passed && preflight.blockReason && (
                <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{preflight.blockReason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
