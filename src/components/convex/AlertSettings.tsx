/**
 * Alert Settings Component
 *
 * Manages alert configuration for framework monitoring:
 * - Threshold-based alerts
 * - Performance degradation alerts
 * - Anomaly alerts
 * - Milestone alerts
 * - Notification channel selection
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  Target,
  Mail,
  MessageSquare,
  Slack,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface AlertRule {
  id: string;
  type: 'threshold' | 'anomaly' | 'performance' | 'milestone';
  metric: string;
  condition: 'above' | 'below' | 'equals' | 'changes_by';
  threshold: number;
  notificationChannels: ('email' | 'in-app' | 'slack')[];
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface AlertSettingsProps {
  frameworkId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock alert rules for development
const MOCK_ALERT_RULES: AlertRule[] = [
  {
    id: 'alert_1',
    type: 'threshold',
    metric: 'effectiveness_score',
    condition: 'below',
    threshold: 70,
    notificationChannels: ['email', 'in-app'],
    enabled: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    triggerCount: 3,
  },
  {
    id: 'alert_2',
    type: 'performance',
    metric: 'adoption_rate',
    condition: 'below',
    threshold: 50,
    notificationChannels: ['email'],
    enabled: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: undefined,
    triggerCount: 0,
  },
  {
    id: 'alert_3',
    type: 'anomaly',
    metric: 'usage_drop',
    condition: 'changes_by',
    threshold: 30,
    notificationChannels: ['email', 'in-app', 'slack'],
    enabled: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    triggerCount: 1,
  },
  {
    id: 'alert_4',
    type: 'milestone',
    metric: 'user_count',
    condition: 'above',
    threshold: 100,
    notificationChannels: ['in-app'],
    enabled: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: undefined,
    triggerCount: 0,
  },
];

function getAlertTypeIcon(type: string) {
  switch (type) {
    case 'threshold':
      return <Target className="h-4 w-4" />;
    case 'anomaly':
      return <AlertTriangle className="h-4 w-4" />;
    case 'performance':
      return <TrendingDown className="h-4 w-4" />;
    case 'milestone':
      return <Bell className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getAlertTypeColor(type: string): string {
  switch (type) {
    case 'threshold':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900';
    case 'anomaly':
      return 'bg-red-100 text-red-800 dark:bg-red-900';
    case 'performance':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900';
    case 'milestone':
      return 'bg-green-100 text-green-800 dark:bg-green-900';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700';
  }
}

function getConditionLabel(condition: string): string {
  switch (condition) {
    case 'above':
      return 'Above';
    case 'below':
      return 'Below';
    case 'equals':
      return 'Equals';
    case 'changes_by':
      return 'Changes by';
    default:
      return condition;
  }
}

function AlertRuleCard({ rule, onEdit, onDelete }: { rule: AlertRule; onEdit: () => void; onDelete: () => void }) {
  const isRecent = rule.lastTriggered ? Date.now() - new Date(rule.lastTriggered).getTime() < 24 * 60 * 60 * 1000 : false;

  return (
    <Card className={`${rule.enabled ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1 text-muted-foreground">{getAlertTypeIcon(rule.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{rule.metric.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                <Badge className={getAlertTypeColor(rule.type)} variant="outline">
                  {rule.type}
                </Badge>
                {rule.enabled ? (
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                Alert when {rule.metric} is {getConditionLabel(rule.condition)} {rule.threshold}
              </CardDescription>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Notification Channels */}
        <div>
          <div className="text-xs font-semibold mb-2 text-muted-foreground">Notification Channels</div>
          <div className="flex gap-2 flex-wrap">
            {rule.notificationChannels.includes('email') && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Badge>
            )}
            {rule.notificationChannels.includes('in-app') && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                In-App
              </Badge>
            )}
            {rule.notificationChannels.includes('slack') && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Slack className="h-3 w-3" />
                Slack
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Triggers</div>
            <div className="text-lg font-bold">{rule.triggerCount}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Last Triggered</div>
            <div className="text-sm font-semibold">
              {rule.lastTriggered ? (
                <>
                  {isRecent && <span className="text-red-600">🔴 </span>}
                  {new Date(rule.lastTriggered).toLocaleDateString()}
                </>
              ) : (
                'Never'
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-sm font-semibold">{new Date(rule.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertSettings({ frameworkId, workspaceId, isOpen, onClose }: AlertSettingsProps) {
  const [rules, setRules] = useState<AlertRule[]>(MOCK_ALERT_RULES);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newRule, setNewRule] = useState({
    metric: 'effectiveness_score',
    condition: 'below' as const,
    threshold: 70,
    channels: ['email'] as ('email' | 'in-app' | 'slack')[],
  });

  const activeRules = useMemo(() => rules.filter((r) => r.enabled), [rules]);
  const recentTriggers = useMemo(
    () =>
      rules
        .filter((r) => r.lastTriggered)
        .sort((a, b) => new Date(b.lastTriggered!).getTime() - new Date(a.lastTriggered!).getTime())
        .slice(0, 5),
    [rules]
  );

  const handleAddRule = () => {
    const rule: AlertRule = {
      id: `alert_${Date.now()}`,
      type: 'threshold',
      metric: newRule.metric,
      condition: newRule.condition,
      threshold: newRule.threshold,
      notificationChannels: newRule.channels,
      enabled: true,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };
    setRules([...rules, rule]);
    setShowNewForm(false);
    logger.info('[ALERTS] New alert rule created');
  };

  const handleToggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    logger.info('[ALERTS] Alert rule deleted');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alert Settings</DialogTitle>
          <DialogDescription>
            Configure alerts and notifications for framework performance monitoring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-blue-600">{rules.length}</div>
                <div className="text-sm text-muted-foreground">Total Rules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">{activeRules.length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-orange-600">
                  {rules.reduce((sum, r) => sum + r.triggerCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Triggers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-purple-600">{recentTriggers.length}</div>
                <div className="text-sm text-muted-foreground">Recent (24h)</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="all-rules" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-rules">All Rules ({rules.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeRules.length})</TabsTrigger>
              <TabsTrigger value="recent">Recent Triggers ({recentTriggers.length})</TabsTrigger>
            </TabsList>

            {/* All Rules */}
            <TabsContent value="all-rules" className="space-y-3 mt-4">
              <Button onClick={() => setShowNewForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Alert Rule
              </Button>

              {/* New Rule Form */}
              {showNewForm && (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-base">Create New Alert Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Metric</Label>
                        <Input
                          value={newRule.metric}
                          onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                          placeholder="e.g., effectiveness_score"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Threshold</Label>
                        <Input
                          type="number"
                          value={newRule.threshold}
                          onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Channels</Label>
                      <div className="space-y-2 mt-2">
                        {(['email', 'in-app', 'slack'] as const).map((channel) => (
                          <label key={channel} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={newRule.channels.includes(channel)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewRule({
                                    ...newRule,
                                    channels: [...newRule.channels, channel],
                                  });
                                } else {
                                  setNewRule({
                                    ...newRule,
                                    channels: newRule.channels.filter((c) => c !== channel),
                                  });
                                }
                              }}
                            />
                            <span className="text-sm capitalize">{channel}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowNewForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddRule}>
                        Create Rule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rules List */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <AlertRuleCard
                      key={rule.id}
                      rule={rule}
                      onEdit={() => logger.info('[ALERTS] Edit rule')}
                      onDelete={() => handleDeleteRule(rule.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Active Rules */}
            <TabsContent value="active" className="space-y-3 mt-4">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {activeRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active alert rules
                    </div>
                  ) : (
                    activeRules.map((rule) => (
                      <AlertRuleCard
                        key={rule.id}
                        rule={rule}
                        onEdit={() => logger.info('[ALERTS] Edit rule')}
                        onDelete={() => handleDeleteRule(rule.id)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Recent Triggers */}
            <TabsContent value="recent" className="space-y-3 mt-4">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {recentTriggers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent alert triggers
                    </div>
                  ) : (
                    recentTriggers.map((rule) => (
                      <Card key={rule.id} className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3 justify-between">
                            <div>
                              <div className="font-semibold">
                                {rule.metric.replace(/_/g, ' ').toUpperCase()} Alert Triggered
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-orange-600">
                              {rule.triggerCount} time{rule.triggerCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
