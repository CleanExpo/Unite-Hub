"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Eye,
  Vault,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpenClawStatus {
  connected: boolean;
  url: string | null;
  hasApiKey: boolean;
  source: "env" | "vault" | "none";
  vaultItemId?: string;
}

// ─── Animated background grid ─────────────────────────────────────────────────

function GridBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(#00F5FF 1px, transparent 1px), linear-gradient(90deg, #00F5FF 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-mono font-semibold uppercase tracking-widest border ${
        connected
          ? "bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]"
          : "bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#00FF88] animate-pulse" : "bg-[#FFB800]"}`}
      />
      {connected ? "Connected" : "Not configured"}
    </motion.div>
  );
}

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-[#0a0a0a] border border-[#00F5FF]/20 rounded-sm p-4 text-xs font-mono text-[#00F5FF]/80 leading-relaxed overflow-x-auto">
        {content}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-[#050505] border border-[#00F5FF]/20 rounded-sm text-[#00F5FF]/60 hover:text-[#00F5FF] hover:border-[#00F5FF]/50"
        title="Copy to clipboard"
      >
        {copied ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

// ─── Setup card (not configured state) ───────────────────────────────────────

function SetupCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="border border-[#FFB800]/20 bg-[#FFB800]/5 rounded-sm p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#FFB800] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#FFB800]/90">
          OpenClaw is not yet configured. Choose one of the two methods below to connect.
        </p>
      </div>

      {/* Option 1: Env vars */}
      <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-[#00F5FF]/10 flex items-center justify-center">
            <span className="text-[#00F5FF] text-xs font-mono font-bold">1</span>
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Set environment variables</h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Add these to your <span className="font-mono text-[#00F5FF]/80">.env.local</span> file (or Vercel environment settings):
        </p>
        <CodeBlock
          content={`OPENCLAW_URL=https://your-openclaw-instance.com\nOPENCLAW_API_KEY=your-api-key`}
        />
        <p className="text-xs text-zinc-500">
          Restart the development server after adding env vars. In production, redeploy after updating Vercel settings.
        </p>
      </div>

      {/* Option 2: Vault */}
      <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-[#00F5FF]/10 flex items-center justify-center">
            <span className="text-[#00F5FF] text-xs font-mono font-bold">2</span>
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Store in Founder Vault</h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Store your OpenClaw API key in the encrypted Founder Vault. Label the entry{" "}
          <span className="font-mono text-[#00F5FF]/80">OpenClaw API Key</span> and include the
          base URL in the URL field. The system will detect it automatically.
        </p>
        <motion.a
          href="/founder/vault?label=OpenClaw+API+Key"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-[#00F5FF] text-sm font-medium hover:bg-[#00F5FF]/20 hover:border-[#00F5FF]/50 transition-colors"
        >
          <Vault className="w-4 h-4" />
          Open Founder Vault
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </motion.a>
      </div>
    </motion.div>
  );
}

// ─── Ping indicator ───────────────────────────────────────────────────────────

