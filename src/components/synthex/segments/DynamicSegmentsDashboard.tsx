"use client";

/**
 * Dynamic Segments Dashboard Component
 * Phase D21: Behaviour-Based Dynamic Segmentation
 *
 * Displays segment list, stats, members, and provides
 * segment management capabilities with AI-powered insights.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Settings,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Brain,
  Clock,
  AlertCircle,
  Check,
  X,
  Layers,
  BarChart3,
  Zap,
} from "lucide-react";

interface SegmentStats {
  total_segments: number;
  active_segments: number;
  total_members: number;
  segments_by_type: Record<string, number>;
  largest_segments: Array<{ id: string; name: string; members: number }>;
  avg_segment_size: number;
  segments_needing_refresh: number;
}

interface Segment {
  id: string;
  segment_name: string;
  description: string | null;
  segment_type: string;
  criteria: Array<{ field: string; operator: string; value: unknown; weight?: number }>;
  criteria_logic: string;
  use_ai_refinement: boolean;
  member_count: number;
  potential_value: number;
  avg_engagement_score: number | null;
  is_active: boolean;
  auto_refresh: boolean;
  last_refreshed_at: string | null;
  next_refresh_at: string | null;
  color: string | null;
  tags: string[];
  created_at: string;
}

interface SegmentRule {
  id: string;
  rule_name: string;
  description: string | null;
  category: string | null;
  field: string;
  operator: string;
  value: unknown;
  is_template: boolean;
}

interface DynamicSegmentsDashboardProps {
  tenantId: string;
}

const SEGMENT_TYPE_COLORS: Record<string, string> = {
  behavioral: "#8B5CF6",
  demographic: "#3B82F6",
  transactional: "#10B981",
  engagement: "#F59E0B",
  lifecycle: "#EC4899",
  predictive: "#14B8A6",
  custom: "#6B7280",
};

const SEGMENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  behavioral: <Zap className="w-4 h-4" />,
  demographic: <Users className="w-4 h-4" />,
  transactional: <BarChart3 className="w-4 h-4" />,
  engagement: <TrendingUp className="w-4 h-4" />,
  lifecycle: <RefreshCw className="w-4 h-4" />,
  predictive: <Brain className="w-4 h-4" />,
  custom: <Settings className="w-4 h-4" />,
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
return `${(num / 1000000).toFixed(1)}M`;
}
  if (num >= 1000) {
return `${(num / 1000).toFixed(1)}K`;
}
  return num.toLocaleString();
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) {
return "Never";
}
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
return "just now";
}
  if (seconds < 3600) {
return `${Math.floor(seconds / 60)}m ago`;
}
  if (seconds < 86400) {
return `${Math.floor(seconds / 3600)}h ago`;
}
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DynamicSegmentsDashboard({
  tenantId,
}: DynamicSegmentsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"segments" | "rules" | "analytics">(
    "segments"
  );
  const [stats, setStats] = useState<SegmentStats | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [refreshingSegment, setRefreshingSegment] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) {
return;
}

    setLoading(true);

    try {
      const [statsRes, segmentsRes, rulesRes] = await Promise.all([
        fetch(`/api/synthex/segments?tenantId=${tenantId}&type=stats`),
        fetch(
          `/api/synthex/segments?tenantId=${tenantId}&type=list&is_archived=false`
        ),
        fetch(
          `/api/synthex/segments?tenantId=${tenantId}&type=rules&is_template=true`
        ),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (segmentsRes.ok) {
        const data = await segmentsRes.json();
        setSegments(data.segments || []);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error("Failed to fetch segments data:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshSegment = async (segmentId: string) => {
    setRefreshingSegment(segmentId);
    try {
      await fetch("/api/synthex/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "refresh",
          segment_id: segmentId,
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to refresh segment:", error);
    } finally {
      setRefreshingSegment(null);
    }
  };

  const filteredSegments = segments.filter((segment) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !segment.segment_name.toLowerCase().includes(query) &&
        !(segment.description || "").toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (filterType && segment.segment_type !== filterType) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Dynamic Segments
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Behaviour-based audience segmentation with AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-bg-surface rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
            <Plus className="w-4 h-4" />
            New Segment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card rounded-xl border border-border-default p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Total Segments</p>
                <p className="text-lg font-semibold text-text-primary">
                  {stats.total_segments}
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Total Members</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatNumber(stats.total_members)}
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Avg Segment Size</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatNumber(Math.round(stats.avg_segment_size))}
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Need Refresh</p>
                <p className="text-lg font-semibold text-text-primary">
                  {stats.segments_needing_refresh}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default pb-2">
        {[
          { key: "segments", label: "Segments" },
          { key: "rules", label: "Rule Templates" },
          { key: "analytics", label: "Analytics" },
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

      {/* Segments Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "segments" && (
          <motion.div
            key="segments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search segments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-tertiary" />
                <select
                  value={filterType || ""}
                  onChange={(e) => setFilterType(e.target.value || null)}
                  className="px-3 py-2 bg-bg-surface border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">All Types</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="demographic">Demographic</option>
                  <option value="transactional">Transactional</option>
                  <option value="engagement">Engagement</option>
                  <option value="lifecycle">Lifecycle</option>
                  <option value="predictive">Predictive</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {/* Segment List */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-text-tertiary" />
                </div>
              ) : filteredSegments.length === 0 ? (
                <div className="bg-bg-card rounded-xl border border-border-default p-8 text-center">
                  <p className="text-text-tertiary">No segments found</p>
                </div>
              ) : (
                filteredSegments.map((segment) => (
                  <motion.div
                    key={segment.id}
                    layout
                    className="bg-bg-card rounded-xl border border-border-default overflow-hidden"
                  >
                    {/* Segment Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-bg-surface/50 transition-colors"
                      onClick={() =>
                        setExpandedSegment(
                          expandedSegment === segment.id ? null : segment.id
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${SEGMENT_TYPE_COLORS[segment.segment_type] || "#6B7280"}20`,
                              color:
                                SEGMENT_TYPE_COLORS[segment.segment_type] ||
                                "#6B7280",
                            }}
                          >
                            {SEGMENT_TYPE_ICONS[segment.segment_type] || (
                              <Layers className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-text-primary">
                                {segment.segment_name}
                              </h3>
                              {segment.use_ai_refinement && (
                                <Brain className="w-4 h-4 text-accent-500" />
                              )}
                              {!segment.is_active && (
                                <span className="px-2 py-0.5 bg-bg-surface rounded text-xs text-text-tertiary">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-text-tertiary">
                              {segment.description ||
                                `${segment.criteria.length} criteria`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-text-primary">
                              {formatNumber(segment.member_count)}
                            </p>
                            <p className="text-xs text-text-tertiary">members</p>
                          </div>
                          {segment.avg_engagement_score && (
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <div className="w-12 h-2 bg-bg-surface rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-accent-500 rounded-full"
                                    style={{
                                      width: `${segment.avg_engagement_score}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-text-primary">
                                  {segment.avg_engagement_score.toFixed(0)}
                                </span>
                              </div>
                              <p className="text-xs text-text-tertiary">
                                engagement
                              </p>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">
                              {formatTimeAgo(segment.last_refreshed_at)}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              last refresh
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSegment(segment.id);
                            }}
                            disabled={refreshingSegment === segment.id}
                            className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
                          >
                            <RefreshCw
                              className={`w-4 h-4 text-text-tertiary ${
                                refreshingSegment === segment.id
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </button>
                          {expandedSegment === segment.id ? (
                            <ChevronDown className="w-5 h-5 text-text-tertiary" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-text-tertiary" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedSegment === segment.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-border-default">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Criteria */}
                              <div>
                                <h4 className="text-sm font-medium text-text-secondary mb-3">
                                  Criteria ({segment.criteria_logic.toUpperCase()}{" "}
                                  logic)
                                </h4>
                                <div className="space-y-2">
                                  {segment.criteria.map((criterion, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-accent-500" />
                                      <span className="text-text-primary">
                                        {criterion.field}
                                      </span>
                                      <span className="text-text-tertiary">
                                        {criterion.operator}
                                      </span>
                                      <span className="text-text-primary font-medium">
                                        {String(criterion.value)}
                                      </span>
                                      {criterion.weight &&
                                        criterion.weight !== 1 && (
                                          <span className="text-text-tertiary">
                                            (weight: {criterion.weight})
                                          </span>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Stats & Actions */}
                              <div>
                                <h4 className="text-sm font-medium text-text-secondary mb-3">
                                  Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-text-tertiary">
                                      Potential Value
                                    </p>
                                    <p className="text-text-primary font-medium">
                                      ${segment.potential_value.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-text-tertiary">
                                      Auto Refresh
                                    </p>
                                    <p className="text-text-primary font-medium">
                                      {segment.auto_refresh ? "Enabled" : "Disabled"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-text-tertiary">Created</p>
                                    <p className="text-text-primary font-medium">
                                      {new Date(
                                        segment.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-text-tertiary">
                                      Next Refresh
                                    </p>
                                    <p className="text-text-primary font-medium">
                                      {segment.next_refresh_at
                                        ? formatTimeAgo(segment.next_refresh_at)
                                        : "Manual"}
                                    </p>
                                  </div>
                                </div>

                                {segment.tags.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-text-tertiary text-xs mb-2">
                                      Tags
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {segment.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-2 py-0.5 bg-bg-surface rounded text-xs text-text-secondary"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
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
            <div className="p-4 border-b border-border-default">
              <h3 className="font-medium text-text-primary">
                Rule Templates
              </h3>
              <p className="text-sm text-text-tertiary mt-1">
                Reusable segmentation rules for building segments
              </p>
            </div>
            <div className="divide-y divide-border-default">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 hover:bg-bg-surface/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">
                        {rule.rule_name}
                      </h4>
                      {rule.description && (
                        <p className="text-sm text-text-tertiary mt-1">
                          {rule.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-bg-surface rounded text-xs text-text-secondary">
                          {rule.field}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {rule.operator}
                        </span>
                        <span className="px-2 py-0.5 bg-accent-500/20 text-accent-500 rounded text-xs">
                          {String(rule.value)}
                        </span>
                      </div>
                    </div>
                    {rule.category && (
                      <span className="px-3 py-1 bg-bg-surface rounded-full text-xs text-text-secondary capitalize">
                        {rule.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && stats && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Segments by Type */}
            <div className="bg-bg-card rounded-xl border border-border-default p-6">
              <h3 className="font-medium text-text-primary mb-4">
                Segments by Type
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.segments_by_type).map(([type, count]) => {
                  const total = Object.values(stats.segments_by_type).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percent = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                SEGMENT_TYPE_COLORS[type] || "#6B7280",
                            }}
                          />
                          <span className="text-sm text-text-secondary capitalize">
                            {type}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              SEGMENT_TYPE_COLORS[type] || "#6B7280",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Largest Segments */}
            <div className="bg-bg-card rounded-xl border border-border-default p-6">
              <h3 className="font-medium text-text-primary mb-4">
                Largest Segments
              </h3>
              <div className="space-y-3">
                {stats.largest_segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center text-xs font-medium text-text-secondary">
                        {index + 1}
                      </span>
                      <span className="text-sm text-text-primary">
                        {segment.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {formatNumber(segment.members)} members
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
