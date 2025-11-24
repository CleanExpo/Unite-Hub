'use client';

/**
 * Suggested Actions Card
 * Phase 83: Display agent-suggested actions for approval
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Tag,
  FileText,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface SuggestedAction {
  id: string;
  action_type: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  confidence_score: number;
  agent_reasoning?: string;
}

interface SuggestedActionsCardProps {
  actions: SuggestedAction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SuggestedActionsCard({
  actions,
  onApprove,
  onReject,
  isLoading = false,
  className = '',
}: SuggestedActionsCardProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_followup':
        return <Mail className="h-4 w-4" />;
      case 'add_tag':
      case 'remove_tag':
        return <Tag className="h-4 w-4" />;
      case 'create_note':
        return <FileText className="h-4 w-4" />;
      case 'schedule_task':
        return <Calendar className="h-4 w-4" />;
      case 'update_score':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (actions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Suggested Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-4">
            No pending suggestions
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Suggested Actions
          <Badge variant="secondary" className="ml-auto">
            {actions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map(action => (
          <div
            key={action.id}
            className={`p-3 rounded-lg border ${getRiskColor(action.risk_level)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {getActionIcon(action.action_type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {action.action_type.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${getRiskColor(action.risk_level)}`}>
                      {action.risk_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {action.description || action.agent_reasoning}
                  </p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={getConfidenceColor(action.confidence_score)}>
                      {Math.round(action.confidence_score * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  onClick={() => onApprove(action.id)}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => onReject(action.id)}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
