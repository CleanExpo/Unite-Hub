"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProjectEvent {
  id: string;
  project_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "inventory", label: "Inventory", icon: "📊" },
  { id: "compliance", label: "Compliance", icon: "🏛️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_COLOURS: Record<string, string> = {
  completed: "#00FF88",
  paid: "#00FF88",
  submitted: "#00F5FF",
  acknowledged: "#00F5FF",
  pending: "#FFB800",
  draft: "#FFB800",
  processing: "#FFB800",
  failed: "#FF4444",
  rejected: "#FF4444",
  cancelled: "#FF4444",
  assessed: "#00FF88",
  active: "#00FF88",
};

function statusColour(status: string): string {
  return STATUS_COLOURS[status.toLowerCase()] ?? "#888";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ConnectorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/project-connect/events");
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      } else {
        setError(data.error ?? "Failed to load events");
      }
    } catch {
      setError("Failed to fetch connector events");
    } finally {
      setLoading(false);
    }
  };

  const orderEvents = events.filter((e) => e.event_type === "order_event");
  const inventoryEvents = events.filter((e) => e.event_type === "inventory_update");
  const complianceEvents = events.filter((e) => e.event_type === "compliance_event");

  const activeEvents =
    activeTab === "orders"
      ? orderEvents
      : activeTab === "inventory"
        ? inventoryEvents
        : complianceEvents;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-mono text-[#00F5FF] tracking-tight">
            Connectors
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            External system events — orders, inventory, compliance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 pb-px">
          {TABS.map((tab) => {
            const count =
              tab.id === "orders"
                ? orderEvents.length
                : tab.id === "inventory"
                  ? inventoryEvents.length
                  : complianceEvents.length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "px-4 py-2.5 text-sm font-mono rounded-sm transition-colors flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30"
                    : "text-white/40 hover:text-white/70 border border-transparent",
                ].join(" ")}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span className="text-xs text-white/25 ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-sm border border-[#FF4444]/40 bg-[#FF4444]/10 text-[#FF4444] text-sm font-mono">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && activeEvents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30 font-mono text-sm">
              No {activeTab} events received yet
            </p>
            <p className="text-white/15 font-mono text-xs mt-2">
              POST to /api/connectors/{activeTab === "orders" ? "orders" : activeTab === "inventory" ? "inventory" : "compliance"} with x-api-key header
            </p>
          </div>
        )}

        {/* Events List */}
        {!loading && activeEvents.length > 0 && (
          <div className="space-y-3">
            {activeEvents.slice(0, 20).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="bg-[#0A0A0A] border border-[#00F5FF]/10 rounded-sm p-4 hover:border-[#00F5FF]/25 transition-colors"
              >
                {activeTab === "orders" && <OrderCard payload={event.payload} createdAt={event.created_at} />}
                {activeTab === "inventory" && <InventoryCard payload={event.payload} createdAt={event.created_at} />}
                {activeTab === "compliance" && <ComplianceCard payload={event.payload} createdAt={event.created_at} />}
              </motion.div>
            ))}
          </div>
        )}

        {/* Nexus Branding */}
        <div className="text-xs text-[#444] text-center py-2">
          Part of <span className="text-[#00F5FF]">Unite-Group Nexus</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-cards ──────────────────────────────────────────────────────────────

function OrderCard({ payload, createdAt }: { payload: Record<string, unknown>; createdAt: string }) {
  const p = payload as {
    orderId?: string;
    status?: string;
    total?: number;
    currency?: string;
    customer?: string;
    lineItems?: { sku: string; name: string; quantity: number }[];
    projectSlug?: string;
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white">{p.orderId ?? "—"}</span>
          {p.status && (
            <span
              className="px-2 py-0.5 rounded-sm text-xs font-mono border"
              style={{
                color: statusColour(p.status),
                borderColor: `${statusColour(p.status)}40`,
                backgroundColor: `${statusColour(p.status)}10`,
              }}
            >
              {p.status}
            </span>
          )}
          {p.projectSlug && (
            <span className="text-xs font-mono text-white/20">{p.projectSlug}</span>
          )}
        </div>
        {p.customer && (
          <p className="text-xs font-mono text-white/40">{p.customer}</p>
        )}
        {p.lineItems && p.lineItems.length > 0 && (
          <p className="text-xs font-mono text-white/25">
            {p.lineItems.length} item{p.lineItems.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        {p.total != null && (
          <p className="font-mono text-sm text-[#00FF88]">
            {formatCurrency(p.total, (p.currency as string) ?? "AUD")}
          </p>
        )}
        <p className="text-xs font-mono text-white/20 mt-1">{formatDate(createdAt)}</p>
      </div>
    </div>
  );
}

function InventoryCard({ payload, createdAt }: { payload: Record<string, unknown>; createdAt: string }) {
  const p = payload as {
    items?: { sku: string; name: string; quantity: number; location: string }[];
    itemCount?: number;
    projectSlug?: string;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white">
            {p.itemCount ?? p.items?.length ?? 0} items updated
          </span>
          {p.projectSlug && (
            <span className="text-xs font-mono text-white/20">{p.projectSlug}</span>
          )}
        </div>
        <span className="text-xs font-mono text-white/20">{formatDate(createdAt)}</span>
      </div>
      {p.items && p.items.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-xs font-mono text-white/30">
          <span className="text-white/15">SKU</span>
          <span className="text-white/15">Name</span>
          <span className="text-white/15">Qty</span>
          <span className="text-white/15">Location</span>
          {p.items.slice(0, 5).map((item, i) => (
            <React.Fragment key={i}>
              <span className="text-white/50">{item.sku}</span>
              <span className="text-white/50">{item.name}</span>
              <span className="text-white/50">{item.quantity}</span>
              <span className="text-white/50">{item.location}</span>
            </React.Fragment>
          ))}
          {p.items.length > 5 && (
            <span className="col-span-4 text-white/15">
              +{p.items.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ComplianceCard({ payload, createdAt }: { payload: Record<string, unknown>; createdAt: string }) {
  const p = payload as {
    complianceType?: string;
    period?: string;
    status?: string;
    amount?: number | null;
    reference?: string | null;
    projectSlug?: string;
  };

  const typeLabels: Record<string, string> = {
    bas: "BAS Lodgement",
    stp: "STP Submission",
    ato_submission: "ATO Submission",
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white">
            {typeLabels[p.complianceType ?? ""] ?? p.complianceType ?? "Unknown"}
          </span>
          {p.status && (
            <span
              className="px-2 py-0.5 rounded-sm text-xs font-mono border"
              style={{
                color: statusColour(p.status),
                borderColor: `${statusColour(p.status)}40`,
                backgroundColor: `${statusColour(p.status)}10`,
              }}
            >
              {p.status}
            </span>
          )}
          {p.projectSlug && (
            <span className="text-xs font-mono text-white/20">{p.projectSlug}</span>
          )}
        </div>
        {p.period && (
          <p className="text-xs font-mono text-white/40">Period: {p.period}</p>
        )}
        {p.reference && (
          <p className="text-xs font-mono text-white/25">Ref: {p.reference}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        {p.amount != null && (
          <p className="font-mono text-sm text-[#00FF88]">{formatCurrency(p.amount)}</p>
        )}
        <p className="text-xs font-mono text-white/20 mt-1">{formatDate(createdAt)}</p>
      </div>
    </div>
  );
}
