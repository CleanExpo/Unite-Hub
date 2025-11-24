'use client';

/**
 * Combat Result Card
 * Phase 88: Visual summary of winner/loser with confidence
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  AlertTriangle,
  Minus,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface CombatResult {
  id: string;
  createdAt: string;
  resultType: string;
  confidenceBand: string;
  statisticalSignificance: number;
  winnerScore?: number;
  loserScore?: number;
  scoreLiftPercent?: number;
  summaryMarkdown: string;
  truthComplete: boolean;
  winnerPromoted: boolean;
  loserRetired: boolean;
}

interface CombatResultCardProps {
  result: CombatResult;
  className?: string;
}

const resultConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  winner: { icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  tie: { icon: Minus, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  inconclusive: { icon: AlertTriangle, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

const confidenceColors: Record<string, string> = {
  low: 'text-red-500',
  medium: 'text-yellow-500',
  high: 'text-green-500',
  very_high: 'text-emerald-500',
};

export function CombatResultCard({
  result,
  className = '',
}: CombatResultCardProps) {
  const resultInfo = resultConfig[result.resultType] || resultConfig.inconclusive;
  const ResultIcon = resultInfo.icon;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className={`${className} ${resultInfo.bgColor}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ResultIcon className={`h-5 w-5 ${resultInfo.color}`} />
            {result.resultType === 'winner' ? 'Winner Found' :
             result.resultType === 'tie' ? 'Tie Result' : 'Inconclusive'}
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            {formatTime(result.createdAt)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score comparison */}
        {result.resultType === 'winner' && (
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {result.winnerScore?.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Winner</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-5 w-5 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-green-500">
                +{result.scoreLiftPercent?.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {result.loserScore?.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Loser</p>
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <span className={`font-medium ${confidenceColors[result.confidenceBand]}`}>
            {result.confidenceBand.replace('_', ' ').toUpperCase()}
            <span className="text-muted-foreground ml-1">
              ({(result.statisticalSignificance * 100).toFixed(0)}%)
            </span>
          </span>
        </div>

        {/* Actions taken */}
        <div className="flex flex-wrap gap-2">
          {result.winnerPromoted && (
            <Badge variant="outline" className="text-[10px] text-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Promoted
            </Badge>
          )}
          {result.loserRetired && (
            <Badge variant="outline" className="text-[10px] text-red-500">
              <XCircle className="h-3 w-3 mr-1" />
              Retired
            </Badge>
          )}
          {!result.truthComplete && (
            <Badge variant="outline" className="text-[10px] text-yellow-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Confidence
            </Badge>
          )}
        </div>

        {/* Summary preview */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          {result.summaryMarkdown.split('\n').slice(0, 3).join(' ').substring(0, 150)}...
        </div>
      </CardContent>
    </Card>
  );
}
