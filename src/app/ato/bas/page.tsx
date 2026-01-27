/**
 * BAS Lodgement Dashboard
 *
 * Business Activity Statement management:
 * - Calculate BAS for periods
 * - Submit to ATO
 * - View lodgement history
 * - Track overdue periods
 * - Compliance monitoring
 *
 * Related to: UNI-177 [ATO] BAS Lodgement Automation
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  FileText,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Calculator,
} from 'lucide-react';

interface BASLodgement {
  id: string;
  period_year: number;
  period_quarter: number | null;
  period_month: number | null;
  abn: string;
  business_name: string;
  net_gst: number;
  total_amount: number;
  status: string;
  lodged_at: string | null;
  due_date: string;
  submission_reference: string | null;
}

interface BASCalculation {
  period: {
    year: number;
    quarter?: number;
    month?: number;
  };
  summary: {
    totalSales: number;
    totalPurchases: number;
    gstOnSales: number;
    gstOnPurchases: number;
    netGst: number;
    transactionCount: number;
  };
}

export default function BASPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [lodgements, setLodgements] = useState<BASLodgement[]>([]);
  const [calculation, setCalculation] = useState<BASCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [abn, setAbn] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [periodType, setPeriodType] = useState<'quarterly' | 'monthly'>('quarterly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (workspaceId) {
      fetchLodgements();
    }
  }, [workspaceId]);

  const fetchLodgements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/ato/bas?workspaceId=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setLodgements(data.lodgements || []);
      }
    } catch (error) {
      console.error('Failed to fetch BAS lodgements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!workspaceId || !abn || !businessName) {
      alert('Please provide workspace ID, ABN, and business name');
      return;
    }

    try {
      setCalculating(true);
      const response = await fetch('/api/integrations/ato/bas/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          abn,
          businessName,
          config: {
            type: periodType,
            year,
            quarter: periodType === 'quarterly' ? quarter : undefined,
            month: periodType === 'monthly' ? month : undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCalculation(data.result);
      } else {
        alert(`Calculation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('BAS calculation error:', error);
      alert('Failed to calculate BAS');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!workspaceId || !abn || !businessName) {
      alert('Please provide workspace ID, ABN, and business name');
      return;
    }

    if (!calculation) {
      alert('Please calculate BAS first');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/integrations/ato/bas/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          abn,
          businessName,
          config: {
            type: periodType,
            year,
            quarter: periodType === 'quarterly' ? quarter : undefined,
            month: periodType === 'monthly' ? month : undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`BAS lodged successfully! Ref: ${data.submissionReference}`);
        setCalculation(null);
        fetchLodgements();
      } else {
        alert(`Lodgement failed: ${data.error}`);
      }
    } catch (error) {
      console.error('BAS submission error:', error);
      alert('Failed to submit BAS');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatPeriod = (lodgement: BASLodgement) => {
    if (lodgement.period_quarter) {
      return `Q${lodgement.period_quarter} ${lodgement.period_year}`;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[lodgement.period_month! - 1]} ${lodgement.period_year}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'text-gray-400 bg-gray-900',
      submitted: 'text-blue-400 bg-blue-950',
      acknowledged: 'text-emerald-400 bg-emerald-950',
      assessed: 'text-green-400 bg-green-950',
      failed: 'text-red-400 bg-red-950',
    };
    return colors[status] || 'text-gray-400 bg-gray-900';
  };

  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <p className="text-gray-400">Missing workspace ID. Please provide ?workspaceId= parameter.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-400" />
            BAS Lodgement Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Business Activity Statement automation and management</p>
        </div>

        {/* Calculate BAS Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-400" />
            Calculate BAS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">ABN</label>
              <input
                type="text"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="51 824 753 556"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ACME PTY LTD"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'quarterly' | 'monthly')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              >
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              />
            </div>

            {periodType === 'quarterly' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Quarter</label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                >
                  <option value={1}>Q1 (Jan-Mar)</option>
                  <option value={2}>Q2 (Apr-Jun)</option>
                  <option value={3}>Q3 (Jul-Sep)</option>
                  <option value={4}>Q4 (Oct-Dec)</option>
                </select>
              </div>
            )}

            {periodType === 'monthly' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {calculating ? 'Calculating...' : 'Calculate BAS'}
          </button>
        </div>

        {/* Calculation Results */}
        {calculation && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100">Calculation Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">GST on Sales (G1)</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(calculation.summary.gstOnSales)}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">GST on Purchases (G11)</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(calculation.summary.gstOnPurchases)}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Net GST (1A)</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(calculation.summary.netGst)}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              Based on {calculation.summary.transactionCount} transactions
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit to ATO'}
            </button>
          </div>
        )}

        {/* Lodgement History */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100">Lodgement History</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : lodgements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No BAS lodgements yet</div>
          ) : (
            <div className="space-y-3">
              {lodgements.map((lodgement) => (
                <div
                  key={lodgement.id}
                  className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold">{formatPeriod(lodgement)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lodgement.status)}`}>
                        {lodgement.status}
                      </span>
                    </div>
                    {lodgement.submission_reference && (
                      <div className="text-sm text-gray-400 mt-1">
                        Ref: {lodgement.submission_reference}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-100">
                      {formatCurrency(lodgement.total_amount)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Due: {new Date(lodgement.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
