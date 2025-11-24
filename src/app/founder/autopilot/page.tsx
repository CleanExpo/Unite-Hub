'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, List, Settings, LayoutDashboard } from 'lucide-react';
import {
  AutopilotOverview,
  AutopilotPlaybookList,
  AutopilotActionBoard,
  AutopilotPreferencesEditor
} from '@/components/autopilot';
import type {
  AutopilotStats,
  AutopilotPreferences,
  AutopilotPlaybook,
  AutopilotAction
} from '@/lib/autopilot';

export default function FounderAutopilotPage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [stats, setStats] = useState<AutopilotStats>({
    totalPlaybooks: 0,
    totalActions: 0,
    autoExecuted: 0,
    approvedExecuted: 0,
    awaitingApproval: 0,
  });
  const [preferences, setPreferences] = useState<AutopilotPreferences | null>(null);
  const [playbooks, setPlaybooks] = useState<AutopilotPlaybook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [actions, setActions] = useState<AutopilotAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;

    setIsLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      // Fetch stats, preferences, and playbooks in parallel
      const [statsRes, prefsRes, playbooksRes] = await Promise.all([
        fetch(`/api/autopilot/stats?workspaceId=${workspaceId}`, { headers }),
        fetch(`/api/autopilot/preferences?workspaceId=${workspaceId}`, { headers }),
        fetch(`/api/autopilot/playbooks?workspaceId=${workspaceId}`, { headers }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPreferences(data.preferences);
      }

      if (playbooksRes.ok) {
        const data = await playbooksRes.json();
        setPlaybooks(data.playbooks || []);
      }
    } catch (error) {
      console.error('Failed to fetch autopilot data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectPlaybook = async (playbookId: string) => {
    if (!session?.access_token || !workspaceId) return;

    setSelectedPlaybook(playbookId);

    try {
      const response = await fetch(
        `/api/autopilot/playbooks?workspaceId=${workspaceId}&playbookId=${playbookId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Failed to fetch playbook actions:', error);
    }
  };

  const handleGeneratePlaybook = async () => {
    if (!session?.access_token || !workspaceId) return;

    try {
      const response = await fetch(
        `/api/autopilot/playbooks?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPlaybooks(prev => [data.playbook, ...prev]);
        setSelectedPlaybook(data.playbook.id);
        setActions(data.actions || []);
        fetchData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to generate playbook:', error);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        `/api/autopilot/actions/${actionId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh actions
        if (selectedPlaybook) {
          handleSelectPlaybook(selectedPlaybook);
        }
        fetchData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  const handleSkipAction = async (actionId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        `/api/autopilot/actions/${actionId}/skip`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh actions
        if (selectedPlaybook) {
          handleSelectPlaybook(selectedPlaybook);
        }
        fetchData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to skip action:', error);
    }
  };

  const handleSavePreferences = async (updates: Partial<AutopilotPreferences>) => {
    if (!session?.access_token || !workspaceId) return;

    try {
      const response = await fetch(
        `/api/autopilot/preferences?workspaceId=${workspaceId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  if (!workspaceId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Please select a workspace to view autopilot settings.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Founder Autopilot</h1>
          <p className="text-muted-foreground">
            Your weekly operating system that plans, prioritises, and executes
          </p>
        </div>
      </div>

      <AutopilotOverview stats={stats} preferences={preferences} />

      <Tabs defaultValue="playbooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="playbooks" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Playbooks
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks">
          <AutopilotPlaybookList
            playbooks={playbooks}
            onSelect={handleSelectPlaybook}
            onGenerate={handleGeneratePlaybook}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="actions">
          {selectedPlaybook ? (
            <AutopilotActionBoard
              actions={actions}
              onApprove={handleApproveAction}
              onSkip={handleSkipAction}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a playbook to view its actions
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <AutopilotPreferencesEditor
            preferences={preferences}
            onSave={handleSavePreferences}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
