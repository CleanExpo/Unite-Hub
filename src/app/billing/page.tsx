"use client";

import { useEffect, useState } from "react";
import { DownloadCloud, CreditCard, FileText, AlertCircle, ExternalLink } from "lucide-react";

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: number;
  dueDate: number | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  paid: boolean;
}

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    planId: string;
    planName: string;
    price: number;
    priceFormatted: string;
    currentPeriodEnd: string;
    trialEnd: string | null;
    canceledAt: string | null;
  };
  mode?: "test" | "live";
  isSandbox?: boolean;
}

function formatAUD(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp * 1000));
}

function statusBadge(status: string | null) {
  const map: Record<string, string> = {
    paid: "text-[#00FF88] border border-[#00FF88]/30 bg-[#00FF88]/[0.06]",
    open: "text-[#00F5FF] border border-[#00F5FF]/30 bg-[#00F5FF]/[0.06]",
    void: "text-white/30 border border-white/10 bg-white/[0.02]",
    draft: "text-[#FFB800] border border-[#FFB800]/30 bg-[#FFB800]/[0.06]",
    uncollectible: "text-[#FF4444] border border-[#FF4444]/30 bg-[#FF4444]/[0.06]",
  };
  const cls = map[status ?? ""] ?? "text-white/30 border border-white/10";
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Unknown";
  return (
    <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded-sm ${cls}`}>
      {label}
    </span>
  );
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/subscription");
        if (!res.ok) throw new Error("Failed to load subscription");
        const data: SubscriptionData = await res.json();
        setSub(data);

        if (data.hasSubscription && data.subscription?.id) {
          const invRes = await fetch("/api/subscription/invoices");
          if (invRes.ok) {
            const invData = await invRes.json();
            setInvoices(invData.invoices ?? []);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-white/[0.06] pb-6">
          <h1 className="text-2xl font-mono font-bold text-white/90 tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-white/40 font-mono text-sm mt-1">
            Manage your subscription and download invoices
          </p>
        </div>

        {/* Sandbox banner */}
        {sub?.isSandbox && (
          <div className="bg-[#FFB800]/[0.06] border border-[#FFB800]/20 rounded-sm px-4 py-3 text-[#FFB800] font-mono text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Sandbox mode — no real charges will be made
          </div>
        )}

        {loading && (
          <div className="text-white/30 font-mono text-sm py-12 text-center">
            Loading billing data…
          </div>
        )}

        {error && (
          <div className="bg-[#FF4444]/[0.06] border border-[#FF4444]/20 rounded-sm px-4 py-3 text-[#FF4444] font-mono text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && sub && (
          <>
            {/* Current Plan */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/40 font-mono text-xs uppercase tracking-widest mb-1">
                    Current Plan
                  </p>
                  {sub.hasSubscription && sub.subscription ? (
                    <>
                      <h2 className="text-xl font-mono font-bold text-white/90">
                        {sub.subscription.planName}
                      </h2>
                      <p className="text-[#00F5FF] font-mono text-2xl font-bold mt-1">
                        {sub.subscription.priceFormatted}
                        <span className="text-white/30 text-sm font-normal"> /month</span>
                      </p>
                    </>
                  ) : (
                    <h2 className="text-xl font-mono font-bold text-white/90">No active plan</h2>
                  )}
                </div>
                {sub.hasSubscription && sub.subscription && (
                  <div className="text-right shrink-0">
                    <p className="text-white/40 font-mono text-xs uppercase tracking-widest mb-1">
                      Status
                    </p>
                    {statusBadge(sub.subscription.status)}
                    {sub.subscription.currentPeriodEnd && (
                      <p className="text-white/30 font-mono text-xs mt-2">
                        Renews{" "}
                        {new Intl.DateTimeFormat("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(sub.subscription.currentPeriodEnd))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06] pt-4 flex flex-wrap gap-3">
                <button
                  onClick={openPortal}
                  disabled={portalLoading || !sub.hasSubscription}
                  className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4" />
                  {portalLoading ? "Opening…" : "Manage Billing"}
                </button>
                {!sub.hasSubscription && (
                  <a
                    href="/pricing"
                    className="bg-white/[0.04] border border-white/[0.06] text-white/70 font-mono text-sm rounded-sm px-4 py-2 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                  >
                    View Plans
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Invoice History */}
            {invoices.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="text-white/90 font-mono font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00F5FF]" />
                    Invoice History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {["Invoice", "Date", "Amount", "Status", ""].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-white/30 font-mono text-xs uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 text-white/70 font-mono text-sm">
                            {inv.number ?? inv.id.slice(0, 12)}
                          </td>
                          <td className="px-6 py-4 text-white/40 font-mono text-sm">
                            {formatDate(inv.created)}
                          </td>
                          <td className="px-6 py-4 text-white/90 font-mono text-sm font-semibold">
                            {formatAUD(inv.amount)}
                          </td>
                          <td className="px-6 py-4">{statusBadge(inv.status)}</td>
                          <td className="px-6 py-4">
                            {inv.invoicePdf && (
                              <a
                                href={inv.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00F5FF]/70 hover:text-[#00F5FF] font-mono text-xs flex items-center gap-1 transition-colors"
                              >
                                <DownloadCloud className="h-4 w-4" />
                                PDF
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {sub.hasSubscription && invoices.length === 0 && !loading && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm px-6 py-8 text-center">
                <p className="text-white/30 font-mono text-sm">No invoices yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
