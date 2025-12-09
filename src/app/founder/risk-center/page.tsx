'use client';

/**
 * Founder Risk Center Dashboard
 *
 * Phase: D56 - Risk, Compliance & Guardrail Center
 * Features:
 * - Monitor risk events across all systems
 * - Manage compliance policies
 * - Track policy violations
 * - AI-powered risk assessment
 */

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Sparkles, Plus, Activity } from 'lucide-react';

type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
type RiskCategory = 'compliance' | 'security' | 'performance' | 'quality' | 'data' | 'operational';

interface RiskEvent {
  id: string;
  source: string;
  category: RiskCategory;
  severity: RiskSeverity;
  message?: string;
  created_at: string;
  resolved_at?: string;
}

interface Policy {
  id: string;
  slug: string;
  name: string;
  description?: string;
  scope: string;
  status: string;
  rules: Record<string, unknown>;
  created_at: string;
}

interface PolicyViolation {
  id: string;
  policy_id: string;
  source: string;
  severity: RiskSeverity;
  created_at: string;
  resolved_at?: string;
}

interface RiskSummary {
  total_events: number;
  unresolved_events: number;
  critical_events: number;
  events_by_severity: Record<string, number>;
  events_by_category: Record<string, number>;
  total_violations: number;
  unresolved_violations: number;
  violations_by_policy: Record<string, number>;
}

interface AIAssessment {
  impact_score: number;
  recommended_action: string;
  analysis: string;
  related_patterns: string[];
}

