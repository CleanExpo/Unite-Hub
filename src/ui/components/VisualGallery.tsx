/**
 * VisualGallery Component
 * Phase 38: Visual Orchestration Layer
 *
 * Grid of visual concepts with badges and approval actions
 */

"use client";

import React from "react";
import { Check, X, RefreshCw, AlertTriangle } from "lucide-react";
import AIModelBadge from "@/components/ui/visual/AIModelBadge";
import type { AIModel } from "@/components/ui/visual/AIModelBadge";

interface VisualItem {
  id: string;
  imageUrl?: string;
  label: string;
  model: AIModel | string;
  status: "draft" | "proposed" | "approved" | "rejected";
}

interface VisualGalleryProps {
  items: VisualItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onSelect?: (id: string) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

const statusStyles = {
  draft: "border-border-subtle",
  proposed: "border-amber-300 dark:border-amber-600",
  approved: "border-green-300 dark:border-green-600",
  rejected: "border-red-300 dark:border-red-600",
};

const statusLabels = {
  draft: "Draft",
  proposed: "Proposed",
  approved: "Approved",
  rejected: "Rejected",
};

export function VisualGallery({
  items,
  onApprove,
  onReject,
  onRegenerate,
  onSelect,
  columns = 3,
  className = "",
}: VisualGalleryProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            relative bg-bg-card
            border-2 ${statusStyles[item.status]}
            rounded-lg overflow-hidden
            ${onSelect ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
          `}
          onClick={() => onSelect?.(item.id)}
        >
          {/* Image */}
          <div className="aspect-video bg-bg-hover">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-text-primary truncate">
                {item.label}
              </p>
              <AIModelBadge model={item.model as AIModel} size="sm" />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span
                className={`
                  text-xs px-2 py-0.5 rounded
                  ${item.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
                  ${item.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""}
                  ${item.status === "proposed" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : ""}
                  ${item.status === "draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400" : ""}
                `}
              >
                {statusLabels[item.status]}
              </span>

              {/* Actions */}
              {item.status === "proposed" && (
                <div className="flex items-center gap-1">
                  {onReject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(item.id);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {onApprove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(item.id);
                      }}
                      className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {onRegenerate && item.status !== "approved" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerate(item.id);
                  }}
                  className="p-1 text-gray-400 hover:bg-bg-hover rounded"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Disclaimer */}
      {items.length > 0 && (
        <div className="col-span-full flex items-center gap-2 mt-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <p className="text-xs text-text-secondary">
            All visuals are AI-generated concepts. Approval required before client-facing use.
          </p>
        </div>
      )}
    </div>
  );
}

export default VisualGallery;
