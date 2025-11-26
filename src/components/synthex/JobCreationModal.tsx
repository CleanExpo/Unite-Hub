'use client';

/**
 * JobCreationModal Component
 *
 * Modal for creating new jobs with different job types
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface JobCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateJob: (jobData: any) => Promise<void>;
  tenantId: string;
  isLoading?: boolean;
}

const JOB_TYPES = [
  { value: 'content_batch', label: 'Content Batch', description: 'Generate multiple pieces of content' },
  { value: 'email_sequence', label: 'Email Sequence', description: 'Create an email campaign sequence' },
  { value: 'seo_launch', label: 'SEO Launch', description: 'Generate SEO content and strategy' },
  { value: 'geo_pages', label: 'Geo Pages', description: 'Create location-specific pages' },
];

export default function JobCreationModal({
  isOpen,
  onClose,
  onCreateJob,
  tenantId,
  isLoading = false,
}: JobCreationModalProps) {
  const [jobType, setJobType] = useState<string>('');
  const [count, setCount] = useState<string>('5');
  const [keywords, setKeywords] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jobType) {
      setError('Please select a job type');
      return;
    }

    if (!count || parseInt(count) < 1) {
      setError('Please enter a valid count');
      return;
    }

    try {
      await onCreateJob({
        tenantId,
        jobType,
        payload: {
          count: parseInt(count),
          keywords: keywords || undefined,
        },
      });

      // Reset form
      setJobType('');
      setCount('5');
      setKeywords('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Generate content, research, or other outputs with Synthex</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Job Type */}
          <div className="space-y-2">
            <Label htmlFor="jobType" className="font-semibold">
              Job Type *
            </Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {jobType && (
              <p className="text-xs text-slate-600 mt-1">
                {JOB_TYPES.find((t) => t.value === jobType)?.description}
              </p>
            )}
          </div>

          {/* Count */}
          <div className="space-y-2">
            <Label htmlFor="count" className="font-semibold">
              Count *
            </Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="Number of items to generate"
            />
            <p className="text-xs text-slate-600">How many items to generate (1-100)</p>
          </div>

          {/* Keywords (for SEO jobs) */}
          {jobType === 'seo_launch' && (
            <div className="space-y-2">
              <Label htmlFor="keywords" className="font-semibold">
                Target Keywords (Optional)
              </Label>
              <Input
                id="keywords"
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., trades Brisbane, electrical services"
              />
              <p className="text-xs text-slate-600">
                Comma-separated keywords to target
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !jobType}
              className="flex-1 gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
