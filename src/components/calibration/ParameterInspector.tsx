'use client';

/**
 * ParameterInspector - Detailed parameter inspection and history
 */

import React, { useState } from 'react';
import { Settings, History, AlertCircle } from 'lucide-react';

export interface ParameterInspectorProps {
  parameters: Record<string, any>;
  parameterHistory: Record<string, any[]>;
}

export const ParameterInspector: React.FC<ParameterInspectorProps> = ({
  parameters = {},
  parameterHistory = {}
}) => {
  const [expandedParam, setExpandedParam] = useState<string | null>(null);

  const categories = [
    { key: 'agentWeights', label: 'Agent Weights', icon: '⚖️' },
    { key: 'riskThresholds', label: 'Risk Thresholds', icon: '⚠️' },
    { key: 'uncertaintyFactors', label: 'Uncertainty Factors', icon: '❓' },
    { key: 'reasoningDepth', label: 'Reasoning Depth', icon: '🧠' },
    { key: 'orchestration', label: 'Orchestration', icon: '🎼' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Parameter Inspector</h3>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const params = parameters[category.key as keyof typeof parameters] || {};
          const paramCount = Object.keys(params).length;

          return (
            <div
              key={category.key}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedParam(expandedParam === category.key ? null : category.key)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-lg">{category.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{category.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{paramCount} parameters</p>
                </div>
                <span className={`text-gray-600 dark:text-gray-400 transition-transform ${expandedParam === category.key ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Category Details */}
              {expandedParam === category.key && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-white dark:bg-gray-800">
                  {paramCount === 0 ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">No parameters</p>
                  ) : (
                    Object.entries(params).map(([paramName, paramData]: [string, any]) => (
                      <div key={paramName} className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {paramName.replace(/_/g, ' ')}
                          </p>
                          {paramData.confidence && (
                            <span className="text-gray-600 dark:text-gray-400">
                              {paramData.confidence}% confidence
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                          <span>Current: {paramData.value?.toFixed(2) || 'N/A'}</span>
                          <span>Baseline: {paramData.baseline?.toFixed(2) || 'N/A'}</span>
                        </div>
                        {paramData.minValue && paramData.maxValue && (
                          <div className="mt-1 text-gray-600 dark:text-gray-400">
                            Range: [{paramData.minValue?.toFixed(2)}, {paramData.maxValue?.toFixed(2)}]
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History Section */}
      {Object.keys(parameterHistory).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Recent Changes</p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(parameterHistory)
              .slice(0, 5)
              .map(([param, history]: [string, any]) => (
                <div key={param} className="text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {param.replace(/_/g, ' ')}
                  </p>
                  {Array.isArray(history) && history[0] && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Last: {history[0].value?.toFixed(2)} (applied {new Date(history[0].appliedAt).toLocaleDateString()})
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
