'use client';

/**
 * Archive Entry Card
 * Phase 78: Display single archive entry
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  BookOpen,
  MessageCircle,
  Trophy,
  TrendingUp,
  Palette,
  Target,
  Factory,
  AlertTriangle,
  Shield,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  ClientArchiveEntry,
  getImportanceLabel,
  getSourceEngineDisplay,
} from '@/lib/archive/archiveTypes';

interface ArchiveEntryCardProps {
  entry: ClientArchiveEntry;
  showClient?: boolean;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  BookOpen,
  MessageCircle,
  Trophy,
  TrendingUp,
  Palette,
  Target,
  Factory,
  AlertTriangle,
  Shield,
};

export function ArchiveEntryCard({
  entry,
  showClient = false,
  className = '',
}: ArchiveEntryCardProps) {
  const router = useRouter();
  const Icon = iconMap[entry.displayIcon] || Info;
  const importance = getImportanceLabel(entry.importance_score);
  const source = getSourceEngineDisplay(entry.source_engine);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={`hover:bg-muted/30 transition-colors ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${source.color}`}>
            <Icon className={`h-4 w-4 ${entry.displayColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{entry.shortLabel}</p>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {entry.summary}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.event_date)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatTime(entry.event_date)}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">
                {source.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${importance.color}`}
              >
                {importance.label}
              </Badge>
              {entry.truth_completeness !== 'complete' && (
                <Badge variant="outline" className="text-[10px] text-orange-500">
                  {entry.truth_completeness}
                </Badge>
              )}
              {showClient && (
                <Badge variant="secondary" className="text-[10px]">
                  {entry.client_id}
                </Badge>
              )}
              {entry.is_demo && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Demo
                </Badge>
              )}
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
                  >
                    #{tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{entry.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Context link */}
            {entry.contextLink && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 mt-2 text-xs"
                onClick={() => router.push(entry.contextLink!)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View in context
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact archive entry item for lists
 */
export function ArchiveEntryItem({
  entry,
  onClick,
}: {
  entry: ClientArchiveEntry;
  onClick?: () => void;
}) {
  const Icon = iconMap[entry.displayIcon] || Info;

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg ${
        onClick ? 'cursor-pointer hover:bg-muted/50' : ''
      }`}
      onClick={onClick}
    >
      <Icon className={`h-4 w-4 ${entry.displayColor} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.shortLabel}</p>
        <p className="text-xs text-muted-foreground truncate">{entry.summary}</p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {new Date(entry.event_date).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
        })}
      </span>
    </div>
  );
}

export default ArchiveEntryCard;
