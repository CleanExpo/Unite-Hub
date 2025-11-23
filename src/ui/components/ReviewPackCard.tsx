/**
 * Review Pack Card Component
 * Phase 43: Client Agency Review Pack Generator
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/Card";
import { Calendar, FileText, Image, CheckCircle, Clock, Send } from "lucide-react";
import type { ReviewPack } from "@/lib/services/clientReviewPackService";

interface ReviewPackCardProps {
  pack: ReviewPack;
  onClick?: () => void;
}

export function ReviewPackCard({ pack, onClick }: ReviewPackCardProps) {
  const statusConfig = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText },
    ready_for_review: { label: "Ready for Review", color: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
    sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  };

  const config = statusConfig[pack.status];
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className={`cursor-pointer hover:border-teal-500 transition-colors ${onClick ? "" : "cursor-default"}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base capitalize">
            {pack.periodType} Review
          </CardTitle>
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${config.color}`}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Period */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(pack.startDate)} - {formatDate(pack.endDate)}
            </span>
          </div>

          {/* Content indicators */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {pack.performanceReportId && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Report
              </span>
            )}
            {pack.visualAssetIds.length > 0 && (
              <span className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                {pack.visualAssetIds.length} visuals
              </span>
            )}
            {pack.narrative && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Narrative
              </span>
            )}
          </div>

          {/* Data sources */}
          {pack.dataSources.length > 0 && (
            <div className="text-xs text-gray-400">
              Sources: {pack.dataSources.join(", ")}
            </div>
          )}

          {/* Sent info */}
          {pack.sentAt && (
            <div className="text-xs text-gray-400">
              Sent via {pack.deliveryChannel} on {formatDate(pack.sentAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReviewPackCard;
