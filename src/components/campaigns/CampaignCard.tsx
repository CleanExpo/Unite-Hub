"use client";

import React from "react";
import { Facebook, Instagram, Linkedin, Calendar, Eye, Edit2, Play, Pause } from "lucide-react";
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

// Scientific Luxury platform accent colours
const platformConfig = {
  facebook:  { icon: Facebook,  accent: "#00F5FF" },
  instagram: { icon: Instagram, accent: "#FF00FF" },
  tiktok:    { icon: Instagram, accent: "#ffffff" },
  linkedin:  { icon: Linkedin,  accent: "#00F5FF" },
};

const statusConfig = {
  draft:     { color: "rgba(255,255,255,0.4)",  bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.08)", label: "Draft" },
  active:    { color: "#00FF88",                bg: "rgba(0,255,136,0.10)",    border: "rgba(0,255,136,0.25)",   label: "Active" },
  paused:    { color: "#FFB800",                bg: "rgba(255,184,0,0.10)",    border: "rgba(255,184,0,0.25)",   label: "Paused" },
  completed: { color: "#00F5FF",                bg: "rgba(0,245,255,0.10)",    border: "rgba(0,245,255,0.25)",   label: "Completed" },
};

export function CampaignCard({ campaign, onView, onEdit, onToggleStatus }: CampaignCardProps) {
  const platform = platformConfig[campaign.platform];
  const status = statusConfig[campaign.status];
  const PlatformIcon = platform.icon;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm hover:bg-white/[0.04] hover:border-white/[0.10] transition-all overflow-hidden group">
      {/* Accent bar */}
      <div className="h-0.5" style={{ backgroundColor: platform.accent }} />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-sm"
              style={{ backgroundColor: `${platform.accent}15`, color: platform.accent }}
            >
              <PlatformIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold font-mono text-white">{campaign.campaignName}</h3>
              <p className="text-sm font-mono capitalize" style={{ color: platform.accent, opacity: 0.7 }}>
                {campaign.platform}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-sm border"
            style={{ color: status.color, backgroundColor: status.bg, borderColor: status.border }}
          >
            {status.label}
          </span>
        </div>

        {/* Themes */}
        {campaign.campaignThemes.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {campaign.campaignThemes.slice(0, 3).map((theme, index) => (
                <span
                  key={index}
                  className="text-xs font-mono px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/50"
                >
                  {theme}
                </span>
              ))}
              {campaign.campaignThemes.length > 3 && (
                <span className="text-xs font-mono px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/30">
                  +{campaign.campaignThemes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {campaign.timeline?.startDate && (
          <div className="flex items-center gap-2 text-sm font-mono text-white/40 mb-4">
            <Calendar className="h-4 w-4" />
            <span>
              {format(campaign.timeline.startDate, "d MMM yyyy")}
              {campaign.timeline.endDate && (
                <> — {format(campaign.timeline.endDate, "d MMM yyyy")}</>
              )}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(campaign._id)}
            className="flex-1 flex items-center justify-center gap-2 h-8 text-xs font-mono rounded-sm border
                       bg-white/[0.02] border-white/[0.06] text-white/60
                       hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          <button
            onClick={() => onEdit(campaign._id)}
            className="flex-1 flex items-center justify-center gap-2 h-8 text-xs font-mono rounded-sm border
                       bg-white/[0.02] border-white/[0.06] text-white/60
                       hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          {(campaign.status === "active" || campaign.status === "paused") && (
            <button
              onClick={() => onToggleStatus?.(campaign._id)}
              className="flex items-center justify-center h-8 w-8 rounded-sm border
                         bg-white/[0.02] border-white/[0.06] text-white/60
                         hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
            >
              {campaign.status === "active" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
