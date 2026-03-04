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
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PhillOSPwaInstaller } from "@/components/PhillOSPwaInstaller";
import { PushNotificationToggle } from "@/components/founder/PushNotificationToggle";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "chat" | "dashboard" | "calendar" | "kanban" | "capture";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Load history on mount
  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  useEffect(() => {
    if (!showHistory) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showHistory]);

  const toggleSpeech = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
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
    </div>
  );
}

function CaptureTab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
        setError(null);
      }
    } catch {
      setError("Camera access denied or not available.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const reset = () => {
    setCaptured(null);
    setNote("");
  };

  useEffect(() => () => { stopCamera(); }, []);

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-y-auto">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Visual Capture</h2>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!captured ? (
        <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-video flex items-center justify-center relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            style={{ display: streaming ? "block" : "none" }}
          />
          {!streaming && (
            <div className="text-center">
              <Video className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No camera active</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-cyan-700/30">
          <img src={captured} alt="Captured" className="w-full rounded-xl" />
          <button onClick={reset} className="absolute top-2 right-2 w-7 h-7 bg-zinc-900/80 rounded-full flex items-center justify-center text-white hover:bg-zinc-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {!streaming && !captured && (
          <Button onClick={startCamera} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
            <Video className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        )}
        {streaming && (
          <>
            <Button onClick={capture} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white">
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            <Button onClick={stopCamera} variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {captured && (
        <div className="space-y-2">
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note or instruction..."
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
          />
          <Button
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
            disabled={!note.trim()}
            onClick={() => {
              // TODO: send to AI or save to vault via API
              reset();
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send to Bron / Save
          </Button>
        </div>
      )}

      <p className="text-xs text-zinc-600 text-center mt-auto">
        Captures are processed locally and sent to your AI command officer
      </p>
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
