'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, ArrowRight, Search, Target } from 'lucide-react';

interface KeywordGapChartProps {
  keywords: KeywordGapItem[];
  clientDomain: string;
  competitorDomain?: string;
  maxItems?: number;
}

interface KeywordGapItem {
  keyword: string;
  competitorPosition: number;
  clientPosition: number | null;
  searchVolume: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low';
}

export function KeywordGapChart({
  keywords,
  clientDomain,
  competitorDomain,
  maxItems = 10,
}: KeywordGapChartProps) {
  const sortedKeywords = useMemo(() => {
    return [...keywords]
      .sort((a, b) => {
        // Sort by opportunity (high first), then by search volume
        const opportunityOrder = { high: 0, medium: 1, low: 2 };
        if (opportunityOrder[a.opportunity] !== opportunityOrder[b.opportunity]) {
          return opportunityOrder[a.opportunity] - opportunityOrder[b.opportunity];
        }
        return b.searchVolume - a.searchVolume;
      })
      .slice(0, maxItems);
  }, [keywords, maxItems]);

  const maxVolume = useMemo(() => {
    return Math.max(...sortedKeywords.map((k) => k.searchVolume));
  }, [sortedKeywords]);

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) {
return 'text-green-600';
}
    if (difficulty < 60) {
return 'text-yellow-600';
}
    return 'text-red-600';
  };

  const getPositionDisplay = (position: number | null) => {
    if (position === null) {
return 'Not ranking';
}
    if (position <= 3) {
return `#${position}`;
}
    if (position <= 10) {
return `Page 1 (#${position})`;
}
    if (position <= 20) {
return `Page 2 (#${position})`;
}
    return `#${position}`;
  };

  const getPositionClass = (position: number | null) => {
    if (position === null) {
return 'text-gray-400';
}
    if (position <= 3) {
return 'text-green-600 font-bold';
}
    if (position <= 10) {
return 'text-blue-600';
}
    if (position <= 20) {
return 'text-yellow-600';
}
    return 'text-gray-600';
  };

  if (keywords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Keyword Gap Data</h3>
            <p className="text-muted-foreground">
              Run a competitor analysis to discover keyword opportunities
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Keyword Gap Analysis
        </CardTitle>
        <CardDescription>
          Keywords where competitors rank but {clientDomain} doesn&apos;t (or ranks lower)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>High Opportunity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium Opportunity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Low Opportunity</span>
          </div>
        </div>

        {/* Keyword List */}
        <div className="space-y-3">
          {sortedKeywords.map((item, idx) => (
            <div
              key={idx}
              className="relative p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        getOpportunityColor(item.opportunity)
                      )}
                    />
                    <span className="font-medium">{item.keyword}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      Vol: {item.searchVolume.toLocaleString()}
                    </span>
                    <span className={getDifficultyColor(item.difficulty)}>
                      KD: {item.difficulty}%
                    </span>
                  </div>
                </div>

                {/* Position Comparison */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">You</p>
                    <p className={cn('text-sm', getPositionClass(item.clientPosition))}>
                      {getPositionDisplay(item.clientPosition)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Competitor</p>
                    <p className="text-sm text-green-600 font-medium">
                      #{item.competitorPosition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Volume bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getOpportunityColor(item.opportunity)
                    )}
                    style={{ width: `${(item.searchVolume / maxVolume) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {keywords.filter((k) => k.opportunity === 'high').length}
            </p>
            <p className="text-sm text-muted-foreground">High Opportunity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {keywords.reduce((sum, k) => sum + k.searchVolume, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Search Volume</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {keywords.filter((k) => k.clientPosition === null).length}
            </p>
            <p className="text-sm text-muted-foreground">Not Ranking</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Additional component for compact keyword display
export function KeywordOpportunityList({
  keywords,
  maxItems = 5,
  onViewAll,
}: {
  keywords: KeywordGapItem[];
  maxItems?: number;
  onViewAll?: () => void;
}) {
  const topKeywords = keywords
    .filter((k) => k.opportunity === 'high')
    .slice(0, maxItems);

  if (topKeywords.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No high-opportunity keywords found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topKeywords.map((keyword, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 text-xs">High</Badge>
            <span className="text-sm font-medium truncate max-w-[150px]">
              {keyword.keyword}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {keyword.searchVolume.toLocaleString()} vol
          </span>
        </div>
      ))}
      {keywords.length > maxItems && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full text-center text-sm text-primary hover:underline py-2"
        >
          View all {keywords.length} keywords
        </button>
      )}
    </div>
  );
}
