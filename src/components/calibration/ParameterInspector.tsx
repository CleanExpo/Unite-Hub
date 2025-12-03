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
        <Settings className="w-5 h-5 text-text-secondary" />
        <h3 className="font-semibold text-text-primary">Parameter Inspector</h3>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const params = parameters[category.key as keyof typeof parameters] || {};
          const paramCount = Object.keys(params).length;

          return (
            <div
              key={category.key}
              className="border border-border-subtle rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedParam(expandedParam === category.key ? null : category.key)}
                className="w-full flex items-center gap-3 p-3 bg-bg-raised hover:bg-bg-hover transition-colors"
              >
                <span className="text-lg">{category.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-text-primary">{category.label}</p>
                  <p className="text-xs text-text-secondary">{paramCount} parameters</p>
                </div>
                <span className={`text-text-secondary transition-transform ${expandedParam === category.key ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Category Details */}
              {expandedParam === category.key && (
                <div className="border-t border-border-subtle p-3 space-y-2 bg-bg-card">
                  {paramCount === 0 ? (
                    <p className="text-xs text-text-secondary">No parameters</p>
                  ) : (
                    Object.entries(params).map(([paramName, paramData]: [string, any]) => (
                      <div key={paramName} className="p-2 bg-bg-raised rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-text-primary">
                            {paramName.replace(/_/g, ' ')}
                          </p>
                          {paramData.confidence && (
                            <span className="text-text-secondary">
                              {paramData.confidence}% confidence
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-text-secondary">
                          <span>Current: {paramData.value?.toFixed(2) || 'N/A'}</span>
                          <span>Baseline: {paramData.baseline?.toFixed(2) || 'N/A'}</span>
                        </div>
                        {paramData.minValue && paramData.maxValue && (
                          <div className="mt-1 text-text-secondary">
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
        <div className="mt-6 pt-6 border-t border-border-subtle space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-text-secondary" />
            <p className="text-sm font-medium text-text-primary">Recent Changes</p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(parameterHistory)
              .slice(0, 5)
              .map(([param, history]: [string, any]) => (
                <div key={param} className="text-xs p-2 bg-bg-raised rounded">
                  <p className="font-medium text-text-primary mb-1">
                    {param.replace(/_/g, ' ')}
                  </p>
                  {Array.isArray(history) && history[0] && (
                    <p className="text-text-secondary">
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
