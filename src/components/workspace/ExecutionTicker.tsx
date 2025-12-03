"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TickerItem {
  id: string;
  time: string;
  message: string;
  platform: "meta" | "google" | "tiktok" | "linkedin" | "email" | "youtube";
}

interface ExecutionTickerProps {
  workspaceId?: string;
}

const platformConfig = {
  meta: { icon: "f", color: "bg-[#1877F2]", name: "Meta" },
  google: { icon: "G", color: "bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500", name: "Google" },
  tiktok: { icon: "T", color: "bg-black", name: "TikTok" },
  linkedin: { icon: "in", color: "bg-[#0A66C2]", name: "LinkedIn" },
  email: { icon: "@", color: "bg-purple-500", name: "Email" },
  youtube: { icon: "Y", color: "bg-red-600", name: "YouTube" },
};

export function ExecutionTicker({ workspaceId }: ExecutionTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([
    {
      id: "1",
      time: "10:45 AM",
      message: "Deployed 12 variants to Meta Ads",
      platform: "meta",
    },
    {
      id: "2",
      time: "10:42 AM",
      message: "Generated Google Display assets",
      platform: "google",
    },
    {
      id: "3",
      time: "10:38 AM",
      message: "Scheduled TikTok campaign",
      platform: "tiktok",
    },
    {
      id: "4",
      time: "10:30 AM",
      message: "Published LinkedIn carousel",
      platform: "linkedin",
    },
    {
      id: "5",
      time: "10:15 AM",
      message: "Sent email campaign batch",
      platform: "email",
    },
    {
      id: "6",
      time: "10:08 AM",
      message: "Uploaded YouTube Shorts",
      platform: "youtube",
    },
  ]);

  // Fetch real execution logs
  useEffect(() => {
    const fetchLogs = async () => {
      if (!workspaceId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `/api/execution-logs?workspaceId=${workspaceId}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.logs && data.logs.length > 0) {
            setItems(
              data.logs.map((log: any) => ({
                id: log.id,
                time: new Date(log.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }),
                message: log.message,
                platform: log.platform || "meta",
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching execution logs:", error);
      }
    };

    fetchLogs();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  return (
    <section className="flex-1 flex flex-col bg-bg-base/50">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-cyan-900/30 bg-bg-card/50">
        <div className="flex items-center font-semibold text-sm text-white gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Live Execution Ticker
        </div>
        <button className="text-gray-500 hover:text-cyan-400 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      <div className="overflow-y-auto flex-1">
        {items.map((item) => {
          const config = platformConfig[item.platform];
          return (
            <div
              key={item.id}
              className="px-4 py-3 flex gap-3 border-b border-cyan-900/20 text-xs items-center hover:bg-cyan-900/10 transition-colors"
            >
              <div className="text-emerald-400 font-medium whitespace-nowrap flex items-center min-w-[70px]">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                {item.time}
              </div>
              <div className="text-gray-300 flex-1 truncate">{item.message}</div>
              <div
                className={`w-5 h-5 rounded flex-shrink-0 flex justify-center items-center text-white text-[9px] font-bold ${config.color}`}
                title={config.name}
              >
                {config.icon}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
