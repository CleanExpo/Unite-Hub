"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Star, Copy, BarChart3 } from "lucide-react";

interface TemplateStatsProps {
  clientId: string;
}

export function TemplateStats({ clientId }: TemplateStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [clientId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/social-templates/stats?clientId=${clientId}`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Templates</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Favorites</p>
            <p className="text-2xl font-bold">{stats.favorites}</p>
          </div>
          <Star className="h-8 w-8 text-yellow-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Most Used</p>
            <p className="text-2xl font-bold">
              {stats.mostUsed[0]?.usageCount || 0}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {stats.mostUsed[0]?.name || "N/A"}
            </p>
          </div>
          <Copy className="h-8 w-8 text-green-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Top Platform</p>
            <p className="text-2xl font-bold">
              {Object.entries(stats.byPlatform)
                .sort(([, a]: any, [, b]: any) => b - a)[0]?.[1] || 0}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {Object.entries(stats.byPlatform)
                .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || "N/A"}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-600" />
        </div>
      </Card>
    </div>
  );
}
