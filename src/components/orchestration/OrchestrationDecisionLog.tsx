'use client';

/**
 * Orchestration Decision Log
 * Phase 84: Timeline of all orchestration decisions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Calendar,
} from 'lucide-react';

interface OrchestrationAction {
  id: string;
  created_at: string;
  action_type: string;
  decision_payload: Record<string, unknown>;
  risk_class: string;
  status: string;
  truth_notes?: string;
  confidence_score: number;
}

interface OrchestrationDecisionLogProps {
  actions: OrchestrationAction[];
  className?: string;
}

export function OrchestrationDecisionLog({
  actions,
  className = '',
}: OrchestrationDecisionLogProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'auto_executed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'awaiting_approval':
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Zap className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      select_asset: 'Asset Selected',
      time_choice: 'Time Chosen',
      variation_choice: 'Variation Chosen',
      evolution_step: 'Evolution Step',
      posting_decision: 'Posting Decision',
      schedule_created: 'Schedule Created',
      schedule_blocked: 'Schedule Blocked',
      schedule_approved: 'Schedule Approved',
      schedule_executed: 'Schedule Executed',
      schedule_failed: 'Schedule Failed',
      conflict_detected: 'Conflict Detected',
      fatigue_check: 'Fatigue Check',
    };
    return labels[type] || type;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
return 'Just now';
}
    if (diff < 3600000) {
return `${Math.floor(diff / 60000)}m ago`;
}
    if (diff < 86400000) {
return `${Math.floor(diff / 3600000)}h ago`;
}
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (actions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Decision Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No decisions recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Decision Log
          <Badge variant="secondary" className="ml-auto">
            {actions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {actions.map(action => (
            <div
              key={action.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5">
                {getStatusIcon(action.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {getActionLabel(action.action_type)}
                  </span>
                  <span className={`text-[10px] ${getRiskColor(action.risk_class)}`}>
                    {action.risk_class}
                  </span>
                  {action.confidence_score < 0.7 && (
                    <Badge variant="outline" className="text-[10px] text-yellow-500">
                      Low conf
                    </Badge>
                  )}
                </div>

                {/* Decision details */}
                {action.decision_payload.channel && (
                  <span className="text-xs text-muted-foreground">
                    Channel: {String(action.decision_payload.channel).toUpperCase()}
                  </span>
                )}

                {action.decision_payload.reasoning && (
                  <p className="text-xs text-muted-foreground truncate">
                    {String(action.decision_payload.reasoning)}
                  </p>
                )}

                {action.truth_notes && (
                  <p className="text-[10px] text-blue-500 truncate">
                    {action.truth_notes}
                  </p>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatTime(action.created_at)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
