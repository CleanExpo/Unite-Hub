"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid, Table2, CalendarDays, Kanban, GalleryHorizontalEnd,
  Plus, Search, Filter, SortAsc, ChevronDown, ChevronRight,
  MoreHorizontal, Star, StarOff, Clock, Tag, User,
  Building2, FileText, Database, Settings, Sparkles,
  TrendingUp, AlertCircle, CheckCircle2, Circle,
  ArrowUpRight, DollarSign, Briefcase, Zap,
  Eye, EyeOff, Pencil, Trash2, Copy, Link2,
  BarChart3, Target, Flame, Rocket, Brain,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "table" | "board" | "calendar" | "gallery";
type DatabaseId = "businesses" | "projects" | "tasks" | "contacts" | "content" | "revenue" | "ideas";

interface DatabaseColumn {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "multi-select" | "date" | "url" | "person" | "status" | "currency" | "progress" | "checkbox";
  options?: { label: string; color: string }[];
  width?: number;
}

interface DatabaseRow {
  id: string;
  cells: Record<string, any>;
  starred?: boolean;
}

interface DatabaseConfig {
  id: DatabaseId;
  name: string;
  icon: React.ReactNode;
  description: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  defaultView: ViewMode;
  groupBy?: string;
}

// ─── Colour Helpers ──────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  "Active": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Planning": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Paused": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Pre-Launch": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Operational": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Integration": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Todo": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Done": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Blocked": "bg-red-500/20 text-red-400 border-red-500/30",
  "Hot": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Urgent": "bg-red-500/20 text-red-400 border-red-500/30",
  "High": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Medium": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Low": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Draft": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Published": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Scheduled": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lead": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Prospect": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Client": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Partner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const priorityIcons: Record<string, React.ReactNode> = {
  "Urgent": <Flame className="w-3.5 h-3.5 text-red-400" />,
  "High": <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />,
  "Medium": <Target className="w-3.5 h-3.5 text-amber-400" />,
  "Low": <Circle className="w-3.5 h-3.5 text-zinc-500" />,
};

// ─── Pre-configured Databases ────────────────────────────────────────────────

