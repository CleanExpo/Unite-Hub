'use client';

/**
 * Production Job Card Component
 * Phase 50: Displays a production job with status and actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Image, Palette, Share2, Search, Globe, Mic,
  Clock, CheckCircle, AlertTriangle, XCircle, Play, RotateCcw
} from 'lucide-react';

interface ProductionJobCardProps {
  id: string;
  jobType: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  safetyScore: number;
  createdAt: string;
  onView?: (id: string) => void;
  onApprove?: (id: string) => void;
  onRevision?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ProductionJobCard({
  id,
  jobType,
  title,
  description,
  status,
  priority,
  safetyScore,
  createdAt,
  onView,
  onApprove,
  onRevision,
  onCancel,
}: ProductionJobCardProps) {
  const getJobTypeIcon = () => {
    const icons: Record<string, any> = {
      content: FileText,
      visual: Image,
      brand: Palette,
      social: Share2,
      seo: Search,
      website: Globe,
      voice: Mic,
    };
    const Icon = icons[jobType] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusConfig = () => {
    const configs: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'secondary', icon: Clock, label: 'Pending' },
      queued: { color: 'secondary', icon: Clock, label: 'Queued' },
      processing: { color: 'default', icon: Play, label: 'Processing' },
      draft: { color: 'outline', icon: FileText, label: 'Draft' },
      review: { color: 'default', icon: AlertTriangle, label: 'Review' },
      revision: { color: 'outline', icon: RotateCcw, label: 'Revision' },
      approved: { color: 'default', icon: CheckCircle, label: 'Approved' },
      completed: { color: 'default', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'secondary', icon: XCircle, label: 'Cancelled' },
      failed: { color: 'destructive', icon: XCircle, label: 'Failed' },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityColor = () => {
    const colors: Record<string, string> = {
      urgent: 'text-red-500',
      high: 'text-orange-500',
      normal: 'text-blue-500',
      low: 'text-gray-500',
    };
    return colors[priority] || colors.normal;
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const canApprove = status === 'review' || status === 'draft';
  const canRevision = status === 'review' || status === 'draft';
  const canCancel = !['completed', 'cancelled', 'failed'].includes(status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-muted rounded">
              {getJobTypeIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${getPriorityColor()}`}>
                  {priority.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {jobType}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={statusConfig.color as any} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </span>
            {safetyScore < 100 && (
              <Badge variant="outline" className="text-xs">
                Safety: {safetyScore}%
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {onView && (
              <Button size="sm" variant="ghost" onClick={() => onView(id)}>
                View
              </Button>
            )}
            {canApprove && onApprove && (
              <Button size="sm" variant="default" onClick={() => onApprove(id)}>
                Approve
              </Button>
            )}
            {canRevision && onRevision && (
              <Button size="sm" variant="outline" onClick={() => onRevision(id)}>
                Revision
              </Button>
            )}
            {canCancel && onCancel && (
              <Button size="sm" variant="ghost" onClick={() => onCancel(id)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductionJobCard;
