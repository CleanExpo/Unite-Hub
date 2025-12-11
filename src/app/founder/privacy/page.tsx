"use client";

/**
 * Founder Privacy Compliance Center (Phase E19)
 * GDPR/CCPA data subject requests, consent tracking, compliance tasks
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/patterns/Modal";
import { Toast } from "@/components/patterns/Toast";
import {
  ShieldCheck as ShieldCheckIcon,
  FileText as DocumentTextIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  AlertCircle as ExclamationCircleIcon,
  Plus as PlusIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

type DSRType = "access" | "rectification" | "erasure" | "export" | "restriction" | "portability" | "objection" | "other";
type DSRStatus = "open" | "in_progress" | "resolved" | "rejected" | "cancelled";
type RequesterType = "user" | "contact" | "unknown";
type ConsentChannel = "email" | "sms" | "social" | "web" | "api" | "other";

interface DataSubjectRequest {
  id: string;
  tenant_id: string;
  requester_type: RequesterType;
  requester_identifier: string;
  type: DSRType;
  status: DSRStatus;
  received_at: string;
  resolved_at: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface ConsentLog {
  id: string;
  tenant_id: string;
  subject_identifier: string;
  channel: ConsentChannel;
  purpose: string;
  granted: boolean;
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface Statistics {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  by_type: Record<string, number>;
}

export default function PrivacyCompliancePage() {
  const { user } = useAuth();
  const workspaceId = user?.id;

  const [dsrs, setDsrs] = useState<DataSubjectRequest[]>([]);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<DSRStatus | "all">("all");

  const [showCreateDSRModal, setShowCreateDSRModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form states
  const [newDSR, setNewDSR] = useState({
    requesterType: "user" as RequesterType,
    requesterIdentifier: "",
    type: "access" as DSRType,
    notes: "",
  });

  const [newConsent, setNewConsent] = useState({
    subjectIdentifier: "",
    channel: "web" as ConsentChannel,
    purpose: "",
    granted: true,
    source: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId, statusFilter]);

  async function loadData() {
    try {
      setLoading(true);

      // Load DSRs
      const dsrParams = new URLSearchParams({ workspaceId: workspaceId! });
      if (statusFilter !== "all") {
        dsrParams.append("status", statusFilter);
      }
      const dsrRes = await fetch(`/api/founder/compliance?${dsrParams}`);
      const dsrData = await dsrRes.json();
      setDsrs(dsrData.dsrs || []);

      // Load statistics
      const statsParams = new URLSearchParams({
        workspaceId: workspaceId!,
        action: "statistics"
      });
      const statsRes = await fetch(`/api/founder/compliance?${statsParams}`);
      const statsData = await statsRes.json();
      setStatistics(statsData.statistics || null);

      // Load consent logs
      const consentParams = new URLSearchParams({
        workspaceId: workspaceId!,
        action: "consent-logs",
        limit: "50"
      });
      const consentRes = await fetch(`/api/founder/compliance?${consentParams}`);
      const consentData = await consentRes.json();
      setConsentLogs(consentData.logs || []);

    } catch (error) {
      console.error("[Privacy] Load error:", error);
      setToast({ message: "Failed to load privacy data", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDSR() {
    try {
      const res = await fetch("/api/founder/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "create-dsr",
          ...newDSR,
        }),
      });

      if (!res.ok) {
throw new Error("Failed to create DSR");
}

      setToast({ message: "Data subject request created", type: "success" });
      setShowCreateDSRModal(false);
      setNewDSR({
        requesterType: "user",
        requesterIdentifier: "",
        type: "access",
        notes: "",
      });
      loadData();
    } catch (error) {
      console.error("[Privacy] Create DSR error:", error);
      setToast({ message: "Failed to create DSR", type: "error" });
    }
  }

  async function handleRecordConsent() {
    try {
      const res = await fetch("/api/founder/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "record-consent",
          ...newConsent,
        }),
      });

      if (!res.ok) {
throw new Error("Failed to record consent");
}

      setToast({ message: "Consent recorded", type: "success" });
      setShowConsentModal(false);
      setNewConsent({
        subjectIdentifier: "",
        channel: "web",
        purpose: "",
        granted: true,
        source: "",
      });
      loadData();
    } catch (error) {
      console.error("[Privacy] Record consent error:", error);
      setToast({ message: "Failed to record consent", type: "error" });
    }
  }

  async function handleUpdateDSRStatus(dsrId: string, status: DSRStatus) {
    try {
      const res = await fetch("/api/founder/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "update-dsr-status",
          dsrId,
          status,
        }),
      });

      if (!res.ok) {
throw new Error("Failed to update DSR");
}

      setToast({ message: "Status updated", type: "success" });
      loadData();
    } catch (error) {
      console.error("[Privacy] Update error:", error);
      setToast({ message: "Failed to update status", type: "error" });
    }
  }

  function getStatusBadge(status: DSRStatus) {
    const variants: Record<DSRStatus, { color: string; icon: React.ReactNode }> = {
      open: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <ClockIcon className="w-3 h-3" /> },
      in_progress: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: <ExclamationCircleIcon className="w-3 h-3" /> },
      resolved: { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: <CheckCircleIcon className="w-3 h-3" /> },
      rejected: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: <ExclamationCircleIcon className="w-3 h-3" /> },
      cancelled: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: <ExclamationCircleIcon className="w-3 h-3" /> },
    };

    const variant = variants[status];
    return (
      <Badge className={`inline-flex items-center gap-1 ${variant.color} border`}>
        {variant.icon}
        <span className="capitalize">{status.replace("_", " ")}</span>
      </Badge>
    );
  }

  function formatDSRType(type: DSRType): string {
    const labels: Record<DSRType, string> = {
      access: "Access Request",
      rectification: "Rectification",
      erasure: "Erasure (Right to be Forgotten)",
      export: "Data Export",
      restriction: "Restriction of Processing",
      portability: "Data Portability",
      objection: "Objection to Processing",
      other: "Other",
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading privacy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <ShieldCheckIcon className="w-8 h-8 text-accent-500" />
              Privacy Compliance
            </h1>
            <p className="text-text-secondary mt-1">
              GDPR/CCPA data subject requests, consent tracking
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConsentModal(true)}
              className="bg-bg-card hover:bg-bg-tertiary text-text-primary border border-border-primary"
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Record Consent
            </Button>
            <Button
              onClick={() => setShowCreateDSRModal(true)}
              className="bg-accent-500 hover:bg-accent-600 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New DSR
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text-primary">{statistics.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-400">{statistics.open}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-400">{statistics.in_progress}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">{statistics.resolved}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-bg-card border border-border-primary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dsrs">Data Subject Requests</TabsTrigger>
            <TabsTrigger value="consent">Consent Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Recent Activity</CardTitle>
                <CardDescription className="text-text-secondary">
                  Latest data subject requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dsrs.slice(0, 5).map((dsr) => (
                    <div
                      key={dsr.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary border border-border-primary rounded-lg hover:border-accent-500/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-text-primary">
                            {formatDSRType(dsr.type)}
                          </span>
                          {getStatusBadge(dsr.status)}
                        </div>
                        <p className="text-sm text-text-secondary">
                          {dsr.requester_identifier} • {new Date(dsr.received_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-text-tertiary" />
                    </div>
                  ))}
                  {dsrs.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      No data subject requests found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DSRs Tab */}
          <TabsContent value="dsrs" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">Data Subject Requests</CardTitle>
                  <div className="flex gap-2">
                    {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
                      <Button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        className={
                          statusFilter === status
                            ? "bg-accent-500 text-white"
                            : "bg-bg-secondary text-text-secondary"
                        }
                      >
                        {status === "all" ? "All" : status.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dsrs.map((dsr) => (
                    <div
                      key={dsr.id}
                      className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-text-primary mb-1">
                            {formatDSRType(dsr.type)}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {dsr.requester_identifier} ({dsr.requester_type})
                          </p>
                        </div>
                        {getStatusBadge(dsr.status)}
                      </div>

                      {dsr.notes && (
                        <p className="text-sm text-text-secondary mb-3 p-3 bg-bg-tertiary rounded">
                          {dsr.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <span>Received: {new Date(dsr.received_at).toLocaleString()}</span>
                        {dsr.resolved_at && (
                          <span>Resolved: {new Date(dsr.resolved_at).toLocaleString()}</span>
                        )}
                      </div>

                      {dsr.status !== "resolved" && dsr.status !== "cancelled" && (
                        <div className="flex gap-2 mt-4">
                          {dsr.status === "open" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDSRStatus(dsr.id, "in_progress")}
                              className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20"
                            >
                              Start
                            </Button>
                          )}
                          {dsr.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDSRStatus(dsr.id, "resolved")}
                              className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consent Tab */}
          <TabsContent value="consent" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Consent Logs</CardTitle>
                <CardDescription className="text-text-secondary">
                  Audit trail of consent grants and revocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-text-primary mb-1">{log.purpose}</h3>
                          <p className="text-sm text-text-secondary">
                            {log.subject_identifier} via {log.channel}
                          </p>
                        </div>
                        <Badge
                          className={
                            log.granted
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }
                        >
                          {log.granted ? "Granted" : "Revoked"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.source && <span>Source: {log.source}</span>}
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create DSR Modal */}
      <Modal
        isOpen={showCreateDSRModal}
        onClose={() => setShowCreateDSRModal(false)}
        title="Create Data Subject Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
            <select
              value={newDSR.type}
              onChange={(e) => setNewDSR({ ...newDSR, type: e.target.value as DSRType })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="access">Access</option>
              <option value="rectification">Rectification</option>
              <option value="erasure">Erasure</option>
              <option value="export">Export</option>
              <option value="restriction">Restriction</option>
              <option value="portability">Portability</option>
              <option value="objection">Objection</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Requester Type</label>
            <select
              value={newDSR.requesterType}
              onChange={(e) => setNewDSR({ ...newDSR, requesterType: e.target.value as RequesterType })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="user">User</option>
              <option value="contact">Contact</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Identifier</label>
            <input
              type="text"
              value={newDSR.requesterIdentifier}
              onChange={(e) => setNewDSR({ ...newDSR, requesterIdentifier: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
            <textarea
              value={newDSR.notes}
              onChange={(e) => setNewDSR({ ...newDSR, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowCreateDSRModal(false)}
              className="flex-1 bg-bg-secondary text-text-primary hover:bg-bg-tertiary border border-border-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDSR}
              disabled={!newDSR.requesterIdentifier}
              className="flex-1 bg-accent-500 text-white hover:bg-accent-600"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Consent Modal */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        title="Record Consent"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Subject</label>
            <input
              type="text"
              value={newConsent.subjectIdentifier}
              onChange={(e) => setNewConsent({ ...newConsent, subjectIdentifier: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Channel</label>
            <select
              value={newConsent.channel}
              onChange={(e) => setNewConsent({ ...newConsent, channel: e.target.value as ConsentChannel })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="web">Web</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="social">Social</option>
              <option value="api">API</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Purpose</label>
            <input
              type="text"
              value={newConsent.purpose}
              onChange={(e) => setNewConsent({ ...newConsent, purpose: e.target.value })}
              placeholder="marketing_emails"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Source</label>
            <input
              type="text"
              value={newConsent.source}
              onChange={(e) => setNewConsent({ ...newConsent, source: e.target.value })}
              placeholder="signup_form"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={newConsent.granted}
                onChange={(e) => setNewConsent({ ...newConsent, granted: e.target.checked })}
                className="w-4 h-4 accent-accent-500"
              />
              <span className="text-sm font-medium">Granted</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowConsentModal(false)}
              className="flex-1 bg-bg-secondary text-text-primary hover:bg-bg-tertiary border border-border-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordConsent}
              disabled={!newConsent.subjectIdentifier || !newConsent.purpose}
              className="flex-1 bg-accent-500 text-white hover:bg-accent-600"
            >
              Record
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
