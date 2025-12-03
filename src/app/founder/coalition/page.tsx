'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoalitionStore } from '@/state/useCoalitionStore';
import { getCoalitionStatus, getCoalitionHistory } from '@/lib/coalition/coalitionClient';
import { CoalitionRolePanel } from '@/components/coalition/CoalitionRolePanel';
import { CoalitionSynergyPanel } from '@/components/coalition/CoalitionSynergyPanel';
import { CoalitionHistoryTimeline } from '@/components/coalition/CoalitionHistoryTimeline';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shield } from 'lucide-react';

type TabType = 'overview' | 'roles' | 'synergy' | 'history';

export default function CoalitionPage() {
  const { currentOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [pollingInterval, setPollingInterval] = useState(2000);

  const {
    setActiveCoalition,
    setCoalitionMembers,
    setRoleAssignments,
    setHistoricalCoalitions,
    setLoadingCoalition,
    setLoadingMembers,
    setLoadingHistory,
    setPollingActive,
    setErrorMessage,
    pollingActive,
    isCoalitionActive,
  } = useCoalitionStore();

  const workspaceId = currentOrganization?.org_id || '';

  // Fetch coalition status
  const fetchStatus = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoadingCoalition(true);
      const status = await getCoalitionStatus(workspaceId);

      if (status.hasActiveCoalition && status.coalition) {
        setActiveCoalition(status.coalition);
        setCoalitionMembers(status.memberDetails || []);
        setRoleAssignments(status.roleAssignments || []);
      } else {
        setActiveCoalition(null);
        setCoalitionMembers([]);
        setRoleAssignments([]);
      }

      setErrorMessage(null);
    } catch (error) {
      console.error('Error fetching coalition status:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to fetch coalition status'
      );
    } finally {
      setLoadingCoalition(false);
    }
  }, [workspaceId, setActiveCoalition, setCoalitionMembers, setRoleAssignments, setLoadingCoalition, setErrorMessage]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoadingHistory(true);
      const history = await getCoalitionHistory(workspaceId, 50);
      setHistoricalCoalitions(history.recentCoalitions || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [workspaceId, setHistoricalCoalitions, setLoadingHistory]);

  // Polling
  useEffect(() => {
    if (!pollingActive || !workspaceId) return;

    const timer = setInterval(async () => {
      await fetchStatus();
      setPollingInterval((prev) => Math.min(prev * 1.5, 20000));
    }, pollingInterval);

    return () => clearInterval(timer);
  }, [pollingActive, pollingInterval, workspaceId, fetchStatus]);

  // Initial fetch
  useEffect(() => {
    if (!workspaceId) return;

    fetchStatus();
    fetchHistory();
    setPollingActive(true);

    return () => setPollingActive(false);
  }, [workspaceId, fetchStatus, fetchHistory, setPollingActive]);

  const handleRefresh = async () => {
    setPollingInterval(2000);
    await fetchStatus();
    await fetchHistory();
  };

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  const coalitionActive = isCoalitionActive();

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-text-primary">
                Coalition Formation
              </h1>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Multi-agent coalition management and real-time monitoring
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Coalition Status Banner */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {coalitionActive ? '✓ Coalition Active' : '○ No Active Coalition'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>Real-time polling: {pollingInterval}ms</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex gap-8">
          {(['overview', 'roles', 'synergy', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 p-6 dark:bg-gray-950">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <CoalitionSynergyPanel workspaceId={workspaceId} />
          </div>
        )}
        {activeTab === 'roles' && <CoalitionRolePanel workspaceId={workspaceId} />}
        {activeTab === 'synergy' && <CoalitionSynergyPanel workspaceId={workspaceId} />}
        {activeTab === 'history' && <CoalitionHistoryTimeline workspaceId={workspaceId} />}
      </div>
    </div>
  );
}
