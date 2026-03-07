"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Users, Briefcase, Megaphone, CheckSquare, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Stats {
  contacts: number;
  deals: number;
  campaigns: number;
  tasks: number;
}

const STAT_CARDS = [
  { label: "Contacts", key: "contacts" as const, icon: Users, href: "/dashboard/contacts", color: "#00F5FF" },
  { label: "Active Deals", key: "deals" as const, icon: Briefcase, href: "/dashboard/deals", color: "#00FF88" },
  { label: "Campaigns", key: "campaigns" as const, icon: Megaphone, href: "/dashboard/campaigns", color: "#FFB800" },
  { label: "Open Tasks", key: "tasks" as const, icon: CheckSquare, href: "/dashboard/tasks", color: "#FF4444" },
];

export default function OverviewPage() {
  const { user, currentOrganization } = useAuth();
  const [stats, setStats] = useState<Stats>({ contacts: 0, deals: 0, campaigns: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization?.org_id) return;

    async function fetchStats() {
      const supabase = createClient();
      const orgId = currentOrganization!.org_id;

      const [contacts, deals, campaigns, tasks] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("workspace_id", orgId),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("workspace_id", orgId).eq("status", "open"),
        supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("workspace_id", orgId),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("workspace_id", orgId).eq("status", "open"),
      ]);

      setStats({
        contacts: contacts.count ?? 0,
        deals: deals.count ?? 0,
        campaigns: campaigns.count ?? 0,
        tasks: tasks.count ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, [currentOrganization]);

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white/90">
          Welcome back, {firstName}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {currentOrganization?.name ?? "Your workspace"} · CRM Overview
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            >
              <Link
                href={card.href}
                className="group block rounded-sm border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] hover:bg-white/[0.04] transition-colors"
                style={{ borderLeft: `2px solid ${card.color}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                  <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white/90 font-mono">
                  {loading ? "—" : stats[card.key].toLocaleString()}
                </p>
                <p className="text-xs text-white/40 mt-1">{card.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        className="rounded-sm border border-white/[0.06] bg-white/[0.02] p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-[#00F5FF]" />
          <h2 className="text-sm font-medium text-white/70">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Contact", href: "/dashboard/contacts" },
            { label: "New Campaign", href: "/dashboard/campaigns" },
            { label: "Send Email", href: "/dashboard/emails" },
            { label: "View Analytics", href: "/dashboard/analytics" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-sm border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/60 hover:text-white/90 hover:border-white/[0.12] hover:bg-white/[0.04] transition-colors text-center"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
