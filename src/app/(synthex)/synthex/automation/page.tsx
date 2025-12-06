'use client';

/**
 * Synthex Automation Page
 *
 * Displays automation workflows and run history.
 * Allows creating and managing lead nurturing workflows.
 *
 * Phase: B13 - Automated Lead Nurturing Workflows
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Workflow,
  Play,
  Pause,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Mail,
  Tag,
  Timer,
  Webhook,
  Bell,
  ArrowRight,
} from 'lucide-react';

interface WorkflowData {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  trigger: {
    type: string;
    threshold?: number;
    tag?: string;
    stage?: string;
  };
  actions: Array<{
    type: string;
    templateId?: string;
    subject?: string;
    tag?: string;
    seconds?: number;
    url?: string;
    stage?: string;
  }>;
  isActive: boolean;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt: string | null;
  createdAt: string;
}

interface RunData {
  id: string;
  workflowId: string;
  contactId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [runs, setRuns] = useState<RunData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('');

  const loadWorkflows = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/synthex/automation?tenantId=${tenantId}&includeRuns=true`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load workflows');
      }

      setWorkflows(data.workflows || []);
      setRuns(data.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadWorkflows();
    }
  }, [tenantId, loadWorkflows]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email':
        return <Mail className="h-4 w-4" />;
      case 'add_tag':
      case 'remove_tag':
        return <Tag className="h-4 w-4" />;
      case 'wait':
        return <Timer className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'notify':
        return <Bell className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (trigger: WorkflowData['trigger']) => {
    switch (trigger.type) {
      case 'lead_score_threshold':
        return `Lead score >= ${trigger.threshold}`;
      case 'churn_risk_high':
        return 'High churn risk detected';
      case 'tag_added':
        return `Tag added: ${trigger.tag}`;
      case 'stage_change':
        return `Stage changed to: ${trigger.stage}`;
      case 'new_contact':
        return 'New contact added';
      case 'manual':
        return 'Manual trigger';
      default:
        return trigger.type;
    }
  };

  const getStatusBadge = (status: RunData['status']) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      running: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return styles[status] || 'bg-gray-700 text-gray-400';
  };

  const getStatusIcon = (status: RunData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Automation Workflows</h1>
            <p className="text-gray-500 mt-1">
              Automate lead nurturing with triggers and actions
            </p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Tenant ID Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter Tenant ID..."
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>
              <Button
                onClick={loadWorkflows}
                disabled={loading || !tenantId}
                className="bg-gray-700 hover:bg-gray-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Load Workflows'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
            <p className="text-gray-500 mt-4">Loading workflows...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tenantId && workflows.length === 0 && (
          <div className="py-12 text-center">
            <Workflow className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Workflows Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Create your first automation workflow to nurture leads automatically.
            </p>
          </div>
        )}

        {/* Workflows Grid */}
        {!loading && workflows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {workflows.map((workflow) => {
              const isExpanded = expandedId === workflow.id;
              const successRate =
                workflow.totalRuns > 0
                  ? Math.round((workflow.successfulRuns / workflow.totalRuns) * 100)
                  : 0;

              return (
                <Card key={workflow.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            workflow.isActive
                              ? 'bg-green-500/20'
                              : 'bg-gray-700'
                          }`}
                        >
                          <Workflow
                            className={`h-5 w-5 ${
                              workflow.isActive
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-100">
                            {workflow.name}
                          </CardTitle>
                          {workflow.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {workflow.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          workflow.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }
                      >
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Trigger */}
                    <div className="p-3 bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Trigger</p>
                      <p className="text-sm text-gray-300">
                        {getTriggerLabel(workflow.trigger)}
                      </p>
                    </div>

                    {/* Actions Preview */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {workflow.actions.slice(0, 4).map((action, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-900 rounded text-xs text-gray-400"
                        >
                          {getActionIcon(action.type)}
                          <span>{action.type.replace(/_/g, ' ')}</span>
                          {i < workflow.actions.length - 1 && i < 3 && (
                            <ArrowRight className="h-3 w-3 ml-1 text-gray-600" />
                          )}
                        </div>
                      ))}
                      {workflow.actions.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{workflow.actions.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-100">
                          {workflow.totalRuns}
                        </p>
                        <p className="text-xs text-gray-500">Total Runs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-400">
                          {successRate}%
                        </p>
                        <p className="text-xs text-gray-500">Success Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-red-400">
                          {workflow.failedRuns}
                        </p>
                        <p className="text-xs text-gray-500">Failed</p>
                      </div>
                    </div>

                    {/* Expand/Collapse */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-gray-400 hover:text-gray-100"
                      onClick={() => setExpandedId(isExpanded ? null : workflow.id)}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-gray-700 space-y-4">
                        {/* All Actions */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            Actions ({workflow.actions.length})
                          </p>
                          <div className="space-y-2">
                            {workflow.actions.map((action, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-2 bg-gray-900 rounded"
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-800 text-xs text-gray-400">
                                  {i + 1}
                                </div>
                                {getActionIcon(action.type)}
                                <div className="flex-1">
                                  <p className="text-sm text-gray-300">
                                    {action.type.replace(/_/g, ' ')}
                                  </p>
                                  {action.seconds && (
                                    <p className="text-xs text-gray-500">
                                      Wait {action.seconds}s
                                    </p>
                                  )}
                                  {action.tag && (
                                    <p className="text-xs text-gray-500">
                                      Tag: {action.tag}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gray-700 hover:bg-gray-600"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Run Manually
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-400"
                          >
                            {workflow.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Last Run */}
                        {workflow.lastRunAt && (
                          <p className="text-xs text-gray-500">
                            Last run:{' '}
                            {new Date(workflow.lastRunAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Recent Runs */}
        {!loading && runs.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-100">Recent Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {runs.slice(0, 10).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg"
                  >
                    {getStatusIcon(run.status)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">
                        Workflow Run
                        {run.contactId && (
                          <span className="text-gray-500">
                            {' '}
                            • Contact: {run.contactId.slice(0, 8)}...
                          </span>
                        )}
                      </p>
                      {run.error && (
                        <p className="text-xs text-red-400 mt-1">{run.error}</p>
                      )}
                    </div>
                    <Badge className={getStatusBadge(run.status)}>{run.status}</Badge>
                    {run.startedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(run.startedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
