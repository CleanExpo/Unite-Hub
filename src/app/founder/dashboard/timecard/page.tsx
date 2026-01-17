/**
 * Founder Timecard Dashboard
 * Phase 41.1: Founder Timecard System
 *
 * Personal time tracking with burnout detection
 * FOUNDER-ONLY ACCESS
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/components/Card";
import {
  Clock,
  Play,
  Square,
  Plus,
  Calendar,
  Download,
  AlertTriangle,
  Loader2,
  BarChart3,
} from "lucide-react";

type Period = "daily" | "weekly" | "monthly";
type Category = "admin" | "coding" | "meetings" | "strategy" | "finance" | "ops" | "sales" | "marketing" | "research" | "learning" | "break";

interface TimeSummary {
  totalMinutes: number;
  totalHours: number;
  byCategory: Record<string, number>;
  period: string;
}

interface BurnoutIndicator {
  risk: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendations: string[];
}

interface RunningTimer {
  id: string;
  startTime: string;
  category: Category;
  notes?: string;
}

const CATEGORIES: Category[] = [
  "admin", "coding", "meetings", "strategy", "finance",
  "ops", "sales", "marketing", "research", "learning", "break"
];

const CATEGORY_COLORS: Record<Category, string> = {
  admin: "bg-bg-hover0",
  coding: "bg-info-500",
  meetings: "bg-purple-500",
  strategy: "bg-accent-500",
  finance: "bg-success-500",
  ops: "bg-accent-500",
  sales: "bg-pink-500",
  marketing: "bg-indigo-500",
  research: "bg-cyan-500",
  learning: "bg-warning-500",
  break: "bg-success-500",
};

export default function FounderTimecardPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [summary, setSummary] = useState<TimeSummary | null>(null);
  const [burnout, setBurnout] = useState<BurnoutIndicator | null>(null);
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>("coding");
  const [timerElapsed, setTimerElapsed] = useState(0);

  useEffect(() => {
    fetchData();
  }, [period]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (runningTimer) {
      interval = setInterval(() => {
        const start = new Date(runningTimer.startTime).getTime();
        const now = Date.now();
        setTimerElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningTimer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, burnoutRes, timerRes] = await Promise.all([
        fetch(`/api/founder/timecard/summary?period=${period}`),
        fetch("/api/founder/timecard/burnout"),
        fetch("/api/founder/timecard/running"),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (burnoutRes.ok) {
        const data = await burnoutRes.json();
        setBurnout(data.indicator);
      }

      if (timerRes.ok) {
        const data = await timerRes.json();
        setRunningTimer(data.timer);
      }
    } catch (err) {
      console.error("Failed to fetch timecard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      const response = await fetch("/api/founder/timecard/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory }),
      });
      if (response.ok) {
        const data = await response.json();
        setRunningTimer(data.entry);
        setTimerElapsed(0);
      }
    } catch (err) {
      console.error("Failed to start timer:", err);
    }
  };

  const stopTimer = async () => {
    try {
      const response = await fetch("/api/founder/timecard/stop", {
        method: "POST",
      });
      if (response.ok) {
        setRunningTimer(null);
        setTimerElapsed(0);
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to stop timer:", err);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch(`/api/founder/timecard/export?period=${period}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timecard-${period}-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const riskColors = {
    low: "text-success-600 bg-success-100",
    medium: "text-warning-600 bg-warning-100",
    high: "text-accent-600 bg-accent-100",
    critical: "text-error-600 bg-error-100",
  };

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={Clock}
          title="Time Tracker"
          description="Personal time tracking with burnout detection"
          action={
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted bg-bg-card border rounded-lg hover:bg-bg-hover"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          }
        />

        {/* Timer Widget */}
        <Section className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Timer Display */}
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-text-primary">
                    {runningTimer ? formatTime(timerElapsed) : "00:00:00"}
                  </div>
                  {runningTimer && (
                    <div className="mt-2 text-sm text-text-tertiary">
                      {runningTimer.category}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
                  {!runningTimer ? (
                    <>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category)}
                        className="w-40 px-3 py-2 text-sm border rounded-lg bg-bg-card"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={startTimer}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700"
                      >
                        <Play className="w-4 h-4" />
                        Start Timer
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={stopTimer}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-error-600 rounded-lg hover:bg-error-700"
                    >
                      <Square className="w-4 h-4" />
                      Stop Timer
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Period Selector */}
        <Section className="mt-6">
          <div className="flex gap-2 p-1 bg-bg-hover rounded-lg w-fit">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-bg-input text-accent-600 shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Calendar className="w-4 h-4" />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </Section>

        {loading ? (
          <Section className="mt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            </div>
          </Section>
        ) : (
          <>
            {/* Summary Stats */}
            {summary && (
              <Section className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-text-tertiary">Total Hours</div>
                      <div className="text-2xl font-bold text-text-primary">
                        {summary.totalHours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {summary.totalMinutes} minutes
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-text-tertiary">Top Category</div>
                      <div className="text-2xl font-bold text-text-primary">
                        {Object.entries(summary.byCategory).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {Math.round((Object.entries(summary.byCategory).sort(([, a], [, b]) => b - a)[0]?.[1] || 0) / 60 * 10) / 10}h
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-text-tertiary">Categories</div>
                      <div className="text-2xl font-bold text-text-primary">
                        {Object.keys(summary.byCategory).length}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        active this {period.replace("ly", "")}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Section>
            )}

            {/* Category Breakdown */}
            {summary && Object.keys(summary.byCategory).length > 0 && (
              <Section className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Time by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(summary.byCategory)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, minutes]) => {
                          const percentage = summary.totalMinutes > 0
                            ? Math.round((minutes / summary.totalMinutes) * 100)
                            : 0;
                          return (
                            <div key={category} className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category as Category] || "bg-bg-hover0"}`} />
                              <span className="text-sm w-24 capitalize">{category}</span>
                              <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${CATEGORY_COLORS[category as Category] || "bg-bg-hover0"} rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-16 text-right">
                                {(minutes / 60).toFixed(1)}h
                              </span>
                              <span className="text-xs text-text-tertiary w-10 text-right">
                                {percentage}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Burnout Indicator */}
            {burnout && (
              <Section className="mt-6">
                <Card className={burnout.risk === "critical" || burnout.risk === "high" ? "border-error-200 dark:border-error-800" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${burnout.risk === "low" ? "text-success-500" : burnout.risk === "medium" ? "text-warning-500" : "text-error-500"}`} />
                      Burnout Risk: <span className={`px-2 py-0.5 rounded text-xs ${riskColors[burnout.risk]}`}>{burnout.risk.toUpperCase()}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {burnout.factors.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-text-secondary mb-2">Factors:</div>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {burnout.factors.map((f, i) => (
                            <li key={i}>• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {burnout.recommendations.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-text-secondary mb-2">Recommendations:</div>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {burnout.recommendations.map((r, i) => (
                            <li key={i}>✓ {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Section>
            )}
          </>
        )}

        {/* Founder Notice */}
        <Section className="mt-8">
          <div className="p-4 bg-bg-raised/50 rounded-lg">
            <p className="text-xs text-text-secondary">
              <strong>Founder-Only:</strong> This time tracker is private and not visible to clients.
              Data can be exported for Xero integration. Burnout detection uses real data patterns only.
            </p>
          </div>
        </Section>
      </ChatbotSafeZone>
    </PageContainer>
  );
}
