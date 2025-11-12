"use client";

import { HotLeadsPanel } from "@/components/HotLeadsPanel";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function OverviewPage() {
  const [workspaceId] = useState("default-workspace"); // Get from context

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Workspaces" value="3" icon="👥" />
        <StatCard title="Total Contacts" value="247" icon="📧" />
        <StatCard title="Campaigns" value="12" icon="✍️" />
        <StatCard title="This Month" value="$299" icon="💰" />
      </div>

      {/* Hot Leads (NEW) */}
      <HotLeadsPanel workspaceId={workspaceId} />

      {/* More sections below */}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-sm">{title}</p>
            <span className="text-2xl">{icon}</span>
          </div>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
