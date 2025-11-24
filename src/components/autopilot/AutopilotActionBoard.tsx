'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  SkipForward,
  Zap
} from 'lucide-react';
import type { AutopilotAction } from '@/lib/autopilot';

interface AutopilotActionBoardProps {
  actions: AutopilotAction[];
  onApprove: (actionId: string) => Promise<void>;
  onSkip: (actionId: string) => Promise<void>;
}

export function AutopilotActionBoard({
  actions,
  onApprove,
  onSkip
}: AutopilotActionBoardProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (actionId: string) => {
    setProcessingId(actionId);
    try {
      await onApprove(actionId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSkip = async (actionId: string) => {
    setProcessingId(actionId);
    try {
      await onSkip(actionId);
    } finally {
      setProcessingId(null);
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500',
    };
    return colors[risk] || 'bg-gray-500';
  };

  const getStateBadge = (state: string) => {
    const styles: Record<string, { bg: string; icon: any }> = {
      suggested: { bg: 'bg-blue-500', icon: Zap },
      auto_executed: { bg: 'bg-green-500', icon: CheckCircle },
      approved_executed: { bg: 'bg-green-500', icon: CheckCircle },
      skipped: { bg: 'bg-gray-500', icon: SkipForward },
      rejected: { bg: 'bg-red-500', icon: XCircle },
    };
    return styles[state] || { bg: 'bg-gray-500', icon: AlertTriangle };
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      risk: '⚠️',
      optimisation: '🎯',
      creative: '🎨',
      scaling: '📈',
      reporting: '📊',
      outreach: '📧',
      retention: '🔄',
      financial: '💰',
    };
    return icons[category] || '📋';
  };

  // Group actions by state
  const suggested = actions.filter(a => a.state === 'suggested');
  const completed = actions.filter(a =>
    a.state === 'auto_executed' || a.state === 'approved_executed'
  );
  const skipped = actions.filter(a => a.state === 'skipped');

  return (
    <div className="space-y-6">
      {/* Awaiting Approval */}
      {suggested.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Awaiting Your Approval ({suggested.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggested.map((action) => (
              <div
                key={action.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(action.category)}</span>
                    <div>
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={getRiskBadge(action.riskClass)}>
                    {action.riskClass} risk
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span>Impact: {(action.impactEstimate * 100).toFixed(0)}%</span>
                    <span>Effort: {(action.effortEstimate * 100).toFixed(0)}%</span>
                    <span>Source: {action.sourceEngine}</span>
                  </div>
                </div>

                {action.truthNotes && (
                  <p className="text-xs italic text-muted-foreground border-l-2 pl-2">
                    {action.truthNotes}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(action.id)}
                    disabled={processingId === action.id}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Approve & Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSkip(action.id)}
                    disabled={processingId === action.id}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Actions */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <span>{getCategoryIcon(action.category)}</span>
                  <span className="font-medium">{action.title}</span>
                  {action.state === 'auto_executed' && (
                    <Badge variant="outline" className="text-xs">Auto</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {action.executedAt && new Date(action.executedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skipped Actions */}
      {skipped.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <SkipForward className="h-5 w-5" />
              Skipped ({skipped.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skipped.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-2 text-muted-foreground p-2"
              >
                <span>{getCategoryIcon(action.category)}</span>
                <span className="text-sm">{action.title}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {actions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No actions in this playbook yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
