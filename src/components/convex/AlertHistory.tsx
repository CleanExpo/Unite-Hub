/**
 * Alert History Component
 *
 * Displays historical alert triggers and their resolution status:
 * - Timeline view of alert triggers
 * - Filter by date range, type, status
 * - Acknowledgment functionality
 * - Resolution tracking
 * - Trigger context display
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  CheckCheck,
  XCircle,
  TrendingDown,
  Target,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface AlertTrigger {
  id: string;
  alert_rule_id: string;
  framework_id: string;
  workspace_id: string;
  triggered_at: string;
  current_value: number;
  threshold_value: number;
  condition_met: boolean;
  notification_sent: boolean;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  trigger_context?: Record<string, any>;
  alert_rule?: {
    alert_type: string;
    metric_name: string;
    condition: string;
    description?: string;
  };
}

interface AlertHistoryProps {
  frameworkId: string;
  workspaceId: string;
}

// Mock data for demonstration
const MOCK_ALERT_TRIGGERS: AlertTrigger[] = [
  {
    id: 'trigger_001',
    alert_rule_id: 'rule_001',
    framework_id: 'fw_001',
    workspace_id: 'ws_001',
    triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    current_value: 65,
    threshold_value: 70,
    condition_met: true,
    notification_sent: true,
    acknowledged: true,
    acknowledged_by: 'user_001',
    acknowledged_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    resolved: false,
    trigger_context: {
      metric: 'Effectiveness Score',
      previous_value: 72,
      change_percent: -9.7,
    },
    alert_rule: {
      alert_type: 'threshold',
      metric_name: 'Effectiveness Score',
      condition: 'below',
      description: 'Alert when effectiveness drops below 70',
    },
  },
  {
    id: 'trigger_002',
    alert_rule_id: 'rule_002',
    framework_id: 'fw_001',
    workspace_id: 'ws_001',
    triggered_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    current_value: 45,
    threshold_value: 50,
    condition_met: true,
    notification_sent: true,
    acknowledged: false,
    resolved: false,
    trigger_context: {
      metric: 'Adoption Rate',
      previous_value: 52,
      change_percent: -13.5,
    },
    alert_rule: {
      alert_type: 'performance',
      metric_name: 'Adoption Rate',
      condition: 'below',
      description: 'Alert when adoption drops below 50%',
    },
  },
  {
    id: 'trigger_003',
    alert_rule_id: 'rule_003',
    framework_id: 'fw_001',
    workspace_id: 'ws_001',
    triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    current_value: 38,
    threshold_value: 40,
    condition_met: true,
    notification_sent: true,
    acknowledged: true,
    acknowledged_by: 'user_001',
    acknowledged_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    resolved: true,
    resolved_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    trigger_context: {
      metric: 'Usage Drop',
      previous_value: 48,
      change_percent: -20.8,
    },
    alert_rule: {
      alert_type: 'anomaly',
      metric_name: 'Usage',
      condition: 'changes_by',
      description: 'Alert on 20% usage drop',
    },
  },
  {
    id: 'trigger_004',
    alert_rule_id: 'rule_004',
    framework_id: 'fw_001',
    workspace_id: 'ws_001',
    triggered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    current_value: 125,
    threshold_value: 100,
    condition_met: true,
    notification_sent: true,
    acknowledged: true,
    acknowledged_by: 'user_002',
    acknowledged_at: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: true,
    resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    trigger_context: {
      metric: 'User Count',
      previous_value: 98,
      change_percent: 27.6,
    },
    alert_rule: {
      alert_type: 'milestone',
      metric_name: 'User Count',
      condition: 'above',
      description: 'Alert when user count exceeds 100',
    },
  },
  {
    id: 'trigger_005',
    alert_rule_id: 'rule_001',
    framework_id: 'fw_001',
    workspace_id: 'ws_001',
    triggered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    current_value: 62,
    threshold_value: 70,
    condition_met: true,
    notification_sent: true,
    acknowledged: true,
    acknowledged_by: 'user_001',
    acknowledged_at: new Date(Date.now() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: true,
    resolved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    trigger_context: {
      metric: 'Effectiveness Score',
      previous_value: 75,
      change_percent: -17.3,
    },
    alert_rule: {
      alert_type: 'threshold',
      metric_name: 'Effectiveness Score',
      condition: 'below',
      description: 'Alert when effectiveness drops below 70',
    },
  },
];

function getAlertTypeIcon(type: string) {
  switch (type) {
    case 'threshold':
      return <AlertCircle className="h-4 w-4" />;
    case 'anomaly':
      return <TrendingDown className="h-4 w-4" />;
    case 'performance':
      return <Target className="h-4 w-4" />;
    case 'milestone':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getAlertTypeColor(type: string): string {
  switch (type) {
    case 'threshold':
      return 'bg-red-100 text-red-800';
    case 'anomaly':
      return 'bg-orange-100 text-orange-800';
    case 'performance':
      return 'bg-yellow-100 text-yellow-800';
    case 'milestone':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(trigger: AlertTrigger) {
  if (trigger.resolved) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  } else if (trigger.acknowledged) {
    return <Eye className="h-4 w-4 text-blue-600" />;
  } else {
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

function getStatusLabel(trigger: AlertTrigger): string {
  if (trigger.resolved) {
    return 'Resolved';
  } else if (trigger.acknowledged) {
    return 'Acknowledged';
  } else {
    return 'Active';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

function AlertTriggerCard({
  trigger,
  onAcknowledge,
  onResolve,
  onDetails,
}: {
  trigger: AlertTrigger;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  onDetails?: (trigger: AlertTrigger) => void;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="mt-1">
              {getStatusIcon(trigger)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getAlertTypeColor(trigger.alert_rule?.alert_type || '')}>
                  {getAlertTypeIcon(trigger.alert_rule?.alert_type || '')}
                  <span className="ml-1">{trigger.alert_rule?.alert_type}</span>
                </Badge>
                <Badge variant="outline">
                  {getStatusLabel(trigger)}
                </Badge>
              </div>

              <h4 className="font-semibold mb-1">
                {trigger.alert_rule?.metric_name || 'Unknown Alert'}
              </h4>

              <div className="text-sm text-gray-600 mb-2">
                <div>
                  <span className="font-medium">Condition:</span> {trigger.alert_rule?.condition} {trigger.threshold_value}
                </div>
                <div>
                  <span className="font-medium">Current Value:</span> {trigger.current_value}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(trigger.triggered_at)}</span>
                <span className="text-gray-400">({formatRelativeTime(trigger.triggered_at)})</span>
              </div>

              {trigger.trigger_context && (
                <div className="bg-gray-50 p-2 rounded text-xs mb-3">
                  {trigger.trigger_context.change_percent && (
                    <div>Change: <span className={trigger.trigger_context.change_percent < 0 ? 'text-red-600' : 'text-green-600'}>
                      {trigger.trigger_context.change_percent > 0 ? '+' : ''}{trigger.trigger_context.change_percent.toFixed(1)}%
                    </span></div>
                  )}
                  {trigger.trigger_context.previous_value && (
                    <div>Previous: {trigger.trigger_context.previous_value}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-fit">
            {trigger.acknowledged && trigger.acknowledged_at && (
              <div className="text-xs text-center">
                <CheckCheck className="h-3 w-3 inline mr-1" />
                <span className="text-gray-600">
                  {formatRelativeTime(trigger.acknowledged_at)}
                </span>
              </div>
            )}
            {!trigger.acknowledged && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAcknowledge?.(trigger.id)}
              >
                Acknowledge
              </Button>
            )}
            {trigger.acknowledged && !trigger.resolved && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolve?.(trigger.id)}
              >
                Resolve
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDetails?.(trigger)}
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertHistory({ frameworkId, workspaceId }: AlertHistoryProps) {
  const [triggers, setTriggers] = useState<AlertTrigger[]>(MOCK_ALERT_TRIGGERS);
  const [selectedTrigger, setSelectedTrigger] = useState<AlertTrigger | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const unacknowledgedTriggers = useMemo(
    () => triggers.filter((t) => !t.acknowledged),
    [triggers]
  );

  const activeTriggers = useMemo(
    () => triggers.filter((t) => !t.resolved),
    [triggers]
  );

  const resolvedTriggers = useMemo(
    () => triggers.filter((t) => t.resolved),
    [triggers]
  );

  const filteredTriggers = useMemo(() => {
    let filtered = triggers;

    // Date filter
    if (dateFilter === '24h') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter((t) => new Date(t.triggered_at) > oneDayAgo);
    } else if (dateFilter === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((t) => new Date(t.triggered_at) > sevenDaysAgo);
    } else if (dateFilter === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((t) => new Date(t.triggered_at) > thirtyDaysAgo);
    }

    // Status filter
    if (statusFilter === 'unacknowledged') {
      filtered = filtered.filter((t) => !t.acknowledged);
    } else if (statusFilter === 'active') {
      filtered = filtered.filter((t) => !t.resolved);
    } else if (statusFilter === 'resolved') {
      filtered = filtered.filter((t) => t.resolved);
    }

    return filtered.sort(
      (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
    );
  }, [triggers, dateFilter, statusFilter]);

  const handleAcknowledge = (triggerId: string) => {
    setTriggers(
      triggers.map((t) =>
        t.id === triggerId
          ? {
              ...t,
              acknowledged: true,
              acknowledged_at: new Date().toISOString(),
            }
          : t
      )
    );
    logger.info(`[ALERTS] Acknowledged trigger: ${triggerId}`);
  };

  const handleResolve = (triggerId: string) => {
    setTriggers(
      triggers.map((t) =>
        t.id === triggerId
          ? {
              ...t,
              resolved: true,
              resolved_at: new Date().toISOString(),
            }
          : t
      )
    );
    logger.info(`[ALERTS] Resolved trigger: ${triggerId}`);
  };

  const unacknowledgedCount = unacknowledgedTriggers.length;
  const activeCount = activeTriggers.length;
  const resolvedCount = resolvedTriggers.length;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.length}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unacknowledgedCount}</div>
            <p className="text-xs text-gray-600">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeCount}</div>
            <p className="text-xs text-gray-600">Not resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <p className="text-xs text-gray-600">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Trigger History</CardTitle>
          <CardDescription>Timeline of all alert triggers with status tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Date Range</Label>
                <div className="flex gap-2 mt-2">
                  {['all', '24h', '7d', '30d'].map((range) => (
                    <Button
                      key={range}
                      size="sm"
                      variant={dateFilter === range ? 'default' : 'outline'}
                      onClick={() => setDateFilter(range)}
                    >
                      {range === 'all' ? 'All' : range}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Status</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'unacknowledged', label: 'Unacknowledged' },
                    { value: 'active', label: 'Active' },
                    { value: 'resolved', label: 'Resolved' },
                  ].map((status) => (
                    <Button
                      key={status.value}
                      size="sm"
                      variant={statusFilter === status.value ? 'default' : 'outline'}
                      onClick={() => setStatusFilter(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Alert Triggers List */}
            <ScrollArea className="h-[600px]">
              {filteredTriggers.length > 0 ? (
                <div className="pr-4">
                  {filteredTriggers.map((trigger) => (
                    <AlertTriggerCard
                      key={trigger.id}
                      trigger={trigger}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      onDetails={() => setSelectedTrigger(trigger)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-600">No alerts found with current filters</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {selectedTrigger && (
        <Dialog open={!!selectedTrigger} onOpenChange={() => setSelectedTrigger(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Alert Trigger Details</DialogTitle>
              <DialogDescription>
                {selectedTrigger.alert_rule?.metric_name} - {formatDate(selectedTrigger.triggered_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alert Type</p>
                  <Badge className={getAlertTypeColor(selectedTrigger.alert_rule?.alert_type || '')}>
                    {selectedTrigger.alert_rule?.alert_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge variant="outline">{getStatusLabel(selectedTrigger)}</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Condition</p>
                <p className="text-sm">
                  {selectedTrigger.alert_rule?.condition} {selectedTrigger.threshold_value}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Current Value</p>
                <p className="text-2xl font-bold">{selectedTrigger.current_value}</p>
              </div>

              {selectedTrigger.trigger_context?.change_percent && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Change</p>
                  <p className={selectedTrigger.trigger_context.change_percent < 0 ? 'text-red-600' : 'text-green-600'}>
                    {selectedTrigger.trigger_context.change_percent > 0 ? '+' : ''}{selectedTrigger.trigger_context.change_percent.toFixed(2)}%
                  </p>
                </div>
              )}

              {selectedTrigger.acknowledged_at && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Acknowledged</p>
                  <p className="text-sm">{formatDate(selectedTrigger.acknowledged_at)}</p>
                </div>
              )}

              {selectedTrigger.resolved_at && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Resolved</p>
                  <p className="text-sm">{formatDate(selectedTrigger.resolved_at)}</p>
                </div>
              )}

              {selectedTrigger.alert_rule?.description && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                  <p className="text-sm text-gray-700">{selectedTrigger.alert_rule.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              {!selectedTrigger.acknowledged && (
                <Button
                  onClick={() => {
                    handleAcknowledge(selectedTrigger.id);
                    setSelectedTrigger(null);
                  }}
                  className="flex-1"
                >
                  Acknowledge
                </Button>
              )}
              {selectedTrigger.acknowledged && !selectedTrigger.resolved && (
                <Button
                  onClick={() => {
                    handleResolve(selectedTrigger.id);
                    setSelectedTrigger(null);
                  }}
                  className="flex-1"
                >
                  Resolve
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedTrigger(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
