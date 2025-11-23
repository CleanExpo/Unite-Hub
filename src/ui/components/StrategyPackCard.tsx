'use client';

/**
 * Strategy Pack Card Component
 * Phase 54: Display monthly strategy pack status and deliverables
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Eye,
} from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'generating' | 'ready' | 'approved' | 'delivered';
}

interface StrategyPackCardProps {
  id: string;
  title: string;
  period: string;
  status: 'draft' | 'generating' | 'pending_review' | 'approved' | 'delivered';
  deliverables: Deliverable[];
  generatedAt?: string;
  approvedAt?: string;
  onView?: () => void;
  onApprove?: () => void;
  onDownload?: () => void;
}

export function StrategyPackCard({
  id,
  title,
  period,
  status,
  deliverables,
  generatedAt,
  approvedAt,
  onView,
  onApprove,
  onDownload,
}: StrategyPackCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Approved</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case 'generating':
        return <Badge className="bg-purple-500">Generating</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const completedCount = deliverables.filter(
    (d) => d.status === 'ready' || d.status === 'approved' || d.status === 'delivered'
  ).length;
  const progress = (completedCount / deliverables.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{period}</p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Deliverables</span>
            <span>
              {completedCount}/{deliverables.length} complete
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Deliverables list */}
        <div className="space-y-2">
          {deliverables.map((deliverable) => (
            <div
              key={deliverable.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                {deliverable.status === 'approved' || deliverable.status === 'delivered' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : deliverable.status === 'generating' ? (
                  <Clock className="h-4 w-4 text-purple-500 animate-pulse" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{deliverable.title}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {deliverable.status}
              </Badge>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        {(generatedAt || approvedAt) && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            {generatedAt && (
              <div>Generated: {new Date(generatedAt).toLocaleDateString()}</div>
            )}
            {approvedAt && (
              <div>Approved: {new Date(approvedAt).toLocaleDateString()}</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {status === 'pending_review' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onApprove}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {(status === 'approved' || status === 'delivered') && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StrategyPackCard;
