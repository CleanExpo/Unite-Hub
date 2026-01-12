"use client";

/**
 * Video Approval Card
 * Phase 35: Integrity Framework
 *
 * Display video concepts with approval actions
 */

import { Play, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import AIModelBadge from "@/components/ui/visual/AIModelBadge";
import type { AIModel } from "@/components/ui/visual/AIModelBadge";

interface VideoApprovalCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  model: AIModel;
  status: "pending" | "approved" | "rejected";
  generatedAt: string;
  disclaimer: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPreview?: (id: string) => void;
}

export default function VideoApprovalCard({
  id,
  title,
  description,
  thumbnailUrl,
  duration,
  model,
  status,
  generatedAt,
  disclaimer,
  onApprove,
  onReject,
  onPreview,
}: VideoApprovalCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-bg-hover">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-12 h-12 text-text-muted" />
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
          {formatDuration(duration)}
        </div>

        {/* Preview button */}
        {onPreview && (
          <button
            onClick={() => onPreview(id)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors"
          >
            <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-text-primary">{title}</h3>
          <AIModelBadge model={model} />
        </div>

        {description && (
          <p className="text-sm text-text-secondary mb-3">
            {description}
          </p>
        )}

        {/* Disclaimer */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-warning-50 dark:bg-warning-900/20 rounded">
          <AlertTriangle className="w-3 h-3 text-warning-600 flex-shrink-0" />
          <p className="text-xs text-warning-700 dark:text-warning-300">
            {disclaimer}
          </p>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === "pending" && (
              <span className="flex items-center gap-1 text-xs text-warning-600 dark:text-warning-400">
                <Clock className="w-3 h-3" />
                Pending approval
              </span>
            )}
            {status === "approved" && (
              <span className="flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
                <CheckCircle className="w-3 h-3" />
                Approved
              </span>
            )}
            {status === "rejected" && (
              <span className="flex items-center gap-1 text-xs text-error-600 dark:text-error-400">
                <XCircle className="w-3 h-3" />
                Rejected
              </span>
            )}
          </div>

          {status === "pending" && (
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  onClick={() => onReject(id)}
                  className="p-1.5 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(id)}
                  className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-text-muted mt-2">
          Generated {new Date(generatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
