"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Runbook {
  id: string;
  category: string;
  title: string;
  description?: string;
  is_template: boolean;
  estimated_duration_minutes?: number;
  tags?: string[];
  step_count?: number;
  created_at: string;
}

interface RunbookAssignment {
  id: string;
  runbook_id: string;
  runbook_title: string;
  assigned_to: string;
  assigned_by: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface RunbookStatus {
  assignment_id: string;
  runbook_title: string;
  status: string;
  total_steps: number;
  completed_steps: number;
  progress_percent: number;
}

export default function RunbookCenterPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [assignments, setAssignments] = useState<RunbookAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "assignments">("templates");
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<RunbookStatus | null>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, activeTab]);

  async function loadData() {
    try {
      if (activeTab === "templates") {
        const res = await fetch(`/api/founder/runbooks?workspaceId=${userId}&isTemplate=true`);
        const data = await res.json();
        setRunbooks(data.runbooks || []);
      } else {
        const res = await fetch(`/api/founder/runbooks?workspaceId=${userId}&action=list-assignments`);
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignmentStatus(assignmentId: string) {
    try {
      const res = await fetch(`/api/founder/runbooks?workspaceId=${userId}&action=get-status&assignmentId=${assignmentId}`);
      const data = await res.json();
      setAssignmentStatus(data.status);
      setSelectedAssignment(assignmentId);
    } catch (err) {
      console.error("Failed to load assignment status", err);
    }
  }

  async function assignRunbook(runbookId: string) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/founder/runbooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-runbook",
          workspaceId: userId,
          runbookId,
          assignedTo: userId,
        }),
      });
      if (res.ok) {
        alert("Runbook assigned successfully!");
        setActiveTab("assignments");
      }
    } catch (err) {
      console.error("Failed to assign runbook", err);
    }
  }

  async function startAssignment(assignmentId: string) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/founder/runbooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-assignment-status",
          workspaceId: userId,
          assignmentId,
          status: "active",
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to start assignment", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="text-text-primary">Loading runbooks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Runbook & Playbook Center</h1>
          <p className="text-text-secondary mt-1">E30: Reusable playbooks for incidents, compliance, onboarding</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 font-medium ${
              activeTab === "templates"
                ? "text-accent-500 border-b-2 border-accent-500"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 font-medium ${
              activeTab === "assignments"
                ? "text-accent-500 border-b-2 border-accent-500"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Assignments
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {runbooks.length === 0 && (
              <Card className="bg-bg-card border-border p-6">
                <p className="text-text-secondary">No runbook templates found.</p>
              </Card>
            )}
            {runbooks.map((rb) => (
              <Card key={rb.id} className="bg-bg-card border-border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-text-primary">{rb.title}</h2>
                      <span className="px-2 py-1 text-xs rounded bg-accent-500/10 text-accent-500 font-medium">
                        {rb.category.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    {rb.description && <p className="text-text-secondary text-sm mb-3">{rb.description}</p>}
                    <div className="flex gap-4 text-sm text-text-secondary">
                      <span>{rb.step_count || 0} steps</span>
                      {rb.estimated_duration_minutes && <span>~{rb.estimated_duration_minutes} min</span>}
                    </div>
                    {rb.tags && rb.tags.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {rb.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded bg-bg-primary text-text-secondary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => assignRunbook(rb.id)}
                    className="bg-accent-500 hover:bg-accent-600 text-white"
                  >
                    Assign to Me
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-text-primary">My Assignments</h2>
              {assignments.length === 0 && (
                <Card className="bg-bg-card border-border p-6">
                  <p className="text-text-secondary">No assignments found.</p>
                </Card>
              )}
              {assignments.map((asg) => (
                <Card
                  key={asg.id}
                  className={`bg-bg-card border-border p-4 cursor-pointer hover:border-accent-500 ${
                    selectedAssignment === asg.id ? "border-accent-500" : ""
                  }`}
                  onClick={() => loadAssignmentStatus(asg.id)}
                >
                  <h3 className="font-semibold text-text-primary mb-1">{asg.runbook_title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        asg.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : asg.status === "active"
                          ? "bg-blue-500/10 text-blue-500"
                          : asg.status === "cancelled"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {asg.status.toUpperCase()}
                    </span>
                    <span className="text-text-secondary text-xs">{new Date(asg.created_at).toLocaleDateString()}</span>
                  </div>
                  {asg.status === "draft" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startAssignment(asg.id);
                      }}
                      className="mt-3 bg-accent-500 hover:bg-accent-600 text-white text-sm"
                    >
                      Start
                    </Button>
                  )}
                </Card>
              ))}
            </div>

            {/* Assignment Details */}
            <div>
              {assignmentStatus && (
                <Card className="bg-bg-card border-border p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">Assignment Details</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-text-secondary text-sm">Runbook</div>
                      <div className="text-text-primary font-medium">{assignmentStatus.runbook_title}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-sm">Status</div>
                      <div className="text-text-primary font-medium">{assignmentStatus.status.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-sm mb-2">Progress</div>
                      <div className="w-full bg-bg-primary rounded-full h-2">
                        <div
                          className="bg-accent-500 h-2 rounded-full"
                          style={{ width: `${assignmentStatus.progress_percent}%` }}
                        />
                      </div>
                      <div className="text-text-secondary text-xs mt-1">
                        {assignmentStatus.completed_steps} / {assignmentStatus.total_steps} steps completed (
                        {assignmentStatus.progress_percent}%)
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
