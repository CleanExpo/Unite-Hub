"use client";

import React from "react";
import { HooksLibrary } from "@/components/hooks/HooksLibrary";

export default function HooksPage() {
  // TODO: Replace with actual Convex data
  const mockHooks = [
    {
      _id: "1",
      hookText:
        "Stop wasting 10+ hours per week on manual marketing tasks. Discover how AI automation can transform your workflow.",
      platform: "linkedin",
      category: "awareness",
      scriptType: "hook",
      effectivenessScore: 9,
      contextExplanation:
        "This hook uses a specific pain point (time waste) combined with a clear benefit (transformation), creating curiosity without being overly salesy.",
      suggestedUse:
        "Use as the opening line for LinkedIn posts about productivity or as an email subject line for cold outreach.",
      tags: ["productivity", "automation", "time-saving"],
      isFavorite: true,
      usageCount: 15,
    },
    {
      _id: "2",
      hookText:
        "Your competitors are already using AI. Here's how to catch up in 30 days or less.",
      platform: "email",
      category: "consideration",
      scriptType: "email_subject",
      effectivenessScore: 8,
      contextExplanation:
        "Creates urgency through competitive pressure while offering a concrete timeframe for results.",
      suggestedUse: "Email subject line for educational campaign sequences.",
      tags: ["competitive", "urgency", "education"],
      isFavorite: false,
      usageCount: 8,
    },
    {
      _id: "3",
      hookText:
        "3 marketing mistakes that are costing you thousands (and how to fix them today)",
      platform: "facebook",
      category: "conversion",
      scriptType: "ad_copy",
      effectivenessScore: 9,
      contextExplanation:
        "List-based hook with clear cost implication and immediate solution promise.",
      suggestedUse:
        "Facebook ad headline or Instagram carousel post opening slide.",
      tags: ["mistakes", "savings", "actionable"],
      isFavorite: true,
      usageCount: 22,
    },
  ];

  return (
    <div className="space-y-6">
      <HooksLibrary
        hooks={mockHooks}
        onGenerateNew={() => console.log("Generate new hooks")}
        onToggleFavorite={(hookId) => console.log("Toggle favorite:", hookId)}
        onUseHook={(hookId) => console.log("Use hook:", hookId)}
      />
    </div>
  );
}
