'use client';

/**
 * CascadeRiskMatrix - Agent-to-agent impact visualization
 *
 * Shows:
 * - Vulnerable agents at risk
 * - Deadlocked agents (circular dependencies)
 * - Cascade factors contributing to risk
 * - Active failure chains
 */

import React from 'react';
import { Network, AlertTriangle, Lock } from 'lucide-react';
import { useSafetyStore } from '@/lib/stores/useSafetyStore';

export const CascadeRiskMatrix: React.FC = () => {
  const {
    cascade,
    isLoading,
  } = useSafetyStore();

  if (isLoading && !cascade) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-text-secondary">Loading cascade analysis...</p>
      </div>
    );
  }

  if (!cascade) {
    return (
      <div className="flex items-center justify-center p-8 text-text-secondary">
        No cascade data available
      </div>
    );
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    if (severity >= 4) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';
    if (severity >= 3) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';
    return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
  };

  const getSeverityBadgeColor = (severity: number) => {
    if (severity >= 5) return 'bg-red-600 text-white';
    if (severity >= 4) return 'bg-orange-600 text-white';
    if (severity >= 3) return 'bg-yellow-600 text-white';
    return 'bg-blue-600 text-white';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary flex items-center gap-2">
        <Network className="w-5 h-5" />
        Cascade Risk Matrix
      </h3>

      {/* Vulnerable Agents */}
      <div className="border border-border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h4 className="font-medium text-text-primary">Vulnerable Agents</h4>
          <span className="ml-auto text-sm font-semibold text-text-primary">
            {cascade.vulnerableAgents.length}
          </span>
        </div>

        {cascade.vulnerableAgents.length > 0 ? (
          <div className="space-y-2">
            {cascade.vulnerableAgents.map((agent) => (
              <div
                key={agent}
                className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full" />
                <span className="text-sm font-medium text-text-primary">{agent}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No vulnerable agents detected</p>
        )}
      </div>

      {/* Deadlocked Agents */}
      <div className="border border-border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h4 className="font-medium text-text-primary">Deadlocked Agents</h4>
          <span className="ml-auto text-sm font-semibold text-text-primary">
            {cascade.deadlockedAgents.length}
          </span>
        </div>

        {cascade.deadlockedAgents.length > 0 ? (
          <div className="space-y-2">
            {cascade.deadlockedAgents.map((agent) => (
              <div
                key={agent}
                className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full" />
                <span className="text-sm font-medium text-text-primary">{agent}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No deadlock detected</p>
        )}
      </div>

      {/* Failure Chains */}
      <div className="border border-border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <h4 className="font-medium text-text-primary">Active Failure Chains</h4>
          <span className="ml-auto text-sm font-semibold text-text-primary">
            {cascade.activeFailureChains}
          </span>
        </div>

        {cascade.activeFailureChains > 0 ? (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-sm text-text-secondary">
              {cascade.activeFailureChains} sequential failure chain{cascade.activeFailureChains !== 1 ? 's' : ''} detected.
              Events are cascading through dependent systems.
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No active failure chains</p>
        )}
      </div>

      {/* Primary Risk Factor */}
      <div className="border border-border-subtle rounded-lg p-4">
        <h4 className="font-medium text-text-primary mb-2">Primary Risk Factor</h4>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm font-semibold text-text-primary">
            {cascade.primaryRiskFactor.replace(/_/g, ' ').toUpperCase()}
          </p>
        </div>
      </div>

      {/* Cascade Factors */}
      <div className="border border-border-subtle rounded-lg p-4">
        <h4 className="font-medium text-text-primary mb-3">Risk Factors</h4>
        {cascade.cascadeFactors.length > 0 ? (
          <div className="space-y-2">
            {cascade.cascadeFactors.map((factor, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${getSeverityColor(factor.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeColor(factor.severity)}`}>
                    S{factor.severity}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary capitalize">
                      {factor.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {factor.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No risk factors identified</p>
        )}
      </div>
    </div>
  );
};
