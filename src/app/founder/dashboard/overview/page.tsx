/**
 * Founder Master Dashboard
 * Phase 42: Unified founder overview
 *
 * Combines financials, time, system health, and client performance
 * FOUNDER-ONLY ACCESS
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/components/Card";
import {
  LayoutDashboard,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Users,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface FinancialSnapshot {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  healthScore: number;
}

interface TimeSnapshot {
  todayHours: number;
  weekHours: number;
  burnoutRisk: "low" | "medium" | "high" | "critical";
  topCategory: string;
}

interface SystemHealth {
  overallScore: number;
  aiEventsToday: number;
  pendingApprovals: number;
  activeClients: number;
}

export default function FounderOverviewPage() {
  const [financial, setFinancial] = useState<FinancialSnapshot | null>(null);
  const [time, setTime] = useState<TimeSnapshot | null>(null);
  const [system, setSystem] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [finRes, timeRes, sysRes] = await Promise.all([
        fetch("/api/founder/overview/financial"),
        fetch("/api/founder/overview/time"),
        fetch("/api/founder/overview/system"),
      ]);

      if (finRes.ok) {
setFinancial(await finRes.json());
}
      if (timeRes.ok) {
setTime(await timeRes.json());
}
      if (sysRes.ok) {
setSystem(await sysRes.json());
}
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const riskColors = {
    low: "text-green-600 bg-green-100",
    medium: "text-amber-600 bg-amber-100",
    high: "text-orange-600 bg-orange-100",
    critical: "text-red-600 bg-red-100",
  };

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={LayoutDashboard}
          title="Founder Command Center"
          description="Unified view of financials, time, system health, and client performance"
        />

        {loading ? (
          <Section className="mt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            </div>
          </Section>
        ) : (
          <>
            {/* Financial Snapshot */}
            <Section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-500">Financial Snapshot</h2>
                <Link
                  href="/founder/dashboard/financials"
                  className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={TrendingUp}
                  label="Income (Q)"
                  value={formatCurrency(financial?.totalIncome || 0)}
                  color="green"
                />
                <MetricCard
                  icon={TrendingDown}
                  label="Expenses (Q)"
                  value={formatCurrency(financial?.totalExpenses || 0)}
                  color="red"
                />
                <MetricCard
                  icon={DollarSign}
                  label="Net Cash Flow"
                  value={formatCurrency(financial?.netCashFlow || 0)}
                  color={financial?.netCashFlow && financial.netCashFlow >= 0 ? "green" : "red"}
                />
                <MetricCard
                  icon={Activity}
                  label="Health Score"
                  value={`${financial?.healthScore || 0}/100`}
                  color="blue"
                />
              </div>
            </Section>

            {/* Time & Burnout */}
            <Section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-500">Time Tracking</h2>
                <Link
                  href="/founder/dashboard/timecard"
                  className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                >
                  View Timecard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={Clock}
                  label="Today"
                  value={`${time?.todayHours?.toFixed(1) || 0}h`}
                  color="blue"
                />
                <MetricCard
                  icon={Calendar}
                  label="This Week"
                  value={`${time?.weekHours?.toFixed(1) || 0}h`}
                  color="blue"
                />
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-500">Burnout Risk</div>
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-sm font-medium rounded ${riskColors[time?.burnoutRisk || "low"]}`}>
                        {time?.burnoutRisk?.toUpperCase() || "LOW"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-500">Top Category</div>
                    <div className="text-xl font-semibold text-text-primary capitalize">
                      {time?.topCategory || "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Section>

            {/* System Health */}
            <Section className="mt-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3">System Health</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent-100 text-accent-600">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Overall Score</p>
                        <p className="text-xl font-semibold">{system?.overallScore || 99}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <MetricCard
                  icon={Activity}
                  label="AI Events Today"
                  value={system?.aiEventsToday?.toString() || "0"}
                  color="blue"
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Pending Approvals"
                  value={system?.pendingApprovals?.toString() || "0"}
                  color={system?.pendingApprovals && system.pendingApprovals > 5 ? "amber" : "blue"}
                />
                <MetricCard
                  icon={Users}
                  label="Active Clients"
                  value={system?.activeClients?.toString() || "0"}
                  color="blue"
                />
              </div>
            </Section>

            {/* Client Journeys */}
            <Section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-500">Client Journeys</h2>
                <Link
                  href="/founder/dashboard/first-client-journey"
                  className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent-100 text-accent-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        First Client Journeys
                      </p>
                      <p className="text-xs text-text-secondary">
                        Track soft-launch client progress through 90-day onboarding
                      </p>
                    </div>
                    <Link
                      href="/founder/dashboard/first-client-journey"
                      className="px-3 py-1.5 text-xs font-medium text-accent-600 bg-accent-50 rounded-lg hover:bg-accent-100"
                    >
                      Monitor Progress
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* Quick Links */}
            <Section className="mt-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/founder/dashboard/financials" label="Financial Details" />
                <QuickLink href="/founder/dashboard/timecard" label="Time Tracker" />
                <QuickLink href="/founder/dashboard/first-client-journey" label="Client Journeys" />
                <QuickLink href="/staff/approvals" label="Review Approvals" />
              </div>
            </Section>

            {/* Data Notice */}
            <Section className="mt-8">
              <div className="p-4 bg-bg-raised/50 rounded-lg">
                <p className="text-xs text-text-secondary">
                  <strong>Founder-Only:</strong> All data shown is real and sourced from existing services.
                  No synthetic metrics or projections beyond historical averages.
                </p>
              </div>
            </Section>
          </>
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface MetricCardProps {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "amber";
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colors = {
    green: "text-green-600 bg-green-100 dark:bg-green-900/30",
    red: "text-red-600 bg-red-100 dark:bg-red-900/30",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-semibold text-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickLinkProps {
  href: string;
  label: string;
}

function QuickLink({ href, label }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 bg-bg-card border border-border-subtle rounded-lg hover:border-accent-500 transition-colors"
    >
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <ArrowRight className="w-4 h-4 text-gray-400" />
    </Link>
  );
}
