"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type TrendForecast = {
  id: string;
  forecast_window: string;
  forecast_category: string;
  current_score: number;
  predicted_score: number;
  predicted_change: number;
  predicted_change_pct: number;
  confidence_score: number;
  prediction_method: string;
  data_points_count: number;
  trend_direction: string;
  trend_strength: number;
  volatility_factor: number;
  risk_factors: any[];
  recommended_actions: string[];
  urgency_level: string;
  notes: string | null;
  forecast_generated_at: string;
  forecast_target_date: string;
};

type Summary = {
  forecast_24h: any;
  forecast_7d: any;
  forecast_30d: any;
  overall_trend: string;
  confidence_avg: number;
};

export default function TrendForecastPage() {
  const [forecasts, setForecasts] = useState<TrendForecast[]>([]);
  const [currentForecast, setCurrentForecast] = useState<any>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"current" | "history" | "summary">("current");
  const [selectedWindow, setSelectedWindow] = useState<"24h" | "7d" | "30d">("7d");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Generate current forecast
        const currentRes = await fetch(
          `/api/founder/trend-forecast?workspaceId=${workspaceId}&action=generate&window=${selectedWindow}`
        );
        const currentData = await currentRes.json();
        setCurrentForecast(currentData.forecast);

        // Get summary
        const summaryRes = await fetch(
          `/api/founder/trend-forecast?workspaceId=${workspaceId}&action=summary`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Get history
        const historyRes = await fetch(
          `/api/founder/trend-forecast?workspaceId=${workspaceId}&limit=50`
        );
        const historyData = await historyRes.json();
        setForecasts(historyData.forecasts || []);
      } catch (error) {
        console.error("Failed to load trend forecast:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading, selectedWindow]);

  const categoryColor = (category: string) => {
    switch (category) {
      case "improving":
        return "bg-success-500/10 text-success-400 border-emerald-500/20";
      case "stable":
        return "bg-info-500/10 text-info-400 border-info-500/20";
      case "declining":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "critical":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const windowColor = (window: string) => {
    switch (window) {
      case "24h":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "7d":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "30d":
        return "bg-cyan-500/10 text-info-400 border-cyan-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const trendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return "📈";
      case "down":
        return "📉";
      default:
        return "➡️";
    }
  };

  const changeIcon = (change: number) => {
    if (change >= 5) return "🚀";
    if (change > 0) return "↗️";
    if (change >= -5) return "➡️";
    if (change > -10) return "↘️";
    return "⚠️";
  };

  const scoreGauge = (score: number) => {
    const color =
      score >= 85
        ? "bg-success-500"
        : score >= 60
          ? "bg-info-500"
          : score >= 40
            ? "bg-warning-500"
            : "bg-error-500";
    return (
      <div className="relative h-3 bg-bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading trend forecast data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Founder Trend Forecaster</h1>
        <p className="text-text-secondary">
          Predictive time-series analysis using linear regression on F09-F14 historical data with
          confidence scoring
        </p>
      </header>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView("current")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "current"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Current Forecast
        </button>
        <button
          onClick={() => setView("summary")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "summary"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          All Windows Summary
        </button>
        <button
          onClick={() => setView("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "history"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          History
        </button>
      </div>

      {/* Current Forecast View */}
      {view === "current" && currentForecast && (
        <div className="space-y-6">
          {/* Window Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedWindow("24h")}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedWindow === "24h"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-bg-card text-text-secondary border-border hover:border-accent-500/50"
              }`}
            >
              24 Hour
            </button>
            <button
              onClick={() => setSelectedWindow("7d")}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedWindow === "7d"
                  ? "bg-accent-500/10 text-accent-400 border-accent-500/20"
                  : "bg-bg-card text-text-secondary border-border hover:border-accent-500/50"
              }`}
            >
              7 Day
            </button>
            <button
              onClick={() => setSelectedWindow("30d")}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedWindow === "30d"
                  ? "bg-cyan-500/10 text-info-400 border-cyan-500/20"
                  : "bg-bg-card text-text-secondary border-border hover:border-accent-500/50"
              }`}
            >
              30 Day
            </button>
          </div>

          {/* Main Forecast Card */}
          <Card className="p-8 space-y-6 bg-bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${categoryColor(
                      currentForecast.forecast_category
                    )}`}
                  >
                    {currentForecast.forecast_category}
                  </span>
                  <span className="text-2xl">
                    {trendIcon(currentForecast.trend_direction)}
                  </span>
                  <span className="text-text-secondary text-sm">
                    {currentForecast.trend_direction} trend (strength:{" "}
                    {currentForecast.trend_strength.toFixed(0)})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-secondary">
                    Confidence: {currentForecast.confidence_score.toFixed(0)}%
                  </span>
                  <span className="text-text-secondary">
                    Based on {currentForecast.data_points_count} data points
                  </span>
                  <span className="text-text-secondary">
                    Method: {currentForecast.prediction_method}
                  </span>
                </div>
                <p className="text-sm text-text-secondary max-w-2xl">
                  Forecast target: {new Date(currentForecast.forecast_target_date).toLocaleString()}
                </p>
              </div>
              <div className="text-right space-y-2">
                <div className="text-sm text-text-secondary">Current → Predicted</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-primary">
                    {currentForecast.current_score.toFixed(0)}
                  </span>
                  <span className="text-2xl text-text-secondary">→</span>
                  <span className="text-3xl font-bold text-accent-500">
                    {currentForecast.predicted_score.toFixed(0)}
                  </span>
                </div>
                <div
                  className={`text-lg font-semibold ${
                    currentForecast.predicted_change >= 0 ? "text-success-400" : "text-error-400"
                  }`}
                >
                  {changeIcon(currentForecast.predicted_change)}{" "}
                  {currentForecast.predicted_change >= 0 ? "+" : ""}
                  {currentForecast.predicted_change.toFixed(1)} (
                  {currentForecast.predicted_change_pct.toFixed(1)}%)
                </div>
              </div>
            </div>
            <div>{scoreGauge(currentForecast.predicted_score)}</div>
          </Card>

          {/* Component Forecasts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Unified State Forecast</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentForecast.unified_state_forecast.toFixed(0)}
              </div>
              {scoreGauge(currentForecast.unified_state_forecast)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Energy Trend Forecast</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentForecast.energy_trend_forecast.toFixed(0)}
              </div>
              {scoreGauge(currentForecast.energy_trend_forecast)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Cognitive Forecast</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentForecast.cognitive_forecast.toFixed(0)}
              </div>
              {scoreGauge(currentForecast.cognitive_forecast)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Recovery Forecast</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentForecast.recovery_forecast.toFixed(0)}
              </div>
              {scoreGauge(currentForecast.recovery_forecast)}
            </Card>
          </div>

          {/* Risk Factors */}
          {currentForecast.risk_factors && currentForecast.risk_factors.length > 0 && (
            <Card className="p-6 space-y-4 bg-bg-card border-border">
              <h3 className="text-lg font-semibold text-text-primary">⚠️ Risk Factors</h3>
              <div className="space-y-2">
                {currentForecast.risk_factors.map((risk: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-sm text-text-secondary">{risk.risk}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        risk.severity === "high"
                          ? "bg-error-500/10 text-error-400"
                          : risk.severity === "moderate"
                            ? "bg-warning-500/10 text-warning-400"
                            : "bg-info-500/10 text-info-400"
                      }`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommended Actions */}
          {currentForecast.recommended_actions && currentForecast.recommended_actions.length > 0 && (
            <Card className="p-6 space-y-4 bg-bg-card border-border">
              <h3 className="text-lg font-semibold text-text-primary">💡 Recommended Actions</h3>
              <ul className="space-y-2">
                {currentForecast.recommended_actions.map((action: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-400 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Summary View */}
      {view === "summary" && summary && (
        <div className="space-y-6">
          {/* Overall Trend */}
          <Card className="p-6 space-y-3 bg-bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Overall Trend</h3>
                <p className="text-sm text-text-secondary">Aggregate forecast across all windows</p>
              </div>
              <div className="text-right">
                <div className="text-4xl">{trendIcon(summary.overall_trend)}</div>
                <div className="text-sm text-text-secondary mt-1">
                  {summary.overall_trend} (avg confidence: {summary.confidence_avg.toFixed(0)}%)
                </div>
              </div>
            </div>
          </Card>

          {/* Window Forecasts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 24h Forecast */}
            {summary.forecast_24h && (
              <Card className="p-6 space-y-4 bg-bg-card border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    24 hour
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(
                      summary.forecast_24h.category
                    )}`}
                  >
                    {summary.forecast_24h.category}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-text-primary">
                    {summary.forecast_24h.predicted_score.toFixed(0)}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      summary.forecast_24h.change >= 0 ? "text-success-400" : "text-error-400"
                    }`}
                  >
                    {summary.forecast_24h.change >= 0 ? "+" : ""}
                    {summary.forecast_24h.change.toFixed(1)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Confidence: {summary.forecast_24h.confidence.toFixed(0)}%
                  </div>
                </div>
              </Card>
            )}

            {/* 7d Forecast */}
            {summary.forecast_7d && (
              <Card className="p-6 space-y-4 bg-bg-card border-accent-500/20">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-500/10 text-accent-400 border border-accent-500/20">
                    7 day
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(
                      summary.forecast_7d.category
                    )}`}
                  >
                    {summary.forecast_7d.category}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-text-primary">
                    {summary.forecast_7d.predicted_score.toFixed(0)}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      summary.forecast_7d.change >= 0 ? "text-success-400" : "text-error-400"
                    }`}
                  >
                    {summary.forecast_7d.change >= 0 ? "+" : ""}
                    {summary.forecast_7d.change.toFixed(1)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Confidence: {summary.forecast_7d.confidence.toFixed(0)}%
                  </div>
                </div>
              </Card>
            )}

            {/* 30d Forecast */}
            {summary.forecast_30d && (
              <Card className="p-6 space-y-4 bg-bg-card border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-info-400 border border-cyan-500/20">
                    30 day
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(
                      summary.forecast_30d.category
                    )}`}
                  >
                    {summary.forecast_30d.category}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-text-primary">
                    {summary.forecast_30d.predicted_score.toFixed(0)}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      summary.forecast_30d.change >= 0 ? "text-success-400" : "text-error-400"
                    }`}
                  >
                    {summary.forecast_30d.change >= 0 ? "+" : ""}
                    {summary.forecast_30d.change.toFixed(1)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Confidence: {summary.forecast_30d.confidence.toFixed(0)}%
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-4">
          {forecasts.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No trend forecasts recorded yet
            </Card>
          ) : (
            forecasts.map((forecast) => (
              <Card
                key={forecast.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${windowColor(
                          forecast.forecast_window
                        )}`}
                      >
                        {forecast.forecast_window}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(
                          forecast.forecast_category
                        )}`}
                      >
                        {forecast.forecast_category}
                      </span>
                      <span className="text-lg">{trendIcon(forecast.trend_direction)}</span>
                    </div>
                    {forecast.notes && <p className="text-sm text-text-secondary">{forecast.notes}</p>}
                    <div className="text-xs text-text-secondary">
                      Generated: {new Date(forecast.forecast_generated_at).toLocaleString()} •
                      Target: {new Date(forecast.forecast_target_date).toLocaleString()} •
                      Confidence: {forecast.confidence_score.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-text-primary">
                        {forecast.current_score.toFixed(0)}
                      </span>
                      <span className="text-text-secondary">→</span>
                      <span className="text-2xl font-bold text-accent-500">
                        {forecast.predicted_score.toFixed(0)}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        forecast.predicted_change >= 0 ? "text-success-400" : "text-error-400"
                      }`}
                    >
                      {forecast.predicted_change >= 0 ? "+" : ""}
                      {forecast.predicted_change.toFixed(1)} ({forecast.predicted_change_pct.toFixed(1)}
                      %)
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </main>
  );
}
