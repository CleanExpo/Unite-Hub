'use client';

/**
 * Guardian Z14: Status Page & Stakeholder Views
 * Real-time status dashboard with operator/leadership/cs views
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type ViewType = 'operator' | 'leadership' | 'cs';
type PeriodLabel = 'last_7d' | 'last_30d' | 'quarter_to_date';
type CardStatus = 'good' | 'warn' | 'bad' | 'info';

interface StatusCard {
  key: string;
  title: string;
  status: CardStatus;
  value?: string;
  details?: string;
  links?: Array<{ label: string; href: string }>;
}

interface StatusPageView {
  overallStatus: 'experimental' | 'limited' | 'recommended' | 'needs_attention';
  headline: string;
  cards: StatusCard[];
  blockers: string[];
  warnings: string[];
  periodLabel: PeriodLabel;
  viewType: ViewType;
  capturedAt: Date;
}

interface Snapshot {
  id: string;
  viewType: ViewType;
  periodLabel: PeriodLabel;
  overallStatus: string;
  headline: string;
  capturedAt: string;
  createdAt: string;
}

export default function StatusPageConsole() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [viewType, setViewType] = useState<ViewType>('operator');
  const [periodLabel, setPeriodLabel] = useState<PeriodLabel>('last_30d');
  const [statusView, setStatusView] = useState<StatusPageView | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    loadStatusView();
    loadSnapshots();
  }, [workspaceId, viewType, periodLabel]);

  const loadStatusView = async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/guardian/meta/status?workspaceId=${workspaceId}&viewType=${viewType}&period=${periodLabel}&live=0`
      );
      const data = await res.json();
      setStatusView(data.data || null);
    } catch (error) {
      console.error('Failed to load status view:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSnapshots = async () => {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/guardian/meta/status/snapshots?workspaceId=${workspaceId}&viewType=${viewType}&period=${periodLabel}&limit=20`
      );
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    }
  };

  const handleCaptureNow = async () => {
    if (!workspaceId) return;

    setCapturing(true);
    try {
      const res = await fetch(`/api/guardian/meta/status/capture?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewType, periodLabel }),
      });
      const data = await res.json();
      alert(`Snapshot captured: ${data.snapshotId}`);
      loadStatusView();
      loadSnapshots();
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setCapturing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-success-100 text-success-900';
      case 'warn':
        return 'bg-warning-100 text-warning-900';
      case 'bad':
        return 'bg-error-100 text-error-900';
      case 'info':
        return 'bg-info-100 text-info-900';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'recommended':
        return 'bg-success-500';
      case 'limited':
        return 'bg-warning-500';
      case 'needs_attention':
        return 'bg-error-500';
      case 'experimental':
      default:
        return 'bg-bg-elevated';
    }
  };

  if (!workspaceId) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">Guardian Status Page</h1>
        <p className="text-text-secondary">
          Real-time meta stack health dashboard. Select view type and period to see role-safe summaries.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap items-center">
        <div>
          <label className="text-sm text-text-secondary block mb-1">View Type</label>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="px-3 py-2 bg-bg-card rounded border"
          >
            <option value="operator">Operator (Detailed)</option>
            <option value="leadership">Leadership (Summary)</option>
            <option value="cs">CS (Customer-Safe)</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-text-secondary block mb-1">Period</label>
          <select
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value as PeriodLabel)}
            className="px-3 py-2 bg-bg-card rounded border"
          >
            <option value="last_7d">Last 7 Days</option>
            <option value="last_30d">Last 30 Days</option>
            <option value="quarter_to_date">Quarter to Date</option>
          </select>
        </div>

        <div>
          <button
            onClick={handleCaptureNow}
            disabled={capturing || !statusView}
            className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 disabled:opacity-50"
          >
            {capturing ? 'Capturing...' : 'Capture Snapshot'}
          </button>
        </div>

        <div>
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-4 py-2 bg-bg-card rounded hover:bg-bg-secondary border"
          >
            History ({snapshots.length})
          </button>
        </div>
      </div>

      {/* Status View */}
      {loading ? (
        <div className="text-center text-text-secondary py-8">Loading status...</div>
      ) : statusView ? (
        <div className="space-y-4">
          {/* Overall Status Banner */}
          <div className={`p-6 rounded border ${getOverallStatusColor(statusView.overallStatus)} text-white`}>
            <h2 className="text-xl font-bold">{statusView.headline}</h2>
            <p className="text-sm mt-1 opacity-90">
              Status: {statusView.overallStatus.replace(/_/g, ' ')} • Period: {periodLabel}
            </p>
          </div>

          {/* Blockers */}
          {statusView.blockers && statusView.blockers.length > 0 && (
            <div className="p-4 bg-error-50 border border-error-200 rounded">
              <h3 className="font-semibold text-error-900 mb-2">Blockers</h3>
              <ul className="space-y-1 text-sm">
                {statusView.blockers.map((blocker, idx) => (
                  <li key={idx} className="text-error-800">
                    • {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {statusView.warnings && statusView.warnings.length > 0 && (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded">
              <h3 className="font-semibold text-warning-900 mb-2">Warnings</h3>
              <ul className="space-y-1 text-sm">
                {statusView.warnings.map((warning, idx) => (
                  <li key={idx} className="text-warning-800">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusView.cards.map((card) => (
              <div key={card.key} className="p-4 bg-bg-card rounded border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{card.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(card.status)}`}>
                    {card.status.toUpperCase()}
                  </span>
                </div>

                {card.value && <p className="text-lg font-bold text-accent-500">{card.value}</p>}

                {card.details && <p className="text-sm text-text-secondary mt-1">{card.details}</p>}

                {card.links && card.links.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {card.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="block text-xs text-accent-500 hover:underline"
                      >
                        {link.label} →
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-text-secondary py-8">No status data available</div>
      )}

      {/* History Drawer */}
      {showHistoryDrawer && (
        <div className="p-4 bg-bg-card rounded border">
          <h3 className="font-semibold mb-4">Snapshot History</h3>
          {snapshots.length === 0 ? (
            <p className="text-text-secondary text-sm">No snapshots recorded yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {snapshots.map((snap) => (
                <div key={snap.id} className="p-3 bg-bg-secondary rounded flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{snap.headline}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {new Date(snap.capturedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getStatusColor(snap.overallStatus)}`}>
                    {snap.overallStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
