'use client';

/**
 * BillingDashboard
 * Phase 12 Week 5-6: Usage, limits, invoices, and plan status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface UsageMetric {
  current_usage: number;
  limit_value: number | null;
  percentage_used: number;
  is_within_limit: boolean;
  is_warning: boolean;
  is_unlimited: boolean;
}

interface UsageSummary {
  emails: UsageMetric;
  ai_requests: UsageMetric;
  contacts: UsageMetric;
  reports: UsageMetric;
  campaigns: UsageMetric;
  storage: UsageMetric;
}

interface Subscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  plan: {
    name: string;
    display_name: string;
    tier: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  currency: string;
  invoice_date: string;
  paid_at?: string;
}

interface BillingDashboardProps {
  orgId: string;
}

export function BillingDashboard({ orgId }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [orgId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch subscription, usage, and invoices in parallel
      const [subRes, usageRes, invoiceRes] = await Promise.all([
        fetch(`/api/enterprise/billing/subscriptions?orgId=${orgId}`),
        fetch(`/api/enterprise/billing/usage?orgId=${orgId}`),
        fetch(`/api/enterprise/billing/invoices?orgId=${orgId}`),
      ]);

      const [subData, usageData, invoiceData] = await Promise.all([
        subRes.json(),
        usageRes.json(),
        invoiceRes.json(),
      ]);

      if (subData.success) {
setSubscription(subData.subscription);
}
      if (usageData.success) {
setUsage(usageData.usage);
}
      if (invoiceData.success) {
setInvoices(invoiceData.invoices);
}
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription details and billing information
              </CardDescription>
            </div>
            <Button variant="outline">
              Upgrade Plan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-2xl font-bold">{subscription.plan.display_name}</p>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="text-lg font-semibold capitalize">{subscription.billing_cycle}</p>
                <p className="text-sm text-muted-foreground">
                  ${subscription.billing_cycle === 'monthly'
                    ? subscription.plan.price_monthly
                    : subscription.plan.price_yearly}/
                  {subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Billing Date</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.ceil(
                    (new Date(subscription.current_period_end).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days remaining
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active subscription</p>
              <Button className="mt-4">Choose a Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage This Period
          </CardTitle>
          <CardDescription>Track your resource consumption against plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          {usage ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <UsageCard label="Emails" metric={usage.emails} />
              <UsageCard label="AI Requests" metric={usage.ai_requests} />
              <UsageCard label="Contacts" metric={usage.contacts} />
              <UsageCard label="Reports" metric={usage.reports} />
              <UsageCard label="Campaigns" metric={usage.campaigns} />
              <UsageCard label="Storage (GB)" metric={usage.storage} />
            </div>
          ) : (
            <p className="text-muted-foreground">No usage data available</p>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
          <CardDescription>Your billing history and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {invoice.currency} {invoice.total.toFixed(2)}
                    </p>
                    <Badge
                      variant={
                        invoice.status === 'paid'
                          ? 'default'
                          : invoice.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No invoices yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsageCard({ label, metric }: { label: string; metric: UsageMetric }) {
  const getStatusColor = () => {
    if (metric.is_unlimited) {
return 'text-green-600';
}
    if (!metric.is_within_limit) {
return 'text-red-600';
}
    if (metric.is_warning) {
return 'text-yellow-600';
}
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!metric.is_within_limit) {
return <AlertTriangle className="h-4 w-4 text-red-600" />;
}
    if (metric.is_warning) {
return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
}
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {getStatusIcon()}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${getStatusColor()}`}>
          {metric.current_usage.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">
          / {metric.is_unlimited ? '∞' : metric.limit_value?.toLocaleString()}
        </span>
      </div>
      {!metric.is_unlimited && (
        <Progress
          value={Math.min(metric.percentage_used, 100)}
          className={`h-2 ${
            !metric.is_within_limit
              ? '[&>div]:bg-red-600'
              : metric.is_warning
              ? '[&>div]:bg-yellow-600'
              : ''
          }`}
        />
      )}
      {metric.is_unlimited ? (
        <p className="text-xs text-muted-foreground">Unlimited</p>
      ) : (
        <p className="text-xs text-muted-foreground">{metric.percentage_used.toFixed(0)}% used</p>
      )}
    </div>
  );
}

export default BillingDashboard;
