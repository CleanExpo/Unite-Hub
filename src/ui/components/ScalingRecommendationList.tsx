'use client';

/**
 * Scaling Recommendation List
 * Phase 66: Display scaling recommendations with actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface ScalingRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: string[];
  implementation_steps: string[];
  estimated_cost_impact: string;
  priority: number;
  status: 'pending' | 'accepted' | 'deferred' | 'rejected';
}

interface ScalingRecommendationListProps {
  recommendations: ScalingRecommendation[];
  onAccept?: (id: string) => void;
  onDefer?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function ScalingRecommendationList({
  recommendations,
  onAccept,
  onDefer,
  onReject,
}: ScalingRecommendationListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      default:
        return 'bg-green-500';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high':
        return 'border-red-500 text-red-500';
      case 'medium':
        return 'border-yellow-500 text-yellow-500';
      default:
        return 'border-green-500 text-green-500';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Accepted' };
      case 'deferred':
        return { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: 'Deferred' };
      case 'rejected':
        return { icon: <XCircle className="h-4 w-4 text-red-500" />, label: 'Rejected' };
      default:
        return { icon: <Lightbulb className="h-4 w-4 text-blue-500" />, label: 'Pending' };
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-muted-foreground">No scaling recommendations at this time</p>
          <p className="text-xs text-muted-foreground mt-1">System is operating within healthy parameters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const isExpanded = expandedId === rec.id;
        const statusConfig = getStatusConfig(rec.status);

        return (
          <Card key={rec.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusConfig.icon}
                  <span className="text-xs">{rec.confidence}%</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getImpactColor(rec.impact)}>
                  Impact: {rec.impact}
                </Badge>
                <Badge className={getRiskColor(rec.risk)}>
                  Risk: {rec.risk}
                </Badge>
                <Badge variant="outline" className={getEffortColor(rec.effort)}>
                  Effort: {rec.effort}
                </Badge>
                <Badge variant="outline">{rec.estimated_cost_impact}</Badge>
              </div>

              {/* Evidence */}
              <div className="text-xs text-muted-foreground mb-3">
                <span className="font-medium">Evidence: </span>
                {rec.evidence.join(' • ')}
              </div>

              {/* Expandable section */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide steps
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show implementation steps
                  </>
                )}
              </button>

              {isExpanded && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <h5 className="text-xs font-medium mb-2">Implementation Steps:</h5>
                  <ol className="text-xs space-y-1">
                    {rec.implementation_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Actions */}
              {rec.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t">
                  {onReject && (
                    <button
                      onClick={() => onReject(rec.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Reject
                    </button>
                  )}
                  {onDefer && (
                    <button
                      onClick={() => onDefer(rec.id)}
                      className="text-xs text-yellow-500 hover:underline"
                    >
                      Defer
                    </button>
                  )}
                  {onAccept && (
                    <button
                      onClick={() => onAccept(rec.id)}
                      className="flex items-center gap-1 text-xs text-green-500 hover:underline"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Accept
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ScalingRecommendationList;
