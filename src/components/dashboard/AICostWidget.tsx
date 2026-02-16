"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface AICostDashboardData {
  today: {
    total_cost: string;
    budget_remaining: string;
    percentage_used: number;
    at_risk: boolean;
  } | null;
  this_month: {
    total_cost: string;
    budget_remaining: string;
    percentage_used: number;
  } | null;
  breakdown: Array<{
    provider: string;
    task_type: string;
    request_count: number;
    total_cost_usd: number;
    avg_cost_usd: number;
  }>;
  savings: {
    total_saved: string;
    savings_percentage: string;
    openrouter_usage: string;
  };
}

interface AICostWidgetProps {
  workspaceId: string;
}

export function AICostWidget({ workspaceId }: AICostWidgetProps) {
  const [data, setData] = useState<AICostDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/ai/cost-dashboard?workspaceId=${workspaceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch AI cost data");
      }
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching AI cost dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage & Costs</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage & Costs</CardTitle>
          <CardDescription className="text-destructive">{error || "No data available"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          AI Usage & Costs
        </CardTitle>
        <CardDescription>OpenRouter-first cost optimization (70% savings)</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>

          {/* Today's Usage */}
          <TabsContent value="today" className="space-y-4">
            {data.today ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{data.today.total_cost}</p>
                    <p className="text-sm text-muted-foreground">Spent today</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{data.today.budget_remaining}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget Usage</span>
                    <span className="font-medium">{data.today.percentage_used.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={data.today.percentage_used}
                    className={`h-2 ${
                      data.today.percentage_used >= 90
                        ? "bg-red-200"
                        : data.today.percentage_used >= 80
                          ? "bg-yellow-200"
                          : "bg-green-200"
                    }`}
                  />
                </div>

                {data.today.at_risk ? (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Approaching daily budget limit
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">Budget on track</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No usage data for today</p>
            )}
          </TabsContent>

          {/* Monthly Usage */}
          <TabsContent value="month" className="space-y-4">
            {data.this_month ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{data.this_month.total_cost}</p>
                    <p className="text-sm text-muted-foreground">Spent this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{data.this_month.budget_remaining}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Budget</span>
                    <span className="font-medium">{data.this_month.percentage_used.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={data.this_month.percentage_used}
                    className={`h-2 ${
                      data.this_month.percentage_used >= 90
                        ? "bg-red-200"
                        : data.this_month.percentage_used >= 80
                          ? "bg-yellow-200"
                          : "bg-green-200"
                    }`}
                  />
                </div>

                {/* Savings Display */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-lg font-bold text-green-600">{data.savings.total_saved}</p>
                    <p className="text-xs text-muted-foreground">Saved</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{data.savings.savings_percentage}</p>
                    <p className="text-xs text-muted-foreground">Savings Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{data.savings.openrouter_usage}</p>
                    <p className="text-xs text-muted-foreground">OpenRouter</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No usage data for this month</p>
            )}
          </TabsContent>

          {/* Cost Breakdown */}
          <TabsContent value="breakdown" className="space-y-3">
            {data.breakdown && data.breakdown.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground mb-2">Top consumers</div>
                {data.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.provider === "openrouter" ? "default" : "secondary"}>
                          {item.provider}
                        </Badge>
                        <span className="text-sm font-medium">{item.task_type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.request_count.toLocaleString()} requests @ ${item.avg_cost_usd.toFixed(4)} avg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${item.total_cost_usd.toFixed(2)}</p>
                      {item.provider === "openrouter" && (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingDown className="h-3 w-3" />
                          <span className="text-xs">69% saved</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No cost breakdown available</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
