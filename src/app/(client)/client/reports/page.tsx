/**
 * Client Reports Page - Phase 3 Step 9
 * UI for clients to view their billables and time usage
 */

'use client';

import { useState, useEffect } from 'react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchClientBilling,
  fetchClientPnL,
  fetchClientHours,
  fetchClientPayments,
} from '@/lib/services/reportsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClientReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<any>(null);
  const [hours, setHours] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);

  // Assuming contact_id is stored in user profile
  const contactId = (user as any)?.contact_id;

  useEffect(() => {
    if (contactId) {
      loadReports();
    }
  }, [contactId]);

  const loadReports = async () => {
    if (!contactId) return;
    setLoading(true);

    const [billingRes, hoursRes, paymentsRes] = await Promise.all([
      fetchClientBilling(contactId),
      fetchClientHours(contactId),
      fetchClientPayments(contactId),
    ]);

    if (billingRes.success) setBilling(billingRes.data);
    if (hoursRes.success) setHours(hoursRes.data);
    if (paymentsRes.success) setPayments(paymentsRes.data);

    setLoading(false);
  };

  if (loading) return <div className="p-8">Loading your reports...</div>;

  return (
    <PageContainer>
      <Section>
        <h1 className="text-3xl font-bold">Your Financial Reports</h1>
      </Section>

      <Section>
        <Tabs defaultValue="billing">
        <TabsList>
          <TabsTrigger value="billing">Billing Summary</TabsTrigger>
          <TabsTrigger value="hours">Hours Breakdown</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Billable Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{billing?.billableHours?.toFixed(1) || '0.0'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Billed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${billing?.totalBillableAmount?.toFixed(2) || '0.00'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  ${billing?.outstandingBalance?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hours?.entries?.slice(0, 10).map((entry: any) => (
                  <div key={entry.id} className="flex justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{entry.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{entry.hours}h</div>
                      <div className="text-sm">${(entry.hours * entry.hourly_rate).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payments?.payments?.slice(0, 10).map((payment: any) => (
                  <div key={payment.id} className="flex justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{payment.description || 'Payment'}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${parseFloat(payment.amount).toFixed(2)}</div>
                      <div className="text-sm text-green-600">{payment.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </Section>
    </PageContainer>
  );
}
