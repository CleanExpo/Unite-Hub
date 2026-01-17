'use client';

/**
 * Founder Safety Command Center Dashboard
 *
 * Real-time visibility and control center for the global predictive safety system.
 * Provides:
 * - Live safety status with color-coded risk levels
 * - Cascade failure risk matrix with agent interdependencies
 * - Top predictions with recommended interventions
 * - Intervention ledger with historical actions
 * - Real-time event feed with severity filtering
 * - One-click intervention controls
 */

import React, { useEffect, useState } from 'react';
import { Shield, Power, AlertTriangle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSafetyStore } from '@/lib/stores/useSafetyStore';
import { SafetyStatusBeacon } from '@/components/safety/SafetyStatusBeacon';
import { SafetyPredictionPanel } from '@/components/safety/SafetyPredictionPanel';
import { CascadeRiskMatrix } from '@/components/safety/CascadeRiskMatrix';
import { SafetyLedgerTable } from '@/components/safety/SafetyLedgerTable';
import { SafetySignalFeed } from '@/components/safety/SafetySignalFeed';

export default function FounderSafetyPage() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [interventionInProgress, setInterventionInProgress] = useState(false);
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [interventionAction, setInterventionAction] = useState('halt_autonomy');
  const [interventionReason, setInterventionReason] = useState('');

  const {
    status,
    startPolling,
    stopPolling,
    executeIntervention,
    error: storeError,
    clearError,
  } = useSafetyStore();

  // Initialize and verify access
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Get user's workspace
        const { data: orgs } = await supabase
          .from('user_organizations')
          .select('org_id, role')
          .eq('user_id', user.id);

        if (!orgs || orgs.length === 0) {
          router.push('/dashboard');
          return;
        }

        // Verify owner role
        const ownerOrg = orgs.find(o => o.role === 'owner');
        if (!ownerOrg) {
          // Non-owners redirect to main dashboard
          router.push('/dashboard');
          return;
        }

        setIsOwner(true);

        // Get workspace
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id')
          .eq('org_id', ownerOrg.org_id)
          .limit(1);

        if (workspaces && workspaces.length > 0) {
          const wsId = workspaces[0].id;
          setWorkspaceId(wsId);

          // Start polling
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            startPolling(wsId, session.access_token);
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        router.push('/dashboard');
      }
    };

    initialize();

    return () => {
      stopPolling();
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-raised">
        <div className="text-center">
          <Shield className="w-12 h-12 text-info-600 dark:text-info-400 mx-auto mb-4 animate-pulse" />
          <p className="text-text-secondary">Initializing Safety Command Center...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-raised">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-accent-600 dark:text-accent-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary">
            Only workspace owners can access the Safety Command Center
          </p>
        </div>
      </div>
    );
  }

  const handleExecuteIntervention = async () => {
    if (!interventionReason.trim()) {
      alert('Please provide a reason for the intervention');
      return;
    }

    setInterventionInProgress(true);
    try {
      await executeIntervention(interventionAction, interventionReason);
      setShowInterventionDialog(false);
      setInterventionReason('');
      setInterventionAction('halt_autonomy');
    } catch (err) {
      console.error('Intervention error:', err);
    } finally {
      setInterventionInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-raised">
      {/* Header */}
      <div className="border-b border-border-subtle bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-info-600 dark:text-info-400" />
              <h1 className="text-3xl font-bold text-text-primary">
                Founder Safety Command Center
              </h1>
            </div>
            <button
              onClick={() => setShowInterventionDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg font-medium transition-colors"
            >
              <Power className="w-4 h-4" />
              Execute Intervention
            </button>
          </div>
          <p className="text-text-secondary mt-2">
            Real-time visibility and control for global autonomous safety
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {storeError && (
          <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-start justify-between">
            <div>
              <p className="font-medium text-error-900 dark:text-error-300">Error</p>
              <p className="text-sm text-error-800 dark:text-error-400">{storeError}</p>
            </div>
            <button
              onClick={clearError}
              className="text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status Beacon */}
        <div className="mb-8">
          <SafetyStatusBeacon />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Predictions and Events */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
              <SafetyPredictionPanel />
            </div>

            <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
              <SafetySignalFeed />
            </div>
          </div>

          {/* Right Column: Cascade Risk */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6 h-fit">
            <CascadeRiskMatrix />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
          <SafetyLedgerTable />
        </div>
      </div>

      {/* Intervention Dialog */}
      {showInterventionDialog && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-lg border border-border-subtle max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              Execute Intervention
            </h2>

            <p className="text-sm text-text-secondary">
              Select an intervention action and provide a reason. This action will be immediately recorded in the safety ledger.
            </p>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Action
              </label>
              <select
                value={interventionAction}
                onChange={(e) => setInterventionAction(e.target.value)}
                className="w-full px-3 py-2 border border-border-base rounded-lg bg-bg-input text-text-primary"
              >
                <option value="throttle">Throttle Operations</option>
                <option value="pause_workflow">Pause Workflow</option>
                <option value="require_approval">Require Approval</option>
                <option value="block_agent">Block Agent</option>
                <option value="halt_autonomy">Halt Autonomy (Emergency)</option>
                <option value="override">Override Execution</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reason (Required)
              </label>
              <textarea
                value={interventionReason}
                onChange={(e) => setInterventionReason(e.target.value)}
                placeholder="Explain why this intervention is necessary..."
                className="w-full px-3 py-2 border border-border-base rounded-lg bg-bg-input text-text-primary placeholder-gray-400 dark:placeholder-gray-500 h-24"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInterventionDialog(false)}
                disabled={interventionInProgress}
                className="flex-1 px-4 py-2 border border-border-base rounded-lg text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteIntervention}
                disabled={interventionInProgress || !interventionReason.trim()}
                className="flex-1 px-4 py-2 bg-error-600 hover:bg-error-700 disabled:bg-error-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {interventionInProgress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Execute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
