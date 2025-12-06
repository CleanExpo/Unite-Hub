'use client';

/**
 * Synthex Sales CRM Page
 *
 * Sales pipeline visualization with Kanban board, opportunity tracking,
 * and revenue forecasting.
 *
 * Phase: B26 - Sales CRM Pipeline + Opportunity Engine
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Target,
  Users,
  Plus,
  ChevronDown,
  Calendar,
  Phone,
  Mail,
  FileText,
  CheckSquare,
  Video,
  X,
  Edit2,
  MoreVertical,
  Activity,
} from 'lucide-react';

interface Pipeline {
  pipeline_id: string;
  name: string;
  stages: string[];
  is_default: boolean;
}

interface Opportunity {
  id: string;
  pipeline_id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  expected_close: string | null;
  owner_user_id: string;
  contact_id: string | null;
  company_name: string | null;
  notes: string | null;
  status: 'open' | 'won' | 'lost';
  created_at: string;
}

interface OpportunityActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  content: string;
  next_action: string | null;
  due_at: string | null;
  completed: boolean;
  created_at: string;
}

interface RevenueForecast {
  total_pipeline_value: number;
  weighted_forecast: number;
  open_opportunities: number;
  avg_deal_size: number;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Video className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export default function CrmPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || '';

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [activities, setActivities] = useState<OpportunityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPipelineSelector, setShowPipelineSelector] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewOpportunity, setShowNewOpportunity] = useState(false);

  const fetchPipelines = useCallback(async () => {
    if (!tenantId) return;

    try {
      const res = await fetch(`/api/synthex/sales/pipelines?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch pipelines');

      const data = await res.json();
      setPipelines(data.pipelines || []);

      // Auto-select default or first pipeline
      const defaultPipeline = data.pipelines.find((p: Pipeline) => p.is_default);
      setSelectedPipeline(defaultPipeline || data.pipelines[0] || null);
    } catch (err) {
      console.error('[CrmPage] Error fetching pipelines:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pipelines');
    }
  }, [tenantId]);

  const fetchOpportunities = useCallback(async () => {
    if (!tenantId || !selectedPipeline) return;

    try {
      const res = await fetch(
        `/api/synthex/sales/opportunities?tenantId=${tenantId}&pipelineId=${selectedPipeline.pipeline_id}&status=open`
      );
      if (!res.ok) throw new Error('Failed to fetch opportunities');

      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      console.error('[CrmPage] Error fetching opportunities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    }
  }, [tenantId, selectedPipeline]);

  const fetchForecast = useCallback(async () => {
    if (!tenantId) return;

    try {
      // We'll need to create a forecast endpoint, but for now we'll calculate client-side
      const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
      const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);

      setForecast({
        total_pipeline_value: totalValue,
        weighted_forecast: weightedValue,
        open_opportunities: opportunities.length,
        avg_deal_size: opportunities.length > 0 ? totalValue / opportunities.length : 0,
      });
    } catch (err) {
      console.error('[CrmPage] Error calculating forecast:', err);
    }
  }, [tenantId, opportunities]);

  const fetchActivities = useCallback(async (opportunityId: string) => {
    try {
      const res = await fetch(`/api/synthex/sales/activities?opportunityId=${opportunityId}`);
      if (!res.ok) throw new Error('Failed to fetch activities');

      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('[CrmPage] Error fetching activities:', err);
    }
  }, []);

  const handleStageMove = async (opportunity: Opportunity, newStage: string) => {
    if (opportunity.stage === newStage) return;

    try {
      const res = await fetch('/api/synthex/sales/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          updates: { stage: newStage },
        }),
      });

      if (!res.ok) throw new Error('Failed to move opportunity');

      await fetchOpportunities();
    } catch (err) {
      console.error('[CrmPage] Error moving opportunity:', err);
      alert('Failed to move opportunity');
    }
  };

  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDetail(true);
    fetchActivities(opportunity.id);
  };

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (selectedPipeline) {
      setLoading(true);
      Promise.all([fetchOpportunities()])
        .finally(() => setLoading(false));
    }
  }, [selectedPipeline, fetchOpportunities]);

  useEffect(() => {
    if (opportunities.length > 0) {
      fetchForecast();
    }
  }, [opportunities, fetchForecast]);

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <p className="text-gray-400">No tenant selected</p>
        </div>
      </div>
    );
  }

  if (loading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const opportunitiesByStage = selectedPipeline
    ? selectedPipeline.stages.reduce((acc, stage) => {
        acc[stage] = opportunities.filter(opp => opp.stage === stage);
        return acc;
      }, {} as Record<string, Opportunity[]>)
    : {};

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Sales CRM</h1>
          <button
            onClick={() => setShowNewOpportunity(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>

        {/* Pipeline Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPipelineSelector(!showPipelineSelector)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-md hover:bg-gray-800 transition-colors"
          >
            <Target className="w-4 h-4 text-blue-400" />
            <span>{selectedPipeline?.name || 'Select Pipeline'}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showPipelineSelector && (
            <div className="absolute top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10">
              {pipelines.map(pipeline => (
                <button
                  key={pipeline.pipeline_id}
                  onClick={() => {
                    setSelectedPipeline(pipeline);
                    setShowPipelineSelector(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors ${
                    selectedPipeline?.pipeline_id === pipeline.pipeline_id ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="font-medium">{pipeline.name}</div>
                  <div className="text-sm text-gray-400">{pipeline.stages.length} stages</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Forecast Summary */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Pipeline Value</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(forecast.total_pipeline_value)}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Weighted Forecast</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(forecast.weighted_forecast)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {forecast.total_pipeline_value > 0
                ? `${((forecast.weighted_forecast / forecast.total_pipeline_value) * 100).toFixed(0)}% of pipeline`
                : '0%'}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>Open Opportunities</span>
            </div>
            <div className="text-2xl font-bold">{forecast.open_opportunities}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Target className="w-4 h-4" />
              <span>Avg Deal Size</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(forecast.avg_deal_size)}</div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {selectedPipeline && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ minWidth: 'fit-content' }}>
            {selectedPipeline.stages.map(stage => {
              const stageOpps = opportunitiesByStage[stage] || [];
              const stageValue = stageOpps.reduce((sum, opp) => sum + opp.value, 0);

              return (
                <div key={stage} className="flex-shrink-0 w-80">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg">
                    {/* Stage Header */}
                    <div className="px-4 py-3 border-b border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{stage}</h3>
                        <span className="text-sm text-gray-400">{stageOpps.length}</span>
                      </div>
                      <div className="text-xs text-gray-500">{formatCurrency(stageValue)}</div>
                    </div>

                    {/* Opportunities */}
                    <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                      {stageOpps.map(opp => (
                        <div
                          key={opp.id}
                          onClick={() => handleOpportunityClick(opp)}
                          className="bg-gray-950 border border-gray-800 rounded-md p-3 hover:border-blue-600 cursor-pointer transition-colors"
                        >
                          <div className="font-medium mb-1 text-sm">{opp.name}</div>
                          {opp.company_name && (
                            <div className="text-xs text-gray-400 mb-2">{opp.company_name}</div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-green-400">
                              {formatCurrency(opp.value)}
                            </span>
                            <span className="text-xs text-gray-500">{opp.probability}% prob</span>
                          </div>
                          {opp.expected_close && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(opp.expected_close)}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {stageOpps.length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-sm">
                          No opportunities
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opportunity Detail Panel */}
      {showDetail && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold">{selectedOpportunity.name}</h2>
                {selectedOpportunity.company_name && (
                  <p className="text-gray-400">{selectedOpportunity.company_name}</p>
                )}
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Value</div>
                  <div className="text-lg font-semibold text-green-400">
                    {formatCurrency(selectedOpportunity.value)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Probability</div>
                  <div className="text-lg font-semibold">{selectedOpportunity.probability}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Stage</div>
                  <div className="text-sm">{selectedOpportunity.stage}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Expected Close</div>
                  <div className="text-sm">{formatDate(selectedOpportunity.expected_close)}</div>
                </div>
              </div>

              {selectedOpportunity.notes && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Notes</div>
                  <div className="bg-gray-950 border border-gray-800 rounded-md p-3 text-sm">
                    {selectedOpportunity.notes}
                  </div>
                </div>
              )}

              {/* Activities Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Activity Timeline</div>
                  <button className="text-xs text-blue-400 hover:text-blue-300">
                    + Add Activity
                  </button>
                </div>
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-950 border border-gray-800 rounded-full flex items-center justify-center text-gray-400">
                        {ACTIVITY_ICONS[activity.type]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">{activity.type}</span>
                          <span className="text-xs text-gray-500">{formatRelativeDate(activity.created_at)}</span>
                        </div>
                        <div className="text-sm text-gray-300">{activity.content}</div>
                        {activity.next_action && (
                          <div className="text-xs text-blue-400 mt-1">Next: {activity.next_action}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {activities.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-sm">
                      No activities yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Opportunity Modal - Placeholder */}
      {showNewOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Opportunity</h2>
              <button
                onClick={() => setShowNewOpportunity(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              Form implementation coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
