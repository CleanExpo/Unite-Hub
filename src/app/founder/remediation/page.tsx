"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface RemediationTask {
  id: string;
  source: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface RemediationSummary {
  total_tasks: number;
  open: number;
  in_progress: number;
  done: number;
  critical: number;
  high: number;
  overdue: number;
}

export default function RemediationEnginePage() {
  const [tasks, setTasks] = useState<RemediationTask[]>([]);
  const [summary, setSummary] = useState<RemediationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      Promise.all([
        fetch(`/api/founder/remediation?workspaceId=${userId}`).then((r) => r.json()),
        fetch(`/api/founder/remediation?workspaceId=${userId}&action=summary`).then((r) => r.json()),
      ])
        .then(([tasksData, summaryData]) => {
          setTasks(tasksData.items || []);
          setSummary(summaryData.summary);
        })
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-bg-primary p-6"><div className="text-text-primary">Loading...</div></div>;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500";
      case "low": return "bg-blue-500/10 text-blue-500 border-blue-500";
      default: return "bg-bg-card text-text-secondary border-border";
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Task Remediation Engine</h1>
          <p className="text-text-secondary mt-1">E35: System-generated remediation tasks to reduce governance risk</p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Tasks</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{summary.total_tasks}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Open</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">{summary.open}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Critical</div>
              <div className="text-2xl font-bold text-red-500 mt-1">{summary.critical}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Overdue</div>
              <div className="text-2xl font-bold text-orange-500 mt-1">{summary.overdue}</div>
            </Card>
          </div>
        )}

        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Remediation Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-text-secondary">No remediation tasks found.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`border-l-4 pl-4 py-2 ${getPriorityColor(task.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">{task.title}</span>
                        <span className="px-2 py-1 text-xs rounded bg-accent-500/10 text-accent-500 capitalize">
                          {task.source}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-bg-card text-text-secondary capitalize">
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary whitespace-nowrap ml-4">
                      {new Date(task.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
