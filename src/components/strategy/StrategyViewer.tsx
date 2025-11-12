"use client";

import React, { useState } from "react";
import { StrategySection } from "./StrategySection";
import { PlatformStrategy } from "./PlatformStrategy";
import { Target, TrendingUp, Users, Zap, BarChart3, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface MarketingStrategy {
  _id: string;
  strategyTitle: string;
  executiveSummary: string;
  marketAnalysis: string;
  targetAudience: string;
  uniqueSellingProposition: string;
  competitorAnalysis?: string;
  marketingChannels: Array<{
    channel: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  contentStrategy: string;
  contentPillars: string[];
  successMetrics: Array<{
    metric: string;
    target: string;
    timeframe: string;
  }>;
  budgetGuidance?: string;
  platformStrategies: Array<{
    platform: "facebook" | "instagram" | "tiktok" | "linkedin";
    strategy: string;
    tactics: string[];
  }>;
  version: number;
  isActive: boolean;
}

interface StrategyViewerProps {
  strategy: MarketingStrategy;
}

export function StrategyViewer({ strategy }: StrategyViewerProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{strategy.strategyTitle}</h1>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/40">
                Version {strategy.version}
              </Badge>
              {strategy.isActive && (
                <Badge className="bg-green-500/20 text-white border-green-400/40">
                  Active Strategy
                </Badge>
              )}
            </div>
          </div>
        </div>
        <p className="text-lg opacity-90">{strategy.executiveSummary}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StrategySection
            icon={Target}
            title="Unique Selling Proposition"
            content={strategy.uniqueSellingProposition}
            color="blue"
          />

          <StrategySection
            icon={Users}
            title="Target Audience"
            content={strategy.targetAudience}
            color="purple"
          />

          <StrategySection
            icon={TrendingUp}
            title="Market Analysis"
            content={strategy.marketAnalysis}
            color="green"
          />

          {strategy.competitorAnalysis && (
            <StrategySection
              icon={Zap}
              title="Competitor Analysis"
              content={strategy.competitorAnalysis}
              color="orange"
              isProfessional
            />
          )}

          {/* Content Pillars */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Content Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategy.contentPillars.map((pillar, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-medium text-purple-900">{pillar}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Marketing Channels */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Marketing Channels</h3>
            <div className="space-y-3">
              {strategy.marketingChannels.map((channel, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <Badge
                    variant={
                      channel.priority === "high"
                        ? "default"
                        : channel.priority === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-0.5"
                  >
                    {channel.priority}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">{channel.channel}</p>
                    <p className="text-sm text-gray-600">{channel.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {strategy.budgetGuidance && (
            <StrategySection
              icon={DollarSign}
              title="Budget Guidance"
              content={strategy.budgetGuidance}
              color="green"
            />
          )}
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          {strategy.platformStrategies.map((platformStrategy, index) => (
            <PlatformStrategy key={index} strategy={platformStrategy} />
          ))}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Success Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy.successMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                >
                  <p className="font-medium text-gray-900 mb-2">{metric.metric}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-semibold text-blue-700">{metric.target}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Timeframe:</span>
                    <span className="text-gray-900">{metric.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <StrategySection
            icon={Target}
            title="Content Strategy"
            content={strategy.contentStrategy}
            color="purple"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
