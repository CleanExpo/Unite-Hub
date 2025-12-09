'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplaceStore } from '@/state/useMarketplaceStore';
import { getAuctionStatus, getAuctionHistory, startAuction } from '@/lib/marketplace/marketplaceClient';
import { LiveBidPanel } from '@/components/marketplace/LiveBidPanel';
import { AuctionWinnerPanel } from '@/components/marketplace/AuctionWinnerPanel';
import { MarketplaceHistoryTimeline } from '@/components/marketplace/MarketplaceHistoryTimeline';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, AlertCircle } from 'lucide-react';

type TabType = 'live' | 'winner' | 'history';

export default function MarketplacePage() {
  const { currentOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [pollingInterval, setPollingInterval] = useState(2000); // Start at 2s
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startingAuction, setStartingAuction] = useState(false);

  const {
    setActiveAuction,
    setCurrentBids,
    setCurrentWinner,
    setHistoricalAuctions,
    setLoadingAuction,
    setLoadingBids,
    setLoadingWinner,
    setLoadingHistory,
    setPollingActive,
    setErrorMessage,
    pollingActive,
  } = useMarketplaceStore();

  const workspaceId = currentOrganization?.org_id || '';

  // Fetch auction status
  const fetchAuctionStatus = useCallback(async () => {
    if (!workspaceId) {
return;
}

    try {
      setLoadingAuction(true);
      const status = await getAuctionStatus(workspaceId);

      if (status.hasActiveAuction && status.auction) {
        setActiveAuction(status.auction);
        setCurrentBids(status.bidDetails || []);
      } else {
        setActiveAuction(null);
        setCurrentBids([]);
      }

      setErrorMessage(null);
    } catch (error) {
      console.error('Error fetching auction status:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to fetch auction status'
      );
    } finally {
      setLoadingAuction(false);
    }
  }, [workspaceId, setActiveAuction, setCurrentBids, setLoadingAuction, setErrorMessage]);

  // Fetch auction history
  const fetchAuctionHistory = useCallback(async () => {
    if (!workspaceId) {
return;
}

    try {
      setLoadingHistory(true);
      const history = await getAuctionHistory(workspaceId, 50);
      setHistoricalAuctions(history.recentAuctions || []);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error fetching auction history:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to fetch auction history'
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [workspaceId, setHistoricalAuctions, setLoadingHistory, setErrorMessage]);

  // Polling logic with exponential backoff
  useEffect(() => {
    if (!pollingActive || !workspaceId) {
return;
}

    const timer = setInterval(async () => {
      await fetchAuctionStatus();

      // Increase interval gradually (2s → 5s → 10s → 20s max)
      setPollingInterval((prev) => {
        const newInterval = Math.min(prev * 1.5, 20000);
        return newInterval;
      });
    }, pollingInterval);

    return () => clearInterval(timer);
  }, [pollingActive, pollingInterval, workspaceId, fetchAuctionStatus]);

  // Initial fetch
  useEffect(() => {
    if (!workspaceId) {
return;
}

    fetchAuctionStatus();
    fetchAuctionHistory();
    setPollingActive(true);

    return () => setPollingActive(false);
  }, [workspaceId, fetchAuctionStatus, fetchAuctionHistory, setPollingActive]);

  // Manual refresh
  const handleRefresh = async () => {
    setPollingInterval(2000); // Reset to 2s
    await fetchAuctionStatus();
    await fetchAuctionHistory();
  };

  const handleStartAuction = async (taskData: {
    taskId: string;
    taskTitle: string;
    taskComplexity: number;
  }) => {
    if (!workspaceId) {
return;
}

    try {
      setStartingAuction(true);
      await startAuction({
        ...taskData,
        workspaceId,
      });

      setShowStartDialog(false);
      setPollingInterval(2000); // Reset polling
      await fetchAuctionStatus();
    } catch (error) {
      console.error('Error starting auction:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to start auction'
      );
    } finally {
      setStartingAuction(false);
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-text-secondary">Loading workspace information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Task Marketplace
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Multi-agent auction system for task assignment and resource allocation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowStartAuction(true)}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start Auction
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {/* {errorMessage && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )} */}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('live')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            Live Auction
          </button>
          <button
            onClick={() => setActiveTab('winner')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'winner'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            Winner
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 p-6 dark:bg-gray-950">
        {activeTab === 'live' && <LiveBidPanel workspaceId={workspaceId} />}
        {activeTab === 'winner' && <AuctionWinnerPanel workspaceId={workspaceId} />}
        {activeTab === 'history' && <MarketplaceHistoryTimeline workspaceId={workspaceId} />}
      </div>

      {/* Start Auction Dialog (placeholder) */}
      {/* TODO: Implement modal for starting new auction */}
    </div>
  );
}
