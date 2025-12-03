'use client';

import React from 'react';
import { Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import type { NegotiationSession } from '@/state/useNegotiationStore';

interface NegotiationSessionPanelProps {
  sessions: NegotiationSession[];
  selectedSessionId?: string | null;
  loading?: boolean;
  onSelectSession?: (sessionId: string) => void;
  onRefresh?: () => void;
}

export const NegotiationSessionPanel: React.FC<NegotiationSessionPanelProps> = ({
  sessions,
  selectedSessionId,
  loading,
  onSelectSession,
  onRefresh,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'escalated': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'deadlocked': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'escalated': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Negotiation Sessions</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Refresh
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-text-secondary">Loading sessions...</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-sm text-text-secondary">No sessions found</p>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              onClick={() => onSelectSession?.(session.sessionId)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedSessionId === session.sessionId
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-bg-card border-border-subtle hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-text-primary text-sm">{session.objective}</p>
                <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(session.status)}`}>
                  {getStatusIcon(session.status)}
                  {session.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1 text-text-secondary">
                  <Users className="w-3 h-3" />
                  <span>{session.participatingAgents.length} agents</span>
                </div>
                <div className="text-text-secondary">
                  Consensus: {session.overallConsensus.toFixed(0)}%
                </div>
                <div className="flex items-center gap-1 text-text-secondary">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(session.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {session.conflictsDetected > 0 && (
                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ {session.conflictsDetected} conflict{session.conflictsDetected !== 1 ? 's' : ''} detected
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
