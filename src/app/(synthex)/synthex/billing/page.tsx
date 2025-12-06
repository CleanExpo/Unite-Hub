/**
 * Synthex Billing Page
 * Path: /synthex/billing
 * Displays current plan, usage, invoices, and payment methods
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

interface Plan {
  code: string;
  name: string;
  description: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  features: string[];
  limits: any;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  plan?: Plan;
}

interface Invoice {
  invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  stripe_invoice_url: string | null;
  period_start: string;
  period_end: string;
  due_date: string;
  paid_at: string | null;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  brand: string | null;
  is_default: boolean;
}

interface UpcomingCharges {
  total_cents: number;
  currency: string;
  period_start: string;
  period_end: string;
  line_items: any[];
  breakdown: {
    base_subscription: number;
    usage_charges: number;
    overage_charges: number;
  };
}

export default function BillingPage() {
  const { tenantId } = useSynthexTenant();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [upcomingCharges, setUpcomingCharges] = useState<UpcomingCharges | null>(null);
  const [usageSummary, setUsageSummary] = useState<any[]>([]);

  useEffect(() => {
    if (tenantId) {
      fetchBillingData();
    }
  }, [tenantId]);

  const fetchBillingData = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // Fetch subscription and usage
      const subResponse = await fetch(`/api/synthex/billing/subscription?tenantId=${tenantId}`);
      const subData = await subResponse.json();
      setSubscription(subData.subscription);
      setUsageSummary(subData.usage || []);

      // Fetch invoices
      const invoicesResponse = await fetch(`/api/synthex/billing/invoices?tenantId=${tenantId}&limit=10`);
      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData.invoices || []);

      // Fetch payment methods
      const pmResponse = await fetch(`/api/synthex/billing/payment-methods?tenantId=${tenantId}`);
      const pmData = await pmResponse.json();
      setPaymentMethods(pmData.paymentMethods || []);

      // Fetch upcoming charges
      const upcomingResponse = await fetch(`/api/synthex/billing/invoices?tenantId=${tenantId}&upcoming=true`);
      const upcomingData = await upcomingResponse.json();
      setUpcomingCharges(upcomingData.upcomingCharges);
    } catch (error) {
      console.error('[Billing Page] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    if (!tenantId) return;

    try {
      const response = await fetch('/api/synthex/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId,
          planCode: 'PRO',
          billingPeriod: 'monthly',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('[Billing Page] Error creating checkout session:', error);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-text-warning" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-text-error" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-text-muted" />;
      default:
        return <Clock className="h-4 w-4 text-text-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Billing & Subscription</h1>
        <p className="text-text-secondary mt-1">Manage your plan, invoices, and payment methods</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-bg-card border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-text-primary">Current Plan</CardTitle>
              <CardDescription className="text-text-secondary">
                {subscription?.plan?.name || 'Free Plan'}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {subscription?.billing_period === 'yearly' ? 'Annual' : 'Monthly'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.plan && (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-text-primary">
                  {formatCurrency(
                    subscription.billing_period === 'yearly'
                      ? subscription.plan.yearly_price_cents
                      : subscription.plan.monthly_price_cents
                  )}
                </span>
                <span className="text-text-secondary">
                  /{subscription.billing_period === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              {subscription.plan.features && subscription.plan.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-primary">Features:</h4>
                  <ul className="space-y-1">
                    {subscription.plan.features.slice(0, 5).map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-text-success mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {subscription.plan.code === 'FREE' && (
                <Button onClick={handleUpgradePlan} className="w-full">
                  Upgrade to Pro
                </Button>
              )}

              {subscription.cancel_at && (
                <div className="rounded-md bg-bg-warning p-3 border border-border-warning">
                  <p className="text-sm text-text-warning">
                    Your subscription will be cancelled on {formatDate(subscription.cancel_at)}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Usage Meters */}
      {usageSummary.length > 0 && (
        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Usage This Month</CardTitle>
            <CardDescription className="text-text-secondary">
              Current usage across all metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageSummary.map((usage: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary capitalize">
                    {usage.metric.replace(/_/g, ' ')}
                  </span>
                  <span className="text-text-secondary">
                    {usage.current.toLocaleString()} / {usage.unlimited ? '∞' : usage.limit.toLocaleString()}
                  </span>
                </div>
                {!usage.unlimited && (
                  <Progress value={usage.percentage} className="h-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Charges */}
      {upcomingCharges && (
        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Upcoming Charges</CardTitle>
            <CardDescription className="text-text-secondary">
              Estimated charges for next billing cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-primary">
                {formatCurrency(upcomingCharges.total_cents, upcomingCharges.currency)}
              </span>
              <span className="text-sm text-text-secondary">
                Due on {formatDate(upcomingCharges.period_end)}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              {upcomingCharges.line_items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{item.description}</span>
                  <span className="text-text-primary font-medium">
                    {formatCurrency(item.amount_cents, upcomingCharges.currency)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      <Card className="bg-bg-card border-border-subtle">
        <CardHeader>
          <CardTitle className="text-text-primary">Invoice History</CardTitle>
          <CardDescription className="text-text-secondary">
            View and download past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No invoices yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-text-secondary">Date</TableHead>
                  <TableHead className="text-text-secondary">Period</TableHead>
                  <TableHead className="text-text-secondary">Amount</TableHead>
                  <TableHead className="text-text-secondary">Status</TableHead>
                  <TableHead className="text-text-secondary text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.invoice_id}>
                    <TableCell className="text-text-primary">
                      {formatDate(invoice.created_at)}
                    </TableCell>
                    <TableCell className="text-text-secondary text-sm">
                      {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                    </TableCell>
                    <TableCell className="text-text-primary font-medium">
                      {formatCurrency(invoice.amount_cents, invoice.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      {invoice.stripe_invoice_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.stripe_invoice_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-bg-card border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-text-primary">Payment Methods</CardTitle>
              <CardDescription className="text-text-secondary">
                Manage your payment methods
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              No payment methods added
            </p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-subtle"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Card'} ****
                        {pm.last_four}
                      </p>
                      {pm.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-text-error" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