function PingIndicator({ url }: { url: string }) {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  const ping = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch("/api/founder/openclaw/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/", method: "GET" }),
        signal: AbortSignal.timeout(11_000),
      });
      setStatus(res.ok || res.status < 500 ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void ping();
  }, [ping]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "checking"
            ? "bg-[#FFB800] animate-pulse"
            : status === "online"
              ? "bg-[#00FF88] animate-pulse"
              : "bg-[#FF4444]"
        }`}
      />
      <span className="text-xs font-mono text-zinc-400">
        {status === "checking" ? "Pinging..." : status === "online" ? "Reachable" : "Unreachable"}
      </span>
      <button
        onClick={ping}
        className="text-zinc-600 hover:text-zinc-300 transition-colors ml-1"
        title="Re-ping"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Configured panel ─────────────────────────────────────────────────────────

function ConfiguredPanel({ status }: { status: OpenClawStatus }) {
  const [iframeBlocked, setIframeBlocked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6"
    >
      {/* Left: Quick actions sidebar */}
      <div className="space-y-4">
        {/* Open OpenClaw */}
        {status.url && (
          <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-5 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
              Quick Actions
            </h3>
            <motion.a
              href={status.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center justify-between gap-2 w-full px-4 py-3 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-[#00F5FF] text-sm font-medium hover:bg-[#00F5FF]/20 hover:border-[#00F5FF]/50 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Open OpenClaw
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          </div>
        )}

        {/* API status */}
        <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-5 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
            API Status
          </h3>
          {status.url && <PingIndicator url={status.url} />}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">Source</span>
              <span
                className={`font-mono px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider ${
                  status.source === "env"
                    ? "bg-[#00F5FF]/10 text-[#00F5FF]"
                    : "bg-[#00FF88]/10 text-[#00FF88]"
                }`}
              >
                {status.source}
              </span>
            </div>
            {status.url && (
              <div className="flex items-start justify-between text-xs gap-2">
                <span className="text-zinc-500 font-mono flex-shrink-0">URL</span>
                <span className="font-mono text-zinc-300 text-right break-all text-[11px]">
                  {status.url}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">API Key</span>
              <span className="flex items-center gap-1 text-[#00FF88] font-mono text-[11px]">
                <Eye className="w-3 h-3" />
                Secured
              </span>
            </div>
          </div>
        </div>

        {/* View in vault */}
        {status.source === "vault" && status.vaultItemId && (
          <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-5 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
              Credential
            </h3>
            <a
              href={`/founder/vault/${status.vaultItemId}`}
              className="flex items-center gap-2 text-sm text-[#00F5FF]/80 hover:text-[#00F5FF] transition-colors"
            >
              <Vault className="w-4 h-4" />
              View in Vault
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        )}
      </div>

      {/* Right: embedded panel */}
      <div className="space-y-4">
        <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
              OpenClaw Interface
            </h3>
            {status.url && !iframeBlocked && (
              <a
                href={status.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-[#00F5FF] transition-colors flex items-center gap-1"
              >
                Open in tab <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {status.url && !iframeBlocked ? (
            <iframe
              src={status.url}
              title="OpenClaw"
              className="w-full border border-[#00F5FF]/20 rounded-sm bg-[#0a0a0a]"
              style={{ height: 600 }}
              onError={() => setIframeBlocked(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] border border-[#00F5FF]/20 rounded-sm bg-[#0a0a0a] space-y-4">
              {iframeBlocked ? (
                <>
                  <AlertCircle className="w-8 h-8 text-[#FFB800]" />
                  <div className="text-center space-y-1">
                    <p className="text-sm text-zinc-300 font-medium">Iframe blocked</p>
                    <p className="text-xs text-zinc-500">
                      OpenClaw sets an X-Frame-Options or CSP header that prevents embedding.
                    </p>
                  </div>
                  {status.url && (
                    <motion.a
                      href={status.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-[#00F5FF] text-sm font-medium hover:bg-[#00F5FF]/20 hover:border-[#00F5FF]/50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open OpenClaw in New Tab
                    </motion.a>
                  )}
                </>
              ) : (
                <>
                  <Globe className="w-8 h-8 text-zinc-600" />
                  <p className="text-sm text-zinc-500">No URL configured</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OpenClawPage() {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/founder/openclaw");
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data: OpenClawStatus = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <GridBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/25 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00F5FF]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">OpenClaw</h1>
            </div>
            <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
              AI automation integration — access your OpenClaw instance directly from the Unite-Group CRM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status && <StatusBadge connected={status.connected} />}
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 rounded-sm border border-[#00F5FF]/15 bg-[#050505] text-zinc-500 hover:text-[#00F5FF] hover:border-[#00F5FF]/30 transition-colors disabled:opacity-40"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#00F5FF]/20 to-transparent" />

        {/* Content */}
        {loading && !status ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
              <p className="text-sm text-zinc-500 font-mono">Checking OpenClaw status…</p>
            </div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-[#FF4444]/20 bg-[#FF4444]/5 rounded-sm p-6 flex items-start gap-3 max-w-xl"
          >
            <AlertCircle className="w-5 h-5 text-[#FF4444] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#FF4444]">Status check failed</p>
              <p className="text-xs text-zinc-400">{error}</p>
              <button
                onClick={fetchStatus}
                className="text-xs text-[#00F5FF] hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          </motion.div>
        ) : status ? (
          status.connected ? (
            <ConfiguredPanel status={status} />
          ) : (
            <SetupCard />
          )
        ) : null}
      </div>
    </div>
  );
}
