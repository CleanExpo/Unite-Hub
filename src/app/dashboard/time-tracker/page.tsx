"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, Calendar } from "lucide-react";

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
          <p className="text-slate-400 mt-1">Track time spent on projects and tasks</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Play className="h-4 w-4 mr-2" />
          Start Timer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Today</p>
            <p className="text-2xl font-bold text-white mt-1">3h 45m</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">This Week</p>
            <p className="text-2xl font-bold text-white mt-1">18h 30m</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">This Month</p>
            <p className="text-2xl font-bold text-white mt-1">72h 15m</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-medium text-white">{entry.project}</p>
                    <p className="text-sm text-slate-400">{entry.task}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{entry.time}</p>
                  <p className="text-sm text-slate-400">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
