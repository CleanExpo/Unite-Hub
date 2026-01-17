/**
 * Founder Finance Dashboard
 *
 * Phase: D43 - Capital & Runway Dashboard (Founder Finance Brain)
 *
 * Features:
 * - Financial accounts overview
 * - Runway calculation and visualization
 * - Transaction tracking
 * - Burn rate trends
 * - AI-powered financial analysis
 * - Cash flow forecasting
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Clock,
  Plus,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  ChartLine,
  AlertTriangle,
  DollarSign,
  Calendar,
  CreditCard,
  X,
} from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

// Types
interface FinanceAccount {
  id: string;
  account_name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  institution_name?: string;
  is_primary: boolean;
  created_at: string;
}

interface FinanceEvent {
  id: string;
  event_date: string;
  event_type: string;
  direction: string;
  amount: number;
  description?: string;
  counterparty_name?: string;
}

interface FinanceSummary {
  total_cash: number;
  total_receivables: number;
  total_payables: number;
  net_position: number;
  monthly_burn: number;
  monthly_revenue: number;
  net_burn: number;
  runway_months: number | null;
  runway_date: string | null;
  accounts: FinanceAccount[];
  recent_transactions: FinanceEvent[];
  burn_trend: { month: string; burn: number; revenue: number }[];
}

interface AIAnalysis {
  summary: string;
  health_score: number;
  risk_flags: string[];
  recommendations: string[];
}

export default function FounderFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Modals
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Form state
  const [newAccount, setNewAccount] = useState({
    account_name: '',
    account_type: 'bank_checking',
    currency: 'AUD',
    opening_balance: '',
    institution_name: '',
  });
  const [newTransaction, setNewTransaction] = useState({
    account_id: '',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'other_expense',
    direction: 'outflow',
    amount: '',
    description: '',
    counterparty_name: '',
  });

  // Demo tenant ID
  const tenantId = 'demo-tenant-id';

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/synthex/finance/runway?tenantId=${tenantId}&mode=summary`
      );
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleCalculateRunway = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/synthex/finance/runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'calculate',
          scenario_type: 'moderate',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error calculating runway:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/synthex/finance/runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'analyze',
          includeRecommendations: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing finances:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      const res = await fetch('/api/synthex/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          account_name: newAccount.account_name,
          account_type: newAccount.account_type,
          currency: newAccount.currency,
          opening_balance: parseFloat(newAccount.opening_balance) || 0,
          institution_name: newAccount.institution_name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddAccount(false);
        setNewAccount({
          account_name: '',
          account_type: 'bank_checking',
          currency: 'AUD',
          opening_balance: '',
          institution_name: '',
        });
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const res = await fetch('/api/synthex/finance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          account_id: newTransaction.account_id,
          event_date: newTransaction.event_date,
          event_type: newTransaction.event_type,
          direction: newTransaction.direction,
          amount: parseFloat(newTransaction.amount) || 0,
          description: newTransaction.description,
          counterparty_name: newTransaction.counterparty_name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddTransaction(false);
        setNewTransaction({
          account_id: '',
          event_date: new Date().toISOString().split('T')[0],
          event_type: 'other_expense',
          direction: 'outflow',
          amount: '',
          description: '',
          counterparty_name: '',
        });
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRunwayColor = (months: number | null) => {
    if (months === null) return 'text-text-muted';
    if (months >= 999) return 'text-success-400';
    if (months >= 18) return 'text-success-400';
    if (months >= 12) return 'text-warning-400';
    if (months >= 6) return 'text-accent-400';
    return 'text-error-400';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success-400';
    if (score >= 60) return 'text-warning-400';
    if (score >= 40) return 'text-accent-400';
    return 'text-error-400';
  };

  return (
    <PageContainer>
      <Section>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wallet className="w-8 h-8 text-success-400" />
              Capital & Runway Dashboard
            </h1>
            <p className="text-text-muted mt-1">
              Track your financial position and runway projections
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleCalculateRunway}
              disabled={isCalculating}
              className="bg-bg-elevated hover:bg-bg-elevated"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
              Calculate Runway
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-success-600 hover:bg-success-500"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              AI Analysis
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-success-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-bg-raised/50 border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-sm">Net Position</span>
                  <DollarSign className="w-5 h-5 text-success-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(summary?.net_position || 0)}
                </p>
                <p className="text-text-tertiary text-sm mt-1">
                  Cash + Receivables - Payables
                </p>
              </Card>

              <Card className="bg-bg-raised/50 border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-sm">Monthly Burn</span>
                  <TrendingDown className="w-5 h-5 text-error-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(summary?.net_burn || 0)}
                </p>
                <p className="text-text-tertiary text-sm mt-1">
                  Expenses: {formatCurrency(summary?.monthly_burn || 0)}
                </p>
              </Card>

              <Card className="bg-bg-raised/50 border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-sm">Monthly Revenue</span>
                  <TrendingUp className="w-5 h-5 text-success-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(summary?.monthly_revenue || 0)}
                </p>
                <p className="text-text-tertiary text-sm mt-1">
                  Avg. of last 3 months
                </p>
              </Card>

              <Card className="bg-bg-raised/50 border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-sm">Runway</span>
                  <Clock className="w-5 h-5 text-warning-400" />
                </div>
                <p className={`text-2xl font-bold ${getRunwayColor(summary?.runway_months ?? null)}`}>
                  {summary?.runway_months === 999
                    ? '∞ (Profitable)'
                    : summary?.runway_months
                    ? `${summary.runway_months} months`
                    : 'N/A'}
                </p>
                {summary?.runway_date && summary.runway_months !== 999 && (
                  <p className="text-text-tertiary text-sm mt-1">
                    Until {new Date(summary.runway_date).toLocaleDateString()}
                  </p>
                )}
              </Card>
            </div>

            {/* AI Analysis */}
            {analysis && (
              <Card className="bg-bg-raised/50 border-border p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-success-400" />
                  <h2 className="text-xl font-semibold text-white">AI Analysis</h2>
                  <span className={`ml-auto text-lg font-bold ${getHealthColor(analysis.health_score)}`}>
                    Health Score: {analysis.health_score}/100
                  </span>
                </div>
                <p className="text-text-secondary mb-4">{analysis.summary}</p>
                {analysis.risk_flags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-error-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Risk Flags
                    </h3>
                    <ul className="space-y-1">
                      {analysis.risk_flags.map((flag, i) => (
                        <li key={i} className="text-text-muted text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-error-400 rounded-full" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-success-400 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-text-muted text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-success-400 rounded-full" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Accounts */}
              <Card className="bg-bg-raised/50 border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-text-muted" />
                    Accounts
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setShowAddAccount(true)}
                    className="bg-success-600 hover:bg-success-500"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {summary?.accounts && summary.accounts.length > 0 ? (
                  <div className="space-y-3">
                    {summary.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-4 bg-bg-elevated/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{account.account_name}</span>
                          {account.is_primary && (
                            <span className="text-xs bg-success-500/20 text-success-400 px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-success-400">
                          {formatCurrency(account.current_balance)}
                        </p>
                        <p className="text-text-tertiary text-xs mt-1">
                          {account.institution_name || account.account_type.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No accounts yet</p>
                    <Button
                      size="sm"
                      onClick={() => setShowAddAccount(true)}
                      className="mt-3 bg-success-600 hover:bg-success-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </Button>
                  </div>
                )}
              </Card>

              {/* Burn Trend */}
              <Card className="bg-bg-raised/50 border-border p-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                  <ChartLine className="w-5 h-5 text-text-muted" />
                  Burn Trend
                </h2>
                {summary?.burn_trend && summary.burn_trend.length > 0 ? (
                  <div className="space-y-3">
                    {summary.burn_trend.map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <span className="text-text-muted text-sm">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-error-400 text-sm flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" />
                            {formatCurrency(month.burn)}
                          </span>
                          <span className="text-success-400 text-sm flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <ChartLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No data yet</p>
                  </div>
                )}
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-bg-raised/50 border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-text-muted" />
                    Recent Transactions
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setShowAddTransaction(true)}
                    className="bg-success-600 hover:bg-success-500"
                    disabled={!summary?.accounts?.length}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {summary?.recent_transactions && summary.recent_transactions.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {summary.recent_transactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-bg-elevated/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">
                            {tx.description || tx.event_type.replace('_', ' ')}
                          </p>
                          <p className="text-text-tertiary text-xs">
                            {new Date(tx.event_date).toLocaleDateString()}
                            {tx.counterparty_name && ` • ${tx.counterparty_name}`}
                          </p>
                        </div>
                        <span
                          className={`font-medium ${
                            tx.direction === 'inflow' ? 'text-success-400' : 'text-error-400'
                          }`}
                        >
                          {tx.direction === 'inflow' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                    {summary?.accounts?.length ? (
                      <Button
                        size="sm"
                        onClick={() => setShowAddTransaction(true)}
                        className="mt-3 bg-success-600 hover:bg-success-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transaction
                      </Button>
                    ) : (
                      <p className="text-xs mt-2">Add an account first</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {/* Add Account Modal */}
        {showAddAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-bg-raised border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Account</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddAccount(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted block mb-1">Account Name</label>
                  <Input
                    value={newAccount.account_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_name: e.target.value })
                    }
                    placeholder="e.g., Business Checking"
                    className="bg-bg-elevated border-border text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Account Type</label>
                  <select
                    value={newAccount.account_type}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_type: e.target.value })
                    }
                    className="w-full p-2 bg-bg-elevated border border-border rounded-md text-white"
                  >
                    <option value="bank_checking">Bank Checking</option>
                    <option value="bank_savings">Bank Savings</option>
                    <option value="credit_line">Credit Line</option>
                    <option value="investment">Investment</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Institution</label>
                  <Input
                    value={newAccount.institution_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, institution_name: e.target.value })
                    }
                    placeholder="e.g., CommBank"
                    className="bg-bg-elevated border-border text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Opening Balance</label>
                  <Input
                    type="number"
                    value={newAccount.opening_balance}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, opening_balance: e.target.value })
                    }
                    placeholder="0"
                    className="bg-bg-elevated border-border text-white"
                  />
                </div>
                <Button
                  onClick={handleAddAccount}
                  className="w-full bg-success-600 hover:bg-success-500"
                >
                  Add Account
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-bg-raised border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTransaction(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted block mb-1">Account</label>
                  <select
                    value={newTransaction.account_id}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, account_id: e.target.value })
                    }
                    className="w-full p-2 bg-bg-elevated border border-border rounded-md text-white"
                  >
                    <option value="">Select account...</option>
                    {summary?.accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Date</label>
                  <Input
                    type="date"
                    value={newTransaction.event_date}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, event_date: e.target.value })
                    }
                    className="bg-bg-elevated border-border text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-text-muted block mb-1">Direction</label>
                    <select
                      value={newTransaction.direction}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, direction: e.target.value })
                      }
                      className="w-full p-2 bg-bg-elevated border border-border rounded-md text-white"
                    >
                      <option value="inflow">Income</option>
                      <option value="outflow">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-text-muted block mb-1">Amount</label>
                    <Input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, amount: e.target.value })
                      }
                      placeholder="0"
                      className="bg-bg-elevated border-border text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Type</label>
                  <select
                    value={newTransaction.event_type}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, event_type: e.target.value })
                    }
                    className="w-full p-2 bg-bg-elevated border border-border rounded-md text-white"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="payroll">Payroll</option>
                    <option value="contractor">Contractor</option>
                    <option value="software">Software</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="marketing">Marketing</option>
                    <option value="rent">Rent</option>
                    <option value="other_income">Other Income</option>
                    <option value="other_expense">Other Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Description</label>
                  <Input
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="bg-bg-elevated border-border text-white"
                  />
                </div>
                <Button
                  onClick={handleAddTransaction}
                  disabled={!newTransaction.account_id || !newTransaction.amount}
                  className="w-full bg-success-600 hover:bg-success-500"
                >
                  Add Transaction
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
