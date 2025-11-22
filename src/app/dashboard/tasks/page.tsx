"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TasksPage() {
  const tasks = [
    { title: "Review Q4 marketing strategy", due: "Today", priority: "High", status: "In Progress" },
    { title: "Update email campaign copy", due: "Tomorrow", priority: "Medium", status: "Pending" },
    { title: "Analyze competitor SEO rankings", due: "Nov 25", priority: "Medium", status: "Pending" },
    { title: "Prepare client presentation", due: "Nov 26", priority: "High", status: "Pending" },
    { title: "Optimize landing page CTA", due: "Nov 24", priority: "Low", status: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">Manage your work items and deadlines</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold text-white">1</p>
                <p className="text-sm text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-white">1</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <CheckSquare className={`h-5 w-5 ${
                  task.status === "Completed" ? "text-emerald-500" : "text-slate-500"
                }`} />
                <div>
                  <h3 className={`font-medium ${
                    task.status === "Completed" ? "text-slate-400 line-through" : "text-white"
                  }`}>{task.title}</h3>
                  <p className="text-sm text-slate-400">Due: {task.due}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  task.priority === "High" ? "bg-red-500/20 text-red-400" :
                  task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-slate-500/20 text-slate-400"
                }`}>
                  {task.priority}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
