"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, LayoutDashboard, Calendar, Kanban, Camera,
  Send, Bot, User, Mic, MicOff, RefreshCw, Building2,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Clock, Flame, ArrowRight, Video, X, ChevronRight,
  Zap, Activity, History, Search, Tag, BookmarkPlus, ExternalLink,
  BookOpen, Upload, Image, Download, CloudUpload, FileText,
  Globe, Shield, Brain, Wrench, Network,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PhillOSPwaInstaller } from "@/components/PhillOSPwaInstaller";
import { PushNotificationToggle } from "@/components/founder/PushNotificationToggle";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "chat" | "dashboard" | "calendar" | "kanban" | "capture" | "ecosystem";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Business {
  id: string;
  display_name: string;
  code: string;
  industry?: string;
  status?: "active" | "warning" | "critical";
  mrr?: number;
  trend?: "up" | "down" | "flat";
}

interface KanbanItem {
  id: string;
  title: string;
  column: "hot" | "today" | "pipeline";
  business?: string;
  priority?: number;
}


interface SavedConversation {
  id: string;
  messages: Message[];
  tags: string[];
  savedAt: string;
  preview: string;
}

// ─── Conversation storage helpers ─────────────────────────────────────────────

const STORAGE_KEY = "phill-os-conversations";
const QUICK_TAGS = ["DR", "RA", "NRPG", "ATO", "UG", "urgent", "decision", "follow-up", "info"];

