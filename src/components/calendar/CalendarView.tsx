"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import CalendarPost from "./CalendarPost";
import { Doc } from "@/convex/_generated/dataModel";

interface CalendarViewProps {
  posts: Doc<"contentCalendarPosts">[];
  onPostClick: (post: Doc<"contentCalendarPosts">) => void;
  onApprove: (postId: string) => void;
  onRegenerate: (postId: string) => void;
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
}

export default function CalendarView({
  posts,
  onPostClick,
  onApprove,
  onRegenerate,
  currentMonth,
  currentYear,
  onMonthChange,
}: CalendarViewProps) {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date | null;
      posts: Doc<"contentCalendarPosts">[];
    }> = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, posts: [] });
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayPosts = posts.filter((post) => {
        const postDate = new Date(post.scheduledDate);
        return (
          postDate.getDate() === day &&
          postDate.getMonth() === currentMonth - 1 &&
          postDate.getFullYear() === currentYear
        );
      });
      days.push({ date, posts: dayPosts });
    }

    return days;
  }, [posts, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(
    "default",
    { month: "long" }
  );

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {monthName} {currentYear}
          </h2>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[120px] border rounded-lg p-2 ${
                day.date
                  ? "bg-white hover:bg-gray-50 cursor-pointer"
                  : "bg-gray-50"
              }`}
            >
              {day.date && (
                <>
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.posts.slice(0, 3).map((post) => (
                      <div
                        key={post._id}
                        onClick={() => onPostClick(post)}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: getPlatformColor(post.platform),
                          color: "white",
                        }}
                      >
                        <div className="font-medium truncate">
                          {post.platform}
                        </div>
                        <div className="truncate opacity-90">
                          {post.postType}
                        </div>
                      </div>
                    ))}
                    {day.posts.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{day.posts.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    linkedin: "#0A66C2",
    blog: "#6B7280",
    email: "#8B5CF6",
  };
  return colors[platform] || "#6B7280";
}
