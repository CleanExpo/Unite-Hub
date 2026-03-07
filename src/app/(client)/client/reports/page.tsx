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

  if (loading) return (
    <div className="p-8 text-white/40 font-mono text-sm">Loading your reports...</div>
  );

  return (
    <PageContainer>
      <Section>
        <h1 className="text-3xl font-bold text-white font-mono">Your Financial Reports</h1>
      </Section>

      <Section>
        <Tabs defaultValue="billing">
        <TabsList className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-1">
          <TabsTrigger value="billing" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">Billing Summary</TabsTrigger>
          <TabsTrigger value="hours" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">Hours Breakdown</TabsTrigger>
          <TabsTrigger value="payments" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
              <p className="text-sm text-white/40 font-mono mb-2">Billable Hours</p>
              <div className="text-3xl font-bold text-white font-mono">{billing?.billableHours?.toFixed(1) || '0.0'}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
              <p className="text-sm text-white/40 font-mono mb-2">Total Billed</p>
              <div className="text-3xl font-bold text-white font-mono">${billing?.totalBillableAmount?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
              <p className="text-sm text-white/40 font-mono mb-2">Outstanding Balance</p>
              <div className="text-3xl font-bold text-[#FFB800] font-mono">
                ${billing?.outstandingBalance?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
            <h3 className="text-white font-mono font-semibold mb-4">Time Entries</h3>
            <div className="space-y-2">
              {hours?.entries?.slice(0, 10).map((entry: any) => (
                <div key={entry.id} className="flex justify-between border-b border-white/[0.06] pb-2">
                  <div>
                    <div className="font-medium text-white font-mono text-sm">{entry.description}</div>
                    <div className="text-sm text-white/40 font-mono">
                      {new Date(entry.date).toLocaleDateString('en-AU')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white font-mono">{entry.hours}h</div>
                    <div className="text-sm text-white/40 font-mono">${(entry.hours * entry.hourly_rate).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
            <h3 className="text-white font-mono font-semibold mb-4">Payment History</h3>
            <div className="space-y-2">
              {payments?.payments?.slice(0, 10).map((payment: any) => (
                <div key={payment.id} className="flex justify-between border-b border-white/[0.06] pb-2">
                  <div>
                    <div className="font-medium text-white font-mono text-sm">{payment.description || 'Payment'}</div>
                    <div className="text-sm text-white/40 font-mono">
                      {new Date(payment.payment_date).toLocaleDateString('en-AU')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white font-mono">${parseFloat(payment.amount).toFixed(2)}</div>
                    <div className="text-sm text-[#00FF88] font-mono">{payment.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </Section>
    </PageContainer>
  );
}
