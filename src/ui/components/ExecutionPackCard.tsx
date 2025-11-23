'use client';

/**
 * Execution Pack Card Component
 * Phase 54: Display weekly execution pack with ready-to-use content
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  Image,
  Mail,
  Share2,
  CheckCircle2,
  Copy,
  Download,
} from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  type: 'blog_post' | 'social_post' | 'email_template' | 'visual_concept';
  status: string;
  preview?: string;
}

interface ExecutionPackCardProps {
  id: string;
  title: string;
  weekRange: string;
  status: 'draft' | 'generating' | 'pending_review' | 'approved' | 'delivered';
  deliverables: Deliverable[];
  onView?: () => void;
  onCopyContent?: (deliverableId: string) => void;
  onDownload?: () => void;
}

export function ExecutionPackCard({
  id,
  title,
  weekRange,
  status,
  deliverables,
  onView,
  onCopyContent,
  onDownload,
}: ExecutionPackCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog_post':
        return <FileText className="h-4 w-4" />;
      case 'social_post':
        return <Share2 className="h-4 w-4" />;
      case 'email_template':
        return <Mail className="h-4 w-4" />;
      case 'visual_concept':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'approved':
        return 'bg-blue-500';
      case 'pending_review':
        return 'bg-yellow-500';
      case 'generating':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const readyDeliverables = deliverables.filter(
    (d) => d.status === 'ready' || d.status === 'approved' || d.status === 'delivered'
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{weekRange}</p>
          </div>
          <Badge className={getStatusColor()}>{status.replace('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Deliverables */}
        <div className="space-y-2">
          {deliverables.map((deliverable) => (
            <div
              key={deliverable.id}
              className={`flex items-center justify-between p-2 rounded-lg ${
                deliverable.status === 'ready' ||
                deliverable.status === 'approved' ||
                deliverable.status === 'delivered'
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">
                  {getTypeIcon(deliverable.type)}
                </div>
                <div>
                  <div className="text-sm font-medium">{deliverable.title}</div>
                  {deliverable.preview && (
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {deliverable.preview}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(deliverable.status === 'ready' ||
                  deliverable.status === 'approved' ||
                  deliverable.status === 'delivered') && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onCopyContent?.(deliverable.id)}
                      title="Copy content"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {readyDeliverables.length} of {deliverables.length} items ready
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onView}
          >
            View Details
          </Button>
          {readyDeliverables.length > 0 && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download All
            </Button>
          )}
        </div>

        {/* Reminder */}
        <div className="text-xs text-muted-foreground text-center">
          Review before publishing • All content is draft until approved
        </div>
      </CardContent>
    </Card>
  );
}

export default ExecutionPackCard;
