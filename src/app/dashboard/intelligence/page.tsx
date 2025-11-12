"use client";

import { HotLeadsPanel } from "@/components/HotLeadsPanel";

export default function IntelligencePage() {
  // In a real app, get workspace ID from session/context
  const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || "demo-workspace-id";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Contact Intelligence Dashboard
          </h1>
          <p className="text-slate-400">
            AI-powered insights and hot lead detection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hot Leads Panel - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <HotLeadsPanel workspaceId={workspaceId} />
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">
                Intelligence Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Total Contacts</p>
                  <p className="text-2xl font-bold text-white">247</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Hot Leads</p>
                  <p className="text-2xl font-bold text-yellow-400">12</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Analyzed This Week</p>
                  <p className="text-2xl font-bold text-blue-400">48</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Avg. AI Score</p>
                  <p className="text-2xl font-bold text-green-400">68</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="pb-3 border-b border-slate-700">
                  <p className="text-white">Contact analyzed</p>
                  <p className="text-slate-400 text-xs">Sarah Chen - 2 min ago</p>
                </div>
                <div className="pb-3 border-b border-slate-700">
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
    </div>
  );
}
