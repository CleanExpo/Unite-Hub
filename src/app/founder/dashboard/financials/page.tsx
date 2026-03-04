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
  Wallet,
  Receipt,
  Building2,
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

interface BusinessFinancials {
  income: number;
  expenses: number;
  netFlow: number;
}

export default function FounderFinancialsPage() {
  const [period, setPeriod] = useState<Period>("quarterly");
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [byBusiness, setByBusiness] = useState<Record<string, BusinessFinancials>>({});
  const [notice, setNotice] = useState<string | null>(null);
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
        setByBusiness(data.byBusiness || {});
        setNotice(data.notice || null);
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

  const businessEntries = Object.entries(byBusiness);

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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#050505] bg-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/80 disabled:opacity-50 transition-colors"
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
          <div className="flex gap-2 p-1 bg-[#0a0a0a] border border-white/10 rounded-sm w-fit">
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
              <Loader2 className="w-8 h-8 text-[#00F5FF] animate-spin" />
            </div>
          </Section>
        ) : (
          <>
            {/* Notice Banner */}
            {notice && (
              <Section className="mt-4">
                <div className="p-3 bg-[#00F5FF]/5 border border-[#00F5FF]/20 rounded-sm">
                  <p className="text-xs text-[#00F5FF]/80">{notice}</p>
                </div>
              </Section>
            )}

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
                    <CardTitle className="flex items-center gap-2 text-white">
                      <BarChart3 className="w-5 h-5 text-[#00F5FF]" />
                      Financial Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-center w-24 h-24 rounded-sm border-2 border-[#00F5FF]">
                        <span className="text-3xl font-bold text-[#00F5FF]">
                          {healthScore.score}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {healthScore.factors.map((factor) => (
                          <div key={factor.name} className="flex items-center gap-2">
                            <span className="text-sm text-white/60 w-40">
                              {factor.name}
                            </span>
                            <div className="flex-1 h-2 bg-white/10 rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-[#00F5FF] rounded-sm"
                                style={{ width: `${factor.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-white w-8">{factor.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Per-Business Breakdown */}
            {businessEntries.length > 0 && (
              <Section className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Building2 className="w-5 h-5 text-[#00F5FF]" />
                      Business Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 pr-4 text-white/40 font-medium">Business</th>
                            <th className="text-right py-2 pr-4 text-white/40 font-medium">Income</th>
                            <th className="text-right py-2 pr-4 text-white/40 font-medium">Expenses</th>
                            <th className="text-right py-2 text-white/40 font-medium">Net Flow</th>
                          </tr>
                        </thead>
                        <tbody>
                          {businessEntries
                            .sort(([, a], [, b]) => b.netFlow - a.netFlow)
                            .map(([biz, data]) => (
                              <tr key={biz} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 pr-4 text-white font-medium capitalize">
                                  {biz.replace(/-/g, " ")}
                                </td>
                                <td className="py-2 pr-4 text-right text-[#00FF88]">
                                  {formatCurrency(data.income)}
                                </td>
                                <td className="py-2 pr-4 text-right text-red-400">
                                  {formatCurrency(data.expenses)}
                                </td>
                                <td className={`py-2 text-right font-semibold ${data.netFlow >= 0 ? "text-[#00FF88]" : "text-red-400"}`}>
                                  {formatCurrency(data.netFlow)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
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
                    <CardTitle className="flex items-center gap-2 text-white">
                      <PieChart className="w-5 h-5 text-[#00F5FF]" />
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
                              <span className="text-sm text-white/60 w-40 truncate">
                                {category}
                              </span>
                              <div className="flex-1 h-2 bg-white/10 rounded-sm overflow-hidden">
                                <div
                                  className="h-full bg-[#00F5FF]/60 rounded-sm"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-white w-20 text-right">
                                {formatCurrency(amount)}
                              </span>
                              <span className="text-xs text-white/40 w-10 text-right">
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
              <div className="p-4 bg-amber-900/20 rounded-sm border border-amber-800/40">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">
                      Founder-Only Access
                    </p>
                    <p className="text-xs text-amber-400/70 mt-1">
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
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
        active
          ? "bg-[#00F5FF]/20 text-[#00F5FF]"
          : "text-white/40 hover:text-white"
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
    green: "text-[#00FF88] bg-[#00FF88]/10",
    red: "text-red-400 bg-red-400/10",
    blue: "text-[#00F5FF] bg-[#00F5FF]/10",
    amber: "text-amber-400 bg-amber-400/10",
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-sm ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-white/40">{label}</p>
            <p className="text-xl font-semibold text-white">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
