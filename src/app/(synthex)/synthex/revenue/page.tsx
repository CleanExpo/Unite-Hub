'use client';

/**
 * Synthex Revenue Attribution Page
 *
 * Displays revenue breakdown by journey stage, channel attribution,
 * and overall revenue statistics.
 *
 * Phase: B15 - Revenue Attribution by Journey Stage
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  RefreshCw,
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { RevenueByStageChart, StageSummary } from '@/components/synthex/RevenueByStageChart';

interface RevenueStats {
  totalRevenue: number;
  totalConversions: number;
  avgOrderValue: number;
  topStage: string | null;
  topChannel: string | null;
}

interface ChannelAttribution {
  channel: string;
  totalRevenue: number;
  totalConversions: number;
  firstTouchConversions: number;
  lastTouchConversions: number;
  assistedConversions: number;
  cost: number;
  roas: number | null;
  cac: number | null;
}

interface RevenueEvent {
  id: string;
  channel: string;
  stage: string | null;
  amount: number;
  currency: string;
  eventType: string;
  productName: string | null;
  occurredAt: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  email: 'bg-blue-500',
  organic: 'bg-green-500',
  paid: 'bg-yellow-500',
  referral: 'bg-purple-500',
  direct: 'bg-gray-500',
  social: 'bg-pink-500',
  affiliate: 'bg-orange-500',
  other: 'bg-slate-500',
};

function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

function getDateRangeLabel(days: number): string {
  if (days === 7) return 'Last 7 days';
  if (days === 30) return 'Last 30 days';
  if (days === 90) return 'Last 90 days';
  return `Last ${days} days`;
}

export default function RevenuePage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || '';

  const [stages, setStages] = useState<StageSummary[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [channels, setChannels] = useState<ChannelAttribution[]>([]);
  const [recentEvents, setRecentEvents] = useState<RevenueEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Fetch summary and events in parallel
      const [summaryRes, eventsRes] = await Promise.all([
        fetch(
          `/api/synthex/revenue/summary?tenantId=${tenantId}&from=${from}&to=${to}&includeChannels=true`
        ),
        fetch(
          `/api/synthex/revenue/events?tenantId=${tenantId}&from=${from}&to=${to}&limit=10`
        ),
      ]);

      if (!summaryRes.ok) throw new Error('Failed to fetch revenue summary');
      if (!eventsRes.ok) throw new Error('Failed to fetch revenue events');

      const summaryData = await summaryRes.json();
      const eventsData = await eventsRes.json();

      setStages(summaryData.stages || []);
      setStats(summaryData.stats || null);
      setChannels(summaryData.channels || []);
      setRecentEvents(eventsData.events || []);
    } catch (err) {
      console.error('[RevenuePage] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="text-center py-20">
          <p className="text-gray-400">Please select a tenant to view revenue data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Revenue Attribution</h1>
          <p className="text-gray-400 mt-1">
            Track revenue by journey stage and marketing channel
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>{getDateRangeLabel(dateRange)}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 py-2">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      setDateRange(days);
                      setShowDatePicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${
                      dateRange === days ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {getDateRangeLabel(days)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="flex items-center text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +12.5%
            </span>
          </div>
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="flex items-center text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +8.3%
            </span>
          </div>
          <p className="text-gray-400 text-sm">Conversions</p>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : formatNumber(stats?.totalConversions || 0)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <span className="flex items-center text-red-400 text-sm">
              <ArrowDownRight className="w-4 h-4 mr-1" />
              -2.1%
            </span>
          </div>
          <p className="text-gray-400 text-sm">Avg Order Value</p>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : formatCurrency(stats?.avgOrderValue || 0)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Top Channel</p>
          <p className="text-2xl font-bold text-white capitalize">
            {loading ? '...' : stats?.topChannel || 'N/A'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Stage Chart */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-gray-800 rounded-lg p-6 h-80 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <RevenueByStageChart stages={stages} currency="AUD" />
          )}
        </div>

        {/* Channel Attribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Channel Attribution</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No channel data</div>
          ) : (
            <div className="space-y-4">
              {channels.slice(0, 6).map((channel) => {
                const totalChannelRevenue = channels.reduce((s, c) => s + c.totalRevenue, 0);
                const percentage =
                  totalChannelRevenue > 0
                    ? (channel.totalRevenue / totalChannelRevenue) * 100
                    : 0;

                return (
                  <div key={channel.channel}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            CHANNEL_COLORS[channel.channel] || CHANNEL_COLORS.other
                          }`}
                        />
                        <span className="text-sm text-gray-300 capitalize">
                          {channel.channel}
                        </span>
                      </div>
                      <span className="text-sm text-white font-medium">
                        {formatCurrency(channel.totalRevenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          CHANNEL_COLORS[channel.channel] || CHANNEL_COLORS.other
                        } transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{channel.totalConversions} conversions</span>
                      {channel.roas !== null && <span>ROAS: {channel.roas.toFixed(1)}x</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Revenue Events</h3>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No recent events</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3 font-medium">Event</th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-700/50">
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          event.eventType === 'conversion'
                            ? 'bg-green-500/20 text-green-400'
                            : event.eventType === 'refund'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {event.eventType}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            CHANNEL_COLORS[event.channel] || CHANNEL_COLORS.other
                          }`}
                        />
                        <span className="text-gray-300 capitalize">{event.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-300 capitalize">{event.stage || '-'}</td>
                    <td className="py-3 text-gray-300">{event.productName || '-'}</td>
                    <td className="py-3 text-right font-medium text-white">
                      {formatCurrency(event.amount, event.currency)}
                    </td>
                    <td className="py-3 text-right text-gray-400 text-sm">
                      {new Date(event.occurredAt).toLocaleDateString('en-AU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
