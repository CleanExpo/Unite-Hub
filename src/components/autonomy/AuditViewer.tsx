"use client";

/**
 * Audit Viewer - Phase 9 Week 9
 *
 * Detailed audit log viewer with advanced filtering.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Calendar,
} from "lucide-react";

interface AuditEvent {
  id: string;
  client_id: string;
  organization_id: string;
  action_type: string;
  source: string;
  actor_type: string;
  actor_id?: string;
  proposal_id?: string;
  execution_id?: string;
  rollback_token_id?: string;
  details: Record<string, any>;
  timestamp_utc: string;
}

interface AuditViewerProps {
  clientId: string;
  organizationId: string;
}

export function AuditViewer({ clientId, organizationId }: AuditViewerProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [clientId, actionFilter, sourceFilter, actorFilter, dateFrom, dateTo]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        client_id: clientId,
        limit: "500",
      });

      if (actionFilter !== "all") params.set("action_type", actionFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (actorFilter !== "all") params.set("actor_type", actorFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/trust/audit?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch audit events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.action_type.toLowerCase().includes(query) ||
      event.source.toLowerCase().includes(query) ||
      JSON.stringify(event.details).toLowerCase().includes(query)
    );
  });

  const getActionBadgeColor = (action: string): string => {
    if (action.includes("CREATED")) return "bg-blue-100 text-blue-800";
    if (action.includes("APPROVED")) return "bg-green-100 text-green-800";
    if (action.includes("REJECTED")) return "bg-red-100 text-red-800";
    if (action.includes("EXECUTED")) return "bg-purple-100 text-purple-800";
    if (action.includes("ROLLED_BACK")) return "bg-orange-100 text-orange-800";
    if (action.includes("FAILED")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const exportToCSV = () => {
    const headers = [
      "Timestamp",
      "Action",
      "Source",
      "Actor Type",
      "Actor ID",
      "Details",
    ];
    const rows = filteredEvents.map((e) => [
      e.timestamp_utc,
      e.action_type,
      e.source,
      e.actor_type,
      e.actor_id || "",
      JSON.stringify(e.details),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${clientId}-${new Date().toISOString()}.csv`;
    a.click();
  };

  const actionTypes = [
    "TRUST_MODE_INITIALIZED",
    "TRUST_MODE_ACTIVATED",
    "TRUST_MODE_REVOKED",
    "SIGNATURE_REQUESTED",
    "SIGNATURE_COMPLETED",
    "PROPOSAL_CREATED",
    "PROPOSAL_APPROVED",
    "PROPOSAL_REJECTED",
    "PROPOSAL_AUTO_APPROVED",
    "EXECUTION_STARTED",
    "EXECUTION_COMPLETED",
    "EXECUTION_FAILED",
    "EXECUTION_ROLLED_BACK",
    "ROLLBACK_FAILED",
    "ROLLBACK_DEADLINE_EXTENDED",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Log Viewer</h2>
          <p className="text-muted-foreground">
            {filteredEvents.length} events found
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchEvents} variant="outline" disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="col-span-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Action Type */}
            <div>
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div>
              <label className="text-sm font-medium">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="TrustModeService">TrustModeService</SelectItem>
                  <SelectItem value="SignatureService">SignatureService</SelectItem>
                  <SelectItem value="ProposalEngine">ProposalEngine</SelectItem>
                  <SelectItem value="ExecutionEngine">ExecutionEngine</SelectItem>
                  <SelectItem value="RollbackEngine">RollbackEngine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actor Type */}
            <div>
              <label className="text-sm font-medium">Actor</label>
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="HUMAN">Human</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events match your filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Related IDs</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(event.timestamp_utc).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getActionBadgeColor(event.action_type)}
                      >
                        {event.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{event.source}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{event.actor_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {event.proposal_id && (
                        <div>P: {event.proposal_id.slice(0, 8)}...</div>
                      )}
                      {event.execution_id && (
                        <div>E: {event.execution_id.slice(0, 8)}...</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Event Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">
                                Action Type
                              </label>
                              <p>{event.action_type}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Timestamp
                              </label>
                              <p>{new Date(event.timestamp_utc).toISOString()}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Details
                              </label>
                              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-64">
                                {JSON.stringify(event.details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AuditViewer;
