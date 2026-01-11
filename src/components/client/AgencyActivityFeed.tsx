"use client";

/**
 * Agency Activity Feed
 * Phase 32: Agency Experience Layer
 *
 * Chronological feed of actions and changes
 */

import { Activity, Bot, User, CheckCircle, Clock, Zap } from "lucide-react";

type ActivityType = "auto" | "reviewed" | "human_assisted";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  timestamp: string;
  icon: React.ReactNode;
}

const TYPE_BADGES = {
  auto: { label: "Auto (AI)", color: "bg-purple-100 text-purple-700" },
  reviewed: { label: "Reviewed", color: "bg-green-100 text-green-700" },
  human_assisted: { label: "Human Assisted", color: "bg-blue-100 text-blue-700" },
};

export default function AgencyActivityFeed() {
  // This would be fetched from audit logs, campaign runs, etc.
  const activities: ActivityItem[] = [
    {
      id: "1",
      title: "GMB Profile Optimized",
      description: "Updated business description with new keywords",
      type: "auto",
      timestamp: "2 hours ago",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: "2",
      title: "Email Campaign Queued",
      description: "Follow-up sequence scheduled for 45 contacts",
      type: "reviewed",
      timestamp: "4 hours ago",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "3",
      title: "SEO Audit Completed",
      description: "Found 12 optimization opportunities on your site",
      type: "auto",
      timestamp: "Yesterday",
      icon: <Bot className="w-4 h-4" />,
    },
    {
      id: "4",
      title: "Content Strategy Updated",
      description: "New blog topics identified for Q1",
      type: "human_assisted",
      timestamp: "Yesterday",
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "5",
      title: "Performance Report Generated",
      description: "Weekly metrics compiled and analyzed",
      type: "auto",
      timestamp: "2 days ago",
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-accent-600" />
        <h3 className="text-lg font-semibold text-text-primary">
          Recent Activity
        </h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 pb-4 border-b border-border-subtle last:border-0 last:pb-0"
          >
            <div className="flex-shrink-0 p-2 bg-bg-hover rounded-lg text-gray-600 dark:text-gray-300">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-text-primary">
                  {activity.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGES[activity.type].color}`}
                >
                  {TYPE_BADGES[activity.type].label}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">
          No recent activity yet. Check back soon!
        </p>
      )}
    </div>
  );
}
