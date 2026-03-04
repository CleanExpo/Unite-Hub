"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface BusinessVaultSummary {
  id: string;
  label: string;
  icon: string;
  count: number;
}

const BUSINESSES: Omit<BusinessVaultSummary, "count">[] = [
  { id: "disaster-recovery", label: "Disaster Recovery", icon: "🔧" },
  { id: "restore-assist", label: "RestoreAssist", icon: "🏠" },
  { id: "ato", label: "ATO Compliance", icon: "📋" },
  { id: "nrpg", label: "NRPG", icon: "🛡️" },
  { id: "unite-group", label: "Unite-Group", icon: "🏢" },
  { id: "carsi", label: "CARSI", icon: "🎓" },
];

export default function VaultBusinessesPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<BusinessVaultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCounts();
  }, []);

  async function fetchCounts() {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/vault");
      const data = await res.json();
      const items: { business_id: string }[] = data.items ?? [];

      const counts = new Map<string, number>();
      for (const item of items) {
        counts.set(item.business_id, (counts.get(item.business_id) ?? 0) + 1);
      }

      setSummaries(
        BUSINESSES.map((b) => ({ ...b, count: counts.get(b.id) ?? 0 })),
      );
    } catch {
      setSummaries(BUSINESSES.map((b) => ({ ...b, count: 0 })));
    } finally {
      setLoading(false);
    }
  }

  const totalCount = summaries.reduce((acc, s) => acc + s.count, 0);
  const hasEmptyBusinesses = summaries.some((s) => s.count === 0);

  async function handleSeed() {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/founder/vault/seed-businesses", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedMessage(data.message);
        await fetchCounts();
      } else {
        setSeedMessage(data.error ?? "Seed failed");
      }
    } catch {
      setSeedMessage("Failed to seed vault");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/founder/vault")}
              className="text-[#00F5FF]/60 hover:text-[#00F5FF] text-sm font-mono transition-colors"
            >
              &larr; Back to Vault
            </button>
          </div>
          <h1 className="text-2xl font-mono text-[#00F5FF] tracking-tight">
            Business Vault
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            Credential overview per business — {totalCount} total credentials stored
          </p>
        </div>

        {/* Seed Button */}
        {!loading && hasEmptyBusinesses && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-sm border border-[#00F5FF]/20 bg-[#00F5FF]/5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-[#00F5FF]">
                  Some businesses have no credentials
                </p>
                <p className="text-xs font-mono text-white/40 mt-1">
                  Seed placeholder entries for all businesses (ABN, bank, socials, etc.)
                </p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] rounded-sm text-sm font-mono hover:bg-[#00F5FF]/20 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {seeding ? "Seeding..." : "Seed Business Vault"}
              </button>
            </div>
            {seedMessage && (
              <p className="mt-3 text-xs font-mono text-[#00FF88]">{seedMessage}</p>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
          </div>
        )}

        {/* Business Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.map((biz, i) => (
              <motion.div
                key={biz.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="bg-[#0a0a0a] border border-[#00F5FF]/15 rounded-sm p-5 flex flex-col gap-4 hover:border-[#00F5FF]/30 transition-colors"
              >
                {/* Business Header */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{biz.icon}</span>
                  <div>
                    <h3 className="font-mono text-sm text-white font-medium">
                      {biz.label}
                    </h3>
                    <p className="text-xs font-mono text-white/40">
                      {biz.count} credential{biz.count !== 1 ? "s" : ""} stored
                    </p>
                  </div>
                </div>

                {/* Count Badge */}
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-sm text-sm font-mono font-bold ${
                      biz.count > 0
                        ? "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20"
                        : "bg-white/5 text-white/30 border border-white/10"
                    }`}
                  >
                    {biz.count}
                  </div>
                  <div className="flex-1 h-1 bg-white/5 rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full bg-[#00F5FF]/40 rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (biz.count / 8) * 100)}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => router.push(`/founder/vault?business=${biz.id}`)}
                    className="flex-1 py-2 rounded-sm text-xs font-mono border border-[#00F5FF]/30 text-[#00F5FF] hover:bg-[#00F5FF]/10 transition-colors text-center"
                  >
                    View credentials
                  </button>
                  <button
                    onClick={() => router.push(`/founder/vault?business=${biz.id}&add=true`)}
                    className="px-3 py-2 rounded-sm text-xs font-mono border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