const databases: DatabaseConfig[] = [
  {
    id: "businesses",
    name: "Businesses",
    icon: <Building2 className="w-4 h-4" />,
    description: "All 6 businesses — status, revenue, health",
    defaultView: "table",
    columns: [
      { id: "name", name: "Business", type: "text", width: 200 },
      { id: "status", name: "Status", type: "select", options: [
        { label: "Active", color: "emerald" }, { label: "Pre-Launch", color: "purple" },
        { label: "Operational", color: "emerald" }, { label: "Integration", color: "cyan" },
        { label: "Paused", color: "zinc" },
      ]},
      { id: "mrr", name: "MRR", type: "currency" },
      { id: "target", name: "Target MRR", type: "currency" },
      { id: "priority", name: "Priority", type: "select", options: [
        { label: "Urgent", color: "red" }, { label: "High", color: "orange" },
        { label: "Medium", color: "amber" }, { label: "Low", color: "zinc" },
      ]},
      { id: "linear_issues", name: "Linear Issues", type: "number" },
      { id: "next_action", name: "Next Action", type: "text" },
      { id: "owner", name: "Owner", type: "person" },
    ],
    rows: [
      { id: "1", cells: { name: "Synthex", status: "Pre-Launch", mrr: 0, target: 10000, priority: "Urgent", linear_issues: 50, next_action: "Stripe integration + onboarding redesign", owner: "Phill" }, starred: true },
      { id: "2", cells: { name: "DR / NRPG", status: "Operational", mrr: 0, target: 5000, priority: "Urgent", linear_issues: 64, next_action: "Social media accounts + content launch", owner: "Phill" }, starred: true },
      { id: "3", cells: { name: "Unite-Hub", status: "Integration", mrr: 0, target: 3000, priority: "High", linear_issues: 43, next_action: "Founder workspace + Notion-style editor", owner: "Phill" } },
      { id: "4", cells: { name: "RestoreAssist", status: "Active", mrr: 0, target: 2000, priority: "High", linear_issues: 24, next_action: "New to Industry content series", owner: "Phill" } },
      { id: "5", cells: { name: "CCW", status: "Active", mrr: 0, target: 5000, priority: "Medium", linear_issues: 22, next_action: "Deploy staging environment", owner: "Phill" } },
      { id: "6", cells: { name: "ATO AI", status: "Planning", mrr: 0, target: 2000, priority: "Medium", linear_issues: 25, next_action: "Xero OAuth integration", owner: "Phill" } },
    ],
  },
  {
    id: "projects",
    name: "Active Projects",
    icon: <Rocket className="w-4 h-4" />,
    description: "All active builds across businesses",
    defaultView: "board",
    groupBy: "status",
    columns: [
      { id: "name", name: "Project", type: "text", width: 250 },
      { id: "business", name: "Business", type: "select", options: [
        { label: "Synthex", color: "purple" }, { label: "DR/NRPG", color: "blue" },
        { label: "Unite-Hub", color: "cyan" }, { label: "RestoreAssist", color: "emerald" },
        { label: "CCW", color: "amber" }, { label: "ATO AI", color: "orange" },
      ]},
      { id: "status", name: "Status", type: "select", options: [
        { label: "Todo", color: "zinc" }, { label: "In Progress", color: "blue" },
        { label: "In Review", color: "amber" }, { label: "Done", color: "emerald" },
        { label: "Blocked", color: "red" },
      ]},
      { id: "priority", name: "Priority", type: "select", options: [
        { label: "Urgent", color: "red" }, { label: "High", color: "orange" },
        { label: "Medium", color: "amber" }, { label: "Low", color: "zinc" },
      ]},
      { id: "due", name: "Due Date", type: "date" },
      { id: "revenue_impact", name: "Revenue Impact", type: "currency" },
      { id: "assignee", name: "Assignee", type: "person" },
    ],
    rows: [
      { id: "p1", cells: { name: "Synthex Stripe Integration", business: "Synthex", status: "Todo", priority: "Urgent", due: "2026-03-15", revenue_impact: 10000, assignee: "Forge" }, starred: true },
      { id: "p2", cells: { name: "Synthex Onboarding Redesign", business: "Synthex", status: "Todo", priority: "Urgent", due: "2026-03-20", revenue_impact: 10000, assignee: "Forge" }, starred: true },
      { id: "p3", cells: { name: "DR Social Media Launch", business: "DR/NRPG", status: "In Progress", priority: "Urgent", due: "2026-03-10", revenue_impact: 5000, assignee: "Bron" } },
      { id: "p4", cells: { name: "DR AEO Blitz (20 pages)", business: "DR/NRPG", status: "Todo", priority: "High", due: "2026-03-18", revenue_impact: 3000, assignee: "Forge" } },
      { id: "p5", cells: { name: "410 Location Pages", business: "DR/NRPG", status: "Todo", priority: "High", due: "2026-03-25", revenue_impact: 5000, assignee: "Forge" } },
      { id: "p6", cells: { name: "Founder Workspace (Notion-style)", business: "Unite-Hub", status: "In Progress", priority: "High", due: "2026-03-12", revenue_impact: 0, assignee: "Forge" } },
      { id: "p7", cells: { name: "Phill OS → Unite-Hub Integration", business: "Unite-Hub", status: "Todo", priority: "High", due: "2026-03-15", revenue_impact: 0, assignee: "Forge" } },
      { id: "p8", cells: { name: "Statistics Database Seed", business: "DR/NRPG", status: "Todo", priority: "High", due: "2026-03-12", revenue_impact: 2000, assignee: "Bron" } },
      { id: "p9", cells: { name: "WhatsApp Community Launch", business: "DR/NRPG", status: "Todo", priority: "High", due: "2026-03-14", revenue_impact: 1000, assignee: "Phill" } },
      { id: "p10", cells: { name: "Reddit 30-Day Playbook", business: "DR/NRPG", status: "Todo", priority: "Medium", due: "2026-04-03", revenue_impact: 500, assignee: "Bron" } },
      { id: "p11", cells: { name: "New to Industry Content Series", business: "RestoreAssist", status: "Todo", priority: "High", due: "2026-03-20", revenue_impact: 2000, assignee: "Quill" } },
      { id: "p12", cells: { name: "CCW Staging Deploy", business: "CCW", status: "Blocked", priority: "Medium", due: "2026-03-10", revenue_impact: 5000, assignee: "Forge" } },
    ],
  },
  {
    id: "tasks",
    name: "Today's Tasks",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "What needs to happen right now",
    defaultView: "board",
    groupBy: "status",
    columns: [
      { id: "name", name: "Task", type: "text", width: 300 },
      { id: "status", name: "Status", type: "select", options: [
        { label: "Todo", color: "zinc" }, { label: "In Progress", color: "blue" },
        { label: "Done", color: "emerald" }, { label: "Blocked", color: "red" },
      ]},
      { id: "priority", name: "Priority", type: "select", options: [
        { label: "Urgent", color: "red" }, { label: "High", color: "orange" },
        { label: "Medium", color: "amber" },
      ]},
      { id: "business", name: "Business", type: "select", options: [
        { label: "Synthex", color: "purple" }, { label: "DR/NRPG", color: "blue" },
        { label: "Unite-Hub", color: "cyan" }, { label: "RestoreAssist", color: "emerald" },
        { label: "CCW", color: "amber" }, { label: "ATO AI", color: "orange" }, { label: "All", color: "zinc" },
      ]},
      { id: "assignee", name: "Assignee", type: "person" },
      { id: "done", name: "Complete", type: "checkbox" },
    ],
    rows: [
      { id: "t1", cells: { name: "Create DR social media accounts (10 channels)", status: "Todo", priority: "Urgent", business: "DR/NRPG", assignee: "Phill", done: false } },
      { id: "t2", cells: { name: "Sign up Publer ($28/mo)", status: "Todo", priority: "Urgent", business: "All", assignee: "Phill", done: false } },
      { id: "t3", cells: { name: "Sign up Canva Pro ($18/mo)", status: "Todo", priority: "Urgent", business: "All", assignee: "Phill", done: false } },
      { id: "t4", cells: { name: "Provide Stripe API keys", status: "Todo", priority: "Urgent", business: "Synthex", assignee: "Phill", done: false } },
      { id: "t5", cells: { name: "Review 11 Dependabot PRs", status: "Todo", priority: "Medium", business: "Unite-Hub", assignee: "Bron", done: false } },
      { id: "t6", cells: { name: "Fix Linear Guardian cron error", status: "Todo", priority: "Medium", business: "Unite-Hub", assignee: "Bron", done: false } },
    ],
  },
  {
    id: "revenue",
    name: "Revenue Tracker",
    icon: <DollarSign className="w-4 h-4" />,
    description: "Income streams, targets, actuals",
    defaultView: "table",
    columns: [
      { id: "stream", name: "Revenue Stream", type: "text", width: 220 },
      { id: "business", name: "Business", type: "select", options: [
        { label: "Synthex", color: "purple" }, { label: "DR/NRPG", color: "blue" },
        { label: "RestoreAssist", color: "emerald" }, { label: "CCW", color: "amber" },
        { label: "ATO AI", color: "orange" }, { label: "Unite-Hub", color: "cyan" },
      ]},
      { id: "type", name: "Type", type: "select", options: [
        { label: "MRR", color: "emerald" }, { label: "Per Job", color: "blue" },
        { label: "Annual", color: "purple" }, { label: "One-off", color: "amber" },
      ]},
      { id: "current", name: "Current/Mo", type: "currency" },
      { id: "target", name: "Target/Mo", type: "currency" },
      { id: "progress", name: "Progress", type: "progress" },
      { id: "next_milestone", name: "Next Milestone", type: "text" },
    ],
    rows: [
      { id: "r1", cells: { stream: "Synthex Pro ($249/mo)", business: "Synthex", type: "MRR", current: 0, target: 5000, progress: 0, next_milestone: "First 20 subscribers" }, starred: true },
      { id: "r2", cells: { stream: "Synthex Growth ($449/mo)", business: "Synthex", type: "MRR", current: 0, target: 3000, progress: 0, next_milestone: "First 7 subscribers" } },
      { id: "r3", cells: { stream: "Synthex Scale ($799/mo)", business: "Synthex", type: "MRR", current: 0, target: 2000, progress: 0, next_milestone: "First 3 subscribers" } },
      { id: "r4", cells: { stream: "NRPG Restoration Jobs", business: "DR/NRPG", type: "Per Job", current: 0, target: 8000, progress: 0, next_milestone: "Min $2,750 per job" } },
      { id: "r5", cells: { stream: "DR Industry Partners Standard ($49/mo)", business: "DR/NRPG", type: "MRR", current: 0, target: 2000, progress: 0, next_milestone: "First 10 partners" } },
      { id: "r6", cells: { stream: "DR Industry Partners Premium ($149/mo)", business: "DR/NRPG", type: "MRR", current: 0, target: 1500, progress: 0, next_milestone: "First 5 partners" } },
      { id: "r7", cells: { stream: "DR Verified Badge ($99/yr)", business: "DR/NRPG", type: "Annual", current: 0, target: 500, progress: 0, next_milestone: "First 50 badges" } },
      { id: "r8", cells: { stream: "RestoreAssist Training", business: "RestoreAssist", type: "MRR", current: 0, target: 2000, progress: 0, next_milestone: "Launch course platform" } },
      { id: "r9", cells: { stream: "CCW Client Services", business: "CCW", type: "MRR", current: 0, target: 5000, progress: 0, next_milestone: "Deploy staging" } },
      { id: "r10", cells: { stream: "ATO AI Subscriptions", business: "ATO AI", type: "MRR", current: 0, target: 2000, progress: 0, next_milestone: "Xero OAuth integration" } },
    ],
  },
  {
    id: "content",
    name: "Content Pipeline",
    icon: <FileText className="w-4 h-4" />,
    description: "Social posts, articles, videos — all brands",
    defaultView: "board",
    groupBy: "status",
    columns: [
      { id: "title", name: "Content", type: "text", width: 280 },
      { id: "brand", name: "Brand", type: "select", options: [
        { label: "DR", color: "blue" }, { label: "NRPG", color: "cyan" },
        { label: "RestoreAssist", color: "emerald" }, { label: "Synthex", color: "purple" },
      ]},
      { id: "platform", name: "Platform", type: "multi-select", options: [
        { label: "LinkedIn", color: "blue" }, { label: "Instagram", color: "pink" },
        { label: "TikTok", color: "zinc" }, { label: "Facebook", color: "blue" },
        { label: "Reddit", color: "orange" }, { label: "YouTube", color: "red" },
        { label: "X/Twitter", color: "zinc" },
      ]},
      { id: "status", name: "Status", type: "select", options: [
        { label: "Draft", color: "zinc" }, { label: "In Review", color: "amber" },
        { label: "Scheduled", color: "blue" }, { label: "Published", color: "emerald" },
      ]},
      { id: "type", name: "Type", type: "select", options: [
        { label: "Article", color: "blue" }, { label: "Stat Card", color: "emerald" },
        { label: "Myth-Buster", color: "red" }, { label: "Poll", color: "amber" },
        { label: "Video Script", color: "purple" }, { label: "Reddit Post", color: "orange" },
      ]},
      { id: "publish_date", name: "Publish Date", type: "date" },
      { id: "assignee", name: "Writer", type: "person" },
    ],
    rows: [
      { id: "c1", cells: { title: "50% of Australian Homes Have Mould (LinkedIn Article)", brand: "DR", platform: ["LinkedIn"], status: "Draft", type: "Article", publish_date: "", assignee: "Quill" } },
      { id: "c2", cells: { title: "Australia's $3.5 Billion Weather Bill (LinkedIn Article)", brand: "DR", platform: ["LinkedIn"], status: "Draft", type: "Article", publish_date: "", assignee: "Quill" } },
      { id: "c3", cells: { title: "Mould Prevalence Stat Card", brand: "DR", platform: ["Instagram", "LinkedIn", "Facebook"], status: "Draft", type: "Stat Card", publish_date: "", assignee: "Pixel" } },
      { id: "c4", cells: { title: "Weather Cost Stat Card", brand: "DR", platform: ["Instagram", "LinkedIn", "Facebook"], status: "Draft", type: "Stat Card", publish_date: "", assignee: "Pixel" } },
      { id: "c5", cells: { title: "Myth: Bleach Kills All Mould (TikTok/Reel)", brand: "DR", platform: ["TikTok", "Instagram"], status: "Draft", type: "Myth-Buster", publish_date: "", assignee: "Quill" } },
      { id: "c6", cells: { title: "CSIRO Mould Study Discussion (Reddit)", brand: "DR", platform: ["Reddit"], status: "Draft", type: "Reddit Post", publish_date: "", assignee: "Bron" } },
    ],
  },
  {
    id: "contacts",
    name: "Network",
    icon: <User className="w-4 h-4" />,
    description: "Leads, partners, industry contacts",
    defaultView: "table",
    columns: [
      { id: "name", name: "Name", type: "text", width: 180 },
      { id: "company", name: "Company", type: "text" },
      { id: "type", name: "Type", type: "select", options: [
        { label: "Lead", color: "blue" }, { label: "Prospect", color: "amber" },
        { label: "Client", color: "emerald" }, { label: "Partner", color: "purple" },
      ]},
      { id: "business", name: "Related Business", type: "select", options: [
        { label: "Synthex", color: "purple" }, { label: "DR/NRPG", color: "blue" },
        { label: "RestoreAssist", color: "emerald" }, { label: "CCW", color: "amber" },
      ]},
      { id: "last_contact", name: "Last Contact", type: "date" },
      { id: "next_action", name: "Next Action", type: "text" },
      { id: "value", name: "Est. Value", type: "currency" },
    ],
    rows: [],
  },
  {
    id: "ideas",
    name: "Ideas Bank",
    icon: <Brain className="w-4 h-4" />,
    description: "Capture, evaluate, promote to projects",
    defaultView: "gallery",
    columns: [
      { id: "title", name: "Idea", type: "text", width: 250 },
      { id: "business", name: "Business", type: "select", options: [
        { label: "Synthex", color: "purple" }, { label: "DR/NRPG", color: "blue" },
        { label: "Unite-Hub", color: "cyan" }, { label: "RestoreAssist", color: "emerald" },
        { label: "CCW", color: "amber" }, { label: "ATO AI", color: "orange" }, { label: "New", color: "zinc" },
      ]},
      { id: "potential", name: "Revenue Potential", type: "select", options: [
        { label: "High", color: "emerald" }, { label: "Medium", color: "amber" }, { label: "Low", color: "zinc" },
      ]},
      { id: "effort", name: "Effort", type: "select", options: [
        { label: "Quick Win", color: "emerald" }, { label: "Medium Build", color: "amber" }, { label: "Major Project", color: "red" },
      ]},
      { id: "status", name: "Status", type: "select", options: [
        { label: "Captured", color: "zinc" }, { label: "Evaluating", color: "amber" },
        { label: "Promoted", color: "emerald" }, { label: "Parked", color: "zinc" },
      ]},
      { id: "notes", name: "Notes", type: "text" },
      { id: "captured", name: "Captured", type: "date" },
    ],
    rows: [
      { id: "i1", cells: { title: "AI Video Ads via Kling + Nano Banana", business: "Synthex", potential: "High", effort: "Medium Build", status: "Evaluating", notes: "Kling ~$1/10s, can produce client video ads at scale", captured: "2026-03-04" } },
      { id: "i2", cells: { title: "DR Verified Badge Program ($99/yr)", business: "DR/NRPG", potential: "High", effort: "Medium Build", status: "Evaluating", notes: "500 partners × $99 = $49,500/yr + backlinks", captured: "2026-03-04" } },
      { id: "i3", cells: { title: "Programmatic SEO — 410 Location Pages", business: "DR/NRPG", potential: "High", effort: "Quick Win", status: "Promoted", notes: "Data generated, just needs Forge to build routes", captured: "2026-03-04" } },
      { id: "i4", cells: { title: "WhatsApp Community for DR Industry", business: "DR/NRPG", potential: "Medium", effort: "Quick Win", status: "Promoted", notes: "98% open rate, free, spec written", captured: "2026-03-04" } },
      { id: "i5", cells: { title: "Meeting Recorder App", business: "Unite-Hub", potential: "Medium", effort: "Major Project", status: "Parked", notes: "Useful but not revenue priority right now", captured: "2026-03-04" } },
    ],
  },
];

