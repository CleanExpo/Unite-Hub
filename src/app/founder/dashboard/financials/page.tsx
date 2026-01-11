/**
 * Founder Financial Dashboard
 * Phase 41: Founder Financial Command Center
 *
 * Multi-org financial overview with Xero integration
 * FOUNDER-ONLY ACCESS
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/components/Card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  Wallet,
  Receipt,
} from "lucide-react";

type Period = "quarterly" | "annual";

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  byCategory: Record<string, number>;
  period: string;
}

interface HealthScore {
  score: number;
  factors: { name: string; score: number; weight: number }[];
}

export default function FounderFinancialsPage() {
  const [period, setPeriod] = useState<Period>("quarterly");
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/founder/financials?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setHealthScore(data.healthScore);
      }
    } catch (err) {
      console.error("Failed to fetch financial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncXero = async () => {
    setSyncing(true);
    try {
      await fetch("/api/founder/financials/sync", { method: "POST" });
      await fetchData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={DollarSign}
          title="Financial Command Center"
          description="Multi-org financial overview with Xero integration"
          action={
            <button
              type="button"
              onClick={syncXero}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700 disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Xero
                </>
              )}
            </button>
          }
        />

        {/* Period Selector */}
        <Section className="mt-6">
          <div className="flex gap-2 p-1 bg-bg-hover rounded-lg w-fit">
            <PeriodButton
              active={period === "quarterly"}
              onClick={() => setPeriod("quarterly")}
              label="Quarterly"
            />
            <PeriodButton
              active={period === "annual"}
              onClick={() => setPeriod("annual")}
              label="Annual"
            />
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
            {/* Key Metrics */}
            <Section className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={TrendingUp}
                  label="Total Income"
                  value={formatCurrency(summary?.totalIncome || 0)}
                  color="green"
                />
                <MetricCard
                  icon={TrendingDown}
                  label="Total Expenses"
                  value={formatCurrency(summary?.totalExpenses || 0)}
                  color="red"
                />
                <MetricCard
                  icon={Wallet}
                  label="Net Cash Flow"
                  value={formatCurrency(summary?.netCashFlow || 0)}
                  color={summary?.netCashFlow && summary.netCashFlow >= 0 ? "green" : "red"}
                />
                <MetricCard
                  icon={Receipt}
                  label="Transactions"
                  value={summary?.transactionCount?.toString() || "0"}
                  color="blue"
                />
              </div>
            </Section>

            {/* Health Score */}
            {healthScore && (
              <Section className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Financial Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-accent-500">
                        <span className="text-3xl font-bold text-accent-600">
                          {healthScore.score}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {healthScore.factors.map((factor) => (
                          <div key={factor.name} className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary w-40">
                              {factor.name}
                            </span>
                            <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent-500 rounded-full"
                                style={{ width: `${factor.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{factor.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Expense Breakdown */}
            {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
              <Section className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Expense Breakdown by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(summary.byCategory)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([category, amount]) => {
                          const percentage = summary.totalExpenses > 0
                            ? Math.round((amount / summary.totalExpenses) * 100)
                            : 0;
                          return (
                            <div key={category} className="flex items-center gap-3">
                              <span className="text-sm text-text-secondary w-40 truncate">
                                {category}
                              </span>
                              <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-20 text-right">
                                {formatCurrency(amount)}
                              </span>
                              <span className="text-xs text-gray-500 w-10 text-right">
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

            {/* Data Sources Notice */}
            <Section className="mt-8">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Founder-Only Access
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      This dashboard is restricted to founder access only. All data is
                      sourced from Xero API, bank feeds, and email receipts. No synthetic
                      or estimated data is displayed. Forecasts are based on historical
                      averages only.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface PeriodButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function PeriodButton({ active, onClick, label }: PeriodButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? "bg-bg-input text-accent-600 dark:text-accent-400 shadow-sm"
          : "text-text-secondary hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <Calendar className="w-4 h-4" />
      {label}
    </button>
  );
}

interface MetricCardProps {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "amber";
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    green: "text-green-600 bg-green-100 dark:bg-green-900/30",
    red: "text-red-600 bg-red-100 dark:bg-red-900/30",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-xl font-semibold text-text-primary">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
