"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown } from "lucide-react";

export function UsageMetrics() {
  // TODO: Replace with actual Convex data
  const usage = {
    emailsAnalyzed: { current: 42, limit: 100 },
    personasGenerated: { current: 2, limit: 5 },
    campaignsCreated: { current: 8, limit: 20 },
    imagesGenerated: { current: 15, limit: 50 },
    tier: "professional",
  };

  const calculatePercentage = (current: number, limit: number) =>
    Math.round((current / limit) * 100);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 hover:border-blue-300 transition-colors">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Usage</span>
          <Badge variant="secondary" className="ml-1">
            {calculatePercentage(
              usage.emailsAnalyzed.current,
              usage.emailsAnalyzed.limit
            )}%
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Monthly Usage</h4>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Crown className="h-3 w-3 mr-1" />
              {usage.tier}
            </Badge>
          </div>

          <div className="space-y-3">
            <UsageItem
              label="Emails Analyzed"
              current={usage.emailsAnalyzed.current}
              limit={usage.emailsAnalyzed.limit}
            />
            <UsageItem
              label="Personas Generated"
              current={usage.personasGenerated.current}
              limit={usage.personasGenerated.limit}
            />
            <UsageItem
              label="Campaigns Created"
              current={usage.campaignsCreated.current}
              limit={usage.campaignsCreated.limit}
            />
            <UsageItem
              label="AI Images"
              current={usage.imagesGenerated.current}
              limit={usage.imagesGenerated.limit}
            />
          </div>

          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
            Upgrade Plan
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UsageItem({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const percentage = Math.round((current / limit) * 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className={isNearLimit ? "text-orange-600 font-medium" : "text-gray-600"}>
          {current} / {limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={isNearLimit ? "bg-orange-100" : "bg-gray-100"}
      />
    </div>
  );
}
