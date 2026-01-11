"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type EnergyReading = {
  id: string;
  energy_level: number;
  category: string;
  measurement_type: string;
  time_of_day: string;
  day_of_week: number;
  activity_context: string | null;
  created_at: string;
};

type EnergyPattern = {
  id: string;
  pattern_type: string;
  time_start: string;
  time_end: string;
  avg_energy_level: number;
  peak_category: string;
  confidence: number;
  data_points: number;
  recommendation: string;
};

type Summary = {
  total_readings: number;
  avg_energy: number;
  max_energy: number;
  min_energy: number;
  peak_count: number;
  low_count: number;
  by_category: Record<string, number>;
  hourly_pattern: Record<string, number>;
};

export default function EnergyMappingPage() {
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [patterns, setPatterns] = useState<EnergyPattern[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [optimalWindows, setOptimalWindows] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"heatmap" | "patterns" | "readings">("heatmap");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Load summary
        const summaryRes = await fetch(
          `/api/founder/energy-mapping?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Load patterns
        const patternsRes = await fetch(
          `/api/founder/energy-mapping?workspaceId=${workspaceId}&action=detect-patterns&minConfidence=70`
        );
        const patternsData = await patternsRes.json();
        setPatterns(patternsData.patterns || []);

        // Load optimal windows
        const windowsRes = await fetch(
          `/api/founder/energy-mapping?workspaceId=${workspaceId}&action=optimal-windows`
        );
        const windowsData = await windowsRes.json();
        setOptimalWindows(windowsData.windows);

        // Load recent readings
        const readingsRes = await fetch(
          `/api/founder/energy-mapping?workspaceId=${workspaceId}&limit=20`
        );
        const readingsData = await readingsRes.json();
        setReadings(readingsData.readings || []);
      } catch (error) {
        console.error("Failed to load energy mapping data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const categoryColor = (category: string) => {
    switch (category) {
      case "flow_state":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "peak":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "high":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "moderate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "depleted":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const energyGauge = (energy: number) => {
    const color =
      energy >= 90
        ? "bg-purple-500"
        : energy >= 75
          ? "bg-emerald-500"
          : energy >= 50
            ? "bg-accent-500"
            : energy >= 30
              ? "bg-amber-500"
              : "bg-red-500";
    return (
      <div className="relative h-2 bg-bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-300`}
          style={{ width: `${energy}%` }}
        />
      </div>
    );
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading energy mapping data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Energy Mapping Engine</h1>
        <p className="text-text-secondary">
          Track energy peaks and troughs with time-of-day productivity mapping and optimal work
          window recommendations
        </p>
      </header>

      {/* Optimal Windows Alert */}
      {optimalWindows?.peak_windows && optimalWindows.peak_windows.length > 0 && (
        <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="text-emerald-400 text-xl">⚡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-400 mb-2">Optimal Work Windows Detected</h3>
              <div className="space-y-1">
                {optimalWindows.peak_windows.slice(0, 3).map((window: any, idx: number) => (
                  <div key={idx} className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {window.time_start} - {window.time_end}
                    </span>
                    {" · "}
                    Avg Energy: {window.avg_energy_level.toFixed(1)}
                    {" · "}
                    <span className="italic">{window.recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView("heatmap")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "heatmap"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Energy Heatmap
        </button>
        <button
          onClick={() => setView("patterns")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "patterns"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Patterns
        </button>
        <button
          onClick={() => setView("readings")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "readings"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Recent Readings
        </button>
      </div>

      {/* Heatmap View */}
      {view === "heatmap" && summary && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Total Readings</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_readings}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Energy</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.avg_energy.toFixed(1)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Peak</div>
              <div className="text-2xl font-bold text-emerald-400">
                {summary.max_energy.toFixed(1)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Low</div>
              <div className="text-2xl font-bold text-red-400">{summary.min_energy.toFixed(1)}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Peak Count</div>
              <div className="text-2xl font-bold text-accent-400">{summary.peak_count}</div>
            </Card>
          </div>

          {/* Hourly Pattern */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Energy by Hour of Day</h3>
            <div className="space-y-3">
              {Object.entries(summary.hourly_pattern)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, energy]) => (
                  <div key={hour} className="flex items-center gap-4">
                    <div className="text-sm text-text-secondary w-16">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    <div className="flex-1">
                      {energyGauge(energy as number)}
                    </div>
                    <div className="text-sm text-text-primary font-medium w-12 text-right">
                      {(energy as number).toFixed(0)}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Category Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Energy Distribution</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_category).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(category)}`}
                  >
                    {category.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_readings) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Patterns View */}
      {view === "patterns" && (
        <div className="space-y-4">
          {patterns.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No energy patterns detected yet. Collect more readings to identify patterns.
            </Card>
          ) : (
            patterns.map((pattern) => (
              <Card
                key={pattern.id}
                className="p-6 space-y-4 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(pattern.peak_category)}`}
                      >
                        {pattern.peak_category}
                      </span>
                      <span className="text-sm text-text-primary font-medium">
                        {pattern.time_start} - {pattern.time_end}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary italic">
                      {pattern.recommendation}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-2xl font-bold text-text-primary">
                      {pattern.avg_energy_level.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">avg energy</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-text-secondary">Confidence: </span>
                    <span className="text-text-primary font-medium">
                      {pattern.confidence.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Data Points: </span>
                    <span className="text-text-primary font-medium">{pattern.data_points}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Readings View */}
      {view === "readings" && (
        <div className="space-y-4">
          {readings.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No energy readings recorded yet
            </Card>
          ) : (
            readings.map((reading) => (
              <Card
                key={reading.id}
                className="p-4 space-y-2 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(reading.category)}`}
                      >
                        {reading.category}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {reading.measurement_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {reading.activity_context && (
                      <p className="text-sm text-text-secondary">{reading.activity_context}</p>
                    )}
                    <div className="text-xs text-text-secondary">
                      {dayNames[reading.day_of_week]} · {reading.time_of_day} ·{" "}
                      {new Date(reading.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-bold text-text-primary">
                      {reading.energy_level.toFixed(0)}
                    </div>
                    <div className="w-24">{energyGauge(reading.energy_level)}</div>
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
