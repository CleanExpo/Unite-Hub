'use client';

/**
 * Synthex Billing & Accounts Page
 *
 * Financial overview:
 * - Plan summary with MRR
 * - Transaction history
 * - Invoice list
 * - Usage-based costs
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Receipt,
  DollarSign,
  TrendingUp,
  FileText,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  plan_code: string | null;
  created_at: string;
}

interface BillingInfo {
  plan: string;
  planPrice: number;
  offerTier: string;
  effectivePrice: number;
  billingStatus: string;
  renewsAt: string | null;
  jobsUsed: number;
  jobsLimit: number;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [txnRes, invRes, billRes] = await Promise.all([
        fetch(`/api/synthex/transactions?tenantId=${tenantId}&limit=20`, { headers }),
        fetch(`/api/synthex/invoices?tenantId=${tenantId}&limit=10`, { headers }),
        fetch(`/api/synthex/billing?tenantId=${tenantId}`, { headers }),
      ]);

      if (txnRes.ok) {
        const data = await txnRes.json();
        setTransactions(data.transactions || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
      }
      if (billRes.ok) {
        const data = await billRes.json();
        setBilling(data);
      }
    } catch (err) {
      console.error('Billing fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchData();
  }, [tenantId, fetchData, router]);

  const txnTypeIcon = (type: string) => {
    switch (type) {
      case 'subscription_charge': return <ArrowUpRight className="h-4 w-4 text-red-400" />;
      case 'refund': return <ArrowDownRight className="h-4 w-4 text-emerald-400" />;
      case 'credit': return <ArrowDownRight className="h-4 w-4 text-blue-400" />;
      default: return <DollarSign className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'text-emerald-300 border-emerald-500/30',
      paid: 'text-emerald-300 border-emerald-500/30',
      pending: 'text-yellow-300 border-yellow-500/30',
      issued: 'text-blue-300 border-blue-500/30',
      failed: 'text-red-300 border-red-500/30',
      overdue: 'text-red-300 border-red-500/30',
      draft: 'text-gray-400 border-gray-600',
      void: 'text-gray-500 border-gray-700',
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const totalSpend = transactions
    .filter(t => t.status === 'completed' && t.transaction_type !== 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-orange-400" />
          Billing & Accounts
        </h1>
        <p className="text-gray-400 mt-1">
          Plan, invoices, and transaction history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              ${billing?.effectivePrice?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">Monthly Cost (AUD)</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              ${totalSpend.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Total Spend</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <Receipt className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{invoices.length}</p>
            <p className="text-xs text-gray-500">Invoices</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <FileText className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{transactions.length}</p>
            <p className="text-xs text-gray-500">Transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Info */}
      {billing && (
        <Card className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-xl font-bold text-gray-100 capitalize">
                  {billing.plan} Plan
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  ${billing.effectivePrice?.toFixed(2)} AUD/month
                  {billing.offerTier && billing.offerTier !== 'standard' && (
                    <Badge variant="outline" className="ml-2 text-orange-300 border-orange-500/30 text-xs">
                      {billing.offerTier.replace('_', ' ')}
                    </Badge>
                  )}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={billing.billingStatus === 'active'
                    ? 'text-emerald-300 border-emerald-500/30'
                    : 'text-yellow-300 border-yellow-500/30'
                  }
                >
                  {billing.billingStatus}
                </Badge>
                {billing.renewsAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Renews {new Date(billing.renewsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {(['overview', 'transactions', 'invoices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6 pb-6 text-center text-gray-500 text-sm">
                  No transactions yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map(txn => (
                  <Card key={txn.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="py-3 flex items-center gap-3">
                      {txnTypeIcon(txn.transaction_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">
                          {txn.description || txn.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-100">
                          ${txn.amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className={`text-xs ${statusBadge(txn.status)}`}>
                          {txn.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Invoices</h3>
            {invoices.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6 pb-6 text-center text-gray-500 text-sm">
                  No invoices yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 5).map(inv => (
                  <Card key={inv.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="py-3 flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200">{inv.invoice_number}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-100">
                          ${inv.total.toFixed(2)}
                        </p>
                        <Badge variant="outline" className={`text-xs ${statusBadge(inv.status)}`}>
                          {inv.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <DollarSign className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No transactions recorded</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map(txn => (
              <Card key={txn.id} className="bg-gray-900 border-gray-800">
                <CardContent className="py-3 flex items-center gap-3">
                  {txnTypeIcon(txn.transaction_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">
                      {txn.description || txn.transaction_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(txn.created_at).toLocaleDateString()} &middot; {txn.transaction_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      txn.transaction_type === 'refund' || txn.transaction_type === 'credit'
                        ? 'text-emerald-300'
                        : 'text-gray-100'
                    }`}>
                      {txn.transaction_type === 'refund' || txn.transaction_type === 'credit' ? '-' : ''}
                      ${txn.amount.toFixed(2)} {txn.currency}
                    </p>
                    <Badge variant="outline" className={`text-xs ${statusBadge(txn.status)}`}>
                      {txn.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-2">
          {invoices.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <Receipt className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No invoices generated</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map(inv => (
              <Card key={inv.id} className="bg-gray-900 border-gray-800">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Period: {new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}
                      </p>
                      {inv.plan_code && (
                        <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs mt-1 capitalize">
                          {inv.plan_code} plan
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-100">${inv.total.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${statusBadge(inv.status)}`}>
                          {inv.status}
                        </Badge>
                      </div>
                      {inv.discount > 0 && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Saved ${inv.discount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
