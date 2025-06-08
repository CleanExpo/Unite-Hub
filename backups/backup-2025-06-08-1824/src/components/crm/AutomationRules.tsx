'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ActionConfig {
  [key: string]: string | number | boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger_stage: { name: string };
  trigger_event: string;
  action_type: string;
  action_config: ActionConfig;
}

export default function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/crm/pipeline/automation');
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerEventLabels: Record<string, string> = {
    'stage_entered': 'Stage Entered',
    'stage_exited': 'Stage Exited',
    'deal_created': 'Deal Created'
  };

  const actionTypeLabels: Record<string, string> = {
    'assign_user': 'Assign User',
    'send_email': 'Send Email',
    'create_task': 'Create Task',
    'send_notification': 'Send Notification'
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading automation rules...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Automation Rules</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No automation rules found</p>
              <Button className="mt-4">Create your first rule</Button>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="font-medium">{rule.name}</div>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-gray-500">When</p>
                    <p>{triggerEventLabels[rule.trigger_event]}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Stage</p>
                    <p>{rule.trigger_stage?.name || 'Any'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Action</p>
                    <p>{actionTypeLabels[rule.action_type]}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
