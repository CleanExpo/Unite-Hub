"use client";

/**
 * Just Dropped Ideas Panel
 * Phase 32: Agency Experience Layer
 *
 * Surface enhancement ideas for SEO, GEO, GMB, content, social
 */

import { Sparkles, ArrowRight, Clock, Rocket, CheckCircle2 } from "lucide-react";

type IdeaStatus = "proposed" | "queued" | "launched";

interface Idea {
  id: string;
  title: string;
  category: string;
  status: IdeaStatus;
  impact: "high" | "medium" | "low";
  description: string;
}

const STATUS_CONFIG = {
  proposed: {
    label: "Proposed",
    color: "bg-gray-100 text-gray-700",
    icon: <Sparkles className="w-3 h-3" />,
  },
  queued: {
    label: "Queued",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-3 h-3" />,
  },
  launched: {
    label: "Launched",
    color: "bg-green-100 text-green-700",
    icon: <Rocket className="w-3 h-3" />,
  },
};

const IMPACT_COLORS = {
  high: "border-l-green-500",
  medium: "border-l-yellow-500",
  low: "border-l-gray-400",
};

export default function JustDroppedIdeasPanel() {
  // This would be pulled from AGENTIC_OPTIMIZATION_LOG or similar
  const ideas: Idea[] = [
    {
      id: "1",
      title: "Add FAQ schema to service pages",
      category: "SEO",
      status: "proposed",
      impact: "high",
      description: "Structured data can improve search visibility by 20-30%",
    },
    {
      id: "2",
      title: "Optimize GMB posts for local keywords",
      category: "GEO",
      status: "queued",
      impact: "high",
      description: "Weekly posts with location keywords boost local pack ranking",
    },
    {
      id: "3",
      title: "A/B test email subject lines",
      category: "Content",
      status: "launched",
      impact: "medium",
      description: "Testing question vs. statement formats",
    },
    {
      id: "4",
      title: "Create video testimonial request flow",
      category: "Social",
      status: "proposed",
      impact: "medium",
      description: "Video content drives 2x engagement on social",
    },
  ];

  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-text-primary">
          Just Dropped
        </h3>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Fresh ideas to grow your business
      </p>

      <div className="space-y-3">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className={`p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 ${IMPACT_COLORS[idea.impact]}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                  {idea.category}
                </span>
                <h4 className="font-medium text-text-primary text-sm">
                  {idea.title}
                </h4>
              </div>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[idea.status].color}`}
              >
                {STATUS_CONFIG[idea.status].icon}
                {STATUS_CONFIG[idea.status].label}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {idea.description}
            </p>
          </div>
        ))}
      </div>

      {ideas.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">
          No new ideas yet. We&apos;re analyzing your data!
        </p>
      )}

      <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium">
        View all ideas
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
