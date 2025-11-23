'use client';

/**
 * ORM ROI Overview
 * Phase 67: Display ROI timeline and value delivered index
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Star,
  Target,
  Clock,
} from 'lucide-react';

interface ORMROIOverviewProps {
  client_name: string;
  value_delivered_index: number;
  roi_score: number;
  cost_efficiency: number;
  quality_score: number;
  timeline_adherence: number;
  overall_rating: 'excellent' | 'good' | 'fair' | 'poor';
  highlights: string[];
  areas_for_improvement: string[];
  deliverable_breakdown?: { type: string; count: number }[];
}

export function ORMROIOverview({
  client_name,
  value_delivered_index,
  roi_score,
  cost_efficiency,
  quality_score,
  timeline_adherence,
  overall_rating,
  highlights,
  areas_for_improvement,
  deliverable_breakdown,
}: ORMROIOverviewProps) {
  const getRatingConfig = () => {
    switch (overall_rating) {
      case 'excellent':
        return { color: 'bg-green-500', stars: 4 };
      case 'good':
        return { color: 'bg-blue-500', stars: 3 };
      case 'fair':
        return { color: 'bg-yellow-500', stars: 2 };
      case 'poor':
        return { color: 'bg-red-500', stars: 1 };
    }
  };

  const ratingConfig = getRatingConfig();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-sm font-medium">{client_name}</CardTitle>
          </div>
          <Badge className={ratingConfig.color}>
            {[...Array(ratingConfig.stars)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Value Index</div>
            <div className={`text-xl font-bold ${getScoreColor(value_delivered_index)}`}>
              {value_delivered_index}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">ROI Score</div>
            <div className={`text-xl font-bold ${getScoreColor(roi_score)}`}>
              {roi_score}
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Quality</span>
              <span>{quality_score}%</span>
            </div>
            <Progress value={quality_score} className="h-1" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Timeline</span>
              <span>{timeline_adherence}%</span>
            </div>
            <Progress value={timeline_adherence} className="h-1" />
          </div>
        </div>

        {/* Cost efficiency */}
        <div className="flex items-center justify-between text-xs bg-muted p-2 rounded">
          <span className="text-muted-foreground">Cost Efficiency</span>
          <span className="font-bold">{cost_efficiency.toFixed(2)} value/$</span>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-green-500">Highlights</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {highlights.slice(0, 2).map((h, i) => (
                <li key={i}>✓ {h}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for improvement */}
        {areas_for_improvement.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-orange-500">Improve</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {areas_for_improvement.slice(0, 2).map((a, i) => (
                <li key={i}>→ {a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Deliverable breakdown */}
        {deliverable_breakdown && deliverable_breakdown.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium mb-2">Deliverables</div>
            <div className="flex flex-wrap gap-1">
              {deliverable_breakdown.slice(0, 4).map((d, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {d.type}: {d.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ORMROIOverview;
