'use client';

/**
 * Combat Entries Table
 * Phase 88: Display competing creatives and their metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Trophy,
  XCircle,
  Minus,
  TrendingUp,
} from 'lucide-react';

interface CombatEntry {
  id: string;
  variant: string;
  score: number;
  confidence: number;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  entryStatus: string;
}

interface CombatEntriesTableProps {
  entries: CombatEntry[];
  className?: string;
}

const statusConfig: Record<string, { icon: any; color: string }> = {
  pending: { icon: Minus, color: 'text-gray-500' },
  active: { icon: TrendingUp, color: 'text-blue-500' },
  winner: { icon: Trophy, color: 'text-yellow-500' },
  loser: { icon: XCircle, color: 'text-red-500' },
  tied: { icon: Minus, color: 'text-purple-500' },
};

const variantColors: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-purple-500',
  D: 'bg-orange-500',
};

export function CombatEntriesTable({
  entries,
  className = '',
}: CombatEntriesTableProps) {
  // Find max score for relative bars
  const maxScore = Math.max(...entries.map(e => e.score), 1);

  if (entries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No entries in this round
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Entries
          <Badge variant="secondary" className="ml-auto">
            {entries.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map(entry => {
            const statusInfo = statusConfig[entry.entryStatus] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;
            const scorePercent = (entry.score / maxScore) * 100;

            return (
              <div
                key={entry.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={variantColors[entry.variant] || 'bg-gray-500'}>
                      {entry.variant}
                    </Badge>
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    {entry.entryStatus === 'winner' && (
                      <span className="text-xs text-yellow-500 font-medium">WINNER</span>
                    )}
                  </div>
                  <span className="text-lg font-bold">{entry.score.toFixed(1)}</span>
                </div>

                {/* Score bar */}
                <Progress value={scorePercent} className="h-2 mb-3" />

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Impressions</span>
                    <p className="font-medium">{entry.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clicks</span>
                    <p className="font-medium">{entry.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversions</span>
                    <p className="font-medium">{entry.conversions}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence</span>
                    <p className="font-medium">{(entry.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
