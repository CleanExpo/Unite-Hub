"use client";

import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  ArrowRightLeft,
  DollarSign,
  Activity,
} from "lucide-react";

interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface DealActivityTimelineProps {
  activities: DealActivity[];
}

const activityIcons: Record<string, React.ReactNode> = {
  note: <MessageSquare className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  stage_change: <ArrowRightLeft className="w-4 h-4" />,
  value_change: <DollarSign className="w-4 h-4" />,
  status_change: <Activity className="w-4 h-4" />,
};

const activityColors: Record<string, string> = {
  note: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  email: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  call: "bg-green-500/20 text-green-400 border-green-500/30",
  meeting: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  task: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  stage_change: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  value_change: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  status_change: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function formatActivityDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function DealActivityTimeline({ activities }: DealActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No activities yet</p>
        <p className="text-xs mt-1">Activities will appear here as you interact with this deal</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700/50" />

      <div className="space-y-4">
        {activities.map((activity) => {
          const colorClass = activityColors[activity.activity_type] || activityColors.note;
          const icon = activityIcons[activity.activity_type] || activityIcons.note;

          return (
            <div key={activity.id} className="relative flex gap-3 pl-1">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${colorClass} z-10`}
              >
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap flex-shrink-0">
                    {formatActivityDate(activity.created_at)}
                  </span>
                </div>

                {/* Activity type badge */}
                <div className="mt-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${colorClass}`}
                  >
                    {activity.activity_type.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
