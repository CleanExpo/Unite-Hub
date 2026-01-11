"use client";

/**
 * Client Roadmap Dashboard
 * Phase 36: MVP Client Truth Layer
 *
 * Gantt-like view of projects and tasks
 */

import { useState } from "react";
import { Calendar, CheckCircle, Clock, AlertTriangle, Filter } from "lucide-react";

type TaskStatus = "planned" | "in_progress" | "waiting_approval" | "complete";

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  start_date: string | null;
  end_date: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  tasks: Task[];
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  planned: { label: "Planned", color: "text-gray-600", bg: "bg-gray-200" },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-500" },
  waiting_approval: { label: "Waiting on You", color: "text-yellow-600", bg: "bg-yellow-500" },
  complete: { label: "Complete", color: "text-green-600", bg: "bg-green-500" },
};

export default function RoadmapPage() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  // Mock data
  const projects: Project[] = [
    {
      id: "1",
      name: "Website Optimization",
      description: "Technical SEO and performance improvements",
      status: "in_progress",
      tasks: [
        { id: "t1", name: "Technical audit", status: "complete", start_date: "2025-11-01", end_date: "2025-11-05" },
        { id: "t2", name: "Page speed optimization", status: "in_progress", start_date: "2025-11-06", end_date: "2025-11-15" },
        { id: "t3", name: "Schema markup", status: "planned", start_date: "2025-11-16", end_date: "2025-11-20" },
      ],
    },
    {
      id: "2",
      name: "Content Strategy",
      description: "Blog and service page content development",
      status: "planned",
      tasks: [
        { id: "t4", name: "Content audit", status: "waiting_approval", start_date: "2025-11-10", end_date: "2025-11-12" },
        { id: "t5", name: "Keyword research", status: "planned", start_date: "2025-11-13", end_date: "2025-11-18" },
      ],
    },
  ];

  const filteredProjects = projects.map((project) => ({
    ...project,
    tasks: project.tasks.filter((task) =>
      filter === "all" ? true : task.status === filter
    ),
  })).filter((p) => p.tasks.length > 0 || filter === "all");

  return (
    <div className="min-h-screen bg-bg-raised">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-accent-600" />
            <h1 className="text-2xl font-bold text-text-primary">
              Your Roadmap
            </h1>
          </div>
          <p className="text-text-secondary">
            Track planned and in-progress work
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Items marked &quot;Planned&quot; are upcoming, not guaranteed. Timelines may shift based on priorities and approvals.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskStatus | "all")}
            className="text-sm border border-border-subtle rounded-lg px-3 py-1.5 bg-bg-card"
          >
            <option value="all">All Tasks</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_approval">Waiting on You</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        {/* Projects */}
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-bg-card rounded-lg border border-border-subtle"
            >
              <div className="p-4 border-b border-border-subtle">
                <h2 className="font-semibold text-text-primary">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="text-sm text-text-secondary">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="p-4 space-y-3">
                {project.tasks.map((task) => {
                  const config = STATUS_CONFIG[task.status];
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">
                          {task.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={config.color}>{config.label}</span>
                          {task.start_date && task.end_date && (
                            <>
                              <span>•</span>
                              <span>
                                {new Date(task.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {" - "}
                                {new Date(task.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {task.status === "complete" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {task.status === "waiting_approval" && (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
