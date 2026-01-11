"use client";

/**
 * Revenue Routing Dashboard Component
 * Phase D20: Multi-Channel Revenue Routing
 *
 * Displays routing rules, channel performance, attribution paths,
 * forecasts, and AI-powered optimization recommendations.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Zap,
  GitBranch,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Brain,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";

interface RevenueStats {
  total_revenue: number;
  event_count: number;
  avg_order_value: number;
  new_customer_revenue: number;
  returning_customer_revenue: number;
  channel_breakdown: Record<string, number>;
  event_type_breakdown: Record<string, number>;
  top_products: Array<{ product_name: string; revenue: number; count: number }>;
  alerts_summary: { new: number; acknowledged: number; critical: number };
}

interface RoutingRule {
  id: string;
  rule_name: string;
  description: string | null;
  source_channels: string[];
  target_channel: string | null;
  action: string;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  priority: number;
  boost_factor: number;
  is_active: boolean;
  is_automated: boolean;
  times_triggered: number;
  total_revenue_impacted: number;
  last_triggered_at: string | null;
}

interface ChannelPerformance {
  id: string;
  channel: string;
  period_type: string;
  period_start: string;
  total_revenue: number;
  event_count: number;
  unique_customers: number;
  roas: number | null;
  revenue_change_percent: number | null;
  ai_score: number | null;
  ai_recommendations: string[];
}

interface AttributionPath {
  id: string;
  path_sequence: string[];
  occurrence_count: number;
  total_revenue: number;
  avg_revenue: number | null;
  conversion_rate: number | null;
  is_optimal: boolean;
}

interface RevenueForecast {
  id: string;
  channel: string | null;
  forecast_type: string;
  forecast_date: string;
  predicted_revenue: number;
  confidence_lower: number | null;
  confidence_upper: number | null;
  contributing_factors: Array<{
    factor: string;
    weight: number;
    direction: "positive" | "negative";
  }>;
}

interface RevenueAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  channel: string | null;
  status: string;
  created_at: string;
}

interface RevenueRoutingDashboardProps {
  tenantId: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  organic: "#10B981",
  paid_search: "#3B82F6",
  social: "#EC4899",
  email: "#8B5CF6",
  referral: "#F59E0B",
  direct: "#6B7280",
  affiliate: "#14B8A6",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  route: <GitBranch className="w-4 h-4" />,
  boost: <TrendingUp className="w-4 h-4" />,
  throttle: <TrendingDown className="w-4 h-4" />,
  allocate: <PieChart className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
  optimize: <Brain className="w-4 h-4" />,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number | null): string {
  if (value === null) {
return "—";
}
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export default function RevenueRoutingDashboard({
  tenantId,
}: RevenueRoutingDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "rules" | "channels" | "paths" | "forecasts" | "alerts"
  >("overview");
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [channels, setChannels] = useState<ChannelPerformance[]>([]);
  const [paths, setPaths] = useState<AttributionPath[]>([]);
  const [forecasts, setForecasts] = useState<RevenueForecast[]>([]);
  const [alerts, setAlerts] = useState<RevenueAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) {
return;
}

    setLoading(true);

    try {
      const [statsRes, rulesRes, channelsRes, pathsRes, forecastsRes, alertsRes] =
        await Promise.all([
          fetch(`/api/synthex/revenue?tenantId=${tenantId}&type=stats`),
          fetch(`/api/synthex/revenue?tenantId=${tenantId}&type=rules&is_active=true`),
          fetch(`/api/synthex/revenue?tenantId=${tenantId}&type=channels&period_type=weekly&limit=10`),
          fetch(`/api/synthex/revenue?tenantId=${tenantId}&type=paths&limit=10`),
          fetch(`/api/synthex/revenue?tenantId=${tenantId}&type=forecasts&limit=5`),
          fetch(`/api/synthex/revenue?tenantId=${tenantId}&type=alerts&status=new&limit=5`),
        ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }
      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data.channels || []);
      }
      if (pathsRes.ok) {
        const data = await pathsRes.json();
        setPaths(data.paths || []);
      }
      if (forecastsRes.ok) {
        const data = await forecastsRes.json();
        setForecasts(data.forecasts || []);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await fetch("/api/synthex/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "update_rule",
          rule_id: ruleId,
          updates: { is_active: !isActive },
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const generateForecast = async () => {
    try {
      await fetch("/api/synthex/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "generate_forecast",
          forecast_type: "weekly",
          horizon_days: 7,
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to generate forecast:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Revenue Routing
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Multi-channel attribution and routing optimization
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-bg-surface rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card rounded-xl border border-border-default p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Total Revenue</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(stats.total_revenue)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-card rounded-xl border border-border-default p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Avg Order Value</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(stats.avg_order_value)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-card rounded-xl border border-border-default p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Events</p>
                <p className="text-lg font-semibold text-text-primary">
                  {stats.event_count.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-bg-card rounded-xl border border-border-default p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Active Alerts</p>
                <p className="text-lg font-semibold text-text-primary">
                  {stats.alerts_summary.new + stats.alerts_summary.acknowledged}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default pb-2">
        {[
          { key: "overview", label: "Overview" },
          { key: "rules", label: "Routing Rules" },
          { key: "channels", label: "Channels" },
          { key: "paths", label: "Attribution Paths" },
          { key: "forecasts", label: "Forecasts" },
          { key: "alerts", label: "Alerts" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-accent-500 text-white"
                : "text-text-secondary hover:bg-bg-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && stats && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Channel Breakdown */}
            <div className="bg-bg-card rounded-xl border border-border-default p-6">
              <h3 className="text-sm font-medium text-text-primary mb-4">
                Revenue by Channel
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.channel_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([channel, revenue]) => {
                    const total = Object.values(stats.channel_breakdown).reduce(
                      (s, v) => s + v,
                      0
                    );
                    const percent = total > 0 ? (revenue / total) * 100 : 0;

                    return (
                      <div key={channel}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-secondary capitalize">
                            {channel.replace("_", " ")}
                          </span>
                          <span className="text-sm font-medium text-text-primary">
                            {formatCurrency(revenue)}
                          </span>
                        </div>
                        <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor:
                                CHANNEL_COLORS[channel] || "#6B7280",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-bg-card rounded-xl border border-border-default p-6">
              <h3 className="text-sm font-medium text-text-primary mb-4">
                Top Products
              </h3>
              <div className="space-y-3">
                {stats.top_products.slice(0, 5).map((product, index) => (
                  <div
                    key={product.product_name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center text-xs font-medium text-text-secondary">
                        {index + 1}
                      </span>
                      <span className="text-sm text-text-primary">
                        {product.product_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {product.count} sales
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "rules" && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bg-card rounded-xl border border-border-default"
          >
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <h3 className="font-medium text-text-primary">
                Active Routing Rules
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 transition-colors">
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </div>
            <div className="divide-y divide-border-default">
              {rules.length === 0 ? (
                <div className="p-8 text-center text-text-tertiary">
                  No routing rules configured
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedRule(
                          expandedRule === rule.id ? null : rule.id
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center">
                          {ACTION_ICONS[rule.action] || (
                            <Settings className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {rule.rule_name}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {rule.source_channels.join(", ")} →{" "}
                            {rule.target_channel || rule.action}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-text-primary">
                            {rule.times_triggered} triggers
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {formatCurrency(rule.total_revenue_impacted)} impacted
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRuleActive(rule.id, rule.is_active);
                          }}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            rule.is_active ? "bg-accent-500" : "bg-bg-surface"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              rule.is_active ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                        {expandedRule === rule.id ? (
                          <ChevronDown className="w-4 h-4 text-text-tertiary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-tertiary" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedRule === rule.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border-default">
                            {rule.description && (
                              <p className="text-sm text-text-secondary mb-3">
                                {rule.description}
                              </p>
                            )}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-text-tertiary">Priority</p>
                                <p className="text-text-primary font-medium">
                                  {rule.priority}
                                </p>
                              </div>
                              <div>
                                <p className="text-text-tertiary">Boost Factor</p>
                                <p className="text-text-primary font-medium">
                                  {rule.boost_factor}x
                                </p>
                              </div>
                              <div>
                                <p className="text-text-tertiary">Mode</p>
                                <p className="text-text-primary font-medium capitalize">
                                  {rule.is_automated ? "Automated" : "Manual"}
                                </p>
                              </div>
                            </div>
                            {rule.conditions.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-text-tertiary mb-2">
                                  Conditions
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {rule.conditions.map((cond, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-bg-surface rounded text-xs text-text-secondary"
                                    >
                                      {cond.field} {cond.operator}{" "}
                                      {String(cond.value)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "channels" && (
          <motion.div
            key="channels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bg-card rounded-xl border border-border-default overflow-hidden"
          >
            <table className="w-full">
              <thead className="bg-bg-surface">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    Channel
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    Revenue
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    Events
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    Customers
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    ROAS
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    Change
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase">
                    AI Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {channels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-bg-surface/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              CHANNEL_COLORS[channel.channel] || "#6B7280",
                          }}
                        />
                        <span className="text-sm font-medium text-text-primary capitalize">
                          {channel.channel.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-primary">
                      {formatCurrency(channel.total_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">
                      {channel.event_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">
                      {channel.unique_customers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-primary">
                      {channel.roas ? `${channel.roas.toFixed(1)}x` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          (channel.revenue_change_percent || 0) >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {formatPercent(channel.revenue_change_percent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {channel.ai_score ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-500 rounded-full"
                              style={{ width: `${channel.ai_score}%` }}
                            />
                          </div>
                          <span className="text-sm text-text-primary">
                            {channel.ai_score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === "paths" && (
          <motion.div
            key="paths"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {paths.map((path) => (
              <div
                key={path.id}
                className="bg-bg-card rounded-xl border border-border-default p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {path.path_sequence.map((channel, i) => (
                      <React.Fragment key={i}>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium capitalize"
                          style={{
                            backgroundColor: `${CHANNEL_COLORS[channel] || "#6B7280"}20`,
                            color: CHANNEL_COLORS[channel] || "#6B7280",
                          }}
                        >
                          {channel.replace("_", " ")}
                        </span>
                        {i < path.path_sequence.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-text-tertiary" />
                        )}
                      </React.Fragment>
                    ))}
                    {path.is_optimal && (
                      <span className="px-2 py-0.5 bg-accent-500/20 text-accent-500 rounded text-xs font-medium ml-2">
                        Optimal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(path.total_revenue)}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {path.occurrence_count} journeys
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(path.avg_revenue || 0)}
                      </p>
                      <p className="text-xs text-text-tertiary">avg value</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-500">
                        {((path.conversion_rate || 0) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-text-tertiary">conversion</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "forecasts" && (
          <motion.div
            key="forecasts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <button
                onClick={generateForecast}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Generate New Forecast
              </button>
            </div>

            {forecasts.map((forecast) => (
              <div
                key={forecast.id}
                className="bg-bg-card rounded-xl border border-border-default p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      {forecast.channel
                        ? `${forecast.channel} Channel`
                        : "All Channels"}{" "}
                      - {forecast.forecast_type}
                    </h4>
                    <p className="text-sm text-text-tertiary">
                      Forecast for{" "}
                      {new Date(forecast.forecast_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent-500">
                      {formatCurrency(forecast.predicted_revenue)}
                    </p>
                    {forecast.confidence_lower && forecast.confidence_upper && (
                      <p className="text-xs text-text-tertiary">
                        Range: {formatCurrency(forecast.confidence_lower)} -{" "}
                        {formatCurrency(forecast.confidence_upper)}
                      </p>
                    )}
                  </div>
                </div>

                {forecast.contributing_factors.length > 0 && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-2">
                      Contributing Factors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {forecast.contributing_factors.map((factor, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            factor.direction === "positive"
                              ? "bg-emerald-500/20 text-emerald-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {factor.factor} ({(factor.weight * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "alerts" && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {alerts.length === 0 ? (
              <div className="bg-bg-card rounded-xl border border-border-default p-8 text-center text-text-tertiary">
                No active alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-bg-card rounded-xl border p-4 ${
                    alert.severity === "critical"
                      ? "border-red-500"
                      : alert.severity === "high"
                        ? "border-orange-500"
                        : "border-border-default"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          alert.severity === "critical"
                            ? "bg-red-500/20"
                            : alert.severity === "high"
                              ? "bg-orange-500/20"
                              : "bg-yellow-500/20"
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            alert.severity === "critical"
                              ? "text-red-500"
                              : alert.severity === "high"
                                ? "text-orange-500"
                                : "text-yellow-500"
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-text-tertiary">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                          {alert.channel && (
                            <span className="text-xs text-text-tertiary">
                              Channel: {alert.channel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-bg-surface rounded transition-colors">
                        <Check className="w-4 h-4 text-emerald-500" />
                      </button>
                      <button className="p-1.5 hover:bg-bg-surface rounded transition-colors">
                        <X className="w-4 h-4 text-text-tertiary" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
