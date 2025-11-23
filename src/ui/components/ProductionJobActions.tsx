'use client';

/**
 * Production Job Actions Component
 * Phase 50: Action buttons for production job management
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle, XCircle, RotateCcw, Play, Pause, Eye,
  Download, MoreVertical, Copy, Trash2
} from 'lucide-react';

interface ProductionJobActionsProps {
  jobId: string;
  status: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRevision?: (id: string) => void;
  onCancel?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function ProductionJobActions({
  jobId,
  status,
  onApprove,
  onReject,
  onRevision,
  onCancel,
  onPause,
  onResume,
  onView,
  onDownload,
  onDuplicate,
  onDelete,
  compact = false,
}: ProductionJobActionsProps) {
  const canApprove = ['draft', 'review'].includes(status);
  const canReject = ['draft', 'review'].includes(status);
  const canRevision = ['draft', 'review'].includes(status);
  const canCancel = ['pending', 'queued', 'processing'].includes(status);
  const canPause = status === 'processing';
  const canResume = status === 'paused';
  const canDownload = ['approved', 'completed'].includes(status);
  const canDelete = ['cancelled', 'failed'].includes(status);

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onView && (
            <DropdownMenuItem onClick={() => onView(jobId)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}
          {canApprove && onApprove && (
            <DropdownMenuItem onClick={() => onApprove(jobId)}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Approve
            </DropdownMenuItem>
          )}
          {canRevision && onRevision && (
            <DropdownMenuItem onClick={() => onRevision(jobId)}>
              <RotateCcw className="mr-2 h-4 w-4 text-amber-500" />
              Request Revision
            </DropdownMenuItem>
          )}
          {canReject && onReject && (
            <DropdownMenuItem onClick={() => onReject(jobId)}>
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
              Reject
            </DropdownMenuItem>
          )}
          {canDownload && onDownload && (
            <DropdownMenuItem onClick={() => onDownload(jobId)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(jobId)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canCancel && onCancel && (
            <DropdownMenuItem onClick={() => onCancel(jobId)} className="text-amber-600">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Job
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <DropdownMenuItem onClick={() => onDelete(jobId)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {onView && (
        <Button variant="outline" size="sm" onClick={() => onView(jobId)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
      )}

      {canApprove && onApprove && (
        <Button variant="default" size="sm" onClick={() => onApprove(jobId)}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve
        </Button>
      )}

      {canRevision && onRevision && (
        <Button variant="outline" size="sm" onClick={() => onRevision(jobId)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Revision
        </Button>
      )}

      {canReject && onReject && (
        <Button variant="destructive" size="sm" onClick={() => onReject(jobId)}>
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      )}

      {canPause && onPause && (
        <Button variant="outline" size="sm" onClick={() => onPause(jobId)}>
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
      )}

      {canResume && onResume && (
        <Button variant="outline" size="sm" onClick={() => onResume(jobId)}>
          <Play className="mr-2 h-4 w-4" />
          Resume
        </Button>
      )}

      {canCancel && onCancel && (
        <Button variant="ghost" size="sm" onClick={() => onCancel(jobId)}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}

      {canDownload && onDownload && (
        <Button variant="outline" size="sm" onClick={() => onDownload(jobId)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      )}
    </div>
  );
}

export default ProductionJobActions;
