'use client';

/**
 * Agent Run History
 * Phase 83: Display history of agent sessions and actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface ActionHistoryItem {
  id: string;
  created_at: string;
  action_type: string;
  approval_status: string;
  risk_level: string;
  execution_result?: {
    success: boolean;
    message: string;
  };
  agent_reasoning?: string;
}

interface AgentRunHistoryProps {
  actions: ActionHistoryItem[];
  onViewDetails?: (actionId: string) => void;
  className?: string;
}

export function AgentRunHistory({
  actions,
  onViewDetails,
  className = '',
}: AgentRunHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_executed':
      case 'approved_executed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'awaiting_approval':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'auto_executed':
        return 'Auto';
      case 'approved_executed':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'awaiting_approval':
        return 'Pending';
      default:
        return status;
    }
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

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (actions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Action History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-4">
            No actions recorded yet
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
          Action History
          <Badge variant="secondary" className="ml-auto">
            {actions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map(action => (
          <div
            key={action.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onViewDetails?.(action.id)}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(action.approval_status)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {action.action_type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] ${getRiskColor(action.risk_level)}`}>
                    {action.risk_level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {action.execution_result?.message ||
                    action.agent_reasoning?.substring(0, 50) ||
                    getStatusLabel(action.approval_status)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(action.created_at)}
              </span>
              {onViewDetails && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
