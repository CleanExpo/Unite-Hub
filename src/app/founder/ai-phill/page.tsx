"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Send, Bot, User, Lightbulb, TrendingUp, Building2, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BusinessSummary {
  business_key: string;
  display_name: string;
  channel_count: number;
  latest_snapshot_date: string | null;
}

export default function AiPhillPage() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm AI Phill, your business intelligence advisor. I monitor your portfolio and provide insights based on signals across your businesses. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({ totalBusinesses: 0, totalChannels: 0, totalSnapshots: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch portfolio stats for sidebar
  const fetchPortfolioStats = useCallback(async () => {
    try {
      const res = await fetch("/api/founder/business-vault?stats=true");
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
        setPortfolioStats({
          totalBusinesses: data.totalBusinesses || 0,
          totalChannels: data.totalChannels || 0,
          totalSnapshots: data.totalSnapshots || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch portfolio stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioStats();
  }, [fetchPortfolioStats]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Build context about the portfolio for richer AI responses
      const portfolioContext = businesses.length > 0
        ? `The user manages ${portfolioStats.totalBusinesses} businesses: ${businesses.map(b => b.display_name).join(", ")}. They have ${portfolioStats.totalChannels} channels and ${portfolioStats.totalSnapshots} AI snapshots.`
        : "";

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          message: currentInput,
          context: "founder_advisor",
          workspaceId: undefined,
          systemContext: portfolioContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "I apologize, but I couldn't generate a response.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorData = await res.json().catch(() => null);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I encountered an issue: ${errorData?.error || "Unable to process your request right now. Please try again."}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "What are the key trends across my businesses this week?",
    "Which business needs the most attention right now?",
    "Help me plan my marketing strategy for next month",
    "What opportunities should I focus on?",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Phill</h1>
            <p className="text-sm text-slate-400">Your AI Business Intelligence Advisor</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchPortfolioStats} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Chat with AI Phill</h3>
                <span className="ml-auto text-xs text-slate-500">Powered by Claude</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-emerald-600"
                          : "bg-gradient-to-br from-blue-600 to-purple-600"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-emerald-600/20 border border-emerald-500/30"
                          : "bg-slate-700/50 border border-slate-600"
                      }`}
                    >
                      <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ask AI Phill anything about your businesses..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Suggested Prompts */}
          <div className="grid grid-cols-2 gap-3">
            {suggestedPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => setInput(prompt)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 justify-start text-left h-auto py-3"
              >
                <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-400" />
                <span className="text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Portfolio Overview */}
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Portfolio Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Businesses</span>
                <span className="text-lg font-bold text-blue-400">{portfolioStats.totalBusinesses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Channels</span>
                <span className="text-lg font-bold text-emerald-400">{portfolioStats.totalChannels}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">AI Snapshots</span>
                <span className="text-lg font-bold text-purple-400">{portfolioStats.totalSnapshots}</span>
              </div>
            </div>
          </Card>

          {/* Business List */}
          {businesses.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Your Businesses
                </h3>
              </div>
              <div className="divide-y divide-slate-700">
                {businesses.map((b) => (
                  <div key={b.business_key} className="p-4 hover:bg-slate-800/30 transition-colors">
                    <h4 className="text-sm font-medium text-white">{b.display_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-500">
                        {b.channel_count} channel{b.channel_count !== 1 ? "s" : ""}
                      </span>
                      {b.latest_snapshot_date && (
                        <span className="text-[11px] text-slate-500">
                          Last snapshot: {new Date(b.latest_snapshot_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Tips */}
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <h3 className="font-semibold text-white mb-3 text-sm">Quick Tips</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                Ask about trends, performance, or strategy across your portfolio
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                Request competitive analysis or market insights
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                Get help planning campaigns or content strategy
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
