"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface ContentItem {
  date: number;
  contentType: string;
  description: string;
  status: "draft" | "scheduled" | "published";
  platform: string;
}

interface CampaignCalendarProps {
  contentCalendar: ContentItem[];
  onDateClick?: (date: Date) => void;
}

export function CampaignCalendar({ contentCalendar, onDateClick }: CampaignCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getContentForDate = (date: Date) => {
    return contentCalendar.filter((item) => isSameDay(item.date, date));
  };

  const statusColors: Record<string, { color: string; bg: string }> = {
    draft:     { color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
    scheduled: { color: "#00F5FF",               bg: "rgba(0,245,255,0.10)" },
    published: { color: "#00FF88",               bg: "rgba(0,255,136,0.10)" },
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-mono text-white flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" style={{ color: "#00F5FF" }} />
          Content Calendar
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-sm border
                       bg-white/[0.02] border-white/[0.06] text-white/50
                       hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-white min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-sm border
                       bg-white/[0.02] border-white/[0.06] text-white/50
                       hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-mono text-white/30 py-2">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const content = getContentForDate(day);
          const isToday = isSameDay(day, new Date());
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toString()}
              onClick={() => onDateClick?.(day)}
              className={`min-h-[100px] p-2 border rounded-sm transition-colors ${
                inMonth
                  ? "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06] hover:border-white/[0.10]"
                  : "bg-transparent border-white/[0.03] text-white/20"
              } ${isToday ? "ring-1 ring-[#00F5FF]/40" : ""}`}
            >
              <div className="text-right mb-1">
                <span
                  className={`text-sm font-mono ${
                    isToday ? "font-bold" : "text-white/60"
                  }`}
                  style={isToday ? { color: "#00F5FF" } : undefined}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {content.slice(0, 2).map((item, index) => {
                  const sc = statusColors[item.status] || statusColors.draft;
                  return (
                    <div
                      key={index}
                      className="text-xs font-mono px-1.5 py-0.5 rounded-sm truncate"
                      style={{ color: sc.color, backgroundColor: sc.bg }}
                    >
                      {item.contentType}
                    </div>
                  );
                })}
                {content.length > 2 && (
                  <div className="text-xs font-mono text-white/30 text-center">
                    +{content.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.06]">
        <span className="text-sm font-mono text-white/40">Status:</span>
        {(["draft", "scheduled", "published"] as const).map((s) => {
          const sc = statusColors[s];
          return (
            <span
              key={s}
              className="text-xs font-mono px-2 py-0.5 rounded-sm capitalize"
              style={{ color: sc.color, backgroundColor: sc.bg }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