// ─── Cell Renderer ───────────────────────────────────────────────────────────

function CellValue({ column, value }: { column: DatabaseColumn; value: any }) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-zinc-600">—</span>;
  }

  switch (column.type) {
    case "select":
      return (
        <Badge variant="outline" className={`text-xs font-medium border ${statusColors[value] || "bg-zinc-700/50 text-zinc-300 border-zinc-600"}`}>
          {priorityIcons[value] && <span className="mr-1">{priorityIcons[value]}</span>}
          {value}
        </Badge>
      );
    case "multi-select":
      return (
        <div className="flex gap-1 flex-wrap">
          {(Array.isArray(value) ? value : [value]).map((v: string) => (
            <Badge key={v} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{v}</Badge>
          ))}
        </div>
      );
    case "currency":
      return (
        <span className={`font-mono text-sm ${Number(value) > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
          ${Number(value).toLocaleString()}
        </span>
      );
    case "progress":
      return (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, Number(value))}%` }} />
          </div>
          <span className="text-xs text-zinc-500 font-mono">{value}%</span>
        </div>
      );
    case "checkbox":
      return (
        <div className={`w-4 h-4 rounded border ${value ? "bg-emerald-500 border-emerald-500" : "border-zinc-600"} flex items-center justify-center`}>
          {value && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
      );
    case "date":
      if (!value) return <span className="text-zinc-600">—</span>;
      return <span className="text-xs text-zinc-400">{value}</span>;
    case "person":
      const personColors: Record<string, string> = {
        "Phill": "bg-blue-500", "Bron": "bg-red-500", "Forge": "bg-amber-500",
        "Quill": "bg-emerald-500", "Sage": "bg-purple-500", "Pixel": "bg-pink-500",
        "Lens": "bg-cyan-500", "Atlas": "bg-orange-500",
      };
      return (
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${personColors[value] || "bg-zinc-600"} flex items-center justify-center text-[10px] font-bold text-white`}>
            {value?.[0]}
          </div>
          <span className="text-xs text-zinc-300">{value}</span>
        </div>
      );
    case "number":
      return <span className="font-mono text-sm text-zinc-300">{Number(value).toLocaleString()}</span>;
    default:
      return <span className="text-sm text-zinc-300 truncate">{String(value)}</span>;
  }
}

// ─── Table View ──────────────────────────────────────────────────────────────

function TableView({ db }: { db: DatabaseConfig }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="w-8 px-2 py-2" />
            {db.columns.map((col) => (
              <th key={col.id} className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider" style={{ minWidth: col.width }}>
                {col.name}
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {db.rows.map((row) => (
            <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group">
              <td className="px-2 py-2.5">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {row.starred ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <StarOff className="w-3.5 h-3.5 text-zinc-600" />}
                </button>
              </td>
              {db.columns.map((col) => (
                <td key={col.id} className="px-3 py-2.5">
                  <CellValue column={col} value={row.cells[col.id]} />
                </td>
              ))}
              <td className="px-2">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors flex items-center justify-center gap-1">
        <Plus className="w-3 h-3" /> New row
      </button>
    </div>
  );
}

// ─── Board View ──────────────────────────────────────────────────────────────

function BoardView({ db }: { db: DatabaseConfig }) {
  const groupCol = db.columns.find((c) => c.id === (db.groupBy || "status"));
  if (!groupCol || !groupCol.options) return <TableView db={db} />;

  const groups = groupCol.options.map((opt) => ({
    ...opt,
    rows: db.rows.filter((r) => r.cells[groupCol.id] === opt.label),
  }));

  const titleCol = db.columns[0];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 px-1">
      {groups.map((group) => (
        <div key={group.label} className="flex-shrink-0 w-72">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Badge variant="outline" className={`text-xs ${statusColors[group.label] || "text-zinc-400 border-zinc-700"}`}>
              {group.label}
            </Badge>
            <span className="text-xs text-zinc-600">{group.rows.length}</span>
          </div>
          <div className="space-y-2">
            {group.rows.map((row) => (
              <Card key={row.id} className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 p-3 cursor-pointer transition-colors">
                <div className="text-sm text-zinc-200 font-medium mb-2">{row.cells[titleCol.id]}</div>
                <div className="flex flex-wrap gap-1.5">
                  {db.columns.slice(1).filter(c => c.id !== groupCol.id).map((col) => {
                    const val = row.cells[col.id];
                    if (!val || val === "" || (Array.isArray(val) && val.length === 0)) return null;
                    return (
                      <div key={col.id}>
                        <CellValue column={col} value={val} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
            <button className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1 rounded border border-dashed border-zinc-800 hover:border-zinc-700">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Gallery View ────────────────────────────────────────────────────────────

function GalleryView({ db }: { db: DatabaseConfig }) {
  const titleCol = db.columns[0];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-1">
      {db.rows.map((row) => (
        <Card key={row.id} className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 p-4 cursor-pointer transition-colors">
          <div className="text-sm font-semibold text-zinc-200 mb-3">{row.cells[titleCol.id]}</div>
          <div className="space-y-2">
            {db.columns.slice(1).map((col) => {
              const val = row.cells[col.id];
              if (!val || val === "") return null;
              return (
                <div key={col.id} className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">{col.name}</span>
                  <CellValue column={col} value={val} />
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      <Card className="border-dashed border-zinc-800 hover:border-zinc-700 p-4 cursor-pointer transition-colors flex items-center justify-center text-zinc-600 hover:text-zinc-400">
        <Plus className="w-5 h-5 mr-1" /> New
      </Card>
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView({ db }: { db: DatabaseConfig }) {
  const dateCol = db.columns.find((c) => c.type === "date");
  if (!dateCol) return <TableView db={db} />;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleString("en-AU", { month: "long", year: "numeric" });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="px-1">
      <div className="text-sm font-medium text-zinc-300 mb-3">{monthName}</div>
      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-lg overflow-hidden">
        {dayNames.map((d) => (
          <div key={d} className="bg-zinc-900 px-2 py-1.5 text-[10px] font-medium text-zinc-500 text-center">{d}</div>
        ))}
        {days.map((day, i) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const items = day ? db.rows.filter((r) => r.cells[dateCol.id] === dateStr) : [];
          const isToday = day === today.getDate();
          return (
            <div key={i} className={`bg-zinc-900/80 min-h-[80px] p-1 ${isToday ? "ring-1 ring-blue-500/50" : ""}`}>
              {day && (
                <>
                  <div className={`text-[11px] mb-1 ${isToday ? "text-blue-400 font-bold" : "text-zinc-500"}`}>{day}</div>
                  {items.slice(0, 2).map((item) => (
                    <div key={item.id} className="text-[10px] text-zinc-300 bg-zinc-800 rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:bg-zinc-700">
                      {item.cells[db.columns[0].id]}
                    </div>
                  ))}
                  {items.length > 2 && <div className="text-[9px] text-zinc-600">+{items.length - 2} more</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── View Switcher ───────────────────────────────────────────────────────────

const viewIcons: Record<ViewMode, React.ReactNode> = {
  table: <Table2 className="w-3.5 h-3.5" />,
  board: <Kanban className="w-3.5 h-3.5" />,
  calendar: <CalendarDays className="w-3.5 h-3.5" />,
  gallery: <GalleryHorizontalEnd className="w-3.5 h-3.5" />,
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FounderWorkspacePage() {
  const [activeDb, setActiveDb] = useState<DatabaseId>("businesses");
  const [views, setViews] = useState<Record<DatabaseId, ViewMode>>(
    Object.fromEntries(databases.map((d) => [d.id, d.defaultView])) as Record<DatabaseId, ViewMode>
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const db = databases.find((d) => d.id === activeDb)!;
  const currentView = views[activeDb];

  const setView = (view: ViewMode) => {
    setViews((prev) => ({ ...prev, [activeDb]: view }));
  };

  const renderView = () => {
    switch (currentView) {
      case "table": return <TableView db={db} />;
      case "board": return <BoardView db={db} />;
      case "calendar": return <CalendarView db={db} />;
      case "gallery": return <GalleryView db={db} />;
    }
  };

  // Quick stats
  const totalRevTarget = databases.find(d => d.id === "revenue")?.rows.reduce((sum, r) => sum + (Number(r.cells.target) || 0), 0) || 0;
  const totalIssues = databases.find(d => d.id === "businesses")?.rows.reduce((sum, r) => sum + (Number(r.cells.linear_issues) || 0), 0) || 0;
  const todoTasks = databases.find(d => d.id === "tasks")?.rows.filter(r => r.cells.status === "Todo").length || 0;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex">
      {/* ─── Sidebar ─── */}
      <aside className={`${sidebarCollapsed ? "w-12" : "w-64"} border-r border-zinc-800 bg-zinc-950/50 flex flex-col transition-all duration-200`}>
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-[10px] font-bold">P</div>
              <span className="text-sm font-semibold">Phill's Workspace</span>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 hover:bg-zinc-800 rounded">
            <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Quick Stats */}
            <div className="p-3 border-b border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Target MRR</span>
                <span className="text-emerald-400 font-mono">${totalRevTarget.toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Active Issues</span>
                <span className="text-zinc-300 font-mono">{totalIssues}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Today's Tasks</span>
                <span className="text-amber-400 font-mono">{todoTasks} todo</span>
              </div>
            </div>

            {/* Database List */}
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 py-1.5">Databases</div>
              {databases.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDb(d.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    activeDb === d.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  {d.icon}
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto text-[10px] text-zinc-600">{d.rows.length}</span>
                </button>
              ))}

              <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 py-1.5 mt-4">Quick Links</div>
              <a href="/founder/os" className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200">
                <Zap className="w-4 h-4" />
                <span>Phill OS</span>
              </a>
              <a href="/founder" className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200">
                <LayoutGrid className="w-4 h-4" />
                <span>Founder Dashboard</span>
              </a>
              <a href="/founder/businesses" className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200">
                <Building2 className="w-4 h-4" />
                <span>God Mode</span>
              </a>
            </nav>
          </>
        )}
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-zinc-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {db.icon}
              <div>
                <h1 className="text-lg font-semibold">{db.name}</h1>
                <p className="text-xs text-zinc-500">{db.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                {(Object.keys(viewIcons) as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                      currentView === v
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {viewIcons[v]}
                    <span className="hidden sm:inline capitalize">{v}</span>
                  </button>
                ))}
              </div>

              {/* Filter + Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <Input
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-40 bg-zinc-900 border-zinc-800 text-sm"
                />
              </div>

              <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-zinc-400 hover:text-zinc-200">
                <Filter className="w-3.5 h-3.5 mr-1" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-zinc-400 hover:text-zinc-200">
                <SortAsc className="w-3.5 h-3.5 mr-1" /> Sort
              </Button>
              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> New
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
