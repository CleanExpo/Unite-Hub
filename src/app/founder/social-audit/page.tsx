"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SocialChannel {
  id: string;
  business_key: string;
  platform: string;
  handle: string | null;
  profile_url: string | null;
  connected: boolean;
  updated_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BUSINESSES = [
  { key: "disaster-recovery", label: "Disaster Recovery" },
  { key: "restore-assist", label: "Restore Assist" },
  { key: "ato", label: "ATO" },
  { key: "nrpg", label: "NRPG" },
  { key: "unite-group", label: "Unite Group" },
  { key: "carsi", label: "CARSI" },
];

const PLATFORMS = [
  { key: "facebook", label: "Facebook", signupUrl: "https://business.facebook.com" },
  { key: "instagram", label: "Instagram", signupUrl: "https://www.instagram.com/accounts/signup/" },
  { key: "linkedin", label: "LinkedIn", signupUrl: "https://www.linkedin.com/company/setup/" },
  { key: "twitter", label: "Twitter/X", signupUrl: "https://x.com/i/flow/signup" },
  { key: "youtube", label: "YouTube", signupUrl: "https://www.youtube.com/create_channel" },
  { key: "tiktok", label: "TikTok", signupUrl: "https://www.tiktok.com/signup" },
  { key: "google_business", label: "Google Biz", signupUrl: "https://business.google.com/create" },
];

const TOTAL_CELLS = BUSINESSES.length * PLATFORMS.length;

// ─── Component ──────────────────────────────────────────────────────────────

export default function SocialAuditPage() {
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/social-audit");
      const data = await res.json();
      if (data.channels) {
        setChannels(data.channels);
      } else {
        setError(data.error ?? "Failed to load channels");
      }
    } catch {
      setError("Failed to fetch social channels");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAll = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/founder/social-audit", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
        await fetchChannels();
        setTimeout(() => setVerified(false), 3000);
      }
    } catch {
      setError("Failed to verify channels");
    } finally {
      setVerifying(false);
    }
  };

  const getChannel = (businessKey: string, platform: string): SocialChannel | undefined => {
    return channels.find(
      (c) => c.business_key === businessKey && c.platform === platform
    );
  };

  const securedCount = channels.filter((c) => c.handle && c.handle.trim() !== "").length;
  const progressPct = TOTAL_CELLS > 0 ? Math.round((securedCount / TOTAL_CELLS) * 100) : 0;

  // Platforms with missing handles
  const missingPlatforms = new Set<string>();
  for (const biz of BUSINESSES) {
    for (const plat of PLATFORMS) {
      const ch = getChannel(biz.key, plat.key);
      if (!ch || !ch.handle) {
        missingPlatforms.add(plat.key);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-mono text-[#00F5FF] tracking-tight">
            Social Media Audit
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            Handle reservation status across all businesses
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-[#0A0A0A] border border-[#00F5FF]/15 rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm text-white/70">
              {securedCount} of {TOTAL_CELLS} handles secured
            </span>
            <span className="font-mono text-sm text-[#00F5FF]">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-sm overflow-hidden">
            <motion.div
              className="h-full bg-[#00F5FF] rounded-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
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

        {/* Audit Matrix */}
        {!loading && (
          <div className="bg-[#0A0A0A] border border-[#00F5FF]/10 rounded-sm overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 font-mono text-xs text-white/30 w-40">
                    Business
                  </th>
                  {PLATFORMS.map((plat) => (
                    <th
                      key={plat.key}
                      className="p-3 font-mono text-xs text-white/30 text-center"
                    >
                      {plat.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BUSINESSES.map((biz, i) => (
                  <motion.tr
                    key={biz.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="p-3 font-mono text-sm text-white/70">
                      {biz.label}
                    </td>
                    {PLATFORMS.map((plat) => {
                      const ch = getChannel(biz.key, plat.key);
                      const hasHandle = ch?.handle && ch.handle.trim() !== "";

                      return (
                        <td key={plat.key} className="p-3 text-center">
                          <div
                            className="inline-flex items-center justify-center w-8 h-8 rounded-sm cursor-default"
                            title={
                              hasHandle
                                ? `${ch!.handle}${ch!.connected ? " (verified)" : ""}`
                                : "Not set"
                            }
                          >
                            {hasHandle ? (
                              <span className="text-[#00FF88] text-lg">&#10003;</span>
                            ) : (
                              <span className="text-[#FF4444]/60 text-lg">&#10007;</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions Row */}
        {!loading && (
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleVerifyAll}
              disabled={verifying || securedCount === 0}
              className={[
                "px-5 py-2.5 font-mono text-sm rounded-sm border transition-colors",
                verified
                  ? "bg-[#00FF88]/10 border-[#00FF88]/40 text-[#00FF88]"
                  : "bg-[#00F5FF]/10 border-[#00F5FF]/30 text-[#00F5FF] hover:bg-[#00F5FF]/20",
                "disabled:opacity-40",
              ].join(" ")}
            >
              {verified
                ? "Audit Complete"
                : verifying
                  ? "Verifying..."
                  : "Mark Audit Complete"}
            </button>
          </div>
        )}

        {/* Missing Handles CTA */}
        {!loading && missingPlatforms.size > 0 && (
          <div className="bg-[#0A0A0A] border border-[#FFB800]/20 rounded-sm p-5">
            <h3 className="font-mono text-sm text-[#FFB800] mb-3">
              Secure Missing Handles
            </h3>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.filter((p) => missingPlatforms.has(p.key)).map((plat) => (
                <a
                  key={plat.key}
                  href={plat.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-sm text-xs font-mono border border-[#FFB800]/20 text-[#FFB800]/70 hover:text-[#FFB800] hover:border-[#FFB800]/40 transition-colors"
                >
                  {plat.label} &rarr;
                </a>
              ))}
            </div>
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
