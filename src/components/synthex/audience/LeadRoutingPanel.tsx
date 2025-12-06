'use client';

/**
 * LeadRoutingPanel Component
 *
 * Displays leads and allows AI-powered routing recommendations.
 * Part of Phase B16 - Predictive Lead Routing Engine.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  leadScore: number | null;
  currentOwner: string | null;
  currentStage: string | null;
}

interface RoutingRecommendation {
  recommendedOwner: string;
  ownerName: string | null;
  priorityScore: number;
  recommendedChannel: string;
  confidence: number;
  reason: string;
  factors: string[];
}

interface RoutingLogEntry {
  id: string;
  leadId: string;
  recommendedOwner: string | null;
  priorityScore: number;
  recommendedChannel: string | null;
  reason: string | null;
  confidence: number | null;
  decisionStatus: string;
  createdAt: string;
}

interface LeadRoutingPanelProps {
  tenantId: string;
  className?: string;
}

export function LeadRoutingPanel({ tenantId, className = '' }: LeadRoutingPanelProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<Map<string, RoutingRecommendation>>(
    new Map()
  );
  const [routingLog, setRoutingLog] = useState<RoutingLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState<string | null>(null);
  const [applyingRouting, setApplyingRouting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        limit: '50',
        ...(filterUnassigned && { unassigned: 'true' }),
      });

      const res = await fetch(`/api/synthex/audience?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leads');

      const data = await res.json();
      const mappedLeads: Lead[] = (data.contacts || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        email: c.email as string,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ') || null,
        company: c.company as string | null,
        leadScore: c.engagementScore as number | null,
        currentOwner: c.owner as string | null,
        currentStage: c.status as string | null,
      }));

      setLeads(mappedLeads);
    } catch (err) {
      console.error('[LeadRoutingPanel] Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filterUnassigned]);

  // Fetch routing log
  const fetchRoutingLog = useCallback(async () => {
    if (!tenantId) return;

    try {
      const res = await fetch(
        `/api/synthex/lead/routing/log?tenantId=${tenantId}&limit=10`
      );
      if (!res.ok) return;

      const data = await res.json();
      setRoutingLog(data.entries || []);
    } catch (err) {
      console.error('[LeadRoutingPanel] Error fetching log:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLeads();
    fetchRoutingLog();
  }, [fetchLeads, fetchRoutingLog]);

  // Get routing recommendation for a lead
  const getRecommendation = async (leadId: string) => {
    setLoadingRecommendation(leadId);
    setError(null);

    try {
      const res = await fetch('/api/synthex/lead/routing/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, leadId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get recommendation');
      }

      const data = await res.json();
      setRecommendations((prev) => new Map(prev).set(leadId, data.recommendation));
    } catch (err) {
      console.error('[LeadRoutingPanel] Error getting recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendation');
    } finally {
      setLoadingRecommendation(null);
    }
  };

  // Apply routing decision
  const applyRouting = async (leadId: string) => {
    const recommendation = recommendations.get(leadId);
    if (!recommendation) return;

    setApplyingRouting(leadId);
    setError(null);

    try {
      const res = await fetch('/api/synthex/lead/routing/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          leadId,
          recommendedOwner: recommendation.recommendedOwner,
          priorityScore: recommendation.priorityScore,
          recommendedChannel: recommendation.recommendedChannel,
          confidence: recommendation.confidence,
          reason: recommendation.reason,
          factors: recommendation.factors,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply routing');
      }

      // Refresh data
      await Promise.all([fetchLeads(), fetchRoutingLog()]);
      setRecommendations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(leadId);
        return newMap;
      });
    } catch (err) {
      console.error('[LeadRoutingPanel] Error applying routing:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply routing');
    } finally {
      setApplyingRouting(null);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Get recommendations for selected leads
  const getSelectedRecommendations = async () => {
    for (const leadId of selectedLeads) {
      if (!recommendations.has(leadId)) {
        await getRecommendation(leadId);
      }
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Lead Routing</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={filterUnassigned}
                onChange={(e) => setFilterUnassigned(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              Unassigned only
            </label>
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedLeads.size > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {selectedLeads.size} selected
            </span>
            <button
              onClick={getSelectedRecommendations}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Suggest Owners
            </button>
            <button
              onClick={() => setSelectedLeads(new Set())}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Leads List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No leads found
          </div>
        ) : (
          <div className="space-y-3">
            {leads.slice(0, 10).map((lead) => {
              const recommendation = recommendations.get(lead.id);
              const isLoadingRec = loadingRecommendation === lead.id;
              const isApplying = applyingRouting === lead.id;

              return (
                <div
                  key={lead.id}
                  className="bg-gray-900 rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="mt-1 rounded bg-gray-700 border-gray-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {lead.name || lead.email}
                          </span>
                          {lead.leadScore !== null && (
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                lead.leadScore >= 80
                                  ? 'bg-green-500/20 text-green-400'
                                  : lead.leadScore >= 50
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {lead.leadScore}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">
                          {lead.company || lead.email}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {lead.currentOwner && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {lead.currentOwner}
                            </span>
                          )}
                          {lead.currentStage && (
                            <span className="capitalize">{lead.currentStage}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!recommendation && (
                        <button
                          onClick={() => getRecommendation(lead.id)}
                          disabled={isLoadingRec}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isLoadingRec ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Suggest
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recommendation */}
                  {recommendation && (
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">
                              {recommendation.ownerName || recommendation.recommendedOwner}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                recommendation.confidence >= 0.8
                                  ? 'bg-green-500/20 text-green-400'
                                  : recommendation.confidence >= 0.5
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {(recommendation.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {recommendation.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-400">via</span>
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                              {recommendation.recommendedChannel}
                            </span>
                            <span className="text-xs text-gray-400">priority:</span>
                            <span className="text-xs text-white font-medium">
                              {recommendation.priorityScore}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyRouting(lead.id)}
                            disabled={isApplying}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isApplying ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Apply
                          </button>
                          <button
                            onClick={() =>
                              setRecommendations((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(lead.id);
                                return newMap;
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {leads.length > 10 && (
              <p className="text-center text-sm text-gray-500">
                Showing 10 of {leads.length} leads
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Routing Log */}
      <div className="border-t border-gray-700">
        <button
          onClick={() => setShowLog(!showLog)}
          className="w-full p-3 flex items-center justify-between text-gray-400 hover:bg-gray-700/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Recent Routing Decisions ({routingLog.length})
          </span>
          {showLog ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showLog && (
          <div className="p-3 pt-0">
            {routingLog.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No routing decisions yet
              </p>
            ) : (
              <div className="space-y-2">
                {routingLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 bg-gray-900 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-gray-300">
                        {entry.recommendedOwner}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded ${
                          entry.decisionStatus === 'accepted'
                            ? 'bg-green-500/20 text-green-400'
                            : entry.decisionStatus === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {entry.decisionStatus}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString('en-AU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadRoutingPanel;
