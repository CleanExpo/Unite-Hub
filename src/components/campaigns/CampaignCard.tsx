"use client";

import React from "react";
import { Facebook, Instagram, Linkedin, Calendar, Eye, Edit2, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Campaign {
  _id: string;
  platform: "facebook" | "instagram" | "tiktok" | "linkedin";
  campaignName: string;
  campaignThemes: string[];
  status: "draft" | "active" | "paused" | "completed";
  createdAt: number;
  timeline?: {
    startDate?: number;
    endDate?: number;
  };
}

interface CampaignCardProps {
  campaign: Campaign;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

const platformConfig = {
  facebook: { icon: Facebook, color: "bg-blue-600", textColor: "text-blue-600" },
  instagram: { icon: Instagram, color: "bg-pink-600", textColor: "text-pink-600" },
  tiktok: { icon: Instagram, color: "bg-gray-900", textColor: "text-gray-900" },
  linkedin: { icon: Linkedin, color: "bg-blue-700", textColor: "text-blue-700" },
};

const statusConfig = {
  draft: { color: "bg-gray-100 text-gray-700", label: "Draft" },
  active: { color: "bg-green-100 text-green-700", label: "Active" },
  paused: { color: "bg-orange-100 text-orange-700", label: "Paused" },
  completed: { color: "bg-blue-100 text-blue-700", label: "Completed" },
};

export function CampaignCard({ campaign, onView, onEdit, onToggleStatus }: CampaignCardProps) {
  const platform = platformConfig[campaign.platform];
  const status = statusConfig[campaign.status];
  const PlatformIcon = platform.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden group">
      {/* Header */}
      <div className={cn("h-2", platform.color)} />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", platform.color, "text-white")}>
              <PlatformIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{campaign.campaignName}</h3>
              <p className="text-sm text-gray-600 capitalize">{campaign.platform}</p>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        {/* Themes */}
        {campaign.campaignThemes.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {campaign.campaignThemes.slice(0, 3).map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
              {campaign.campaignThemes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{campaign.campaignThemes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {campaign.timeline?.startDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Calendar className="h-4 w-4" />
            <span>
              {format(campaign.timeline.startDate, "MMM d, yyyy")}
              {campaign.timeline.endDate && (
                <> - {format(campaign.timeline.endDate, "MMM d, yyyy")}</>
              )}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onView(campaign._id)}
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button
            onClick={() => onEdit(campaign._id)}
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          {campaign.status === "active" || campaign.status === "paused" ? (
            <Button
              onClick={() => onToggleStatus?.(campaign._id)}
              variant="outline"
              size="sm"
            >
              {campaign.status === "active" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
