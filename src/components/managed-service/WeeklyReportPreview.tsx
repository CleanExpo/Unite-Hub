'use client';

import React, { useState } from 'react';
import { Send, Mail, Download, Eye, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export interface ReportMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  change: number;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  actionItems?: string[];
}

export interface WeeklyReportData {
  id: string;
  projectId: string;
  reportNumber: number;
  periodStartDate: string;
  periodEndDate: string;
  hoursUtilized: number;
  hoursRemaining: number;
  executiveSummary: string;
  highlights: string[];
  kpiTracking: ReportMetric[];
  recommendations: Recommendation[];
  trafficData?: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  rankData?: {
    improvementCount: number;
    topKeyword: string;
    topRank: number;
  };
  blockers?: string[];
  status: 'draft' | 'sent' | 'reviewed';
  createdAt: string;
  sentAt?: string;
}

interface WeeklyReportPreviewProps {
  report: WeeklyReportData;
  loading?: boolean;
  onSend?: (reportId: string, recipientEmail: string) => Promise<void>;
}

export const WeeklyReportPreview: React.FC<WeeklyReportPreviewProps> = ({ report, loading = false, onSend }) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      alert('Please enter a recipient email');
      return;
    }

    try {
      setSending(true);
      if (onSend) {
        await onSend(report.id, recipientEmail);
        setShowSendModal(false);
        setRecipientEmail('');
      }
    } finally {
      setSending(false);
    }
  };

  const downloadAsHTML = () => {
    const htmlContent = generateHTMLReport();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-week-${report.reportNumber}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const generateHTMLReport = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Report - Week ${report.reportNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #1f2937; }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .metric { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .recommendation { border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; background: #f0f9ff; }
    .highlight { background: #fef3c7; padding: 10px; margin: 5px 0; border-radius: 3px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .stat-box { background: #f3f4f6; padding: 15px; border-radius: 5px; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly Report - Week ${report.reportNumber}</h1>
      <p>${formatDate(report.periodStartDate)} to ${formatDate(report.periodEndDate)}</p>
    </div>

    <h2>Executive Summary</h2>
    <p>${report.executiveSummary}</p>

    <h2>Key Highlights</h2>
    <ul>
      ${report.highlights.map((h) => `<li class="highlight">${h}</li>`).join('')}
    </ul>

    <h2>Hours Utilization</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <strong>Hours Used</strong><br>${report.hoursUtilized}h
      </div>
      <div class="stat-box">
        <strong>Hours Remaining</strong><br>${report.hoursRemaining}h
      </div>
    </div>

    <h2>KPI Tracking</h2>
    ${report.kpiTracking
      .map(
        (metric) => `
      <div class="metric">
        <strong>${metric.name}</strong><br>
        Current: ${metric.value.toFixed(2)}${metric.unit} | Target: ${metric.target.toFixed(2)}${metric.unit}<br>
        <span class="${metric.trend === 'up' ? 'positive' : 'negative'}">
          ${metric.trend === 'up' ? '↑' : '↓'} ${Math.abs(metric.change).toFixed(1)}% ${metric.trend === 'up' ? 'increase' : 'decrease'}
        </span>
      </div>
    `
      )
      .join('')}

    <h2>Recommendations</h2>
    ${report.recommendations
      .map(
        (rec) => `
      <div class="recommendation">
        <strong>${rec.title}</strong> (Priority: ${rec.priority.toUpperCase()})<br>
        ${rec.description}<br>
        Impact: ${rec.impact}
        ${rec.actionItems ? `<ul>${rec.actionItems.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}
      </div>
    `
      )
      .join('')}

    ${report.blockers && report.blockers.length > 0 ? `
      <h2>Blockers</h2>
      <ul>
        ${report.blockers.map((b) => `<li>${b}</li>`).join('')}
      </ul>
    ` : ''}

    <hr style="margin-top: 40px;">
    <p style="font-size: 12px; color: #666;">
      Generated on ${formatDateTime(report.createdAt)} | Status: ${report.status}
    </p>
  </div>
</body>
</html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Loading report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Buttons */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
          <span
            className={`px-3 py-1 rounded text-xs font-medium ${
              report.status === 'sent'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : report.status === 'reviewed'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
            }`}
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
          {report.sentAt && (
            <span className="text-xs text-gray-600 dark:text-gray-400">Sent {formatDateTime(report.sentAt)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>

          <button
            onClick={downloadAsHTML}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          {report.status !== 'sent' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              Send Report
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Weekly Report - Week {report.reportNumber}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDate(report.periodStartDate)} to {formatDate(report.periodEndDate)}
              </p>
            </div>

            {/* Executive Summary */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Executive Summary</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.executiveSummary}</p>
            </div>

            {/* Key Highlights */}
            {report.highlights.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Key Highlights</h2>
                <ul className="space-y-2">
                  {report.highlights.map((highlight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded"
                    >
                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hours Utilization */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Hours Utilization</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hours Used</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{report.hoursUtilized}h</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hours Remaining</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{report.hoursRemaining}h</p>
                </div>
              </div>
            </div>

            {/* KPI Tracking */}
            {report.kpiTracking.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">KPI Tracking</h2>
                <div className="space-y-3">
                  {report.kpiTracking.map((metric, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{metric.name}</h3>
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {metric.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(metric.change).toFixed(1)}%
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Current</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {metric.value.toFixed(2)}
                            {metric.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Target</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {metric.target.toFixed(2)}
                            {metric.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traffic Data */}
            {report.trafficData && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Traffic Data</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sessions</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {report.trafficData.sessions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Users</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {report.trafficData.users.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pageviews</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {report.trafficData.pageviews.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bounce Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {report.trafficData.bounceRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 md:col-span-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Avg Session Duration</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {report.trafficData.avgSessionDuration.toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rank Data */}
            {report.rankData && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ranking Improvements</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Keywords Improved</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {report.rankData.improvementCount}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Ranking Keyword</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{report.rankData.topKeyword}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Rank #{report.rankData.topRank}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Recommendations</h2>
                <div className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${getPriorityColor(rec.priority)}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Impact: {rec.impact}</p>

                      {rec.actionItems && rec.actionItems.length > 0 && (
                        <ul className="ml-4 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          {rec.actionItems.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockers */}
            {report.blockers && report.blockers.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Blockers
                </h2>
                <ul className="space-y-2">
                  {report.blockers.map((blocker, idx) => (
                    <li key={idx} className="text-red-700 dark:text-red-300 flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-600 dark:text-gray-400">
              <p>Generated on {formatDateTime(report.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Send Report</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@example.com"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
