/**
 * Domain Health Grid - Cognitive Twin
 *
 * Grid of domain health scores showing 13 cognitive domains
 * with health scores, trend arrows, and drill-down functionality.
 */

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Activity,
  Target,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainHealth {
  domain_id: string;
  domain_name: string;
  health_score: number;
  previous_score?: number;
  last_updated: string;
  insight_count?: number;
}

interface DomainHealthGridProps {
  domains: DomainHealth[];
  onDomainClick?: (domainId: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function DomainHealthGrid({
  domains,
  onDomainClick,
  isLoading = false,
  error,
}: DomainHealthGridProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Calculate trend for each domain
  const domainsWithTrend = useMemo(() => {
    return domains.map((domain) => {
      let trend: "up" | "down" | "stable" = "stable";
      let trendValue = 0;

      if (domain.previous_score !== undefined) {
        trendValue = domain.health_score - domain.previous_score;
        if (trendValue > 2) {
trend = "up";
} else if (trendValue < -2) {
trend = "down";
}
      }

      return { ...domain, trend, trendValue };
    });
  }, [domains]);

  // Get health level based on score
  const getHealthLevel = (score: number): { label: string; variant: "success" | "warning" | "danger" | "default" } => {
    if (score >= 80) {
return { label: "Excellent", variant: "success" };
}
    if (score >= 60) {
return { label: "Good", variant: "default" };
}
    if (score >= 40) {
return { label: "Fair", variant: "warning" };
}
    return { label: "Needs Attention", variant: "danger" };
  };

  // Get color classes based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) {
return "text-green-600 dark:text-green-400";
}
    if (score >= 60) {
return "text-blue-600 dark:text-blue-400";
}
    if (score >= 40) {
return "text-yellow-600 dark:text-yellow-400";
}
    return "text-red-600 dark:text-red-400";
  };

  // Get background color based on score
  const getBackgroundColor = (score: number, isSelected: boolean): string => {
    const base = isSelected ? "ring-2 ring-blue-500" : "";
    if (score >= 80) {
return cn("bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800", base);
}
    if (score >= 60) {
return cn("bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800", base);
}
    if (score >= 40) {
return cn("bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800", base);
}
    return cn("bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800", base);
  };

  // Render trend icon
  const TrendIcon = ({ trend, value }: { trend: "up" | "down" | "stable"; value: number }) => {
    if (trend === "up") {
return <TrendingUp className="w-4 h-4 text-green-500" />;
}
    if (trend === "down") {
return <TrendingDown className="w-4 h-4 text-red-500" />;
}
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Handle domain click
  const handleDomainClick = (domainId: string) => {
    setSelectedDomain(domainId);
    onDomainClick?.(domainId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(13)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-bg-hover rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-bg-hover rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-bg-hover rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="bordered" className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Error Loading Domains</p>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Brain className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Domains Yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Domain health data will appear here once your Cognitive Twin starts tracking.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main render
  return (
    <div>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Brain className="w-4 h-4" />
              <span>Total Domains</span>
            </div>
            <p className="text-2xl font-bold">{domains.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span>Average Health</span>
            </div>
            <p className="text-2xl font-bold">
              {(domains.reduce((sum, d) => sum + d.health_score, 0) / domains.length).toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 text-sm mb-1">
              <Target className="w-4 h-4" />
              <span>Excellent</span>
            </div>
            <p className="text-2xl font-bold">
              {domains.filter(d => d.health_score >= 80).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>Needs Attention</span>
            </div>
            <p className="text-2xl font-bold">
              {domains.filter(d => d.health_score < 40).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {domainsWithTrend.map((domain) => {
          const healthLevel = getHealthLevel(domain.health_score);
          const isSelected = selectedDomain === domain.domain_id;

          return (
            <Card
              key={domain.domain_id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                getBackgroundColor(domain.health_score, isSelected)
              )}
              onClick={() => handleDomainClick(domain.domain_id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold line-clamp-2">
                    {domain.domain_name}
                  </CardTitle>
                  <TrendIcon trend={domain.trend} value={domain.trendValue} />
                </div>
              </CardHeader>

              <CardContent>
                {/* Health Score */}
                <div className="mb-3">
                  <div className={cn("text-3xl font-bold", getScoreColor(domain.health_score))}>
                    {domain.health_score}
                    <span className="text-lg text-gray-500">/100</span>
                  </div>

                  {domain.trendValue !== 0 && (
                    <div className={cn(
                      "text-xs font-medium mt-1",
                      domain.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {domain.trendValue > 0 ? "+" : ""}{domain.trendValue} from last check
                    </div>
                  )}
                </div>

                {/* Health Badge */}
                <Badge variant={healthLevel.variant} size="sm">
                  {healthLevel.label}
                </Badge>

                {/* Meta Info */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                  <span className="text-xs text-gray-500">
                    {new Date(domain.last_updated).toLocaleDateString()}
                  </span>
                  {domain.insight_count !== undefined && domain.insight_count > 0 && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {domain.insight_count} insights
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
