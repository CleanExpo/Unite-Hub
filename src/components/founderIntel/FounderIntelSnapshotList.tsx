'use client';

/**
 * Founder Intel Snapshot List
 * Phase 80: List of recent snapshots
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Calendar, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  FounderIntelSnapshot,
  getRiskLevelDisplay,
  getOpportunityLevelDisplay,
} from '@/lib/founderIntel/founderIntelTypes';
import { FounderIntelTruthBadgeCompact } from './FounderIntelTruthBadge';

interface FounderIntelSnapshotListProps {
  snapshots: FounderIntelSnapshot[];
  className?: string;
}

export function FounderIntelSnapshotList({
  snapshots,
  className = '',
}: FounderIntelSnapshotListProps) {
  const router = useRouter();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Snapshots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No snapshots yet. Generate your first intelligence snapshot.
          </p>
        ) : (
          snapshots.map(snapshot => {
            const riskDisplay = getRiskLevelDisplay(snapshot.risk_level);
            const oppDisplay = getOpportunityLevelDisplay(snapshot.opportunity_level);

            return (
              <div
                key={snapshot.id}
                className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/founder/intel/snapshots/${snapshot.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium truncate">{snapshot.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(snapshot.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${riskDisplay.color}`}>
                        Risk: {riskDisplay.label}
                      </Badge>
                      {snapshot.opportunity_level !== 'none' && (
                        <Badge variant="outline" className={`text-[10px] ${oppDisplay.color}`}>
                          Opp: {oppDisplay.label}
                        </Badge>
                      )}
                      <FounderIntelTruthBadgeCompact
                        confidenceScore={snapshot.confidence_score}
                        completenessScore={snapshot.data_completeness_score}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Single snapshot card for featured display
 */
export function FounderIntelSnapshotCard({
  snapshot,
  onClick,
}: {
  snapshot: FounderIntelSnapshot;
  onClick?: () => void;
}) {
  const riskDisplay = getRiskLevelDisplay(snapshot.risk_level);

  return (
    <Card
      className={`hover:bg-muted/30 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          <p className="font-medium text-sm">{snapshot.title}</p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3">
          {snapshot.summary_markdown.slice(0, 150)}...
        </p>
        <div className="flex items-center justify-between mt-3">
          <Badge variant="outline" className={`text-[10px] ${riskDisplay.color}`}>
            {riskDisplay.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(snapshot.created_at).toLocaleDateString('en-AU')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default FounderIntelSnapshotList;
