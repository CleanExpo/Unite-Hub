'use client';

/**
 * Founder Command Center Dashboard
 *
 * Phase: D52 - Founder Command Center & Cross-Business Insights
 *
 * Features:
 * - Customizable dashboard panels
 * - Widget management (KPI cards, charts, tables, alerts)
 * - Cross-business KPI snapshots
 * - AI-powered insights and recommendations
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, Settings, TrendingUp, TrendingDown, Activity } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

type WidgetType = 'kpi_card' | 'chart' | 'table' | 'alert_list' | 'trend_graph';

interface Panel {
  id: string;
  slug: string;
  name: string;
  description?: string;
  default_panel: boolean;
  created_at: string;
}

interface PanelWidget {
  id: string;
  panel_id: string;
  widget_type: WidgetType;
  title?: string;
  config?: {
    metric?: string;
    visualization?: string;
    aggregation?: string;
  };
  position?: { x: number; y: number; w: number; h: number };
}

interface CrossBusinessSummary {
  total_businesses: number;
  total_mrr: number;
  total_active_campaigns: number;
  avg_health_score: number;
  critical_alerts: number;
}

interface AIInsights {
  insights: string[];
  alerts: Array<{ severity: 'low' | 'medium' | 'high' | 'critical'; message: string }>;
  recommendations: string[];
  trends: Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change_percent: number }>;
}

// =============================================================================
// Component
// =============================================================================

export default function FounderCommandCenterPage() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [widgets, setWidgets] = useState<PanelWidget[]>([]);
  const [summary, setSummary] = useState<CrossBusinessSummary | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showCreatePanelModal, setShowCreatePanelModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

  // Form states
  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelSlug, setNewPanelSlug] = useState('');
  const [newPanelDescription, setNewPanelDescription] = useState('');
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>('kpi_card');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetMetric, setNewWidgetMetric] = useState('mrr');

  // Fetch panels
  useEffect(() => {
    fetchPanels();
    fetchSummary();
  }, []);

  // Fetch widgets when panel changes
  useEffect(() => {
    if (selectedPanel) {
      fetchWidgets(selectedPanel.id);
    }
  }, [selectedPanel]);

  const fetchPanels = async () => {
    try {
      const response = await fetch('/api/founder/command-center/panels');
      const data = await response.json();
      setPanels(data.panels || []);
      if (data.panels && data.panels.length > 0) {
        setSelectedPanel(data.panels[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch panels:', error);
      setLoading(false);
    }
  };

  const fetchWidgets = async (panelId: string) => {
    try {
      const response = await fetch(`/api/founder/command-center/panels?action=widgets&id=${panelId}`);
      const data = await response.json();
      setWidgets(data.widgets || []);
    } catch (error) {
      console.error('Failed to fetch widgets:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/founder/command-center/snapshots?action=cross_business');
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await fetch('/api/founder/command-center/ai/summary?action=cross_business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const createPanel = async () => {
    try {
      const response = await fetch('/api/founder/command-center/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newPanelSlug,
          name: newPanelName,
          description: newPanelDescription,
        }),
      });

      if (response.ok) {
        setShowCreatePanelModal(false);
        setNewPanelName('');
        setNewPanelSlug('');
        setNewPanelDescription('');
        fetchPanels();
      }
    } catch (error) {
      console.error('Failed to create panel:', error);
    }
  };

  const addWidget = async () => {
    if (!selectedPanel) return;

    try {
      const response = await fetch('/api/founder/command-center/panels?action=add_widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panel_id: selectedPanel.id,
          widget_type: newWidgetType,
          title: newWidgetTitle,
          config: { metric: newWidgetMetric },
        }),
      });

      if (response.ok) {
        setShowAddWidgetModal(false);
        setNewWidgetTitle('');
        setNewWidgetMetric('mrr');
        fetchWidgets(selectedPanel.id);
      }
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const deletePanel = async (panelId: string) => {
    if (!confirm('Delete this panel?')) return;

    try {
      await fetch(`/api/founder/command-center/panels?action=delete&id=${panelId}`, {
        method: 'POST',
      });
      fetchPanels();
    } catch (error) {
      console.error('Failed to delete panel:', error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    if (!confirm('Remove this widget?')) return;

    try {
      await fetch(`/api/founder/command-center/panels?action=remove_widget&widget_id=${widgetId}`, {
        method: 'POST',
      });
      if (selectedPanel) {
        fetchWidgets(selectedPanel.id);
      }
    } catch (error) {
      console.error('Failed to remove widget:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  const severityColors = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div className="min-h-screen bg-bg-app p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Founder Command Center</h1>
            <p className="text-text-secondary">Cross-business insights and customizable dashboards</p>
          </div>
          <button
            onClick={() => setShowCreatePanelModal(true)}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-white hover:bg-accent-600"
          >
            <Plus className="h-5 w-5" />
            New Panel
          </button>
        </div>

        {/* Cross-Business Summary */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-bg-card p-4 border border-border-default">
              <div className="text-sm text-text-secondary">Businesses</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_businesses}</div>
            </div>
            <div className="rounded-lg bg-bg-card p-4 border border-border-default">
              <div className="text-sm text-text-secondary">Total MRR</div>
              <div className="text-2xl font-bold text-accent-500">${summary.total_mrr.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-bg-card p-4 border border-border-default">
              <div className="text-sm text-text-secondary">Active Campaigns</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_active_campaigns}</div>
            </div>
            <div className="rounded-lg bg-bg-card p-4 border border-border-default">
              <div className="text-sm text-text-secondary">Avg Health Score</div>
              <div className="text-2xl font-bold text-green-400">{summary.avg_health_score.toFixed(1)}/100</div>
            </div>
            <div className="rounded-lg bg-bg-card p-4 border border-border-default">
              <div className="text-sm text-text-secondary">Critical Alerts</div>
              <div className="text-2xl font-bold text-red-400">{summary.critical_alerts}</div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="rounded-lg bg-bg-card p-6 border border-border-default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">AI Insights</h2>
            <button
              onClick={fetchInsights}
              disabled={insightsLoading}
              className="flex items-center gap-2 rounded bg-accent-500 px-3 py-1.5 text-sm text-white hover:bg-accent-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${insightsLoading ? 'animate-spin' : ''}`} />
              {insightsLoading ? 'Generating...' : 'Generate Insights'}
            </button>
          </div>

          {insights && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Insights */}
              <div className="space-y-2">
                <h3 className="font-medium text-text-primary">Key Insights</h3>
                {insights.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Activity className="h-4 w-4 mt-0.5 text-accent-500" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              <div className="space-y-2">
                <h3 className="font-medium text-text-primary">Alerts</h3>
                {insights.alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className={`font-semibold ${severityColors[alert.severity]}`}>
                      {alert.severity.toUpperCase()}:
                    </span>
                    <span className="text-text-secondary">{alert.message}</span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h3 className="font-medium text-text-primary">Recommendations</h3>
                {insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-sm text-text-secondary">• {rec}</div>
                ))}
              </div>
            </div>
          )}

          {insights && insights.trends.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-default">
              <h3 className="font-medium text-text-primary mb-2">Trends</h3>
              <div className="flex flex-wrap gap-3">
                {insights.trends.map((trend, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded bg-bg-app px-3 py-1.5 text-sm">
                    <span className="text-text-secondary">{trend.metric}:</span>
                    {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
                    {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
                    <span className={trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
                      {trend.change_percent > 0 ? '+' : ''}{trend.change_percent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panels */}
        <div className="grid grid-cols-4 gap-6">
          {/* Panel Selector */}
          <div className="col-span-1 space-y-2">
            <h2 className="text-lg font-semibold text-text-primary">Panels</h2>
            {panels.map((panel) => (
              <div
                key={panel.id}
                onClick={() => setSelectedPanel(panel)}
                className={`cursor-pointer rounded-lg p-3 border ${
                  selectedPanel?.id === panel.id
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-border-default bg-bg-card hover:border-accent-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-text-primary">{panel.name}</div>
                    {panel.default_panel && (
                      <div className="text-xs text-accent-500">Default</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePanel(panel.id);
                    }}
                    className="text-text-tertiary hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Widget Grid */}
          <div className="col-span-3">
            {selectedPanel && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">{selectedPanel.name}</h2>
                  <button
                    onClick={() => setShowAddWidgetModal(true)}
                    className="flex items-center gap-2 rounded bg-accent-500 px-3 py-1.5 text-sm text-white hover:bg-accent-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add Widget
                  </button>
                </div>

                {widgets.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border-default bg-bg-card p-12 text-center">
                    <Settings className="mx-auto h-12 w-12 text-text-tertiary mb-3" />
                    <p className="text-text-secondary">No widgets yet. Add your first widget to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {widgets.map((widget) => (
                      <div key={widget.id} className="rounded-lg bg-bg-card p-4 border border-border-default">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-text-primary">{widget.title || widget.widget_type}</h3>
                          <button
                            onClick={() => removeWidget(widget.id)}
                            className="text-text-tertiary hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-sm text-text-secondary">
                          Type: {widget.widget_type}
                          {widget.config?.metric && ` • Metric: ${widget.config.metric}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create Panel Modal */}
        {showCreatePanelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-bg-card p-6 border border-border-default">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Create Panel</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={newPanelName}
                    onChange={(e) => setNewPanelName(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    placeholder="My Dashboard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
                  <input
                    type="text"
                    value={newPanelSlug}
                    onChange={(e) => setNewPanelSlug(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    placeholder="my-dashboard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={newPanelDescription}
                    onChange={(e) => setNewPanelDescription(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreatePanelModal(false)}
                  className="rounded bg-bg-app px-4 py-2 text-text-secondary hover:bg-bg-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={createPanel}
                  disabled={!newPanelName || !newPanelSlug}
                  className="rounded bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Widget Modal */}
        {showAddWidgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-bg-card p-6 border border-border-default">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Add Widget</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                  <input
                    type="text"
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    placeholder="Widget Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                  <select
                    value={newWidgetType}
                    onChange={(e) => setNewWidgetType(e.target.value as WidgetType)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                  >
                    <option value="kpi_card">KPI Card</option>
                    <option value="chart">Chart</option>
                    <option value="table">Table</option>
                    <option value="alert_list">Alert List</option>
                    <option value="trend_graph">Trend Graph</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Metric</label>
                  <select
                    value={newWidgetMetric}
                    onChange={(e) => setNewWidgetMetric(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                  >
                    <option value="mrr">MRR</option>
                    <option value="active_campaigns">Active Campaigns</option>
                    <option value="health_score">Health Score</option>
                    <option value="churn_rate">Churn Rate</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddWidgetModal(false)}
                  className="rounded bg-bg-app px-4 py-2 text-text-secondary hover:bg-bg-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={addWidget}
                  disabled={!newWidgetTitle}
                  className="rounded bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 disabled:opacity-50"
                >
                  Add Widget
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
