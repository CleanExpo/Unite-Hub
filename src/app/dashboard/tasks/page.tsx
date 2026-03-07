"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare, Plus, Clock, AlertCircle, CheckCircle2, RefreshCw,
  Search, Calendar, User,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  deadline?: string;
  assigned_to?: string;
  brand_slug?: string;
  created_at: string;
  updated_at: string;
}

export default function TasksPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTasks = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ workspaceId });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/founder/ops/tasks?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        let allTasks: Task[] = data.tasks || [];
        if (searchTerm) {
          allTasks = allTasks.filter((t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setTasks(allTasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, session?.access_token, statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    if (workspaceId && session?.access_token) fetchTasks();
  }, [workspaceId, session?.access_token, fetchTasks]);

  const pending = tasks.filter((t) => ["pending", "draft", "scheduled"].includes(t.status)).length;
  const inProgress = tasks.filter((t) => ["in_progress", "pending_review"].includes(t.status)).length;
  const completed = tasks.filter((t) => ["completed", "approved"].includes(t.status)).length;

  const priorityColors: Record<string, string> = {
    urgent: "bg-[#FF4444]/20 text-[#FF4444]",
    high: "bg-[#FFB800]/20 text-[#FFB800]",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-white/[0.04] text-white/40",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="w-4 h-4 text-white/40" />,
    pending: <Clock className="w-4 h-4 text-[#FFB800]" />,
    scheduled: <Calendar className="w-4 h-4 text-purple-400" />,
    in_progress: <AlertCircle className="w-4 h-4 text-[#00F5FF]" />,
    pending_review: <User className="w-4 h-4 text-[#FFB800]" />,
    completed: <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />,
    approved: <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />,
    rejected: <AlertCircle className="w-4 h-4 text-[#FF4444]" />,
  };

  if (workspaceLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/[0.03] rounded-sm w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.03] rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-mono font-bold text-white/90">Tasks</h1>
          <p className="text-sm text-white/40 mt-1">Manage your work items and deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchTasks}
            className="text-white/40 hover:text-white/90"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <button
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { label: "Pending", value: pending, icon: Clock, color: "text-[#FFB800]", bg: "bg-[#FFB800]/10" },
          { label: "In Progress", value: inProgress, icon: AlertCircle, color: "text-[#00F5FF]", bg: "bg-[#00F5FF]/10" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-[#00FF88]", bg: "bg-[#00FF88]/10" },
        ].map((s) => (
          <Card key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-sm ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/90">{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/[0.04] border border-white/[0.06] text-white/90 placeholder:text-white/20 rounded-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white/[0.04] border border-white/[0.06] text-white/90 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#080808] border border-white/[0.06] rounded-sm">
            {["all", "draft", "scheduled", "in_progress", "pending_review", "completed"].map((v) => (
              <SelectItem key={v} value={v} className="text-white/90 hover:bg-white/[0.06]">
                {v === "all" ? "All Status" : v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 bg-white/[0.04] border border-white/[0.06] text-white/90 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#080808] border border-white/[0.06] rounded-sm">
            {["all", "urgent", "high", "medium", "low"].map((v) => (
              <SelectItem key={v} value={v} className="text-white/90 hover:bg-white/[0.06]">
                {v === "all" ? "All Priority" : v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Task list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.03] rounded-sm animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <CardContent className="text-center py-16">
              <CheckSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-semibold text-white/90 mb-2">No tasks found</h3>
              <p className="text-sm text-white/40 mb-6">
                {statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <Card
                key={t.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-sm hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {statusIcons[t.status] || <CheckSquare className="w-4 h-4 text-white/40" />}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-medium truncate ${
                          ["completed", "approved"].includes(t.status)
                            ? "text-white/40 line-through"
                            : "text-white/90"
                        }`}
                      >
                        {t.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {t.brand_slug && (
                          <span className="text-[11px] text-white/40">
                            {t.brand_slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        )}
                        {(t.deadline || t.due_date) && (
                          <span className="text-[11px] text-white/40 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(t.deadline || t.due_date!).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                        {t.assigned_to && (
                          <span className="text-[11px] text-white/40 flex items-center gap-1">
                            <User className="w-3 h-3" /> {t.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 border-transparent ${
                        priorityColors[t.priority] || "bg-white/[0.04] text-white/40"
                      }`}
                    >
                      {t.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        ["completed", "approved"].includes(t.status)
                          ? "text-[#00FF88] border-[#00FF88]/30"
                          : t.status === "in_progress"
                          ? "text-[#00F5FF] border-[#00F5FF]/30"
                          : t.status === "pending_review"
                          ? "text-[#FFB800] border-[#FFB800]/30"
                          : "text-white/40 border-white/[0.08]"
                      }`}
                    >
                      {t.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
