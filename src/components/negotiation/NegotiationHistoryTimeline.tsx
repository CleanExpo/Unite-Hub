'use client';

import React, { useState } from 'react';
import { Calendar, Filter, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import type { NegotiationSession } from '@/state/useNegotiationStore';

interface NegotiationHistoryTimelineProps {
  sessions: NegotiationSession[];
  onSelectSession?: (session: NegotiationSession) => void;
  loading?: boolean;
}

interface FilterState {
  agent?: string;
  outcome?: string;
  consensusBand?: string;
  safetyInvolved?: boolean;
}

export const NegotiationHistoryTimeline: React.FC<NegotiationHistoryTimelineProps> = ({
  sessions,
  onSelectSession,
  loading,
}) => {
  const [filters, setFilters] = useState<FilterState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredSessions = sessions.filter((session) => {
    if (filters.agent && !session.participatingAgents.includes(filters.agent)) {
      return false;
    }
    if (filters.outcome && session.outcome !== filters.outcome) {
      return false;
    }
    if (filters.consensusBand) {
      const consensus = session.consensusPercentage;
      if (filters.consensusBand === 'high' && consensus < 65) return false;
      if (filters.consensusBand === 'medium' && (consensus < 50 || consensus >= 65)) return false;
      if (filters.consensusBand === 'low' && consensus >= 50) return false;
    }
    if (filters.safetyInvolved !== undefined) {
      const hasSafetyVeto = session.riskScore >= 80;
      if (filters.safetyInvolved && !hasSafetyVeto) return false;
      if (!filters.safetyInvolved && hasSafetyVeto) return false;
    }
    return true;
  });

  const uniqueAgents = Array.from(new Set(sessions.flatMap(s => s.participatingAgents)));
  const outcomes = Array.from(new Set(sessions.map(s => s.outcome)));

  const getOutcomeIcon = (outcome: string) => {
    return outcome === 'success' ? (
      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
    ) : outcome === 'escalated' ? (
      <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
    );
  };

  const getOutcomeColor = (outcome: string) => {
    return outcome === 'success'
      ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
      : outcome === 'escalated'
      ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20'
      : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
  };

  const getConsensusColor = (consensus: number) => {
    if (consensus >= 65) return 'bg-green-100 dark:bg-green-900/30';
    if (consensus >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading history...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-bg-raised rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-text-secondary" />
          <p className="text-sm font-semibold text-text-primary">Filters</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Agent Filter */}
          <select
            value={filters.agent || ''}
            onChange={(e) => setFilters({ ...filters, agent: e.target.value || undefined })}
            className="text-xs bg-bg-input text-text-primary border border-border-base rounded px-2 py-1"
            title="Filter by agent"
          >
            <option value="">All Agents</option>
            {uniqueAgents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>

          {/* Outcome Filter */}
          <select
            value={filters.outcome || ''}
            onChange={(e) => setFilters({ ...filters, outcome: e.target.value || undefined })}
            className="text-xs bg-bg-input text-text-primary border border-border-base rounded px-2 py-1"
            title="Filter by outcome"
          >
            <option value="">All Outcomes</option>
            {outcomes.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
              </option>
            ))}
          </select>

          {/* Consensus Band Filter */}
          <select
            value={filters.consensusBand || ''}
            onChange={(e) => setFilters({ ...filters, consensusBand: e.target.value || undefined })}
            className="text-xs bg-bg-input text-text-primary border border-border-base rounded px-2 py-1"
            title="Filter by consensus band"
          >
            <option value="">All Consensus Levels</option>
            <option value="high">High (≥65%)</option>
            <option value="medium">Medium (50-64%)</option>
            <option value="low">Low (&lt;50%)</option>
          </select>

          {/* Safety Involved Filter */}
          <select
            value={filters.safetyInvolved === undefined ? '' : filters.safetyInvolved ? 'yes' : 'no'}
            onChange={(e) => {
              if (e.target.value === '') {
                setFilters({ ...filters, safetyInvolved: undefined });
              } else {
                setFilters({ ...filters, safetyInvolved: e.target.value === 'yes' });
              }
            }}
            className="text-xs bg-bg-input text-text-primary border border-border-base rounded px-2 py-1"
            title="Filter by safety involvement"
          >
            <option value="">All Sessions</option>
            <option value="yes">Safety Veto Only</option>
            <option value="no">No Safety Veto</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <p className="text-sm text-text-secondary">No sessions match filters</p>
        ) : (
          filteredSessions.map((session, index) => (
            <div
              key={session.sessionId}
              className="cursor-pointer group"
              onClick={() => {
                onSelectSession?.(session);
                setExpandedId(expandedId === session.sessionId ? null : session.sessionId);
              }}
            >
              {/* Timeline Marker */}
              <div className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${getConsensusColor(session.consensusPercentage)} border-2 border-border-base`} />
                  {index < filteredSessions.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-300 dark:bg-gray-600 mt-1" />
                  )}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 pb-4 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 rounded p-3 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{session.objective}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                        <Calendar className="w-3 h-3" />
                        {formatDate(session.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(session.outcome)}
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getOutcomeColor(session.outcome)}`}>
                        {session.outcome.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === session.sessionId && (
                    <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-text-secondary">Consensus</p>
                          <p className="font-semibold text-text-primary">{session.consensusPercentage.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Risk Score</p>
                          <p className={`font-semibold ${session.riskScore >= 80 ? 'text-red-600 dark:text-red-400' : 'text-text-primary'}`}>
                            {session.riskScore.toFixed(0)}/100
                          </p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Proposals</p>
                          <p className="font-semibold text-text-primary">{session.proposalsCount}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-text-secondary text-xs mb-1">Participating Agents</p>
                        <div className="flex flex-wrap gap-1">
                          {session.participatingAgents.map((agent) => (
                            <span
                              key={agent}
                              className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                            >
                              {agent}
                            </span>
                          ))}
                        </div>
                      </div>

                      {session.riskScore >= 80 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                          <p className="text-xs text-red-700 dark:text-red-300">
                            ⚠️ Safety veto applied (risk ≥ 80)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
