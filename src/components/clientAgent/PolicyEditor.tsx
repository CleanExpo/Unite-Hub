'use client';

/**
 * Policy Editor
 * Phase 83: Edit agent policy settings
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Save,
  RotateCcw,
} from 'lucide-react';

interface Policy {
  id: string;
  agent_enabled: boolean;
  allowed_actions: string[];
  auto_exec_enabled: boolean;
  auto_exec_risk_threshold: 'low' | 'medium' | 'high';
  max_actions_per_day: number;
  require_human_review_above_score: number;
  respect_early_warnings: boolean;
  pause_on_high_severity_warning: boolean;
}

interface PolicyEditorProps {
  policy: Policy;
  onSave: (policy: Partial<Policy>) => void;
  onReset?: () => void;
  isSaving?: boolean;
  className?: string;
}

const ALL_ACTIONS = [
  { value: 'send_followup', label: 'Send Followup' },
  { value: 'update_status', label: 'Update Status' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'remove_tag', label: 'Remove Tag' },
  { value: 'schedule_task', label: 'Schedule Task' },
  { value: 'generate_content', label: 'Generate Content' },
  { value: 'update_score', label: 'Update Score' },
  { value: 'create_note', label: 'Create Note' },
  { value: 'send_notification', label: 'Send Notification' },
];

export function PolicyEditor({
  policy,
  onSave,
  onReset,
  isSaving = false,
  className = '',
}: PolicyEditorProps) {
  const [localPolicy, setLocalPolicy] = useState<Policy>(policy);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePolicy = (updates: Partial<Policy>) => {
    setLocalPolicy(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const toggleAction = (action: string) => {
    const current = localPolicy.allowed_actions;
    const updated = current.includes(action)
      ? current.filter(a => a !== action)
      : [...current, action];
    updatePolicy({ allowed_actions: updated });
  };

  const handleSave = () => {
    onSave(localPolicy);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPolicy(policy);
    setHasChanges(false);
    onReset?.();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Agent Policy Settings
          {hasChanges && (
            <Badge variant="secondary" className="ml-auto">
              Unsaved
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent enabled */}
        <div className="flex items-center justify-between">
          <Label htmlFor="agent-enabled">Agent Enabled</Label>
          <Switch
            id="agent-enabled"
            checked={localPolicy.agent_enabled}
            onCheckedChange={checked => updatePolicy({ agent_enabled: checked })}
          />
        </div>

        {/* Auto-execution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-exec">Auto-Execute Actions</Label>
            <Switch
              id="auto-exec"
              checked={localPolicy.auto_exec_enabled}
              onCheckedChange={checked => updatePolicy({ auto_exec_enabled: checked })}
            />
          </div>

          {localPolicy.auto_exec_enabled && (
            <div className="ml-4 space-y-2">
              <Label className="text-xs">Max Risk Level for Auto-Exec</Label>
              <Select
                value={localPolicy.auto_exec_risk_threshold}
                onValueChange={value =>
                  updatePolicy({ auto_exec_risk_threshold: value as Policy['auto_exec_risk_threshold'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low only</SelectItem>
                  <SelectItem value="medium">Low + Medium</SelectItem>
                  <SelectItem value="high">All (not recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Allowed actions */}
        <div className="space-y-2">
          <Label>Allowed Actions</Label>
          <div className="flex flex-wrap gap-1">
            {ALL_ACTIONS.map(action => (
              <Badge
                key={action.value}
                variant={localPolicy.allowed_actions.includes(action.value) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleAction(action.value)}
              >
                {action.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="max-actions" className="text-xs">
              Max Actions/Day
            </Label>
            <Input
              id="max-actions"
              type="number"
              min={1}
              max={100}
              value={localPolicy.max_actions_per_day}
              onChange={e =>
                updatePolicy({ max_actions_per_day: parseInt(e.target.value) || 10 })
              }
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="review-score" className="text-xs">
              Review Above Score
            </Label>
            <Input
              id="review-score"
              type="number"
              min={0}
              max={100}
              value={localPolicy.require_human_review_above_score}
              onChange={e =>
                updatePolicy({ require_human_review_above_score: parseInt(e.target.value) || 70 })
              }
            />
          </div>
        </div>

        {/* Early warning settings */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="respect-warnings" className="text-xs">
              Respect Early Warnings
            </Label>
            <Switch
              id="respect-warnings"
              checked={localPolicy.respect_early_warnings}
              onCheckedChange={checked =>
                updatePolicy({ respect_early_warnings: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pause-high" className="text-xs">
              Pause on High Severity
            </Label>
            <Switch
              id="pause-high"
              checked={localPolicy.pause_on_high_severity_warning}
              onCheckedChange={checked =>
                updatePolicy({ pause_on_high_severity_warning: checked })
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {onReset && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
