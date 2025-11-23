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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-12 h-12 text-gray-300 dark:text-gray-600" />
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
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <AIModelBadge model={model} />
        </div>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {description}
          </p>
        )}

        {/* Disclaimer */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <AlertTriangle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            {disclaimer}
          </p>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === "pending" && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <Clock className="w-3 h-3" />
                Pending approval
              </span>
            )}
            {status === "approved" && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                Approved
              </span>
            )}
            {status === "rejected" && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
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
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(id)}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Generated {new Date(generatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
