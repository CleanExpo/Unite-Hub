'use client';

/**
 * LiveEnforcementLogPanel - Real-time enforcement events log
 *
 * Displays:
 * - All enforcement events in real-time
 * - Severity color coding
 * - Filter by agent, rule, severity
 * - Expandable details with metadata
 * - Cross-linked to safety ledger
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, AlertTriangle, AlertOctagon, Filter, X } from 'lucide-react';

export interface EnforcementEvent {
  id: string;
  action: string;
  severity: number;
  affectedSystems: string[];
  reason: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface LiveEnforcementLogPanelProps {
  events?: EnforcementEvent[];
  isLoading?: boolean;
}

export const LiveEnforcementLogPanel: React.FC<LiveEnforcementLogPanelProps> = ({
  events = [],
  isLoading = false,
}) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<number | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [searchAgent, setSearchAgent] = useState('');

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filterSeverity !== null && event.severity !== filterSeverity) return false;
    if (filterAction !== null && event.action !== filterAction) return false;
    if (searchAgent && !event.affectedSystems.some(sys => sys.toLowerCase().includes(searchAgent.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (severity >= 4) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    if (severity >= 3) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const getSeverityIcon = (severity: number) => {
    if (severity >= 5) return <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />;
    if (severity >= 4) return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    if (severity >= 3) return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    return <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 5) return 'bg-red-600 text-white';
    if (severity >= 4) return 'bg-orange-600 text-white';
    if (severity >= 3) return 'bg-yellow-600 text-white';
    return 'bg-blue-600 text-white';
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'halt_autonomy':
        return 'text-red-600 dark:text-red-400';
      case 'pause_workflow':
        return 'text-orange-600 dark:text-orange-400';
      case 'block_agent':
        return 'text-red-600 dark:text-red-400';
      case 'throttle':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'require_approval':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Live Enforcement Log</h3>
        <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Severity filter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase block mb-2">
              Severity
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(filterSeverity === sev ? null : sev)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filterSeverity === sev
                      ? getSeverityBadge(sev)
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {sev}
                </button>
              ))}
              {filterSeverity !== null && (
                <button
                  onClick={() => setFilterSeverity(null)}
                  className="px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action filter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase block mb-2">
              Action
            </label>
            <select
              value={filterAction || ''}
              onChange={(e) => setFilterAction(e.target.value || null)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Actions</option>
              <option value="halt_autonomy">Halt Autonomy</option>
              <option value="pause_workflow">Pause Workflow</option>
              <option value="block_agent">Block Agent</option>
              <option value="throttle">Throttle</option>
              <option value="require_approval">Require Approval</option>
            </select>
          </div>

          {/* Agent search */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase block mb-2">
              Search Agent
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by agent..."
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchAgent && (
                <button
                  onClick={() => setSearchAgent('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events log */}
      {isLoading && filteredEvents.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-900 dark:text-green-300">No enforcement events</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredEvents.map(event => {
            const isExpanded = expandedEventId === event.id;

            return (
              <div
                key={event.id}
                className={`border rounded-lg overflow-hidden transition-colors ${getSeverityColor(event.severity)}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  className="w-full p-3 flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                >
                  {getSeverityIcon(event.severity)}

                  <div className="flex-1">
                    <p className={`font-medium ${getActionColor(event.action)}`}>
                      {event.action.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {event.affectedSystems.join(', ')} • {formatTime(event.timestamp)}
                    </p>
                  </div>

                  <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadge(event.severity)}`}>
                    S{event.severity}
                  </span>
                </button>

                {/* Details */}
                {isExpanded && (
                  <div className="border-t border-opacity-30 border-gray-300 dark:border-gray-600 p-3 bg-white/50 dark:bg-gray-800/50 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                        Reason
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{event.reason}</p>
                    </div>

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                          Metadata
                        </p>
                        <pre className="text-xs bg-white/50 dark:bg-gray-900/50 p-2 rounded text-gray-700 dark:text-gray-300 overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Event ID: {event.id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
