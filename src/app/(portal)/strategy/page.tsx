"use client";

import React from "react";
import { StrategyViewer } from "@/components/strategy/StrategyViewer";
import { Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StrategyPage() {
  // TODO: Replace with actual Convex data
  const mockStrategy = {
    _id: "1",
    strategyTitle: "Integrated Digital Marketing Strategy 2025",
    executiveSummary:
      "A comprehensive multi-platform marketing approach designed to increase brand awareness, generate qualified leads, and drive sustainable growth through targeted digital campaigns.",
    marketAnalysis:
      "The digital marketing landscape is increasingly competitive. Our analysis shows strong opportunities in social media marketing and content marketing, with particular emphasis on LinkedIn and Instagram for B2B and lifestyle content respectively.",
    targetAudience:
      "Tech-savvy professionals aged 30-45, earning $75,000-$150,000 annually, primarily located in urban areas. They value efficiency, innovation, and ROI-driven solutions.",
    uniqueSellingProposition:
      "Unite-Hub combines AI-powered automation with personalized marketing insights, enabling businesses to scale their marketing efforts without proportional increases in time or budget investment.",
    competitorAnalysis:
      "Major competitors include HubSpot, Marketo, and ActiveCampaign. Our differentiation lies in deeper AI integration and more affordable pricing for small to medium businesses.",
    marketingChannels: [
      {
        channel: "LinkedIn",
        description:
          "Primary B2B channel for thought leadership and professional networking",
        priority: "high" as const,
      },
      {
        channel: "Instagram",
        description: "Visual storytelling and brand personality showcase",
        priority: "high" as const,
      },
      {
        channel: "Email Marketing",
        description: "Nurture campaigns and customer retention",
        priority: "high" as const,
      },
      {
        channel: "Content Marketing",
        description: "SEO-optimized blog posts and resources",
        priority: "medium" as const,
      },
    ],
    contentStrategy:
      "Create valuable, educational content that positions Unite-Hub as a thought leader in marketing automation. Focus on case studies, how-to guides, and industry insights that demonstrate ROI and practical applications.",
    contentPillars: [
      "Marketing Automation Tips",
      "AI in Marketing",
      "ROI Success Stories",
      "Small Business Growth",
      "Digital Marketing Trends",
    ],
    successMetrics: [
      {
        metric: "Lead Generation",
        target: "500 qualified leads per month",
        timeframe: "Q1 2025",
      },
      {
        metric: "Social Media Engagement",
        target: "25% increase in engagement rate",
        timeframe: "Q2 2025",
      },
      {
        metric: "Email Open Rate",
        target: "Above 30%",
        timeframe: "Ongoing",
      },
      {
        metric: "Website Traffic",
        target: "50% YoY growth",
        timeframe: "2025",
      },
    ],
    budgetGuidance:
      "Recommended monthly budget of $5,000-$10,000 split across: 40% paid advertising, 30% content creation, 20% tools and software, 10% testing and optimization.",
    platformStrategies: [
      {
        platform: "facebook" as const,
        strategy:
          "Leverage Facebook Groups and community building to create engaged micro-communities around marketing automation topics.",
        tactics: [
          "Join and participate in relevant marketing groups",
          "Create a branded Facebook community",
          "Run targeted lead generation campaigns",
          "Use Facebook Live for product demos",
        ],
      },
      {
        platform: "instagram" as const,
        strategy:
          "Visual storytelling approach showcasing customer success stories, behind-the-scenes content, and quick marketing tips.",
        tactics: [
          "Daily Stories with marketing tips",
          "Reels showcasing platform features",
          "Carousel posts for educational content",
          "User-generated content campaigns",
        ],
      },
      {
        platform: "linkedin" as const,
        strategy:
          "Establish thought leadership through long-form content, company updates, and professional networking.",
        tactics: [
          "Weekly LinkedIn articles on marketing trends",
          "Employee advocacy program",
          "LinkedIn Live webinars",
          "Targeted InMail campaigns for enterprise clients",
        ],
      },
      {
        platform: "tiktok" as const,
        strategy:
          "Experiment with short-form video content targeting younger entrepreneurs and startup founders.",
        tactics: [
          "Quick marketing hack videos",
          "Trending audio integration",
          "Day-in-the-life content",
          "Collaborate with micro-influencers",
        ],
      },
    ],
    version: 1,
    isActive: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Strategy</h1>
          <p className="text-gray-600 mt-1">
            AI-generated comprehensive marketing strategy tailored to your business
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2">
          <Sparkles className="h-5 w-5" />
          Regenerate Strategy
        </Button>
      </div>

      <StrategyViewer strategy={mockStrategy} />
    </div>
  );
}
