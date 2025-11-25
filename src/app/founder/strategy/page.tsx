'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStrategyStore } from '@/state/useStrategyStore';
import {
  createStrategy,
  fetchStrategyStatus,
  fetchStrategyHistory,
  type StrategyCreateRequest,
} from '@/lib/strategy/strategyClient';
import { StrategyHierarchyPanel } from '@/components/strategy/StrategyHierarchyPanel';
import { StrategyValidationPanel } from '@/components/strategy/StrategyValidationPanel';
import { StrategySynergyBreakdown } from '@/components/strategy/StrategySynergyBreakdown';
import { StrategyHistoryTimeline } from '@/components/strategy/StrategyHistoryTimeline';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';

export default function StrategyPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState<StrategyCreateRequest>({
    workspaceId: '',
    coalitionId: '',
    objectiveTitle: '',
    objectiveDescription: '',
    context: '',
    priority: 'medium',
  });

  // Zustand store
  const {
    activeStrategy,
    validation,
    decompositionMetrics,
    historicalStrategies,
    pollingActive,
    pollingInterval,
    isLoadingStrategy,
    isLoadingValidation,
    isLoadingHistory,
    errorMessage,
    setActiveStrategy,
    setValidation,
    setDecompositionMetrics,
    setHistoricalStrategies,
    setPollingActive,
    setPollingInterval,
    setIsLoadingStrategy,
    setIsLoadingValidation,
    setIsLoadingHistory,
    setErrorMessage,
    isStrategyActive,
    getHierarchyHealth,
    getDecompositionQuality,
    getValidationStatus,
    getTotalItems,
    getRiskDistribution,
  } = useStrategyStore();

  // Initialize workspace
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get workspace from URL or session
        const url = new URL(window.location.href);
        const wsId = url.searchParams.get('workspaceId');

        if (wsId) {
          setWorkspaceId(wsId);
          setFormData((prev) => ({ ...prev, workspaceId: wsId }));
        } else {
          // Try to get default workspace
          const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .limit(1);

          if (workspaces?.[0]) {
            setWorkspaceId(workspaces[0].id);
            setFormData((prev) => ({ ...prev, workspaceId: workspaces[0].id }));
          }
        }
      } catch (error) {
        console.error('Error initializing workspace:', error);
      }
    };

    initWorkspace();
  }, []);

  // Polling logic for active strategy
  useEffect(() => {
    if (!workspaceId || !activeStrategy || !pollingActive) return;

    const interval = setInterval(async () => {
      try {
        const status = await fetchStrategyStatus(workspaceId, activeStrategy.id);
        if (status.strategy) {
          setActiveStrategy({
            ...activeStrategy,
            status: status.strategy.status as any,
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [
    workspaceId,
    activeStrategy,
    pollingActive,
    pollingInterval,
    setActiveStrategy,
  ]);

  // Load strategy history on mount
  useEffect(() => {
    if (!workspaceId) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const history = await fetchStrategyHistory(workspaceId, {}, session?.access_token);

        if (history.completedStrategies) {
          setHistoricalStrategies(
            history.completedStrategies.map((s) => ({
              id: s.id,
              outcome: s.outcome as 'successful' | 'partial_success' | 'failed',
              completionRate: s.completionRate,
              timeEfficiency: s.timeEfficiency,
              costEfficiency: s.costEfficiency,
              patterns: s.patterns,
              archivedAt: s.archivedAt,
            }))
          );
        }
      } catch (error) {
        console.error('Error loading history:', error);
        setErrorMessage('Failed to load strategy history');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [workspaceId, setHistoricalStrategies, setIsLoadingHistory, setErrorMessage]);

  // Handle strategy creation
  const handleCreateStrategy = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.workspaceId || !formData.coalitionId) {
        setCreateError('Workspace and Coalition are required');
        return;
      }

      setIsCreating(true);
      setCreateError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await createStrategy(formData, session?.access_token);

        if (response.success && response.strategy) {
          // Map response to StrategyHierarchy
          const strategy = {
            id: response.strategy.id,
            objectiveId: response.strategy.objectiveId,
            L1_Strategic_Objective: {
              level: 1 as const,
              title: 'Strategic Objective',
              description: formData.objectiveDescription || '',
              items: [],
            },
            L2_Strategic_Pillars: {
              level: 2 as const,
              title: 'Strategic Pillars',
              description: '',
              items: [],
            },
            L3_Strategic_Tactics: {
              level: 3 as const,
              title: 'Strategic Tactics',
              description: '',
              items: [],
            },
            L4_Operational_Tasks: {
              level: 4 as const,
              title: 'Operational Tasks',
              description: '',
              items: [],
            },
            hierarchyScore: response.strategy.hierarchyScore,
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
          };

          setActiveStrategy(strategy);
          setDecompositionMetrics(response.strategy.decompositionQuality);
          setShowCreateForm(false);
          setFormData({
            workspaceId: workspaceId || '',
            coalitionId: '',
            objectiveTitle: '',
            objectiveDescription: '',
            context: '',
            priority: 'medium',
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create strategy';
        setCreateError(message);
        setErrorMessage(message);
      } finally {
        setIsCreating(false);
      }
    },
    [formData, workspaceId, setActiveStrategy, setDecompositionMetrics, setErrorMessage]
  );

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const hierarchyHealth = getHierarchyHealth();
  const decompositionQuality = getDecompositionQuality();
  const validationStatus = getValidationStatus();
  const totalItems = getTotalItems();
  const riskDist = getRiskDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Strategy Planning
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Build, validate, and execute hierarchical strategies with multi-agent coordination
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Strategy
          </button>

          <button
            onClick={() => setPollingActive(!pollingActive)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              pollingActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${pollingActive ? 'animate-spin' : ''}`} />
            {pollingActive ? 'Polling' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
            <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Create Strategy Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Strategy
          </h2>

          <form onSubmit={handleCreateStrategy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objective Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.objectiveTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      objectiveTitle: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Launch Q4 Marketing Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Coalition ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.coalitionId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coalitionId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter coalition ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.objectiveDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    objectiveDescription: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe the objective..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Context
                </label>
                <input
                  type="text"
                  value={formData.context}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      context: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add context..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {createError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                {createError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Strategy'}
              </button>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Strategy Overview */}
      {activeStrategy && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Hierarchy Health
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {hierarchyHealth.toFixed(1)}%
                </div>
              </div>
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Items
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalItems}
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Critical Items
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {riskDist.critical}
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Decomposition Quality
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 capitalize">
                  {decompositionQuality}
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {activeStrategy ? (
            <>
              <StrategySynergyBreakdown
                metrics={decompositionMetrics}
                isLoading={isLoadingStrategy}
              />
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No Active Strategy
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new strategy to get started with hierarchical planning.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-6">
          {activeStrategy ? (
            <StrategyHierarchyPanel
              hierarchy={activeStrategy}
              isLoading={isLoadingStrategy}
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No Active Strategy
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new strategy to view its hierarchical decomposition.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <StrategyValidationPanel
            validation={validation}
            isLoading={isLoadingValidation}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <StrategyHistoryTimeline
            strategies={historicalStrategies}
            patterns={[]}
            isLoading={isLoadingHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