export default function FounderRiskCenterPage() {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [assessment, setAssessment] = useState<AIAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);

  const [newPolicy, setNewPolicy] = useState({
    slug: '',
    name: '',
    description: '',
    scope: 'global',
    rules: {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryResponse = await fetch('/api/founder/risk/events?action=summary');
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary || null);

      // Fetch recent events
      const eventsResponse = await fetch('/api/founder/risk/events?resolved=false&limit=20');
      const eventsData = await eventsResponse.json();
      setEvents(eventsData.events || []);

      // Fetch policies
      const policiesResponse = await fetch('/api/founder/risk/policies?status=active');
      const policiesData = await policiesResponse.json();
      setPolicies(policiesData.policies || []);

      // Fetch violations
      const violationsResponse = await fetch('/api/founder/risk/policies?action=violations&resolved=false');
      const violationsData = await violationsResponse.json();
      setViolations(violationsData.violations || []);
    } catch (error) {
      console.error('Failed to fetch risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (event: RiskEvent) => {
    setSelectedEvent(event);
    setLoading(true);

    try {
      const response = await fetch('/api/founder/risk/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      });
      const data = await response.json();
      setAssessment(data.assessment || null);
    } catch (error) {
      console.error('Failed to assess risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      await fetch(`/api/founder/risk/events?action=resolve&id=${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      fetchData();
      setSelectedEvent(null);
      setAssessment(null);
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/founder/risk/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy),
      });
      const data = await response.json();
      if (data.policy) {
        setPolicies([data.policy, ...policies]);
        setShowCreatePolicyModal(false);
        setNewPolicy({
          slug: '',
          name: '',
          description: '',
          scope: 'global',
          rules: {},
        });
      }
    } catch (error) {
      console.error('Failed to create policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: RiskSeverity) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getSeverityIcon = (severity: RiskSeverity) => {
    const icons = {
      low: Activity,
      medium: AlertTriangle,
      high: AlertTriangle,
      critical: XCircle,
    };
    return icons[severity] || Activity;
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Risk Center</h1>
            <p className="text-text-secondary">Monitor risks, enforce policies, and ensure compliance</p>
          </div>
          <button
            onClick={() => setShowCreatePolicyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition"
          >
            <Plus className="h-4 w-4" />
            New Policy
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <div className="flex items-center gap-2 text-text-tertiary mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Unresolved Events</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{summary?.unresolved_events || 0}</p>
            <p className="text-sm text-text-tertiary mt-1">
              {summary?.total_events || 0} total
            </p>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <div className="flex items-center gap-2 text-text-tertiary mb-2">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Critical Events</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{summary?.critical_events || 0}</p>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <div className="flex items-center gap-2 text-text-tertiary mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Active Policies</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{policies.length}</p>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <div className="flex items-center gap-2 text-text-tertiary mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Policy Violations</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{summary?.unresolved_violations || 0}</p>
            <p className="text-sm text-text-tertiary mt-1">
              {summary?.total_violations || 0} total
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events */}
          <div className="lg:col-span-2">
            <div className="bg-bg-card rounded-xl border border-border-primary p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Risk Events</h2>
              <div className="space-y-3">
                {events.slice(0, 10).map((event) => {
                  const SeverityIcon = getSeverityIcon(event.severity);
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedEvent?.id === event.id
                          ? 'border-accent-500 bg-accent-500/10'
                          : 'border-border-primary hover:border-accent-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <SeverityIcon className="h-4 w-4 text-text-tertiary" />
                          <h3 className="font-semibold text-text-primary">{event.source}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs text-white ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{event.message || 'No message'}</p>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <span className="px-2 py-1 rounded bg-bg-primary">{event.category}</span>
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && !loading && (
                  <p className="text-sm text-text-tertiary text-center py-8">
                    No unresolved risk events
                  </p>
                )}
              </div>
            </div>

            {/* AI Assessment */}
            {selectedEvent && assessment && (
              <div className="bg-bg-card rounded-xl border border-border-primary p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-accent-500" />
                  <h3 className="text-lg font-semibold text-text-primary">AI Risk Assessment</h3>
                  <span className="ml-auto px-3 py-1 rounded-full text-sm bg-accent-500/20 text-accent-500">
                    Impact: {assessment.impact_score}/100
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Analysis</h4>
                    <p className="text-sm text-text-primary">{assessment.analysis}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Recommended Action</h4>
                    <p className="text-sm text-accent-500">{assessment.recommended_action}</p>
                  </div>

                  {assessment.related_patterns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-secondary mb-2">Related Patterns</h4>
                      <ul className="space-y-1">
                        {assessment.related_patterns.map((pattern, idx) => (
                          <li key={idx} className="text-sm text-text-primary flex items-start gap-2">
                            <span className="text-accent-500">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border-primary">
                    <button
                      onClick={() => handleResolveEvent(selectedEvent.id)}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Resolve Event
                    </button>
                    <button
                      onClick={() => { setSelectedEvent(null); setAssessment(null); }}
                      className="px-4 py-2 bg-bg-primary border border-border-primary text-text-primary rounded-lg hover:bg-bg-hover transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Policies Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card rounded-xl border border-border-primary p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Active Policies</h2>
              <div className="space-y-3">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="p-3 rounded-lg border border-border-primary hover:border-accent-500/50 transition"
                  >
                    <h3 className="font-semibold text-text-primary text-sm">{policy.name}</h3>
                    <p className="text-xs text-text-secondary mt-1">{policy.scope}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">
                        {policy.status}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {Object.keys(policy.rules).length} rules
                      </span>
                    </div>
                  </div>
                ))}
                {policies.length === 0 && !loading && (
                  <p className="text-sm text-text-tertiary text-center py-8">
                    No active policies
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Policy Modal */}
        {showCreatePolicyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-xl border border-border-primary p-6 max-w-lg w-full">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Create Policy</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
                  <input
                    type="text"
                    value={newPolicy.slug}
                    onChange={(e) => setNewPolicy({ ...newPolicy, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={newPolicy.description}
                    onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Scope</label>
                  <select
                    value={newPolicy.scope}
                    onChange={(e) => setNewPolicy({ ...newPolicy, scope: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary"
                  >
                    <option value="global">Global</option>
                    <option value="email">Email</option>
                    <option value="content">Content</option>
                    <option value="campaign">Campaign</option>
                    <option value="api">API</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreatePolicy}
                  disabled={loading || !newPolicy.slug || !newPolicy.name}
                  className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreatePolicyModal(false)}
                  className="flex-1 px-4 py-2 bg-bg-primary border border-border-primary text-text-primary rounded-lg hover:bg-bg-hover transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