function loadConversations(): SavedConversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveConversation(msgs: Message[], tags: string[]): SavedConversation {
  const conv: SavedConversation = {
    id: Date.now().toString(),
    messages: msgs,
    tags,
    savedAt: new Date().toISOString(),
    preview: msgs.find(m => m.role === "user")?.content.slice(0, 80) ?? "New conversation",
  };
  const existing = loadConversations();
  // Keep last 50 conversations
  localStorage.setItem(STORAGE_KEY, JSON.stringify([conv, ...existing].slice(0, 50)));
  return conv;
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "chat",      label: "Chat",      icon: MessageSquare },
  { id: "dashboard", label: "Status",    icon: LayoutDashboard },
  { id: "ecosystem", label: "Ecosystem", icon: Network },
  { id: "calendar",  label: "Calendar",  icon: Calendar },
  { id: "kanban",    label: "Kanban",    icon: Kanban },
  { id: "capture",   label: "Capture",   icon: Camera },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ChatTab({ session }: { session: { access_token?: string } | null }) {
  const WELCOME: Message = {
    id: "welcome",
    role: "assistant",
    content: "Bron here — your AI command officer. What's the priority right now?",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savePickerOpen, setSavePickerOpen] = useState(false);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // eslint-disable-line

  // Load history on mount
  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  useEffect(() => {
    if (!showHistory) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showHistory]);

  const toggleSpeech = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line
    if (!SR) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-AU";
    recognition.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const text = input;
    setInput("");
    setLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const history = allMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/founder-os/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Could not get a response right now.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Connection issue. Check your network.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversation = () => {
    const realMsgs = messages.filter(m => m.id !== "welcome");
    if (realMsgs.length === 0) return;
    saveConversation(realMsgs, pendingTags);
    const updated = loadConversations();
    setConversations(updated);
    setSavePickerOpen(false);
    setPendingTags([]);
    setMessages([WELCOME]);
  };

  const restoreConversation = (conv: SavedConversation) => {
    // Deserialise timestamps (they're strings in localStorage)
    const restored = conv.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
    setMessages([WELCOME, ...restored]);
    setShowHistory(false);
  };

  const filteredConversations = conversations.filter(c => {
    const matchSearch = !historySearch || c.preview.toLowerCase().includes(historySearch.toLowerCase());
    const matchTags = selectedTags.length === 0 || selectedTags.every(t => c.tags.includes(t));
    return matchSearch && matchTags;
  });

  // ─── History panel ──────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold text-white">Conversation History</h3>
          <span className="text-xs text-zinc-500 ml-auto">{conversations.length} saved</span>
        </div>

        {/* Search + tag filter */}
        <div className="px-3 py-2 space-y-2 border-b border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <input
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["urgent", "decision", "DR", "UG", "NRPG"].map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-cyan-600 border-cyan-500 text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredConversations.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-8">No conversations found</p>
          )}
          {filteredConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => restoreConversation(conv)}
              className="w-full text-left p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
            >
              <p className="text-sm text-white font-medium truncate">{conv.preview}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-zinc-500">
                  {new Date(conv.savedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
                <span className="text-[10px] text-zinc-600">·</span>
                <span className="text-[10px] text-zinc-500">{conv.messages.length} messages</span>
                <div className="flex gap-1 ml-auto">
                  {conv.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Save picker overlay ─────────────────────────────────────────────────────
  const hasMeaningfulMessages = messages.filter(m => m.id !== "welcome").length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
        <span className="text-[10px] text-zinc-600 flex-1">
          {messages.filter(m => m.id !== "welcome").length} messages
        </span>
        {hasMeaningfulMessages && (
          <button
            onClick={() => { setPendingTags([]); setSavePickerOpen(v => !v); }}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save
          </button>
        )}
        <button
          onClick={() => { setShowHistory(true); setHistorySearch(""); setSelectedTags([]); }}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      {/* Save tag picker */}
      {savePickerOpen && (
        <div className="px-3 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-zinc-300 font-medium">Tag this conversation</span>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {QUICK_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setPendingTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  pendingTags.includes(tag)
                    ? "bg-cyan-600 border-cyan-500 text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveConversation}
              className="flex-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white py-1.5 rounded-lg transition-colors"
            >
              Save &amp; New Chat
            </button>
            <button
              onClick={() => setSavePickerOpen(false)}
              className="text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
                msg.role === "user" ? "bg-cyan-600" : "bg-gradient-to-br from-violet-600 to-cyan-600"
              }`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-cyan-900/60 border border-cyan-700/40 text-cyan-50 rounded-br-sm"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-bl-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-zinc-500 mt-1 text-right">
                  {msg.timestamp.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              listening ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={listening ? "Listening..." : "Command or question..."}
            className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-sm h-9"
            disabled={loading || listening}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ecosystem Tab ────────────────────────────────────────────────────────────

interface EcosystemPlatform {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

type HealthStatus = "healthy" | "unknown" | "down";

const ECOSYSTEM_PLATFORMS: EcosystemPlatform[] = [
  {
    id: "disaster-recovery",
    name: "Disaster Recovery",
    description: "Emergency response and business continuity platform",
    url: process.env.NEXT_PUBLIC_DR_URL || "https://disaster-recovery.unitegroupau.com",
    category: "Operations",
    icon: Shield,
  },
  {
    id: "nrpg",
    name: "NRPG",
    description: "Natural Resources Portfolio Group management",
    url: process.env.NEXT_PUBLIC_NRPG_URL || "https://nrpg.unitegroupau.com",
    category: "Portfolio",
    icon: Globe,
  },
  {
    id: "carsi",
    name: "CARSI",
    description: "Client acquisition and relationship scoring intelligence",
    url: process.env.NEXT_PUBLIC_CARSI_URL || "https://carsi.unitegroupau.com",
    category: "Intelligence",
    icon: Brain,
  },
  {
    id: "restore-assist",
    name: "RestoreAssist",
    description: "Restoration project management and contractor coordination",
    url: process.env.NEXT_PUBLIC_RESTORE_URL || "https://restoreassist.unitegroupau.com",
    category: "Operations",
    icon: Wrench,
  },
  {
    id: "synthex",
    name: "Synthex",
    description: "AI-powered marketing automation and content generation",
    url: process.env.NEXT_PUBLIC_SYNTHEX_URL || "https://synthex.unitegroupau.com",
    category: "Marketing",
    icon: Zap,
  },
];

const CATEGORY_COLOURS: Record<string, string> = {
  Operations: "text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/20",
  Portfolio: "text-[#00F5FF] bg-[#00F5FF]/10 border-[#00F5FF]/20",
  Intelligence: "text-[#FF00FF] bg-[#FF00FF]/10 border-[#FF00FF]/20",
  Marketing: "text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20",
};

const HEALTH_DOT: Record<HealthStatus, string> = {
  healthy: "#00FF88",
  unknown: "#FFB800",
  down: "#FF4444",
};

function EcosystemTab() {
  const [health, setHealth] = useState<Record<string, HealthStatus>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/connectors/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setLastChecked(new Date());
      }
    } catch {
      // fail silently — show unknown for all
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { checkHealth(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatus = (id: string): HealthStatus => health[id] ?? "unknown";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h2 className="text-xs font-mono font-semibold text-[#00F5FF] uppercase tracking-widest">Ecosystem</h2>
          <p className="text-[10px] text-white/30 mt-0.5">5 connected platforms</p>
        </div>
        <button
          onClick={checkHealth}
          disabled={checking}
          className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-[#00F5FF] transition-colors font-mono"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
          {lastChecked ? lastChecked.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }) : "Check"}
        </button>
      </div>

      {/* Platform cards */}
      <div className="p-3 space-y-2.5 flex-1">
        {ECOSYSTEM_PLATFORMS.map(platform => {
          const Icon = platform.icon;
          const status = getStatus(platform.id);
          const catColour = CATEGORY_COLOURS[platform.category] ?? "text-white/40 bg-white/5 border-white/10";

          return (
            <div
              key={platform.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-3 space-y-2"
            >
              {/* Top row */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono font-semibold text-white/90 truncate">{platform.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${catColour}`}>
                      {platform.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-snug mt-0.5 line-clamp-2">{platform.description}</p>
                </div>
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: HEALTH_DOT[status] }}
                  />
                  <span className="text-[10px] font-mono capitalize" style={{ color: HEALTH_DOT[status] }}>
                    {status}
                  </span>
                </div>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-mono text-[#00F5FF] hover:text-white transition-colors"
                >
                  Open
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Footer: last sync */}
              <p className="text-[9px] text-white/20 font-mono">
                Last checked: {lastChecked ? lastChecked.toLocaleString("en-AU", { timeZone: "Australia/Sydney" }) : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="px-4 pb-4 flex-shrink-0">
        <Link
          href="/founder/connections"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-sm bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-white/40 hover:text-[#00F5FF] hover:border-[#00F5FF]/20 transition-colors"
        >
          <Network className="w-3.5 h-3.5" />
          Ecosystem Registry
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function DashboardTab() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch6Businesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/founder-os/businesses");
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch {
      // fail silently — show placeholders
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch6Businesses(); }, [fetch6Businesses]);

  const statusColor = (status?: string) => {
    if (status === "critical") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (status === "warning") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  const StatusIcon = ({ status }: { status?: string }) => {
    if (status === "critical") return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (status === "warning") return <AlertCircle className="w-4 h-4 text-amber-400" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  // If no businesses from API, show placeholder grid
  const displayBusinesses: Business[] = businesses.length > 0 ? businesses : [
    { id: "dr", display_name: "Disaster Recovery", code: "DR", status: "active", trend: "up" },
    { id: "ra", display_name: "RestoreAssist", code: "RA", status: "warning", trend: "flat" },
    { id: "nrpg", display_name: "NRPG", code: "NRPG", status: "critical", trend: "down" },
    { id: "ato", display_name: "ATO", code: "ATO", status: "active", trend: "up" },
    { id: "ug", display_name: "Unite-Group", code: "UG", status: "warning", trend: "up" },
    { id: "carsi", display_name: "CARSI", code: "CARSI", status: "active", trend: "up" },
  ];

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Business Status</h2>
        <div className="flex items-center gap-2">
          <PushNotificationToggle />
          <button onClick={fetch6Businesses} className="text-zinc-500 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {displayBusinesses.map(biz => (
        <div key={biz.id} className={`flex items-center gap-3 p-3 rounded-xl border ${statusColor(biz.status)}`}>
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-zinc-300">{biz.code}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{biz.display_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusIcon status={biz.status} />
              <span className="text-xs capitalize">{biz.status || "active"}</span>
              {biz.mrr !== undefined && (
                <span className="text-xs text-zinc-500 ml-auto">${biz.mrr.toLocaleString()} MRR</span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {biz.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            {biz.trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
            {(!biz.trend || biz.trend === "flat") && <Activity className="w-4 h-4 text-zinc-500" />}
          </div>
        </div>
      ))}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {[
          { label: "Active", value: displayBusinesses.filter(b => b.status !== "critical").length, color: "text-emerald-400" },
          { label: "Warnings", value: displayBusinesses.filter(b => b.status === "warning").length, color: "text-amber-400" },
          { label: "Critical", value: displayBusinesses.filter(b => b.status === "critical").length, color: "text-red-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="pt-1 space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quick Links</p>
        <Link
          href="/founder/openclaw"
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-cyan-700/50 hover:bg-zinc-800 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-900/40 border border-cyan-700/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white leading-tight">OpenClaw</p>
              <p className="text-[10px] text-zinc-500 leading-tight">AI Automation Panel</p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

// ─── Live calendar event shape from API ───────────────────────────────────────

interface LiveCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  colour: string;
}

function CalendarTab() {
  const today = new Date();
  const [liveEvents, setLiveEvents] = useState<LiveCalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const fetchWeekEvents = async () => {
      setCalLoading(true);
      try {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

        const params = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString(),
          maxResults: "20",
        });
        const res = await fetch(`/api/founder/calendar?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setConnected(data.connected ?? false);
        setLiveEvents(data.events ?? []);
      } catch {
        setConnected(false);
        setLiveEvents([]);
      } finally {
        setCalLoading(false);
      }
    };

    fetchWeekEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayLabel = (iso: string): string => {
    try {
      const d = new Date(iso);
      const todayDate = new Date(today);
      todayDate.setHours(0, 0, 0, 0);
      const eventDate = new Date(d);
      eventDate.setHours(0, 0, 0, 0);
      const diff = Math.round((eventDate.getTime() - todayDate.getTime()) / 86400000);
      if (diff === 0) return "Today";
      if (diff === 1) return "Tomorrow";
      return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  const timeLabel = (iso: string, allDay: boolean): string => {
    if (allDay) return "All day";
    try {
      return new Date(iso).toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Sydney",
      });
    } catch {
      return "";
    }
  };

  // Group events by day label
  const grouped: Record<string, LiveCalendarEvent[]> = {};
  for (const ev of liveEvents) {
    const label = dayLabel(ev.start);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(ev);
  }

  if (calLoading) {
    return (
      <div className="p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Upcoming</h2>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-4 flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: 200 }}>
        <AlertCircle className="w-8 h-8 text-amber-400" />
        <p className="text-sm text-zinc-300 font-medium">Google Calendar not connected</p>
        <p className="text-xs text-zinc-500">
          Connect via{" "}
          <a href="/settings/integrations" className="text-cyan-400 underline underline-offset-2">
            Integrations
          </a>
          {" "}to see your upcoming events.
        </p>
      </div>
    );
  }

  if (liveEvents.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: 200 }}>
        <Calendar className="w-8 h-8 text-zinc-600" />
        <p className="text-sm text-zinc-400">No events this week</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">This Week</h2>
        <span className="text-xs text-zinc-500">
          {today.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </div>

      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day}>
          <div className="flex items-center gap-2 mb-2">
            {day === "Today" && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${
              day === "Today" ? "text-cyan-400" : "text-zinc-500"
            }`}>
              {day}
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
                style={{ borderLeftColor: event.colour, borderLeftWidth: 3 }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{event.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs text-zinc-500">
                      {timeLabel(event.start, event.allDay)}
                    </span>
                    {event.location && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600 truncate">{event.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const KANBAN_CACHE_MS = 30_000;
let kanbanCache: { items: KanbanItem[]; fetchedAt: number } | null = null;

function KanbanTab() {
  const columns: { id: KanbanItem["column"]; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: "hot",      label: "HOT",      icon: Flame,      color: "text-red-400 border-red-500/30 bg-red-500/5" },
    { id: "today",    label: "TODAY",    icon: Zap,        color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
    { id: "pipeline", label: "PIPELINE", icon: ArrowRight, color: "text-blue-400 border-blue-500/30 bg-blue-500/5" },
  ];

  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCol, setActiveCol] = useState<KanbanItem["column"]>("hot");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fetchKanban = useCallback(async () => {
    if (kanbanCache && Date.now() - kanbanCache.fetchedAt < KANBAN_CACHE_MS) {
      setItems(kanbanCache.items);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/founder-os/linear-kanban");
      if (res.ok) {
        const data = await res.json();
        const fetched: KanbanItem[] = data.items ?? [];
        kanbanCache = { items: fetched, fetchedAt: Date.now() };
        setItems(fetched);
      }
    } catch {
      // fall through — keep existing items
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKanban(); }, [fetchKanban]);

  const exportToMarkdown = async () => {
    if (exporting || items.length === 0) return;
    setExporting(true);
    try {
      const res = await fetch("/api/founder/os/kanban-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setExported(true);
        setTimeout(() => setExported(false), 2000);
        // Fetch download URL
        const dlRes = await fetch("/api/founder/os/kanban-export");
        if (dlRes.ok) {
          const dlData = await dlRes.json();
          setDownloadUrl(dlData.url ?? null);
        }
      }
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  const colItems = items.filter(i => i.column === activeCol);

  if (loading && items.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Column selector */}
      <div className="flex border-b border-zinc-800">
        {columns.map(col => {
          const Icon = col.icon;
          const isActive = activeCol === col.id;
          const count = items.filter(i => i.column === col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCol(col.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive ? col.color + " border-b-2" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {col.label}
              <span className="text-[10px] bg-zinc-800 rounded-full px-1.5 py-0.5 text-zinc-400">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {colItems.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-sm">
            Nothing in this column
          </div>
        )}
        {colItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-sm bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
            <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
              item.priority === 1 ? "bg-red-500" : item.priority === 2 ? "bg-amber-500" : "bg-zinc-600"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{item.title}</p>
              {item.business && (
                <span className="text-xs text-zinc-500">{item.business}</span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Export actions */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-800 space-y-2">
        <motion.button
          onClick={exportToMarkdown}
          disabled={exporting || items.length === 0}
          whileTap={{ scale: 0.97 }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-xs font-medium uppercase tracking-wider transition-colors ${
            exported
              ? "bg-[#00FF88]/10 border border-[#00FF88]/40 text-[#00FF88]"
              : "bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] hover:bg-[#00F5FF]/20 disabled:opacity-40"
          }`}
        >
          {exporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : exported ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {exporting ? "Exporting…" : exported ? "Exported!" : "Sync to KANBAN.md"}
        </motion.button>

        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download KANBAN.md
          </a>
        )}
      </div>
    </div>
  );
}

const BUSINESS_OPTIONS = [
  "disaster-recovery",
  "restore-assist",
  "nrpg",
  "ato",
  "unite-group",
  "carsi",
] as const;

const CAPTURE_TAGS = ["meeting", "idea", "task", "followup", "insight"] as const;

function MediaCapturePanel() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [business, setBusiness] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      // Camera access denied or unavailable
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveMedia = async () => {
    if (!preview || uploading) return;
    setUploading(true);
    try {
      const res = await fetch("/api/founder/os/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: preview,
          caption: caption || undefined,
          business: business || undefined,
          mimeType: preview.match(/^data:([^;]+)/)?.[1] || "image/jpeg",
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setPreview(null);
          setCaption("");
          setBusiness("");
        }, 2000);
      }
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Camera viewfinder or preview */}
      {stream && !preview && (
        <div className="relative rounded-sm overflow-hidden border border-zinc-700 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
            style={{ maxHeight: 192 }}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={captureFrame}
              className="w-12 h-12 rounded-full bg-white/90 border-4 border-cyan-400 flex items-center justify-center"
            >
              <Camera className="w-5 h-5 text-black" />
            </button>
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative rounded-sm overflow-hidden border border-zinc-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Captured" className="w-full" style={{ maxHeight: 192, objectFit: "cover" }} />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-sm bg-black/60 flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!stream && !preview && (
        <div className="flex gap-2">
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-700 rounded-sm text-sm text-zinc-300 hover:border-cyan-700 transition-colors"
          >
            <Video className="w-4 h-4 text-cyan-400" />
            Take Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-700 rounded-sm text-sm text-zinc-300 hover:border-cyan-700 transition-colors"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Caption */}
      {preview && (
        <>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption (optional)..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#00F5FF] rounded-sm text-sm text-white placeholder:text-zinc-600 p-3 resize-none outline-none transition-colors"
          />

          {/* Business selector */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Business</p>
            <div className="flex flex-wrap gap-1.5">
              {BUSINESS_OPTIONS.map(biz => (
                <button
                  key={biz}
                  onClick={() => setBusiness(prev => prev === biz ? "" : biz)}
                  className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-sm border transition-colors ${
                    business === biz
                      ? "bg-[#00F5FF]/10 border-[#00F5FF]/50 text-[#00F5FF]"
                      : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {biz}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full py-3 rounded-sm bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Saved to vault
              </motion.div>
            ) : (
              <Button
                onClick={saveMedia}
                disabled={uploading}
                className="w-full bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/40 rounded-sm font-medium disabled:opacity-40"
              >
                {uploading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Image className="w-4 h-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Save Media"}
              </Button>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function DriveSyncPanel() {
  const [driveStatus, setDriveStatus] = useState<{ connected: boolean; googleEmail?: string; connectedAt?: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; fileUrl?: string; error?: string; connectUrl?: string } | null>(null);

  useEffect(() => {
    async function checkDrive() {
      try {
        const res = await fetch("/api/founder/documents/drive/status");
        if (res.ok) {
          setDriveStatus(await res.json());
        } else {
          setDriveStatus({ connected: false });
        }
      } catch {
        setDriveStatus({ connected: false });
      }
    }
    checkDrive();
  }, []);

  const syncToDrive = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/founder/os/drive-sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
    } catch {
      setSyncResult({ error: "Network error — try again" });
    } finally {
      setSyncing(false);
    }
  };

  const lastSync = driveStatus?.connectedAt
    ? new Date(driveStatus.connectedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
    : null;

  return (
    <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudUpload className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Drive Backup</h3>
        </div>
        {driveStatus === null ? (
          <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
        ) : driveStatus.connected ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-zinc-500">{driveStatus.googleEmail}</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-red-500" title="Not connected" />
        )}
      </div>

      {lastSync && (
        <p className="text-[10px] text-zinc-600">Last sync: {lastSync} AEST</p>
      )}

      {driveStatus?.connected ? (
        <motion.button
          onClick={syncToDrive}
          disabled={syncing}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
        >
          {syncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CloudUpload className="w-3.5 h-3.5" />
          )}
          {syncing ? "Syncing…" : "Backup to Drive"}
        </motion.button>
      ) : driveStatus !== null ? (
        <Link
          href="/api/founder/documents/drive/connect"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <CloudUpload className="w-3.5 h-3.5" />
          Connect Google Drive
        </Link>
      ) : null}

      {/* Sync result */}
      <AnimatePresence>
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {syncResult.success ? (
              <div className="flex items-center gap-2 p-2 rounded-sm bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-400">Synced to Google Drive</p>
                  {syncResult.fileUrl && (
                    <a
                      href={syncResult.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-500/70 hover:text-emerald-400 underline underline-offset-2 truncate block"
                    >
                      Open in Drive
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-sm bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-[10px] text-red-400">{syncResult.error}</p>
                {syncResult.connectUrl && (
                  <Link
                    href={syncResult.connectUrl}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex-shrink-0"
                  >
                    Connect
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CaptureTab() {
  const [captureMode, setCaptureMode] = useState<"text" | "media">("text");
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [business, setBusiness] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentCaptures, setRecentCaptures] = useState<string[]>([]);
  const [vaultConnected, setVaultConnected] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null); // eslint-disable-line

  // Check vault status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/founder/obsidian/status");
        if (res.ok) {
          const data = await res.json();
          setVaultConnected(!!data.connected);
        } else {
          setVaultConnected(false);
        }
      } catch {
        setVaultConnected(false);
      }
    }
    checkStatus();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const toggleBusiness = (biz: string) => {
    setBusiness(prev => (prev === biz ? "" : biz));
  };

  const toggleSpeech = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line
    if (!SR) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-AU";
    recognition.onresult = (e: any) => { // eslint-disable-line
      setText(prev => prev ? `${prev} ${e.results[0][0].transcript}` : e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const pushToObsidian = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/founder/obsidian/daily-note/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          tags: selectedTags,
          business: business || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecentCaptures(data.captures ?? []);
        setText("");
        setSelectedTags([]);
        setBusiness("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
      } else if (data.error?.includes("not connected")) {
        setVaultConnected(false);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            {captureMode === "text" ? "Obsidian Capture" : "Media Capture"}
          </h2>
        </div>
        {/* Mode toggle + Vault status */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setCaptureMode("text")}
              className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                captureMode === "text"
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setCaptureMode("media")}
              className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                captureMode === "media"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Media
            </button>
          </div>
          {captureMode === "text" && (
            <div className="flex items-center gap-1.5">
              {vaultConnected === null ? (
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
              ) : vaultConnected ? (
                <div className="w-2 h-2 rounded-full bg-violet-500" title="Vault connected" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-500" title="Vault disconnected" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media capture mode */}
      {captureMode === "media" && <MediaCapturePanel />}

      {/* Text capture mode */}
      {captureMode === "text" && vaultConnected === null && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {captureMode === "text" && vaultConnected === false && (
        <div className="flex flex-col items-center gap-3 p-5 rounded-sm bg-zinc-900 border border-zinc-800 text-center">
          <BookOpen className="w-8 h-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">Obsidian vault not connected</p>
          <p className="text-xs text-zinc-600">
            Set up your vault in Integrations to start capturing notes directly to Obsidian.
          </p>
          <Link
            href="/founder/integrations"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            Go to Integrations →
          </Link>
        </div>
      )}

      {captureMode === "text" && vaultConnected === true && (
        <>
          {/* Textarea + voice button */}
          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's on your mind? Capture a thought, decision, or follow-up…"
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#00F5FF] rounded-sm text-sm text-white placeholder:text-zinc-600 p-3 pr-10 resize-none outline-none transition-colors"
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) pushToObsidian();
              }}
            />
            <button
              onClick={toggleSpeech}
              title={listening ? "Stop listening" : "Voice input"}
              className={`absolute bottom-3 right-3 w-7 h-7 rounded-sm flex items-center justify-center transition-colors ${
                listening
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Business selector */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Business</p>
            <div className="flex flex-wrap gap-1.5">
              {BUSINESS_OPTIONS.map(biz => (
                <button
                  key={biz}
                  onClick={() => toggleBusiness(biz)}
                  className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-sm border transition-colors ${
                    business === biz
                      ? "bg-[#00F5FF]/10 border-[#00F5FF]/50 text-[#00F5FF]"
                      : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {biz}
                </button>
              ))}
            </div>
          </div>

          {/* Tag pills */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {CAPTURE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-sm border transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-violet-500/15 border-violet-500/50 text-violet-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full py-3 rounded-sm bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Captured!
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={pushToObsidian}
                  disabled={!text.trim() || loading}
                  className="w-full bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/40 rounded-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Pushing…" : "Push to Obsidian"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent captures */}
          {recentCaptures.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Recent captures (today)
              </p>
              <div className="flex flex-col gap-1.5">
                {recentCaptures.map((cap, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-sm bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 leading-snug"
                  >
                    {cap}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drive sync panel */}
          <DriveSyncPanel />

          <p className="text-[10px] text-zinc-600 text-center mt-auto pb-1">
            Captures append to today&apos;s daily note in your Obsidian vault via Google Drive
          </p>
        </>
      )}

      {/* Show Drive sync in media mode too */}
      {captureMode === "media" && (
        <div className="px-4 pb-3">
          <DriveSyncPanel />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PhillOSPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <div
      className="flex flex-col bg-[#0d0d0d] text-white"
      style={{ height: "100dvh", maxWidth: 480, margin: "0 auto", position: "relative" }}
    >
      <PhillOSPwaInstaller />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Phill OS</h1>
            <p className="text-[10px] text-zinc-500 leading-tight">Command Centre</p>
          </div>
        </div>
        <Badge variant="outline" className="border-cyan-700/50 text-cyan-400 text-[10px] px-2 py-0.5">
          Founder
        </Badge>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat"      && <ChatTab session={session} />}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "ecosystem" && <EcosystemTab />}
        {activeTab === "calendar"  && <CalendarTab />}
        {activeTab === "kanban"    && <KanbanTab />}
        {activeTab === "capture"   && <CaptureTab />}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950 safe-area-bottom">
        <nav className="flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive ? "text-cyan-400" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
