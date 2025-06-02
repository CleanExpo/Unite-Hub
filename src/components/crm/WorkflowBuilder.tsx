"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ArrowRight, Clock, Filter } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';

interface WorkflowTrigger {
  trigger_type: string;
  trigger_config: Record<string, any>;
}

interface WorkflowCondition {
  condition_type: string;
  field_name: string;
  operator: string;
  value: any;
  logical_operator?: 'AND' | 'OR';
  order_index?: number;
}

interface WorkflowAction {
  action_type: string;
  action_config: Record<string, any>;
  order_index?: number;
  delay_minutes?: number;
}

interface WorkflowTemplate {
  id?: string;
  name: string;
  description?: string;
  trigger_type: string;
  is_active: boolean;
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

const TRIGGER_TYPES = [
  { value: 'deal_stage_change', label: 'Deal Stage Changed' },
  { value: 'task_status_change', label: 'Task Status Changed' },
  { value: 'client_created', label: 'New Client Created' },
  { value: 'project_status_change', label: 'Project Status Changed' }
];

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' }
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_field', label: 'Update Field' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'create_activity', label: 'Create Activity' },
  { value: 'assign_user', label: 'Assign User' }
];

export default function WorkflowBuilder({ workflowId }: { workflowId?: string }) {
  const [workflow, setWorkflow] = useState<WorkflowTemplate>({
    name: '',
    description: '',
    trigger_type: 'deal_stage_change',
    is_active: true,
    triggers: [{
      trigger_type: 'deal_stage_change',
      trigger_config: { from_stage: '', to_stage: '' }
    }],
    conditions: [],
    actions: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow();
    }
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/crm/workflows/${workflowId}`);
      setWorkflow(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (workflowId) {
        await apiClient.put(`/api/crm/workflows/${workflowId}`, workflow);
        toast({
          title: 'Success',
          description: 'Workflow updated successfully'
        });
      } else {
        await apiClient.post('/api/crm/workflows', workflow);
        toast({
          title: 'Success',
          description: 'Workflow created successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTriggerConfig = (key: string, value: string) => {
    setWorkflow(prev => ({
      ...prev,
      triggers: [{
        ...prev.triggers[0],
        trigger_config: {
          ...prev.triggers[0].trigger_config,
          [key]: value
        }
      }]
    }));
  };

  const addCondition = () => {
    setWorkflow(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          condition_type: 'field_equals',
          field_name: '',
          operator: 'equals',
          value: '',
          logical_operator: prev.conditions.length > 0 ? 'AND' : undefined,
          order_index: prev.conditions.length
        }
      ]
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setWorkflow(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => 
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const removeCondition = (index: number) => {
    setWorkflow(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    setWorkflow(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          action_type: 'send_email',
          action_config: {},
          order_index: prev.actions.length,
          delay_minutes: 0
        }
      ]
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setWorkflow(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const updateActionConfig = (index: number, key: string, value: any) => {
    setWorkflow(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? {
          ...action,
          action_config: { ...action.action_config, [key]: value }
        } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setWorkflow(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>
            Configure the basic settings for your workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              placeholder="e.g., Follow up on new leads"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={workflow.description || ''}
              onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
              placeholder="Describe what this workflow does..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={workflow.is_active}
              onCheckedChange={(checked) => setWorkflow({ ...workflow, is_active: checked })}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger</CardTitle>
          <CardDescription>
            Choose when this workflow should run
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Trigger Type</Label>
            <Select
              value={workflow.trigger_type}
              onValueChange={(value) => {
                setWorkflow({
                  ...workflow,
                  trigger_type: value,
                  triggers: [{
                    trigger_type: value,
                    trigger_config: {}
                  }]
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {workflow.trigger_type === 'deal_stage_change' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Stage</Label>
                <Input
                  value={workflow.triggers[0]?.trigger_config.from_stage || ''}
                  onChange={(e) => updateTriggerConfig('from_stage', e.target.value)}
                  placeholder="e.g., lead"
                />
              </div>
              <div>
                <Label>To Stage</Label>
                <Input
                  value={workflow.triggers[0]?.trigger_config.to_stage || ''}
                  onChange={(e) => updateTriggerConfig('to_stage', e.target.value)}
                  placeholder="e.g., qualified"
                />
              </div>
            </div>
          )}

          {workflow.trigger_type === 'task_status_change' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Status</Label>
                <Input
                  value={workflow.triggers[0]?.trigger_config.from_status || ''}
                  onChange={(e) => updateTriggerConfig('from_status', e.target.value)}
                  placeholder="e.g., pending"
                />
              </div>
              <div>
                <Label>To Status</Label>
                <Input
                  value={workflow.triggers[0]?.trigger_config.to_status || ''}
                  onChange={(e) => updateTriggerConfig('to_status', e.target.value)}
                  placeholder="e.g., completed"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
          <CardDescription>
            Add conditions to filter when the workflow should execute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflow.conditions.map((condition, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              {index > 0 && (
                <Select
                  value={condition.logical_operator || 'AND'}
                  onValueChange={(value) => updateCondition(index, 'logical_operator', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Field</Label>
                  <Input
                    value={condition.field_name}
                    onChange={(e) => updateCondition(index, 'field_name', e.target.value)}
                    placeholder="e.g., deal_value"
                  />
                </div>
                
                <div>
                  <Label>Operator</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Value</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Value to compare"
                  />
                </div>
              </div>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeCondition(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addCondition}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Define what should happen when the workflow runs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflow.actions.map((action, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">Action {index + 1}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeAction(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action Type</Label>
                  <Select
                    value={action.action_type}
                    onValueChange={(value) => updateAction(index, 'action_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Delay (minutes)</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      value={action.delay_minutes || 0}
                      onChange={(e) => updateAction(index, 'delay_minutes', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Action-specific configuration */}
              {action.action_type === 'send_email' && (
                <div className="space-y-4">
                  <div>
                    <Label>To</Label>
                    <Input
                      value={action.action_config.to || ''}
                      onChange={(e) => updateActionConfig(index, 'to', e.target.value)}
                      placeholder="Email address or {{client_email}}"
                    />
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={action.action_config.subject || ''}
                      onChange={(e) => updateActionConfig(index, 'subject', e.target.value)}
                      placeholder="Email subject - use {{variables}}"
                    />
                  </div>
                  <div>
                    <Label>Body</Label>
                    <Textarea
                      value={action.action_config.body || ''}
                      onChange={(e) => updateActionConfig(index, 'body', e.target.value)}
                      placeholder="Email body - use {{variables}} for dynamic content"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {action.action_type === 'create_task' && (
                <div className="space-y-4">
                  <div>
                    <Label>Task Title</Label>
                    <Input
                      value={action.action_config.title || ''}
                      onChange={(e) => updateActionConfig(index, 'title', e.target.value)}
                      placeholder="Task title - use {{variables}}"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={action.action_config.description || ''}
                      onChange={(e) => updateActionConfig(index, 'description', e.target.value)}
                      placeholder="Task description"
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={action.action_config.priority || 'medium'}
                      onValueChange={(value) => updateActionConfig(index, 'priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {action.action_type === 'send_notification' && (
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={action.action_config.title || ''}
                      onChange={(e) => updateActionConfig(index, 'title', e.target.value)}
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={action.action_config.message || ''}
                      onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                      placeholder="Notification message"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addAction}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Workflow'}
        </Button>
      </div>
    </div>
  );
}
