"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  url: string;
  username: string;
  password: string;
  business: string;
  selected: boolean;
  duplicate: boolean;
}

// ─── Auto-detect business from URL ──────────────────────────────────────────

function detectBusiness(url: string): string {
  if (!url) return "unite-group";
  const lower = url.toLowerCase();
  if (lower.includes("xero")) return "unite-group";
  if (lower.includes("linear")) return "unite-group";
  if (lower.includes("stripe")) return "unite-group";
  if (lower.includes("disaster") || lower.includes("dr4")) return "disaster-recovery";
  if (lower.includes("restore")) return "restore-assist";
  if (lower.includes("nrpg")) return "nrpg";
  if (lower.includes("carsi")) return "carsi";
  return "unite-group";
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect header
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("name") ||
    header.includes("url") ||
    header.includes("username") ||
    header.includes("password");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    // Simple CSV split — handles quoted fields
    const fields: string[] = [];
    let current = "";
    let inQuote = false;
    for (const char of line) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    // Chrome format: name, url, username, password
    return {
      name: fields[0] || "",
      url: fields[1] || "",
      username: fields[2] || "",
      password: fields[3] || "",
      business: detectBusiness(fields[1] || ""),
      selected: true,
      duplicate: false,
    };
  }).filter((r) => r.name && r.password);
}

// ─── Steps ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

export default function VaultImportPage() {
  const [step, setStep] = useState<Step>(1);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ─── Step 2: File handling ──────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ─── Step 3: Import ─────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    const selected = rows.filter((r) => r.selected && !r.duplicate);
    if (selected.length === 0) return;

    setImporting(true);
    setStep(3);

    try {
      const items = selected.map((r) => ({
        label: r.name,
        secret: r.password,
        category: "login",
        business_id: r.business,
        url: r.url || undefined,
        notes: r.username ? `Username: ${r.username}` : undefined,
      }));

      const res = await fetch("/api/founder/vault/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ imported: 0, skipped: 0, errors: ["Network error"] });
    } finally {
      setImporting(false);
    }
  }, [rows]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-mono font-bold text-[#00F5FF]">Import Credentials</h1>
            <p className="text-xs font-mono text-white/40 mt-1">
              Import from Chrome/Edge CSV export or manual CSV
            </p>
          </div>
          <Link
            href="/founder/vault"
            className="px-3 py-1.5 rounded-sm text-xs font-mono text-white/40 border border-white/10 hover:text-white/70 transition-colors"
          >
            Back to Vault
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-mono font-bold ${
                  step >= s ? "bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/40" : "bg-white/5 text-white/30 border border-white/10"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-px ${step > s ? "bg-[#00F5FF]/40" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ─── Step 1: Choose source ─────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-mono text-white/70">Step 1: Upload CSV</h2>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-sm p-12 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-[#00F5FF] bg-[#00F5FF]/5" : "border-white/15 hover:border-white/30"
                }`}
                onClick={() => document.getElementById("csv-input")?.click()}
              >
                <input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="text-3xl mb-3">&#128206;</div>
                <p className="text-sm font-mono text-white/50">
                  Drop a CSV file here or click to browse
                </p>
                <p className="text-xs font-mono text-white/30 mt-2">
                  Chrome format: name, url, username, password
                </p>
              </div>

              {/* Download template */}
              <div className="text-center">
                <button
                  onClick={() => {
                    const csv = "name,url,username,password\nExample Site,https://example.com,user@email.com,password123";
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "vault-import-template.csv";
                    a.click();
                  }}
                  className="text-xs font-mono text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors"
                >
                  Download CSV template
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Preview ──────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono text-white/70">
                  Step 2: Preview ({rows.length} credentials found)
                </h2>
                <button
                  onClick={() => { setStep(1); setRows([]); }}
                  className="text-xs font-mono text-white/40 hover:text-white/70"
                >
                  Change file
                </button>
              </div>

              {/* Select all toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRows((prev) => prev.map((r) => ({ ...r, selected: !prev.every((p) => p.selected) })))}
                  className="text-xs font-mono text-[#00F5FF]/60 hover:text-[#00F5FF]"
                >
                  {rows.every((r) => r.selected) ? "Deselect all" : "Select all"}
                </button>
                <span className="text-xs font-mono text-white/30">
                  {rows.filter((r) => r.selected).length} selected
                </span>
              </div>

              {/* Preview table */}
              <div className="border border-white/10 rounded-sm overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-3 py-2 text-left text-white/40 w-8"></th>
                        <th className="px-3 py-2 text-left text-white/40">Name</th>
                        <th className="px-3 py-2 text-left text-white/40">URL</th>
                        <th className="px-3 py-2 text-left text-white/40">Username</th>
                        <th className="px-3 py-2 text-left text-white/40">Business</th>
                        <th className="px-3 py-2 text-left text-white/40">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-t border-white/5 ${row.duplicate ? "opacity-50" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() =>
                                setRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r))
                                )
                              }
                              className="accent-[#00F5FF]"
                            />
                          </td>
                          <td className="px-3 py-2 text-white/80 truncate max-w-[200px]">{row.name}</td>
                          <td className="px-3 py-2 text-white/40 truncate max-w-[200px]">{row.url}</td>
                          <td className="px-3 py-2 text-white/40 truncate max-w-[150px]">{row.username}</td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded-sm bg-[#00F5FF]/10 text-[#00F5FF]/70 text-xs">
                              {row.business}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {row.duplicate ? (
                              <span className="text-[#FFB800]">Duplicate</span>
                            ) : (
                              <span className="text-[#00FF88]">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {rows.length > 50 && (
                <p className="text-xs font-mono text-white/30">
                  Showing first 50 of {rows.length} rows
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={rows.filter((r) => r.selected && !r.duplicate).length === 0}
                  className="flex-1 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] font-mono text-sm rounded-sm hover:bg-[#00F5FF]/20 disabled:opacity-30 transition-colors"
                >
                  Import {rows.filter((r) => r.selected && !r.duplicate).length} Credentials
                </button>
                <button
                  onClick={() => { setStep(1); setRows([]); }}
                  className="px-4 py-2.5 border border-white/10 text-white/40 font-mono text-sm rounded-sm hover:text-white/70"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Import result ────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {importing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 rounded-full"
                    style={{ borderColor: "#00F5FF", borderTopColor: "transparent" }}
                  />
                  <p className="text-sm font-mono text-white/50">Importing credentials...</p>
                </div>
              ) : result ? (
                <div className="text-center py-12 space-y-4">
                  <div className="text-5xl mb-2">
                    {result.imported > 0 ? "\u2713" : "\u2717"}
                  </div>
                  <h2 className="text-lg font-mono font-bold text-[#00F5FF]">
                    Import Complete
                  </h2>
                  <div className="flex justify-center gap-6 text-sm font-mono">
                    <span className="text-[#00FF88]">{result.imported} imported</span>
                    <span className="text-[#FFB800]">{result.skipped} skipped</span>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-sm text-left">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs font-mono text-[#FF4444]">{err}</p>
                      ))}
                    </div>
                  )}
                  <div className="pt-4">
                    <Link
                      href="/founder/vault"
                      className="px-6 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] font-mono text-sm rounded-sm hover:bg-[#00F5FF]/20 transition-colors"
                    >
                      Back to Vault
                    </Link>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
