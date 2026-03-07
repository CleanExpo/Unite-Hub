"use client";

import { Clock, Play, Calendar } from "lucide-react";

export default function TimeTrackerPage() {
  const entries = [
    { project: "Website Redesign", task: "Homepage layout", time: "2h 30m", date: "Today" },
    { project: "Email Campaign", task: "Copy writing", time: "1h 15m", date: "Today" },
    { project: "SEO Audit", task: "Keyword research", time: "3h 00m", date: "Yesterday" },
    { project: "Client Meeting", task: "Strategy call", time: "45m", date: "Yesterday" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Time Tracker</h1>
          <p className="text-white/50 mt-1">Track time spent on projects and tasks</p>
        </div>
        <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2">
          <Play className="h-4 w-4" />
          Start Timer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <p className="text-sm text-white/40">Today</p>
          <p className="text-2xl font-bold text-white mt-1">3h 45m</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <p className="text-sm text-white/40">This Week</p>
          <p className="text-2xl font-bold text-white mt-1">18h 30m</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <p className="text-sm text-white/40">This Month</p>
          <p className="text-2xl font-bold text-white mt-1">72h 15m</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          Recent Entries
        </h3>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-white/40" />
                <div>
                  <p className="font-medium text-white">{entry.project}</p>
                  <p className="text-sm text-white/40">{entry.task}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">{entry.time}</p>
                <p className="text-sm text-white/40">{entry.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
