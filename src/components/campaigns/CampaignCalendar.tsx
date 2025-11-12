"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const statusColors = {
    draft: "bg-gray-200 text-gray-700",
    scheduled: "bg-blue-200 text-blue-700",
    published: "bg-green-200 text-green-700",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          Content Calendar
        </h3>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-gray-900 min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const content = getContentForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toString()}
              onClick={() => onDateClick?.(day)}
              className={`min-h-[100px] p-2 border rounded-lg transition-colors ${
                isSameMonth(day, currentMonth)
                  ? "bg-white hover:bg-gray-50 border-gray-200"
                  : "bg-gray-50 border-gray-100 text-gray-400"
              } ${isToday ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-right mb-1">
                <span
                  className={`text-sm font-medium ${
                    isToday ? "text-blue-600 font-bold" : "text-gray-900"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {content.slice(0, 2).map((item, index) => (
                  <div
                    key={index}
                    className={`text-xs px-1.5 py-0.5 rounded truncate ${
                      statusColors[item.status]
                    }`}
                  >
                    {item.contentType}
                  </div>
                ))}
                {content.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{content.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <Badge className="bg-gray-200 text-gray-700">Draft</Badge>
        <Badge className="bg-blue-200 text-blue-700">Scheduled</Badge>
        <Badge className="bg-green-200 text-green-700">Published</Badge>
      </div>
    </div>
  );
}
