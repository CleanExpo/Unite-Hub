"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TickerItem {
  id: string;
  time: string;
  message: string;
  platform: "meta" | "google" | "tiktok" | "linkedin" | "email";
}

interface ExecutionTickerProps {
  workspaceId?: string;
}

const platformConfig = {
  meta: { icon: "M", color: "bg-[#1877F2]" },
  google: { icon: "G", color: "bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" },
  tiktok: { icon: "T", color: "bg-black" },
  linkedin: { icon: "in", color: "bg-[#0A66C2]" },
  email: { icon: "@", color: "bg-purple-500" },
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
      message: "Published LinkedIn post",
      platform: "linkedin",
    },
    {
      id: "5",
      time: "10:15 AM",
      message: "Sent email campaign batch",
      platform: "email",
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
    <section className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-50">
        <div className="flex items-center font-semibold text-sm text-gray-900">
          Live Execution Ticker
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      <div className="overflow-y-auto">
        {items.map((item) => {
          const config = platformConfig[item.platform];
          return (
            <div
              key={item.id}
              className="px-4 py-3 flex gap-3 border-b border-gray-100 text-xs items-start"
            >
              <div className="text-green-500 font-semibold whitespace-nowrap flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                {item.time}
              </div>
              <div className="text-gray-900 flex-1">{item.message}</div>
              <div
                className={`w-[18px] h-[18px] rounded-full flex-shrink-0 flex justify-center items-center text-white text-[10px] font-bold ${config.color}`}
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
