"use client";

import { HotLeadsPanel } from "@/components/HotLeadsPanel";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function IntelligencePage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 text-center">
          <p className="text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-4">No workspace selected</p>
          <p className="text-sm text-slate-500">Please create or select a workspace to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Contact Intelligence" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Contact Intelligence
          </h1>
          <p className="text-slate-400">
            AI-powered insights and hot lead detection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Leads Panel - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <HotLeadsPanel workspaceId={workspaceId} />
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">
              Intelligence Stats
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Total Contacts</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">247</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Hot Leads</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">12</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Analyzed This Week</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">48</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Avg. AI Score</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">68</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="pb-3 border-b border-slate-700/50">
                <p className="text-white">Contact analyzed</p>
                <p className="text-slate-400 text-xs">Sarah Chen - 2 min ago</p>
              </div>
              <div className="pb-3 border-b border-slate-700/50">
                <p className="text-white">New hot lead detected</p>
                <p className="text-slate-400 text-xs">Mike Johnson - 15 min ago</p>
              </div>
              <div className="pb-3">
                <p className="text-white">Workspace analyzed</p>
                <p className="text-slate-400 text-xs">10 contacts - 1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
