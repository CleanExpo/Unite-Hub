"use client";

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
  metadata: Record<string, unknown>;
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

// Scientific Luxury activity colour tokens
const activityColors: Record<string, { bg: string; text: string; border: string }> = {
  note:         { bg: "rgba(0,245,255,0.08)",  text: "#00F5FF",  border: "rgba(0,245,255,0.2)" },
  email:        { bg: "rgba(255,0,255,0.08)",  text: "#FF00FF",  border: "rgba(255,0,255,0.2)" },
  call:         { bg: "rgba(0,255,136,0.08)",  text: "#00FF88",  border: "rgba(0,255,136,0.2)" },
  meeting:      { bg: "rgba(255,184,0,0.08)",  text: "#FFB800",  border: "rgba(255,184,0,0.2)" },
  task:         { bg: "rgba(0,245,255,0.08)",  text: "#00F5FF",  border: "rgba(0,245,255,0.2)" },
  stage_change: { bg: "rgba(0,245,255,0.06)",  text: "#00F5FF",  border: "rgba(0,245,255,0.15)" },
  value_change: { bg: "rgba(0,255,136,0.08)",  text: "#00FF88",  border: "rgba(0,255,136,0.2)" },
  status_change:{ bg: "rgba(255,184,0,0.08)",  text: "#FFB800",  border: "rgba(255,184,0,0.2)" },
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
      <div className="text-center py-12 text-white/30">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-mono">No activities yet</p>
        <p className="text-xs mt-1 font-mono text-white/20">Activities will appear here as you interact with this deal</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-white/[0.06]" />

      <div className="space-y-4">
        {activities.map((activity) => {
          const colors = activityColors[activity.activity_type] || activityColors.note;
          const icon = activityIcons[activity.activity_type] || activityIcons.note;

          return (
            <div key={activity.id} className="relative flex gap-3 pl-1">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-sm flex items-center justify-center border z-10"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium font-mono text-white">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-white/30 whitespace-nowrap flex-shrink-0">
                    {formatActivityDate(activity.created_at)}
                  </span>
                </div>

                {/* Activity type badge */}
                <div className="mt-1.5">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 border rounded-sm"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  >
                    {activity.activity_type.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
