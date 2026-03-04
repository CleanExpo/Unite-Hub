"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, Key, ExternalLink, GitBranch, CheckCircle2,
  AlertCircle, XCircle, RefreshCw, Copy, Eye, EyeOff,
  Settings, Activity, DollarSign, Users, Zap, Link2,
  BarChart3, Clock, ArrowUpRight, Shield,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectedProject {
  id: string;
  key: string;
  name: string;
  description: string;
  status: "active" | "setup" | "error" | "inactive";
  vercelUrl?: string;
  githubRepo: string;
  linearIssues: number;
  apiKeySet: boolean;
  lastHealthCheck?: string;
  health: "healthy" | "degraded" | "down" | "unknown";
  mrr: number;
  customers: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const projects: ConnectedProject[] = [
  {
    id: "1", key: "synthex", name: "Synthex",
    description: "Social media management SaaS — $249/$449/$799 AUD/mo",
    status: "setup", vercelUrl: "https://synthex.vercel.app",
    githubRepo: "CleanExpo/Synthex", linearIssues: 50,
    apiKeySet: false, health: "unknown", mrr: 0, customers: 0,
  },
  {
    id: "2", key: "disaster-recovery", name: "Disaster Recovery",
    description: "ANZ cleaning & restoration authority platform",
    status: "active", vercelUrl: "https://disaster-recovery-seven.vercel.app",
    githubRepo: "CleanExpo/Disaster-Recovery", linearIssues: 64,
    apiKeySet: false, health: "unknown", mrr: 0, customers: 0,
  },
  {
    id: "3", key: "restore-assist", name: "RestoreAssist",
    description: "Training & certification platform",
    status: "active", vercelUrl: "https://restore-assist-backend.vercel.app",
    githubRepo: "CleanExpo/RestoreAssist", linearIssues: 24,
    apiKeySet: false, health: "unknown", mrr: 0, customers: 0,
  },
  {
    id: "4", key: "ccw", name: "CCW",
    description: "Carpet Cleaners Warehouse — ERP/CRM",
    status: "setup", githubRepo: "CleanExpo/CCW-CRM", linearIssues: 22,
    apiKeySet: false, health: "unknown", mrr: 0, customers: 0,
  },
  {
    id: "5", key: "ato-ai", name: "ATO AI",
    description: "AI-powered tax compliance tool",
    status: "setup", githubRepo: "CleanExpo/ATO", linearIssues: 25,
    apiKeySet: false, health: "unknown", mrr: 0, customers: 0,
  },
  {
    id: "6", key: "dr-nrpg", name: "DR / NRPG",
    description: "National Remediation & Property Group — operations",
    status: "active", githubRepo: "CleanExpo/DR-NRPG", linearIssues: 0,
    apiKeySet: false, health: "unknown", mrr: 0, customers: 0,
  },
];

// ─── Status Helpers ──────────────────────────────────────────────────────────

const statusConfig = {
  active: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  setup: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Settings },
  error: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  inactive: { color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: AlertCircle },
};

const healthConfig = {
  healthy: { color: "text-emerald-400", label: "Healthy" },
  degraded: { color: "text-amber-400", label: "Degraded" },
  down: { color: "text-red-400", label: "Down" },
  unknown: { color: "text-zinc-500", label: "Not Connected" },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const totalMRR = projects.reduce((sum, p) => sum + p.mrr, 0);
  const totalIssues = projects.reduce((sum, p) => sum + p.linearIssues, 0);
  const connectedCount = projects.filter((p) => p.apiKeySet).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="w-6 h-6 text-blue-400" />
          Connected Projects
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage API connections to all your projects. Each project connects via a unique API key.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Building2 className="w-3.5 h-3.5" /> Projects
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-xs text-slate-500">{connectedCount} connected</div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Total MRR
          </div>
          <div className="text-2xl font-bold text-emerald-400">${totalMRR.toLocaleString()}</div>
          <div className="text-xs text-slate-500">across all projects</div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-3.5 h-3.5" /> Linear Issues
          </div>
          <div className="text-2xl font-bold text-white">{totalIssues}</div>
          <div className="text-xs text-slate-500">active across projects</div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Shield className="w-3.5 h-3.5" /> API Keys
          </div>
          <div className="text-2xl font-bold text-amber-400">{connectedCount}/{projects.length}</div>
          <div className="text-xs text-slate-500">configured</div>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-blue-500/5 border-blue-500/20 p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" /> How Project Connections Work
        </h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>1. Generate an API key for each project below</p>
          <p>2. Add <code className="text-blue-300 bg-blue-500/10 px-1 rounded">UNITE_HUB_API_KEY=your-key</code> to each project's environment variables</p>
          <p>3. Each project calls <code className="text-blue-300 bg-blue-500/10 px-1 rounded">POST /api/project-connect</code> to push health, events, and revenue data</p>
          <p>4. Unite-Hub pulls everything into your Founder Dashboard — one view, all businesses</p>
        </div>
      </Card>

      {/* Project Cards */}
      <div className="space-y-4">
        {projects.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          const health = healthConfig[project.health];

          return (
            <Card key={project.id} className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-slate-500">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${statusConfig[project.status].color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {project.status}
                    </Badge>
                    <span className={`text-xs ${health.color}`}>{health.label}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">${project.mrr.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">MRR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{project.customers}</div>
                    <div className="text-[10px] text-slate-500">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{project.linearIssues}</div>
                    <div className="text-[10px] text-slate-500">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${project.apiKeySet ? "text-emerald-400" : "text-amber-400"}`}>
                      {project.apiKeySet ? "✓" : "—"}
                    </div>
                    <div className="text-[10px] text-slate-500">API Key</div>
                  </div>
                </div>

                {/* Links & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    {project.vercelUrl && (
                      <a href={project.vercelUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Live
                      </a>
                    )}
                    <a href={`https://github.com/${project.githubRepo}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors">
                      <GitBranch className="w-3 h-3" /> GitHub
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-400 hover:text-white">
                      <Key className="w-3 h-3 mr-1" />
                      {project.apiKeySet ? "Rotate Key" : "Generate Key"}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-400 hover:text-white">
                      <RefreshCw className="w-3 h-3 mr-1" /> Test Connection
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-400 hover:text-white">
                      <Settings className="w-3 h-3 mr-1" /> Configure
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Integration Code Snippet */}
      <Card className="bg-slate-900/50 border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Add to Each Project
        </h3>
        <pre className="bg-slate-950 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
{`// app/api/unite-hub/route.ts — Add to each project
import { NextRequest, NextResponse } from 'next/server';

const UNITE_HUB_URL = 'https://unite-hub.vercel.app/api/project-connect';

export async function POST(req: NextRequest) {
  // Verify request is from Unite-Hub
  const key = req.headers.get('x-api-key');
  if (key !== process.env.UNITE_HUB_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Return project health + stats
  return NextResponse.json({
    status: 'healthy',
    mrr: 0, // Pull from your Stripe
    customers: 0, // Pull from your DB
    lastDeploy: new Date().toISOString(),
  });
}

// Call Unite-Hub to push events:
// fetch(UNITE_HUB_URL, {
//   method: 'POST',
//   headers: { 'x-api-key': process.env.UNITE_HUB_API_KEY },
//   body: JSON.stringify({ type: 'event', data: { ... } })
// })`}
        </pre>
      </Card>
    </div>
  );
}
