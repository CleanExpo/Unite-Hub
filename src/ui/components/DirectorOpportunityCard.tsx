'use client';

/**
 * Director Opportunity Card
 * Phase 60: Display opportunity from AI Director
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Star,
  Users,
  Lightbulb,
  Zap,
  Gift,
} from 'lucide-react';

type OpportunityCategory =
  | 'upsell_ready'
  | 'referral_potential'
  | 'case_study_candidate'
  | 'expansion_opportunity'
  | 'efficiency_gain'
  | 'cross_sell';

interface DirectorOpportunityCardProps {
  category: OpportunityCategory;
  title: string;
  description: string;
  metrics: Record<string, string | number>;
  recommendedActions: string[];
  clientName?: string;
  estimatedValue?: number;
  confidence: number;
  onAction?: (action: string) => void;
}

export function DirectorOpportunityCard({
  category,
  title,
  description,
  metrics,
  recommendedActions,
  clientName,
  estimatedValue,
  confidence,
  onAction,
}: DirectorOpportunityCardProps) {
  const getCategoryIcon = (cat: OpportunityCategory) => {
    switch (cat) {
      case 'upsell_ready':
        return <TrendingUp className="h-4 w-4" />;
      case 'referral_potential':
        return <Users className="h-4 w-4" />;
      case 'case_study_candidate':
        return <Star className="h-4 w-4" />;
      case 'expansion_opportunity':
        return <Zap className="h-4 w-4" />;
      case 'efficiency_gain':
        return <Lightbulb className="h-4 w-4" />;
      case 'cross_sell':
        return <Gift className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (cat: OpportunityCategory) => {
    switch (cat) {
      case 'upsell_ready':
        return 'bg-green-500';
      case 'referral_potential':
        return 'bg-purple-500';
      case 'case_study_candidate':
        return 'bg-yellow-500';
      case 'expansion_opportunity':
        return 'bg-blue-500';
      case 'efficiency_gain':
        return 'bg-cyan-500';
      case 'cross_sell':
        return 'bg-pink-500';
      default:
        return 'bg-green-500';
    }
  };

  const formatCategory = (cat: string) => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) {
return 'text-green-500';
}
    if (conf >= 0.6) {
return 'text-yellow-500';
}
    return 'text-gray-500';
  };

  return (
    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${getCategoryColor(category)} text-white`}>
              {getCategoryIcon(category)}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {clientName && (
                <div className="text-xs text-muted-foreground">{clientName}</div>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {formatCategory(category)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Value and Confidence */}
        <div className="flex items-center gap-4">
          {estimatedValue && estimatedValue > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Est. Value:</span>{' '}
              <span className="font-medium text-green-600">
                ${estimatedValue.toLocaleString()}
              </span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Confidence:</span>{' '}
            <span className={`font-medium ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Metrics */}
        {Object.keys(metrics).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded"
              >
                <span className="text-muted-foreground">
                  {key.replace(/_/g, ' ')}:
                </span>{' '}
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Actions */}
        {recommendedActions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Next Steps:</div>
            {recommendedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction?.(action)}
                className="block text-xs text-green-600 hover:underline cursor-pointer"
              >
                → {action}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DirectorOpportunityCard;
