'use client';

/**
 * Billing Overview
 * Phase: D66 - Billing & Invoicing Integration Layer
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  number?: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  issue_date?: string;
  due_date?: string;
  paid_at?: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  useEffect(() => {
    if (selectedInvoice) {
      fetchLineItems(selectedInvoice);
    }
  }, [selectedInvoice]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const response = await fetch(`/api/unite/billing/invoices?limit=50${statusParam}`);
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async (invoiceId: string) => {
    try {
      const response = await fetch(
        `/api/unite/billing/invoices?action=line_items&invoice_id=${invoiceId}`
      );
      const data = await response.json();
      if (response.ok) {
        setLineItems(data.lineItems || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      paid: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      open: <Clock className="w-5 h-5 text-blue-400" />,
      overdue: <XCircle className="w-5 h-5 text-red-400" />,
      draft: <Clock className="w-5 h-5 text-gray-400" />,
      canceled: <XCircle className="w-5 h-5 text-gray-500" />,
    };
    return icons[status] || icons.draft;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-400',
      open: 'bg-blue-500/10 text-blue-400',
      overdue: 'bg-red-500/10 text-red-400',
      draft: 'bg-gray-500/10 text-gray-400',
      canceled: 'bg-gray-600/10 text-gray-500',
    };
    return colors[status] || colors.draft;
  };

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalOutstanding = invoices.filter((inv) => inv.status === 'open' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Receipt className="w-10 h-10 text-accent-500" />
              Billing & Invoicing
            </h1>
            <p className="text-text-secondary">Multi-provider invoice management</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Total Invoiced</span>
              <DollarSign className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              ${totalInvoiced.toFixed(2)}
            </div>
            <div className="text-xs text-text-tertiary mt-1">All time</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Paid</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">
              ${totalPaid.toFixed(2)}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {invoices.filter((inv) => inv.status === 'paid').length} invoices
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Outstanding</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400">
              ${totalOutstanding.toFixed(2)}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {invoices.filter((inv) => inv.status === 'open' || inv.status === 'overdue').length}{' '}
              invoices
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {['all', 'draft', 'open', 'paid', 'overdue', 'canceled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                filter === status
                  ? 'bg-accent-500 text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Invoices Grid */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
            <p className="text-text-secondary">No invoices found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoices List */}
            <div className="lg:col-span-2 space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice.id)}
                  className={`p-5 bg-bg-card rounded-lg border ${
                    selectedInvoice === invoice.id ? 'border-accent-500' : 'border-border-primary'
                  } hover:border-accent-500 transition-all cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          {invoice.number || `Invoice #${invoice.id.substring(0, 8)}`}
                        </h3>
                        <p className="text-sm text-text-tertiary mt-1">
                          {invoice.issue_date
                            ? new Date(invoice.issue_date).toLocaleDateString()
                            : 'No date'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-text-secondary">
                      {invoice.due_date && (
                        <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-accent-500">
                      ${invoice.total.toFixed(2)}{' '}
                      <span className="text-sm text-text-tertiary">{invoice.currency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Details */}
            <div className="space-y-6">
              {!selectedInvoice ? (
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary text-center">
                  <p className="text-text-tertiary">Select an invoice to view details</p>
                </div>
              ) : (
                <>
                  {/* Line Items */}
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Line Items</h3>
                    {lineItems.length === 0 ? (
                      <p className="text-sm text-text-tertiary">No line items</p>
                    ) : (
                      <div className="space-y-3">
                        {lineItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-bg-tertiary rounded border border-border-secondary"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-text-primary">
                                {item.description}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>
                                {item.quantity} × ${item.unit_price.toFixed(2)}
                              </span>
                              <span className="font-medium text-text-primary">
                                ${item.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  {invoices.find((inv) => inv.id === selectedInvoice)?.paid_at && (
                    <div className="p-6 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-green-400">Paid</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {new Date(
                          invoices.find((inv) => inv.id === selectedInvoice)!.paid_at!
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
