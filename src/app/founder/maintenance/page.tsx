"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DependabotPR {
  number: number;
  title: string;
  url: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
  mergeable: boolean | null;
  labels: { name: string; color: string }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function extractPackage(title: string): string {
  // "chore(deps): bump @types/node from 20.x to 24.x" → "@types/node"
  const match = title.match(/bump\s+(.+?)\s+from/i);
  return match?.[1] ?? title.replace(/^chore\((deps|ci)\):\s*/i, "");
}

function mergeableColour(m: boolean | null): { text: string; colour: string } {
  if (m === true) return { text: "Mergeable", colour: "#00FF88" };
  if (m === false) return { text: "Conflicts", colour: "#FF4444" };
  return { text: "Checking", colour: "#FFB800" };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [prs, setPrs] = useState<DependabotPR[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dependabot-prs");
      const data = await res.json();
      if (data.prs) {
        setPrs(data.prs);
        setTotal(data.total);
      } else {
        setError(data.error ?? "Failed to load PRs");
      }
    } catch {
      setError("Failed to fetch Dependabot PRs");
    } finally {
      setLoading(false);
    }
  };

  const mergeableCount = prs.filter((pr) => pr.mergeable === true).length;
  const conflictCount = prs.filter((pr) => pr.mergeable === false).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-mono text-[#00F5FF] tracking-tight">
            Maintenance
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            Dependency updates and repository health
          </p>
        </div>

        {/* Health Summary Card */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0A0A0A] border border-[#00F5FF]/15 rounded-sm p-4 text-center">
            <p className="text-3xl font-mono text-[#FFB800]">{total}</p>
            <p className="text-xs font-mono text-white/30 mt-1">Pending PRs</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#00FF88]/15 rounded-sm p-4 text-center">
            <p className="text-3xl font-mono text-[#00FF88]">{mergeableCount}</p>
            <p className="text-xs font-mono text-white/30 mt-1">Mergeable</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#FF4444]/15 rounded-sm p-4 text-center">
            <p className="text-3xl font-mono text-[#FF4444]">{conflictCount}</p>
            <p className="text-xs font-mono text-white/30 mt-1">Conflicts</p>
          </div>
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

        {/* PR List */}
        {!loading && prs.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-mono text-sm text-white/50">
              Pending Dependabot PRs
            </h2>
            {prs.map((pr, i) => {
              const pkg = extractPackage(pr.title);
              const age = daysSince(pr.createdAt);
              const m = mergeableColour(pr.mergeable);

              return (
                <motion.div
                  key={pr.number}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="bg-[#0A0A0A] border border-[#00F5FF]/10 rounded-sm p-4 hover:border-[#00F5FF]/25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-white/70">
                          #{pr.number}
                        </span>
                        <span className="font-mono text-sm text-white">
                          {pkg}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-sm text-xs font-mono border"
                          style={{
                            color: m.colour,
                            borderColor: `${m.colour}40`,
                            backgroundColor: `${m.colour}10`,
                          }}
                        >
                          {m.text}
                        </span>
                        {age > 30 && (
                          <span className="px-2 py-0.5 rounded-sm text-xs font-mono border border-[#FF4444]/20 text-[#FF4444]/70 bg-[#FF4444]/5">
                            {age}d old
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-white/25 truncate">
                        {pr.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-white/20">
                        {formatDate(pr.createdAt)}
                      </span>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-sm text-xs font-mono border border-[#00F5FF]/20 text-[#00F5FF]/70 hover:text-[#00F5FF] hover:border-[#00F5FF]/40 transition-colors"
                      >
                        Review &rarr;
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && prs.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-[#00FF88] font-mono text-sm">
              No pending Dependabot PRs
            </p>
            <p className="text-white/20 font-mono text-xs mt-2">
              All dependencies are up to date
            </p>
          </div>
        )}

        {/* Note */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-sm p-4">
          <p className="text-xs font-mono text-white/25">
            Review and merge via GitHub. Each PR links directly to the pull request page.
            Dependabot PRs are auto-generated when dependency updates are available.
          </p>
        </div>

        {/* Nexus Branding */}
        <div className="text-xs text-[#444] text-center py-2">
          Part of <span className="text-[#00F5FF]">Unite-Group Nexus</span>
        </div>
      </div>
    </div>
  );
}
