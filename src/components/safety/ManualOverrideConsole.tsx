'use client';

/**
 * ManualOverrideConsole - Founder-only safety override controls
 *
 * Provides 6 override actions:
 * - unblock_agent: Unblock a specific agent
 * - unpause_orchestrator: Resume orchestrator operations
 * - resume_autonomy: Re-enable global autonomy
 * - clear_validation_mode: Disable validation mode requirement
 * - clear_throttle: Remove throttling
 * - full_reset: Clear all enforcement states
 *
 * All overrides require:
 * - Reason/justification
 * - Confirmation modal
 * - Audit logging
 * - Safety gate check
 */

import React, { useState } from 'react';
import { Terminal, Lock, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

export interface OverrideAction {
  type: 'unblock_agent' | 'unpause_orchestrator' | 'resume_autonomy' | 'clear_validation_mode' | 'clear_throttle' | 'full_reset';
  label: string;
  description: string;
  requiresTarget: boolean;
  severity: number;
}

interface ManualOverrideConsoleProps {
  onExecuteOverride?: (action: string, reason: string, target?: string) => Promise<void>;
  isLoading?: boolean;
}

const OVERRIDE_ACTIONS: OverrideAction[] = [
  {
    type: 'unblock_agent',
    label: 'Unblock Agent',
    description: 'Allow a blocked agent to resume operations',
    requiresTarget: true,
    severity: 3,
  },
  {
    type: 'unpause_orchestrator',
    label: 'Resume Orchestrator',
    description: 'Resume orchestrator workflow scheduling',
    requiresTarget: false,
    severity: 3,
  },
  {
    type: 'resume_autonomy',
    label: 'Resume Autonomy',
    description: 'Re-enable global autonomy engine',
    requiresTarget: false,
    severity: 4,
  },
  {
    type: 'clear_validation_mode',
    label: 'Clear Validation Mode',
    description: 'Disable validation-mode requirement for approvals',
    requiresTarget: false,
    severity: 2,
  },
  {
    type: 'clear_throttle',
    label: 'Clear Throttle',
    description: 'Remove request throttling',
    requiresTarget: false,
    severity: 2,
  },
  {
    type: 'full_reset',
    label: 'Full System Reset',
    description: 'Clear all enforcement states and return to normal',
    requiresTarget: false,
    severity: 5,
  },
];

export const ManualOverrideConsole: React.FC<ManualOverrideConsoleProps> = ({
  onExecuteOverride,
  isLoading = false,
}) => {
  const [selectedAction, setSelectedAction] = useState<OverrideAction | null>(null);
  const [reason, setReason] = useState('');
  const [targetAgent, setTargetAgent] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [executionInProgress, setExecutionInProgress] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleExecuteOverride = async () => {
    if (!selectedAction || !reason.trim()) {
      alert('Please provide a reason for the override');
      return;
    }

    if (selectedAction.requiresTarget && !targetAgent.trim()) {
      alert('Please specify the target agent');
      return;
    }

    setExecutionInProgress(true);
    try {
      if (onExecuteOverride) {
        await onExecuteOverride(selectedAction.type, reason, targetAgent);
      }
      setExecutionResult({ success: true, message: 'Override executed successfully' });
      setTimeout(() => {
        setShowConfirmation(false);
        setSelectedAction(null);
        setReason('');
        setTargetAgent('');
        setExecutionResult(null);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Override execution failed';
      setExecutionResult({ success: false, message });
    } finally {
      setExecutionInProgress(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-300';
    if (severity >= 4) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-300';
    if (severity >= 3) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-300';
    return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Manual Override Console</h3>
        <span className="ml-auto text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
          <Lock className="w-4 h-4" />
          Founder Only
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Use these override controls only when necessary. All actions are logged for audit purposes.
        </p>

        {/* Override actions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {OVERRIDE_ACTIONS.map(action => (
            <button
              key={action.type}
              onClick={() => {
                setSelectedAction(action);
                setShowConfirmation(true);
              }}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md text-left ${
                selectedAction?.type === action.type
                  ? getSeverityColor(action.severity) + ' border-current'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Override Confirmation Dialog */}
      {showConfirmation && selectedAction && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirm Override
              </h2>
            </div>

            {executionResult ? (
              <div className={`p-4 rounded-lg border ${
                executionResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {executionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <p className={executionResult.success ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}>
                    {executionResult.message}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
                  <p className="text-sm text-orange-900 dark:text-orange-300">
                    <span className="font-semibold">{selectedAction.label}</span> - {selectedAction.description}
                  </p>
                </div>

                {selectedAction.requiresTarget && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Target Agent
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., orchestrator, reasoning-engine"
                      value={targetAgent}
                      onChange={(e) => setTargetAgent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Reason for Override
                  </label>
                  <textarea
                    placeholder="Explain why this override is necessary..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 h-24 resize-none"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-semibold mb-1">⚠️ Important:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>All overrides are logged for audit purposes</li>
                    <li>Override may re-enable dangerous system states</li>
                    <li>Monitor system closely after override execution</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setExecutionResult(null);
                    }}
                    disabled={executionInProgress}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteOverride}
                    disabled={executionInProgress || !reason.trim() || (selectedAction.requiresTarget && !targetAgent.trim())}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {executionInProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Execute Override
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
