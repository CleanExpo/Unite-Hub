"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";

type Forecast = {
  id: string;
  forecast_type: string;
  forecast_horizon: string;
  forecast_method: string;
  forecast_value: number;
  confidence: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  actual_value: number | null;
  forecast_error: number | null;
  is_expired: boolean;
  created_at: string;
  valid_until: string;
};

type ForecastAccuracy = {
  total_forecasts: number;
  expired_forecasts: number;
  avg_absolute_error: number;
  avg_confidence: number;
};

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [accuracy, setAccuracy] = useState<ForecastAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "all">("active");
  const [forecastTypeFilter, setForecastTypeFilter] = useState<string>("all");

  const workspaceId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth context

  useEffect(() => {
    loadData();
  }, [viewMode, forecastTypeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load accuracy
      const accuracyRes = await fetch(
        `/api/founder/forecast?workspaceId=${workspaceId}&action=accuracy`
      );
      if (!accuracyRes.ok) {
throw new Error("Failed to load accuracy");
}
      const accuracyData = await accuracyRes.json();
      setAccuracy(accuracyData.accuracy);

      // Load forecasts
      const params = new URLSearchParams({ workspaceId });
      if (viewMode === "all") {
params.append("includeExpired", "true");
}

      const forecastsRes = await fetch(`/api/founder/forecast?${params}`);
      if (!forecastsRes.ok) {
throw new Error("Failed to load forecasts");
}
      const forecastsData = await forecastsRes.json();

      let items = forecastsData.items || [];
      if (forecastTypeFilter !== "all") {
        items = items.filter((f: Forecast) => f.forecast_type === forecastTypeFilter);
      }

      setForecasts(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case "1_day": return "1 Day";
      case "7_days": return "7 Days";
      case "30_days": return "30 Days";
      case "90_days": return "90 Days";
      case "1_year": return "1 Year";
      default: return horizon;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      heuristic: "bg-blue-500",
      linear_regression: "bg-green-500",
      time_series: "bg-purple-500",
      ml_model: "bg-accent-500",
      manual: "bg-gray-500",
    };
    return colors[method] || "bg-gray-500";
  };

  const getForecastTrend = (forecast: Forecast) => {
    if (forecast.actual_value === null) {
return null;
}
    const diff = forecast.actual_value - forecast.forecast_value;
    if (Math.abs(diff) < 0.01) {
return <Activity className="h-4 w-4 text-gray-500" />;
}
    return diff > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  if (loading && !accuracy) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-text-primary">Loading forecast data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Governance Forecaster</h1>
            <p className="text-text-secondary mt-1">Predictive governance analytics and trend forecasting</p>
          </div>
          <Button onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <Card className="bg-red-500/10 border-red-500">
            <CardContent className="p-4">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Accuracy Cards */}
        {accuracy && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Total Forecasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">{accuracy.total_forecasts}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Expired Forecasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-500">{accuracy.expired_forecasts}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Avg Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">
                  {accuracy.avg_confidence ? `${accuracy.avg_confidence.toFixed(1)}%` : "N/A"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Avg Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">
                  {accuracy.avg_absolute_error ? accuracy.avg_absolute_error.toFixed(2) : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Forecast Type</label>
                <Select value={forecastTypeFilter} onValueChange={setForecastTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="compliance_score">Compliance Score</SelectItem>
                    <SelectItem value="risk_score">Risk Score</SelectItem>
                    <SelectItem value="incident_rate">Incident Rate</SelectItem>
                    <SelectItem value="debt_accumulation">Debt Accumulation</SelectItem>
                    <SelectItem value="remediation_backlog">Remediation Backlog</SelectItem>
                    <SelectItem value="system_load">System Load</SelectItem>
                    <SelectItem value="user_satisfaction">User Satisfaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">View Mode</label>
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as "active" | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Forecasts</SelectItem>
                    <SelectItem value="all">All Forecasts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecasts List */}
        <Card className="bg-bg-card border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            {forecasts.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No forecasts found</div>
            ) : (
              <div className="space-y-3">
                {forecasts.map((forecast) => (
                  <div
                    key={forecast.id}
                    className={`flex items-start gap-4 p-4 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors border ${
                      forecast.is_expired ? "border-gray-500 opacity-60" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-center p-3 rounded-lg bg-accent-500/10">
                      <Target className="h-6 w-6 text-accent-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-text-primary">{forecast.forecast_type}</span>
                        <Badge className={`${getMethodBadge(forecast.forecast_method)} text-white`}>
                          {forecast.forecast_method}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getHorizonLabel(forecast.forecast_horizon)}
                        </Badge>
                        {forecast.is_expired && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Expired
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-text-tertiary text-xs">Forecast Value</div>
                          <div className="font-semibold text-text-primary">{forecast.forecast_value.toFixed(2)}</div>
                        </div>

                        {forecast.confidence !== null && (
                          <div>
                            <div className="text-text-tertiary text-xs">Confidence</div>
                            <div className="font-semibold text-text-primary">{forecast.confidence.toFixed(1)}%</div>
                          </div>
                        )}

                        {forecast.actual_value !== null && (
                          <div>
                            <div className="text-text-tertiary text-xs">Actual Value</div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">
                                {forecast.actual_value.toFixed(2)}
                              </span>
                              {getForecastTrend(forecast)}
                            </div>
                          </div>
                        )}

                        {forecast.forecast_error !== null && (
                          <div>
                            <div className="text-text-tertiary text-xs">Error</div>
                            <div className="font-semibold text-red-500">
                              {Math.abs(forecast.forecast_error).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {(forecast.lower_bound !== null || forecast.upper_bound !== null) && (
                        <div className="mt-2 text-xs text-text-tertiary">
                          Range: {forecast.lower_bound?.toFixed(2) || "N/A"} - {forecast.upper_bound?.toFixed(2) || "N/A"}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                        <span>Created: {new Date(forecast.created_at).toLocaleDateString()}</span>
                        <span>Valid Until: {new Date(forecast.valid_until).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
