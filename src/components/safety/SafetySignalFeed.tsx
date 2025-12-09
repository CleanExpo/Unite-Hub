'use client';

/**
 * SafetySignalFeed - Real-time safety events feed
 *
 * Displays:
 * - Recent safety events with severity indicators
 * - Source of each event
 * - Color-coded by risk level
 * - Expandable details
 */

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useSafetyStore } from '@/lib/stores/useSafetyStore';

export const SafetySignalFeed: React.FC = () => {
  const { events, isLoading } = useSafetyStore();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-text-secondary">Loading events...</p>
      </div>
    );
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) {
return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
}
    if (severity >= 3) {
return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
}
    if (severity >= 2) {
return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
}
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const getSeverityIcon = (severity: number) => {
    if (severity >= 4) {
return <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />;
}
    if (severity >= 3) {
return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
}
    if (severity >= 2) {
return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
}
    return <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  };

  const getRiskBadgeColor = (riskLevel: number) => {
    if (riskLevel >= 75) {
return 'bg-red-600 text-white';
}
    if (riskLevel >= 50) {
return 'bg-orange-600 text-white';
}
    if (riskLevel >= 25) {
return 'bg-yellow-600 text-white';
}
    return 'bg-blue-600 text-white';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
return 'Just now';
}
    if (minutes < 60) {
return `${minutes}m ago`;
}
    if (hours < 24) {
return `${hours}h ago`;
}
    if (days < 7) {
return `${days}d ago`;
}

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-text-secondary" />
        <h3 className="font-semibold text-text-primary">
          Recent Events
        </h3>
        <span className="ml-auto text-sm text-text-secondary">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900 dark:text-green-300">No recent events</p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">System is operating safely</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id;

            return (
              <div
                key={event.id}
                className={`border rounded-lg overflow-hidden transition-colors ${getSeverityColor(event.severity)}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  className="w-full p-4 flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                >
                  {getSeverityIcon(event.severity)}

                  <div className="flex-1">
                    <p className="font-medium text-text-primary capitalize">
                      {event.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {event.source} • {formatTime(event.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskBadgeColor(event.riskLevel)}`}>
                      {event.riskLevel}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-text-secondary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                </button>

                {/* Details */}
                {isExpanded && (
                  <div className="border-t border-opacity-30 border-border-base p-4 bg-white/50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                          Severity
                        </p>
                        <p className="text-sm font-bold text-text-primary">
                          {event.severity}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                          Risk Level
                        </p>
                        <p className="text-sm font-bold text-text-primary">
                          {event.riskLevel}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase mb-2">
                        Source
                      </p>
                      <p className="text-sm text-text-secondary bg-white/50 dark:bg-gray-900/50 p-2 rounded">
                        {event.source}
                      </p>
                    </div>

                    <p className="text-xs text-text-secondary mt-3">
                      Event ID: {event.id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {events.length > 0 && (
        <div className="pt-2 border-t border-border-subtle">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-card p-3 rounded border border-border-subtle">
              <p className="text-xs text-text-secondary">Total Events</p>
              <p className="text-lg font-bold text-text-primary">{events.length}</p>
            </div>
            <div className="bg-bg-card p-3 rounded border border-border-subtle">
              <p className="text-xs text-text-secondary">Avg Severity</p>
              <p className="text-lg font-bold text-text-primary">
                {(events.reduce((sum, e) => sum + e.severity, 0) / events.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
