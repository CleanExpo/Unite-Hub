'use client';

/**
 * JobProgressCard Component
 *
 * Displays a single job's progress and status
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  jobType: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface JobProgressCardProps {
  job: Job;
  onViewDetails: () => void;
}

export function JobProgressCard({ job, onViewDetails }: JobProgressCardProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-slate-100 text-slate-800',
      icon: Clock,
      progress: 10,
    },
    queued: {
      label: 'Queued',
      color: 'bg-blue-100 text-blue-800',
      icon: Clock,
      progress: 25,
    },
    running: {
      label: 'Running',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Loader2,
      progress: 50,
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      progress: 100,
    },
    failed: {
      label: 'Failed',
      color: 'bg-red-100 text-red-800',
      icon: AlertCircle,
      progress: 0,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-slate-100 text-slate-800',
      icon: AlertCircle,
      progress: 0,
    },
  };

  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      content_batch: 'Content Batch',
      email_sequence: 'Email Sequence',
      seo_launch: 'SEO Launch',
      geo_pages: 'Geo Pages',
    };
    return labels[type] || type;
  };

  const getTimeInfo = () => {
    if (job.completed_at) {
      return `Completed ${format(new Date(job.completed_at), 'MMM d, h:mm a')}`;
    }
    if (job.started_at) {
      return `Started ${format(new Date(job.started_at), 'MMM d, h:mm a')}`;
    }
    return `Created ${format(new Date(job.created_at), 'MMM d, h:mm a')}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
              <div>
                <h3 className="font-semibold text-slate-900">
                  {getJobTypeLabel(job.jobType)}
                </h3>
                <p className="text-sm text-slate-600">{getTimeInfo()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={config.color}>
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          {job.status !== 'failed' && job.status !== 'cancelled' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Progress</span>
                <span>{config.progress}%</span>
              </div>
              <Progress value={config.progress} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {job.error_message && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{job.error_message}</p>
            </div>
          )}

          {/* Job ID */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded">
            <span>Job ID: {job.id.slice(0, 8)}...</span>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="w-full gap-2"
          >
            View Details
            <ChevronRight size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default JobProgressCard;
