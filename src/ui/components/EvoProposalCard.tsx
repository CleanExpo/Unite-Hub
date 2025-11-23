'use client';

/**
 * Evo Proposal Card
 * Phase 64: Display system improvement proposal
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface EvoProposalCardProps {
  id: string;
  title: string;
  description: string;
  affected_subsystems: string[];
  urgency_score: number;
  effort_estimate: 'low' | 'medium' | 'high';
  founder_value_score: number;
  risk_score: number;
  confidence: number;
  recommended_action: string;
  status: string;
  created_at: string;
  onApprove?: () => void;
  onDecline?: () => void;
  onView?: () => void;
}

export function EvoProposalCard({
  id,
  title,
  description,
  affected_subsystems,
  urgency_score,
  effort_estimate,
  founder_value_score,
  risk_score,
  confidence,
  recommended_action,
  status,
  created_at,
  onApprove,
  onDecline,
  onView,
}: EvoProposalCardProps) {
  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low':
        return <Badge className="bg-green-500">Low Effort</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Effort</Badge>;
      case 'high':
        return <Badge className="bg-red-500">High Effort</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {getEffortBadge(effort_estimate)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Urgency</div>
            <div className={`font-bold ${getUrgencyColor(urgency_score)}`}>
              {urgency_score}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Value</div>
            <div className="font-bold text-green-500">{founder_value_score}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Risk</div>
            <div className={`font-bold ${risk_score > 60 ? 'text-red-500' : 'text-blue-500'}`}>
              {risk_score}%
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span>{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-1" />
        </div>

        {/* Affected subsystems */}
        <div className="flex flex-wrap gap-1">
          {affected_subsystems.slice(0, 3).map((sys) => (
            <Badge key={sys} variant="outline" className="text-xs">
              {sys.replace(/_/g, ' ')}
            </Badge>
          ))}
          {affected_subsystems.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{affected_subsystems.length - 3}
            </Badge>
          )}
        </div>

        {/* Recommendation */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          💡 {recommended_action}
        </div>

        {/* Actions */}
        {status === 'pending_review' && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(created_at)}
            </div>
            <div className="flex gap-2">
              {onDecline && (
                <button
                  onClick={onDecline}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <XCircle className="h-3 w-3" />
                  Decline
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="flex items-center gap-1 text-xs text-green-500 hover:underline"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approve
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EvoProposalCard;
