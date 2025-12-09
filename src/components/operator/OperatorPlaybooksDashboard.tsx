"use client";

/**
 * Operator Playbooks Dashboard - Phase 10 Week 7-8
 *
 * Dashboard for creating, editing, and assigning playbooks to teams and roles.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Book,
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  FileText,
} from "lucide-react";

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  risk_level: string | null;
  status: string;
  version: number;
  created_at: string;
}

interface PlaybookRule {
  id: string;
  playbook_id: string;
  rule_name: string;
  rule_type: string;
  conditions: Record<string, unknown>;
  action: string;
  action_params: Record<string, unknown>;
  coaching_message: string | null;
  coaching_severity: string | null;
  priority: number;
  is_active: boolean;
}

interface Assignment {
  id: string;
  playbook_id: string;
  assignment_type: string;
  target_role: string | null;
  target_user_id: string | null;
  operator_playbooks: { name: string };
}

interface OperatorPlaybooksDashboardProps {
  organizationId: string;
}

export function OperatorPlaybooksDashboard({
  organizationId,
}: OperatorPlaybooksDashboardProps) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [rules, setRules] = useState<PlaybookRule[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("playbooks");

  // Form states
  const [showCreatePlaybook, setShowCreatePlaybook] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const [newPlaybook, setNewPlaybook] = useState({
    name: "",
    description: "",
    domain: "",
    risk_level: "",
  });

  const [newRule, setNewRule] = useState({
    rule_name: "",
    rule_type: "GUARDRAIL",
    conditions: "{}",
    action: "ALLOW",
    action_params: "{}",
    coaching_message: "",
    coaching_severity: "INFO",
    priority: 100,
  });

  const [newAssignment, setNewAssignment] = useState({
    assignment_type: "ROLE",
    target_role: "",
    target_user_id: "",
  });

  useEffect(() => {
    fetchPlaybooks();
    fetchAssignments();
  }, [organizationId]);

  useEffect(() => {
    if (selectedPlaybook) {
      fetchRules(selectedPlaybook.id);
    }
  }, [selectedPlaybook]);

  const fetchPlaybooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/operator/playbooks?type=playbooks&organization_id=${organizationId}`
      );
      const data = await res.json();
      setPlaybooks(data.playbooks || []);
    } catch (error) {
      console.error("Failed to fetch playbooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async (playbookId: string) => {
    try {
      const res = await fetch(
        `/api/operator/playbooks?type=rules&organization_id=${organizationId}&playbook_id=${playbookId}`
      );
      const data = await res.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(
        `/api/operator/playbooks?type=assignments&organization_id=${organizationId}`
      );
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  const handleCreatePlaybook = async () => {
    try {
      const res = await fetch("/api/operator/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_playbook",
          organization_id: organizationId,
          name: newPlaybook.name,
          description: newPlaybook.description || undefined,
          domain: newPlaybook.domain || undefined,
          risk_level: newPlaybook.risk_level || undefined,
        }),
      });

      if (res.ok) {
        setShowCreatePlaybook(false);
        setNewPlaybook({ name: "", description: "", domain: "", risk_level: "" });
        fetchPlaybooks();
      }
    } catch (error) {
      console.error("Failed to create playbook:", error);
    }
  };

  const handleCreateRule = async () => {
    if (!selectedPlaybook) {
return;
}

    try {
      let conditions = {};
      let actionParams = {};

      try {
        conditions = JSON.parse(newRule.conditions);
      } catch {
        conditions = {};
      }

      try {
        actionParams = JSON.parse(newRule.action_params);
      } catch {
        actionParams = {};
      }

      const res = await fetch("/api/operator/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_rule",
          playbook_id: selectedPlaybook.id,
          rule_name: newRule.rule_name,
          rule_type: newRule.rule_type,
          conditions,
          rule_action: newRule.action,
          action_params: actionParams,
          coaching_message: newRule.coaching_message || undefined,
          coaching_severity: newRule.coaching_severity,
          priority: newRule.priority,
        }),
      });

      if (res.ok) {
        setShowCreateRule(false);
        setNewRule({
          rule_name: "",
          rule_type: "GUARDRAIL",
          conditions: "{}",
          action: "ALLOW",
          action_params: "{}",
          coaching_message: "",
          coaching_severity: "INFO",
          priority: 100,
        });
        fetchRules(selectedPlaybook.id);
      }
    } catch (error) {
      console.error("Failed to create rule:", error);
    }
  };

  const handleAssignPlaybook = async () => {
    if (!selectedPlaybook) {
return;
}

    try {
      const res = await fetch("/api/operator/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_playbook",
          playbook_id: selectedPlaybook.id,
          organization_id: organizationId,
          assignment_type: newAssignment.assignment_type,
          target_role: newAssignment.target_role || undefined,
          target_user_id: newAssignment.target_user_id || undefined,
        }),
      });

      if (res.ok) {
        setShowAssign(false);
        setNewAssignment({
          assignment_type: "ROLE",
          target_role: "",
          target_user_id: "",
        });
        fetchAssignments();
      }
    } catch (error) {
      console.error("Failed to assign playbook:", error);
    }
  };

  const handleActivatePlaybook = async (playbookId: string) => {
    try {
      await fetch("/api/operator/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_playbook",
          playbook_id: playbookId,
          status: "ACTIVE",
        }),
      });
      fetchPlaybooks();
    } catch (error) {
      console.error("Failed to activate playbook:", error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch("/api/operator/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_rule",
          rule_id: ruleId,
        }),
      });
      if (selectedPlaybook) {
        fetchRules(selectedPlaybook.id);
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "BLOCK":
        return <Badge className="bg-red-100 text-red-800">Block</Badge>;
      case "REQUIRE_QUORUM":
        return <Badge className="bg-orange-100 text-orange-800">Quorum</Badge>;
      case "SIMULATE":
        return <Badge className="bg-blue-100 text-blue-800">Simulate</Badge>;
      case "ESCALATE":
        return <Badge className="bg-purple-100 text-purple-800">Escalate</Badge>;
      case "COACH":
        return <Badge className="bg-yellow-100 text-yellow-800">Coach</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading playbooks...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6" />
          Operator Playbooks
        </h2>
        <Button onClick={() => setShowCreatePlaybook(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Playbook
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          {playbooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                No playbooks created yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {playbooks.map((playbook) => (
                <Card
                  key={playbook.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPlaybook?.id === playbook.id
                      ? "border-primary"
                      : "hover:border-muted-foreground"
                  }`}
                  onClick={() => setSelectedPlaybook(playbook)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {playbook.name}
                          {getStatusBadge(playbook.status)}
                        </div>
                        {playbook.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {playbook.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {playbook.domain && (
                            <Badge variant="outline">{playbook.domain}</Badge>
                          )}
                          {playbook.risk_level && (
                            <Badge variant="outline">{playbook.risk_level}</Badge>
                          )}
                          <Badge variant="outline">v{playbook.version}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {playbook.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivatePlaybook(playbook.id);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {selectedPlaybook ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Rules for: {selectedPlaybook.name}
                </h3>
                <Button size="sm" onClick={() => setShowCreateRule(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Rule
                </Button>
              </div>

              {rules.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No rules defined yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{rule.rule_name}</span>
                              <Badge variant="outline">{rule.rule_type}</Badge>
                              {getActionBadge(rule.action)}
                              {!rule.is_active && (
                                <Badge variant="secondary">Disabled</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Priority: {rule.priority}
                            </div>
                            {rule.coaching_message && (
                              <div className="mt-2 p-2 bg-muted rounded text-sm flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                                {rule.coaching_message}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a playbook to view its rules.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {selectedPlaybook && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowAssign(true)}>
                <Users className="w-4 h-4 mr-1" />
                Assign Playbook
              </Button>
            </div>
          )}

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No assignments yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {assignment.operator_playbooks.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.assignment_type}:{" "}
                          {assignment.target_role ||
                            assignment.target_user_id?.slice(0, 8)}
                        </div>
                      </div>
                      <Badge variant="outline">{assignment.assignment_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Playbook Dialog */}
      <Dialog open={showCreatePlaybook} onOpenChange={setShowCreatePlaybook}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newPlaybook.name}
                onChange={(e) =>
                  setNewPlaybook({ ...newPlaybook, name: e.target.value })
                }
                placeholder="e.g., High-Risk Review Process"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newPlaybook.description}
                onChange={(e) =>
                  setNewPlaybook({ ...newPlaybook, description: e.target.value })
                }
                placeholder="Describe this playbook's purpose..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Domain (optional)</label>
                <Input
                  value={newPlaybook.domain}
                  onChange={(e) =>
                    setNewPlaybook({ ...newPlaybook, domain: e.target.value })
                  }
                  placeholder="e.g., SEO"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Risk Level</label>
                <Select
                  value={newPlaybook.risk_level}
                  onValueChange={(v) =>
                    setNewPlaybook({ ...newPlaybook, risk_level: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW_RISK">Low Risk</SelectItem>
                    <SelectItem value="MEDIUM_RISK">Medium Risk</SelectItem>
                    <SelectItem value="HIGH_RISK">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreatePlaybook} className="w-full">
              Create Playbook
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                value={newRule.rule_name}
                onChange={(e) =>
                  setNewRule({ ...newRule, rule_name: e.target.value })
                }
                placeholder="e.g., Block low-score operators"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newRule.rule_type}
                  onValueChange={(v) => setNewRule({ ...newRule, rule_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUARDRAIL">Guardrail</SelectItem>
                    <SelectItem value="COACHING">Coaching</SelectItem>
                    <SelectItem value="ESCALATION">Escalation</SelectItem>
                    <SelectItem value="VALIDATION">Validation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Action</label>
                <Select
                  value={newRule.action}
                  onValueChange={(v) => setNewRule({ ...newRule, action: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOW">Allow</SelectItem>
                    <SelectItem value="BLOCK">Block</SelectItem>
                    <SelectItem value="REQUIRE_QUORUM">Require Quorum</SelectItem>
                    <SelectItem value="SIMULATE">Simulate</SelectItem>
                    <SelectItem value="ESCALATE">Escalate</SelectItem>
                    <SelectItem value="COACH">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Conditions (JSON)</label>
              <Textarea
                value={newRule.conditions}
                onChange={(e) =>
                  setNewRule({ ...newRule, conditions: e.target.value })
                }
                placeholder='{"operator_score": "<50"}'
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Coaching Message (optional)
              </label>
              <Textarea
                value={newRule.coaching_message}
                onChange={(e) =>
                  setNewRule({ ...newRule, coaching_message: e.target.value })
                }
                placeholder="Helpful tip to show the operator..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Input
                type="number"
                value={newRule.priority}
                onChange={(e) =>
                  setNewRule({ ...newRule, priority: parseInt(e.target.value) })
                }
              />
            </div>
            <Button onClick={handleCreateRule} className="w-full">
              Add Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assignment Type</label>
              <Select
                value={newAssignment.assignment_type}
                onValueChange={(v) =>
                  setNewAssignment({ ...newAssignment, assignment_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE">By Role</SelectItem>
                  <SelectItem value="USER">By User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newAssignment.assignment_type === "ROLE" && (
              <div>
                <label className="text-sm font-medium">Target Role</label>
                <Select
                  value={newAssignment.target_role}
                  onValueChange={(v) =>
                    setNewAssignment({ ...newAssignment, target_role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ANALYST">Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {newAssignment.assignment_type === "USER" && (
              <div>
                <label className="text-sm font-medium">User ID</label>
                <Input
                  value={newAssignment.target_user_id}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      target_user_id: e.target.value,
                    })
                  }
                  placeholder="User UUID"
                />
              </div>
            )}
            <Button onClick={handleAssignPlaybook} className="w-full">
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OperatorPlaybooksDashboard;
