"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Network,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  Settings,
  Activity,
  Globe,
  Zap,
} from "lucide-react";

const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;

type ConnectionStatus = "CONNECTED" | "PENDING" | "OFFLINE" | "CONFIGURING";

interface BusinessApp {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: ConnectionStatus;
  category: string;
  colour: string;
  features: string[];
  apiEndpoint: string | null;
  lastSync: string | null;
}

const ECOSYSTEM: BusinessApp[] = [
  {
    id: "disaster-recovery",
    name: "Disaster Recovery",
    description: "Emergency response coordination, client management, and claim processing platform.",
    domain: "disasterrecovery.com.au",
    status: "PENDING",
    category: "Field Operations",
    colour: "#FF4444",
    features: ["Client CRM", "Job Scheduling", "Claim Management", "Reporting"],
    apiEndpoint: null,
    lastSync: null,
  },
  {
    id: "nrpg",
    name: "NRPG",
    description: "National Restoration & Property Group — enterprise restoration management system.",
    domain: "nrpg.com.au",
    status: "PENDING",
    category: "Restoration",
    colour: "#FFB800",
    features: ["Project Tracking", "Asset Management", "Staff Coordination", "Invoicing"],
    apiEndpoint: null,
    lastSync: null,
  },
  {
    id: "carsi",
    name: "CARSI",
    description: "Claims and restoration system integration — API gateway for insurance workflows.",
    domain: "carsi.com.au",
    status: "CONFIGURING",
    category: "Insurance Tech",
    colour: "#00F5FF",
    features: ["Claim Intake", "Insurer Portal", "Status Tracking", "Document Management"],
    apiEndpoint: "/api/ecosystem/carsi",
    lastSync: null,
  },
  {
    id: "restore-assist",
    name: "RestoreAssist",
    description: "AI-assisted restoration guidance, job scoping, and contractor coordination.",
    domain: "restoreassist.com.au",
    status: "PENDING",
    category: "AI Tools",
    colour: "#00FF88",
    features: ["AI Scoping", "Contractor Network", "Job Matching", "Quality Control"],
    apiEndpoint: null,
    lastSync: null,
  },
  {
    id: "synthex",
    name: "Synthex",
    description: "Autonomous AI marketing agency — content generation, SEO, and campaign orchestration.",
    domain: "synthex.com.au",
    status: "CONFIGURING",
    category: "Marketing AI",
    colour: "#FF00FF",
    features: ["AI Content", "SEO Engine", "Campaign Automation", "Analytics"],
    apiEndpoint: "/api/ecosystem/synthex",
    lastSync: null,
  },
];

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; icon: React.ElementType; colour: string }> = {
  CONNECTED: { label: "Connected", icon: CheckCircle2, colour: "#00FF88" },
  PENDING:   { label: "Pending Setup", icon: Clock, colour: "#FFB800" },
  OFFLINE:   { label: "Offline", icon: AlertCircle, colour: "#FF4444" },
  CONFIGURING: { label: "Configuring", icon: Zap, colour: "#00F5FF" },
};

export default function EcosystemPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const connected = ECOSYSTEM.filter((a) => a.status === "CONNECTED").length;
  const configuring = ECOSYSTEM.filter((a) => a.status === "CONFIGURING").length;

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Network className="h-5 w-5 text-[#00F5FF]" />
          <h1 className="text-xl font-mono font-bold text-white tracking-wide">
            BUSINESS ECOSYSTEM
          </h1>
        </div>
        <p className="text-sm text-white/40 font-mono">
          Central registry of all connected Unite-Group business applications
        </p>
      </motion.div>

      {/* Summary strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: EASE_OUT_EXPO }}
        className="grid grid-cols-4 gap-3 mb-8"
      >
        {[
          { label: "Total Businesses", value: ECOSYSTEM.length, colour: "#00F5FF" },
          { label: "Connected", value: connected, colour: "#00FF88" },
          { label: "Configuring", value: configuring, colour: "#FFB800" },
          { label: "Pending", value: ECOSYSTEM.length - connected - configuring, colour: "#FF4444" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4"
          >
            <p className="text-xs text-white/30 font-mono uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: stat.colour }}>
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Business cards */}
      <div className="grid grid-cols-1 gap-4">
        {ECOSYSTEM.map((app, i) => {
          const status = STATUS_CONFIG[app.status];
          const StatusIcon = status.icon;
          const isExpanded = selected === app.id;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 + i * 0.06, ease: EASE_OUT_EXPO }}
            >
              <div
                className="bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden cursor-pointer hover:border-white/[0.12] transition-colors"
                style={isExpanded ? { borderColor: `${app.colour}40` } : undefined}
                onClick={() => setSelected(isExpanded ? null : app.id)}
              >
                {/* Card top bar accent */}
                <div className="h-px w-full" style={{ backgroundColor: `${app.colour}60` }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-base font-bold text-white/90 font-mono">{app.name}</h2>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-sm border"
                          style={{ color: app.colour, borderColor: `${app.colour}40`, backgroundColor: `${app.colour}10` }}
                        >
                          {app.category}
                        </span>
                      </div>
                      <p className="text-sm text-white/40 leading-relaxed">{app.description}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <Globe className="h-3 w-3 text-white/20" />
                        <span className="text-xs text-white/20 font-mono">{app.domain}</span>
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="h-3.5 w-3.5" style={{ color: status.colour }} />
                        <span className="text-xs font-mono" style={{ color: status.colour }}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.apiEndpoint && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] rounded-sm border border-white/[0.06]">
                            <Activity className="h-3 w-3 text-white/30" />
                            <span className="text-[10px] font-mono text-white/30">API Ready</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] rounded-sm border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                        >
                          <Settings className="h-3 w-3 text-white/30" />
                          <span className="text-[10px] font-mono text-white/30">Configure</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                      className="mt-5 pt-5 border-t border-white/[0.06]"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        {/* Features */}
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">Features</p>
                          <div className="flex flex-wrap gap-2">
                            {app.features.map((f) => (
                              <span
                                key={f}
                                className="text-xs font-mono px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/50"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Integration status */}
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">Integration</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/30 font-mono">API Endpoint</span>
                              <span className="text-xs font-mono" style={{ color: app.apiEndpoint ? "#00F5FF" : "#FF4444" }}>
                                {app.apiEndpoint ?? "Not configured"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/30 font-mono">Last Sync</span>
                              <span className="text-xs font-mono text-white/20">
                                {app.lastSync ?? "Never"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/30 font-mono">Data Flow</span>
                              <span className="text-xs font-mono text-white/20">
                                {app.status === "CONNECTED" ? "Bidirectional" : "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-sm">
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">
                          Integration Roadmap
                        </p>
                        <p className="text-xs text-white/40">
                          {app.status === "CONNECTED"
                            ? "Fully integrated. Data syncing bidirectionally."
                            : app.status === "CONFIGURING"
                            ? "API architecture in place. Auth and data mapping in progress."
                            : "Awaiting API credentials and endpoint configuration from business team."}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-2 justify-end">
                        <a
                          href={`https://${app.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit {app.domain}
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Architecture note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 p-4 bg-white/[0.02] border border-white/[0.06] rounded-sm"
      >
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">Architecture</p>
        <p className="text-xs text-white/30 leading-relaxed">
          Unite-Group acts as the central orchestration layer. Each connected business exposes a REST API
          that this platform consumes for unified reporting, project visibility, and command-and-control
          workflows. OpenClaw remote operations will route through this registry.
        </p>
      </motion.div>
    </div>
  );
}
