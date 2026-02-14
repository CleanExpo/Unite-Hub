"use client";

import { useState, useEffect, useCallback } from "react";
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
    urgent: "bg-red-500/20 text-red-400", high: "bg-orange-500/20 text-orange-400",
    medium: "bg-yellow-500/20 text-yellow-400", low: "bg-slate-500/20 text-slate-400",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="w-4 h-4 text-slate-400" />, pending: <Clock className="w-4 h-4 text-yellow-400" />,
    scheduled: <Calendar className="w-4 h-4 text-purple-400" />, in_progress: <AlertCircle className="w-4 h-4 text-cyan-400" />,
    pending_review: <User className="w-4 h-4 text-orange-400" />, completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    approved: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, rejected: <AlertCircle className="w-4 h-4 text-red-400" />,
  };

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your work items and deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchTasks} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pending, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "In Progress", value: inProgress, icon: AlertCircle, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div><p className="text-2xl font-bold text-white">{s.value}</p><p className="text-xs text-slate-400">{s.label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {["all","draft","scheduled","in_progress","pending_review","completed"].map((v) => (
              <SelectItem key={v} value={v} className="text-white hover:bg-slate-700">
                {v === "all" ? "All Status" : v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {["all","urgent","high","medium","low"].map((v) => (
              <SelectItem key={v} value={v} className="text-white hover:bg-slate-700">
                {v === "all" ? "All Priority" : v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-800/30 rounded-lg animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="text-center py-16">
            <CheckSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-sm text-slate-400 mb-6">
              {statusFilter !== "all" || priorityFilter !== "all" ? "Try adjusting your filters" : "Create your first task to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {statusIcons[t.status] || <CheckSquare className="w-4 h-4 text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-medium truncate ${["completed","approved"].includes(t.status) ? "text-slate-400 line-through" : "text-white"}`}>{t.title}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.brand_slug && <span className="text-[11px] text-slate-500">{t.brand_slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>}
                      {(t.deadline || t.due_date) && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(t.deadline || t.due_date!).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {t.assigned_to && <span className="text-[11px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> {t.assigned_to}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[t.priority] || "bg-slate-500/20 text-slate-400"}`}>{t.priority}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${
                    ["completed","approved"].includes(t.status) ? "text-emerald-400 border-emerald-400/30" :
                    t.status === "in_progress" ? "text-cyan-400 border-cyan-400/30" :
                    t.status === "pending_review" ? "text-orange-400 border-orange-400/30" :
                    "text-slate-400 border-slate-600"
                  }`}>{t.status.replace(/_/g, " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
