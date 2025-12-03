"use client";

/**
 * Agency Presence Panel
 * Phase 32: Agency Experience Layer
 *
 * Shows virtual team with named roles and status
 */

import { Users, Bot, Briefcase, Search, Palette, CheckCircle, Clock, Settings, BarChart } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  icon: React.ReactNode;
  status: "active" | "reviewing" | "implementing" | "testing" | "reporting";
  statusLine: string;
}

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  reviewing: "bg-blue-100 text-blue-700",
  implementing: "bg-yellow-100 text-yellow-700",
  testing: "bg-purple-100 text-purple-700",
  reporting: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS = {
  active: "Active",
  reviewing: "Reviewing",
  implementing: "Implementing",
  testing: "Testing",
  reporting: "Reporting",
};

export default function AgencyPresencePanel() {
  // This would be fetched from API/database in production
  const team: TeamMember[] = [
    {
      name: "Strategy Lead",
      role: "Account Strategy",
      icon: <Briefcase className="w-5 h-5" />,
      status: "active",
      statusLine: "Monitoring your campaign performance this week",
    },
    {
      name: "SEO Specialist",
      role: "Search Optimization",
      icon: <Search className="w-5 h-5" />,
      status: "implementing",
      statusLine: "Running keyword analysis on your top pages",
    },
    {
      name: "Content Creative",
      role: "Content Strategy",
      icon: <Palette className="w-5 h-5" />,
      status: "reviewing",
      statusLine: "Drafting new email sequences for your audience",
    },
    {
      name: "NEXUS AI",
      role: "AI Intelligence",
      icon: <Bot className="w-5 h-5" />,
      status: "testing",
      statusLine: "Testing a new headline variant on your GMB profile",
    },
  ];

  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-text-primary">
          Your Team
        </h3>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Your dedicated team is working on your account right now.
      </p>

      <div className="space-y-4">
        {team.map((member, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex-shrink-0 p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
              {member.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-text-primary">
                  {member.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[member.status]}`}
                >
                  {STATUS_LABELS[member.status]}
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-1">
                {member.role}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {member.statusLine}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
