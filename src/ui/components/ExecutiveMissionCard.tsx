'use client';

/**
 * Executive Mission Card
 * Phase 62: Display mission status and progress
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  CheckCircle2,
  Clock,
  Play,
  XCircle,
  ChevronRight,
} from 'lucide-react';

interface MissionStep {
  step_number: number;
  agent_id: string;
  action: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
}

interface ExecutiveMissionCardProps {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  progress: number;
  steps: MissionStep[];
  clientId: string;
  onViewDetails?: () => void;
}

export function ExecutiveMissionCard({
  id,
  title,
  description,
  type,
  priority,
  status,
  progress,
  steps,
  clientId,
  onViewDetails,
}: ExecutiveMissionCardProps) {
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed':
        return 'text-green-500';
      case 'executing':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'executing':
        return <Play className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <Badge className={getPriorityColor(priority)}>
            {priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={getStatusColor(status)}>{status}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-1">
          {steps.slice(0, 3).map((step) => (
            <div
              key={step.step_number}
              className="flex items-center gap-2 text-xs"
            >
              {getStepIcon(step.status)}
              <span className="truncate">{step.description}</span>
            </div>
          ))}
          {steps.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{steps.length - 3} more steps
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Client: {clientId.slice(0, 8)}...
          </span>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              Details
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExecutiveMissionCard;
