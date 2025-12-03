'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useNegotiationStore } from '@/state/useNegotiationStore';
import { fetchNegotiationStatus, startNegotiation, submitArbitrationDecision } from '@/lib/negotiation/negotiationClient';
import { NegotiationSessionPanel } from '@/components/negotiation/NegotiationSessionPanel';
import { ProposalMatrix } from '@/components/negotiation/ProposalMatrix';
import { ConsensusScoreChart } from '@/components/negotiation/ConsensusScoreChart';
import { ArbitrationDecisionPanel } from '@/components/negotiation/ArbitrationDecisionPanel';
import { NegotiationHistoryTimeline } from '@/components/negotiation/NegotiationHistoryTimeline';
import { ChevronDown, RefreshCw, AlertTriangle, Settings } from 'lucide-react';

type TabType = 'sessions' | 'proposals' | 'consensus' | 'decisions' | 'history';

export default function NegotiationDashboardPage() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [pollingInterval, setPollingInterval] = useState<number>(2000); // Start at 2s
  const [manualRefresh, setManualRefresh] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const {
    activeSessions,
    selectedSessionId,
    currentProposals,
    currentConsensusScores,
    currentDecision,
    historicalSessions,
    isLoadingSessions,
    isLoadingDetails,
    isLoadingHistory,
    pollingActive,
    setActiveSessions,
    setSelectedSessionId,
    setCurrentProposals,
    setCurrentConsensusScores,
    setCurrentDecision,
    setHistoricalSessions,
    setLoadingSessions,
    setLoadingDetails,
    setLoadingHistory,
    setPollingActive,
    setErrorMessage,
  } = useNegotiationStore();

  const selectedSession = activeSessions.find(s => s.sessionId === selectedSessionId);

  // Polling effect
  useEffect(() => {
    if (!orgId) return;

    let pollTimeout: NodeJS.Timeout;
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      setLoadingSessions(true);
      try {
        const response = await fetchNegotiationStatus(orgId);

        if (response.hasActiveNegotiation) {
          setActiveSessions([response.session]);
          setPollingActive(true);

          // If session is still IN_PROGRESS, keep polling at shorter interval
          if (response.session.status === 'IN_PROGRESS') {
            setPollingInterval(2000); // Fast polling
          } else {
            // Slow down polling after session resolves
            setPollingInterval(20000); // 20 seconds
            setPollingActive(false);
          }
        } else {
          setActiveSessions([]);
          setPollingActive(false);
          setPollingInterval(20000);
        }

        // Load historical sessions
        if (response.recentDecisions && response.recentDecisions.length > 0) {
          const historical: typeof historicalSessions = response.recentDecisions.map((d: any) => ({
            sessionId: d.decisionId,
            objective: selectedSession?.objective || 'Past negotiation',
            status: 'RESOLVED',
            participatingAgents: [],
            proposalsCount: 0,
            consensusPercentage: d.consensusPercentage,
            riskScore: 50,
            outcome: d.outcome === 'success' ? 'success' : 'partial_success',
            createdAt: d.createdAt,
          }));
          setHistoricalSessions(historical);
        }

        setErrorMessage(null);
      } catch (error) {
        console.error('Polling error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch status');
      } finally {
        setLoadingSessions(false);
      }

      // Schedule next poll with exponential backoff
      if (isActive) {
        pollTimeout = setTimeout(poll, pollingInterval);
      }
    };

    // Initial poll
    poll();

    return () => {
      isActive = false;
      clearTimeout(pollTimeout);
    };
  }, [orgId, pollingInterval, setActiveSessions, setPollingActive, setErrorMessage, selectedSession?.objective, setLoadingSessions, setHistoricalSessions]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setManualRefresh(true);
    try {
      if (orgId) {
        const response = await fetchNegotiationStatus(orgId);
        if (response.hasActiveNegotiation) {
          setActiveSessions([response.session]);
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setManualRefresh(false);
    }
  };

  // Handle arbitration decision
  const handlePublishDecision = async () => {
    if (!selectedSession || !currentDecision || !orgId) return;

    try {
      const result = await submitArbitrationDecision({
        workspaceId: orgId,
        sessionId: selectedSession.sessionId,
        proposals: currentProposals,
        objective: selectedSession.objective,
      });

      // Update decision
      setCurrentDecision(result.decision);
      setPollingActive(false);
      setPollingInterval(20000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to publish decision');
    }
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'sessions', label: 'Sessions', count: activeSessions.length },
    { id: 'proposals', label: 'Proposals', count: currentProposals.length },
    { id: 'consensus', label: 'Consensus', count: currentConsensusScores.length },
    { id: 'decisions', label: 'Decisions', count: currentDecision ? 1 : 0 },
    { id: 'history', label: 'History', count: historicalSessions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Agent Negotiation & Arbitration</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor multi-agent negotiations, consensus scoring, and arbitration decisions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={manualRefresh || isLoadingSessions}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${manualRefresh ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-bg-hover hover:bg-gray-300 dark:hover:bg-gray-600 text-text-primary rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Controls
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      {pollingActive && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Live Negotiation Active</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Polling every {pollingInterval / 1000}s</p>
          </div>
        </div>
      )}

      {/* Founder Controls */}
      {showControls && selectedSession && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Founder Controls</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleRefresh}
              className="w-full px-4 py-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-sm font-medium transition-colors"
            >
              Re-run Negotiation
            </button>

            {currentDecision && currentDecision.riskScore < 80 && (
              <button
                onClick={handlePublishDecision}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors"
              >
                Publish Decision (Override Available)
              </button>
            )}

            {currentDecision && currentDecision.riskScore >= 80 && (
              <button
                disabled
                className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-text-secondary rounded text-sm font-medium cursor-not-allowed"
              >
                Decision Locked (Risk ≥ 80 - Safety Override)
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className="w-full px-4 py-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-sm font-medium transition-colors"
            >
              Escalate to Manual Review
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border-subtle">
        <div className="flex gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-text-secondary hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-bg-hover text-text-primary rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <NegotiationSessionPanel
            sessions={activeSessions}
            onSelectSession={(session) => setSelectedSessionId(session.sessionId)}
            selectedSessionId={selectedSessionId}
            loading={isLoadingSessions}
          />
        )}

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {selectedSession ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>{selectedSession.objective}</strong> - {currentProposals.length} proposals
                  </p>
                </div>
                <ProposalMatrix proposals={currentProposals} loading={isLoadingDetails} />
              </>
            ) : (
              <p className="text-sm text-text-secondary">Select a session to view proposals</p>
            )}
          </div>
        )}

        {/* Consensus Tab */}
        {activeTab === 'consensus' && (
          <div className="space-y-4">
            {selectedSession && currentConsensusScores.length > 0 ? (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Overall Consensus: <strong>{selectedSession.consensusPercentage.toFixed(0)}%</strong>
                  </p>
                </div>
                <ConsensusScoreChart scores={currentConsensusScores} />
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                {!selectedSession ? 'Select a session' : 'No consensus scores available'}
              </p>
            )}
          </div>
        )}

        {/* Decisions Tab */}
        {activeTab === 'decisions' && (
          <div className="space-y-4">
            {currentDecision ? (
              <>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Decision ID: <code className="font-mono text-xs">{currentDecision.decisionId}</code>
                  </p>
                </div>
                <ArbitrationDecisionPanel
                  decision={currentDecision}
                  rationale={currentDecision.rationale}
                  alternatives={currentDecision.alternativeActions}
                  loading={isLoadingDetails}
                />
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                {!selectedSession ? 'Select a session to view decision' : 'No arbitration decision yet'}
              </p>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <NegotiationHistoryTimeline
            sessions={historicalSessions}
            onSelectSession={(session) => setSelectedSessionId(session.sessionId)}
            loading={isLoadingHistory}
          />
        )}
      </div>
    </div>
  );
}
