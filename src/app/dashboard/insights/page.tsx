"use client";

import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";

export default function InsightsPage() {
  const insights = [
    {
      type: "opportunity",
      icon: Lightbulb,
      title: "High-Intent Leads Detected",
      description: "5 leads have visited your pricing page 3+ times this week. Consider reaching out with a personalised offer.",
      action: "View Leads",
      color: "text-[#FFB800]",
    },
    {
      type: "success",
      icon: CheckCircle,
      title: "Email Campaign Performing Well",
      description: "Your 'November Newsletter' has a 48% open rate, significantly above industry average.",
      action: "View Details",
      color: "text-[#00FF88]",
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Website Traffic Declining",
      description: "Organic traffic is down 12% this week. Consider reviewing your SEO strategy.",
      action: "View Analytics",
      color: "text-[#FFB800]",
    },
    {
      type: "recommendation",
      icon: Zap,
      title: "AI Content Suggestion",
      description: "Based on trending topics, consider creating content about 'AI automation for small businesses'.",
      action: "Generate Content",
      color: "text-[#00F5FF]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white/90">AI Insights</h1>
        <p className="text-white/50 mt-1">AI-powered recommendations and business intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm p-4">
          <h3 className="text-white/90 font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00F5FF]" />
            Weekly Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">New Leads</span>
              <span className="text-white/90 font-medium">+23</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Emails Sent</span>
              <span className="text-white/90 font-medium">1,247</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Conversions</span>
              <span className="text-white/90 font-medium">8</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <h3 className="text-white/90 font-bold mb-3">AI Health Score</h3>
          <div className="text-4xl font-bold text-[#00FF88]">87</div>
          <p className="text-sm text-white/50 mt-1">Your business health is excellent</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white/90">Actionable Insights</h2>
        {insights.map((insight, index) => (
          <div key={index} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-start gap-4">
            <div className={`p-2 bg-white/[0.04] rounded-sm ${insight.color}`}>
              <insight.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white/90">{insight.title}</h3>
              <p className="text-sm text-white/50 mt-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
