/**
 * Synthex Safety Dashboard
 *
 * AI compliance, audit logging, guardrail configuration, and safety incidents.
 *
 * Features:
 * - Summary cards (total AI calls, flagged %, incidents)
 * - Risk distribution chart
 * - Recent audit log table (filterable)
 * - Incidents list with severity badges
 * - Guardrail policy editor
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  FileText,
  Settings,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Plus,
  X,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  service_name: string;
  route?: string;
  input_preview?: string;
  output_preview?: string;
  input_tokens: number;
  output_tokens: number;
  risk_score: number;
  flagged: boolean;
  flag_reason?: string;
  response_time_ms?: number;
  created_at: string;
}

interface SafetyIncident {
  id: string;
  type: 'pii_detected' | 'blocked_phrase' | 'high_risk' | 'rate_limit' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

interface GuardrailPolicy {
  mode: 'strict' | 'moderate' | 'open';
  blocked_phrases: string[];
  pii_rules: {
    mask_email: boolean;
    mask_phone: boolean;
    mask_ssn: boolean;
    mask_credit_card: boolean;
    mask_address: boolean;
    mask_name: boolean;
  };
  max_input_tokens: number;
  max_output_tokens: number;
}

interface SafetyStats {
  total_calls: number;
  flagged_count: number;
  flagged_percentage: number;
  incidents_count: number;
  avg_risk_score: number;
  high_risk_count: number;
}

export default function SafetyPage() {
  const [stats, setStats] = useState<SafetyStats>({
    total_calls: 0,
    flagged_count: 0,
    flagged_percentage: 0,
    incidents_count: 0,
    avg_risk_score: 0,
    high_risk_count: 0,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [policy, setPolicy] = useState<GuardrailPolicy>({
    mode: 'moderate',
    blocked_phrases: ['password', 'secret', 'confidential'],
    pii_rules: {
      mask_email: true,
      mask_phone: true,
      mask_ssn: true,
      mask_credit_card: true,
      mask_address: false,
      mask_name: false,
    },
    max_input_tokens: 10000,
    max_output_tokens: 4000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [flaggedFilter, setFlaggedFilter] = useState<boolean | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<boolean | 'all'>('all');

  // New phrase input
  const [newPhrase, setNewPhrase] = useState('');

  useEffect(() => {
    loadData();
  }, [serviceFilter, flaggedFilter, severityFilter, resolvedFilter]);

  async function loadData() {
    setLoading(true);
    try {
      // Get tenant from auth (placeholder)
      const tenantId = 'demo-tenant-001';

      // Load stats
      const statsRes = await fetch(`/api/synthex/safety/stats?tenantId=${tenantId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load audit logs
      const auditParams = new URLSearchParams({ tenantId });
      if (serviceFilter !== 'all') auditParams.append('service_name', serviceFilter);
      if (flaggedFilter !== 'all') auditParams.append('flagged', String(flaggedFilter));

      const auditRes = await fetch(`/api/synthex/safety/audit?${auditParams}`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }

      // Load incidents
      const incidentParams = new URLSearchParams({ tenantId });
      if (severityFilter !== 'all') incidentParams.append('severity', severityFilter);
      if (resolvedFilter !== 'all') incidentParams.append('resolved', String(resolvedFilter));

      const incidentRes = await fetch(`/api/synthex/safety/incidents?${incidentParams}`);
      if (incidentRes.ok) {
        const incidentData = await incidentRes.json();
        setIncidents(incidentData.incidents || []);
      }

      // Load policy
      const policyRes = await fetch(`/api/synthex/safety/policy?tenantId=${tenantId}`);
      if (policyRes.ok) {
        const policyData = await policyRes.json();
        setPolicy(policyData.policy);
      }
    } catch (error) {
      console.error('Failed to load safety data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePolicy() {
    setSaving(true);
    try {
      const tenantId = 'demo-tenant-001';
      const res = await fetch('/api/synthex/safety/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, policy }),
      });

      if (res.ok) {
        alert('Policy saved successfully');
      } else {
        alert('Failed to save policy');
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert('Failed to save policy');
    } finally {
      setSaving(false);
    }
  }

  async function resolveIncident(incidentId: string) {
    try {
      const tenantId = 'demo-tenant-001';
      const res = await fetch('/api/synthex/safety/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, incidentId }),
      });

      if (res.ok) {
        loadData(); // Reload
      }
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  }

  function addBlockedPhrase() {
    if (newPhrase && !policy.blocked_phrases.includes(newPhrase)) {
      setPolicy({
        ...policy,
        blocked_phrases: [...policy.blocked_phrases, newPhrase],
      });
      setNewPhrase('');
    }
  }

  function removeBlockedPhrase(phrase: string) {
    setPolicy({
      ...policy,
      blocked_phrases: policy.blocked_phrases.filter((p) => p !== phrase),
    });
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const incidentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pii_detected: 'PII Detected',
      blocked_phrase: 'Blocked Phrase',
      high_risk: 'High Risk',
      rate_limit: 'Rate Limit',
      policy_violation: 'Policy Violation',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
              <Shield className="h-8 w-8 text-accent-500" />
              AI Safety & Compliance
            </h1>
            <p className="text-text-secondary mt-1">
              Guardrails, audit logs, and safety incident management
            </p>
          </div>
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-bg-card border-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Total AI Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stats.total_calls.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Flagged %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {stats.flagged_percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-text-muted mt-1">{stats.flagged_count} flagged</p>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.incidents_count}</div>
              <p className="text-xs text-text-muted mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Avg Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {stats.avg_risk_score.toFixed(0)}
              </div>
              <p className="text-xs text-text-muted mt-1">{stats.high_risk_count} high-risk</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="audit" className="space-y-4">
          <TabsList className="bg-bg-card border border-border-primary">
            <TabsTrigger value="audit" className="data-[state=active]:bg-accent-500">
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-accent-500">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="policy" className="data-[state=active]:bg-accent-500">
              <Settings className="h-4 w-4 mr-2" />
              Guardrail Policy
            </TabsTrigger>
          </TabsList>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">Recent Audit Logs</CardTitle>
                  <div className="flex gap-2">
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger className="w-40 bg-bg-secondary border-border-primary">
                        <SelectValue placeholder="Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="insight">Insight</SelectItem>
                        <SelectItem value="lead_engine">Lead Engine</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={flaggedFilter === 'all' ? 'all' : String(flaggedFilter)}
                      onValueChange={(val) => setFlaggedFilter(val === 'all' ? 'all' : val === 'true')}
                    >
                      <SelectTrigger className="w-32 bg-bg-secondary border-border-primary">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Flagged</SelectItem>
                        <SelectItem value="false">Safe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No audit logs found</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-accent-500/10 text-accent-400 border-accent-500/30">
                                {log.service_name}
                              </Badge>
                              {log.flagged && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Flagged
                                </Badge>
                              )}
                              <span className="text-xs text-text-muted">
                                Risk: {log.risk_score.toFixed(0)}
                              </span>
                              <span className="text-xs text-text-muted">
                                {log.input_tokens + log.output_tokens} tokens
                              </span>
                              {log.response_time_ms && (
                                <span className="text-xs text-text-muted">
                                  {log.response_time_ms}ms
                                </span>
                              )}
                            </div>
                            {log.input_preview && (
                              <p className="text-sm text-text-secondary mb-1">
                                <span className="font-medium">Input:</span> {log.input_preview.substring(0, 100)}...
                              </p>
                            )}
                            {log.flag_reason && (
                              <p className="text-sm text-red-400">
                                <span className="font-medium">Reason:</span> {log.flag_reason}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-text-muted">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">Safety Incidents</CardTitle>
                  <div className="flex gap-2">
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-32 bg-bg-secondary border-border-primary">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={resolvedFilter === 'all' ? 'all' : String(resolvedFilter)}
                      onValueChange={(val) => setResolvedFilter(val === 'all' ? 'all' : val === 'true')}
                    >
                      <SelectTrigger className="w-32 bg-bg-secondary border-border-primary">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="false">Unresolved</SelectItem>
                        <SelectItem value="true">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
                  </div>
                ) : incidents.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No incidents found</p>
                ) : (
                  <div className="space-y-2">
                    {incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={severityColor(incident.severity)}>
                                {incident.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                {incidentTypeLabel(incident.type)}
                              </Badge>
                              {incident.resolved ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Open
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {JSON.stringify(incident.details, null, 2).substring(0, 200)}...
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-text-muted">
                              {new Date(incident.created_at).toLocaleString()}
                            </div>
                            {!incident.resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveIncident(incident.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guardrail Policy Tab */}
          <TabsContent value="policy">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Guardrail Configuration</CardTitle>
                <CardDescription className="text-text-secondary">
                  Configure AI safety policies for your tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Selector */}
                <div>
                  <Label className="text-text-primary">Policy Mode</Label>
                  <Select value={policy.mode} onValueChange={(val) => setPolicy({ ...policy, mode: val as any })}>
                    <SelectTrigger className="mt-2 bg-bg-secondary border-border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict (Block all violations)</SelectItem>
                      <SelectItem value="moderate">Moderate (Log and sanitize)</SelectItem>
                      <SelectItem value="open">Open (Audit only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Blocked Phrases */}
                <div>
                  <Label className="text-text-primary">Blocked Phrases</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        placeholder="Add phrase to block..."
                        className="bg-bg-secondary border-border-primary text-text-primary"
                        onKeyPress={(e) => e.key === 'Enter' && addBlockedPhrase()}
                      />
                      <Button onClick={addBlockedPhrase} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {policy.blocked_phrases.map((phrase) => (
                        <Badge
                          key={phrase}
                          variant="outline"
                          className="bg-red-500/10 text-red-400 border-red-500/30"
                        >
                          {phrase}
                          <button
                            onClick={() => removeBlockedPhrase(phrase)}
                            className="ml-2 hover:text-red-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PII Masking */}
                <div>
                  <Label className="text-text-primary">PII Masking Rules</Label>
                  <div className="mt-2 space-y-3">
                    {Object.entries(policy.pii_rules).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-sm text-text-secondary capitalize">
                          {key.replace('mask_', '').replace('_', ' ')}
                        </Label>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            setPolicy({
                              ...policy,
                              pii_rules: { ...policy.pii_rules, [key]: checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Token Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-primary">Max Input Tokens</Label>
                    <Input
                      type="number"
                      value={policy.max_input_tokens}
                      onChange={(e) =>
                        setPolicy({ ...policy, max_input_tokens: parseInt(e.target.value) })
                      }
                      className="mt-2 bg-bg-secondary border-border-primary text-text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-text-primary">Max Output Tokens</Label>
                    <Input
                      type="number"
                      value={policy.max_output_tokens}
                      onChange={(e) =>
                        setPolicy({ ...policy, max_output_tokens: parseInt(e.target.value) })
                      }
                      className="mt-2 bg-bg-secondary border-border-primary text-text-primary"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={savePolicy} disabled={saving} className="bg-accent-500 hover:bg-accent-600">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Save Policy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
