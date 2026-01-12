"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";

export default function InsightsPage() {
  const insights = [
    {
      type: "opportunity",
      icon: Lightbulb,
      title: "High-Intent Leads Detected",
      description: "5 leads have visited your pricing page 3+ times this week. Consider reaching out with a personalized offer.",
      action: "View Leads",
      color: "text-warning-500",
    },
    {
      type: "success",
      icon: CheckCircle,
      title: "Email Campaign Performing Well",
      description: "Your 'November Newsletter' has a 48% open rate, significantly above industry average.",
      action: "View Details",
      color: "text-success-500",
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Website Traffic Declining",
      description: "Organic traffic is down 12% this week. Consider reviewing your SEO strategy.",
      action: "View Analytics",
      color: "text-accent-500",
    },
    {
      type: "recommendation",
      icon: Zap,
      title: "AI Content Suggestion",
      description: "Based on trending topics, consider creating content about 'AI automation for small businesses'.",
      action: "Generate Content",
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">AI Insights</h1>
        <p className="text-text-muted mt-1">AI-powered recommendations and business intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-cyan-900/50 to-bg-raised/50 border-cyan-800/50">
          <CardHeader>
            <CardTitle className="text-text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">New Leads</span>
              <span className="text-text-primary font-medium">+23</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Emails Sent</span>
              <span className="text-text-primary font-medium">1,247</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Conversions</span>
              <span className="text-text-primary font-medium">8</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-raised/50 border-border-medium">
          <CardHeader>
            <CardTitle className="text-text-primary">AI Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success-500">87</div>
            <p className="text-sm text-text-muted mt-1">Your business health is excellent</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Actionable Insights</h2>
        {insights.map((insight, index) => (
          <Card key={index} className="bg-bg-raised/50 border-border-medium">
            <CardContent className="flex items-start gap-4 p-4">
              <div className={`p-2 bg-bg-card rounded-lg ${insight.color}`}>
                <insight.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text-primary">{insight.title}</h3>
                <p className="text-sm text-text-muted mt-1">{insight.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
