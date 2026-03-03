'use client';

import { useState, useMemo } from 'react';
import { useAgentRuns, type AgentRunStatus } from '@/hooks/use-agent-runs';
import { AgentRunMonitor } from '@/components/agent-run-monitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, CheckCircle2, Clock, Search, Filter, TrendingUp, BarChart3 } from 'lucide-react';

export default function AgentRunsDashboard() {
  const { runs, loading, error } = useAgentRuns();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentRunStatus | 'all'>('all');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Filter and search runs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const matchesSearch =
        !searchQuery ||
        run.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.current_step?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || run.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [runs, searchQuery, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = runs.length;
    const completed = runs.filter((r) => r.status === 'completed').length;
    const failed = runs.filter((r) => r.status === 'failed').length;
    const active = runs.filter((r) =>
      ['in_progress', 'awaiting_verification', 'verification_in_progress'].includes(r.status)
    ).length;
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

    return { total, completed, failed, active, successRate };
  }, [runs]);

  const getStatusColor = (status: AgentRunStatus) => {
    const colors: Record<AgentRunStatus, string> = {
      pending: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      awaiting_verification: 'bg-yellow-500',
      verification_in_progress: 'bg-yellow-600',
      verification_passed: 'bg-green-500',
      verification_failed: 'bg-red-500',
      completed: 'bg-green-600',
      failed: 'bg-red-600',
      blocked: 'bg-orange-500',
      escalated_to_human: 'bg-purple-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">Agent Runs Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and observability for agent executions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground mt-1 text-xs">All time agent executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-muted-foreground mt-1 text-xs">Currently running agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-muted-foreground mt-1 text-xs">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-muted-foreground mt-1 text-xs">{stats.failed} failed runs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by agent name, run ID, or step..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as AgentRunStatus | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
              <SelectItem value="verification_failed">Verification Failed</SelectItem>
              <SelectItem value="escalated_to_human">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">Error loading agent runs: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Agent Runs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Runs ({filteredRuns.length})</CardTitle>
              <CardDescription>Click a row to view detailed information</CardDescription>
            </div>
            {loading && <Clock className="text-muted-foreground h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRuns.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <p className="text-sm">No agent runs found</p>
              {searchQuery || statusFilter !== 'all' ? (
                <p className="mt-1 text-xs">Try adjusting your filters</p>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((run) => {
                  const duration = run.completed_at
                    ? Math.round(
                        (new Date(run.completed_at).getTime() -
                          new Date(run.started_at).getTime()) /
                          1000
                      )
                    : Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000);

                  return (
                    <TableRow
                      key={run.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(run.status)}`} />
                          <span className="text-xs capitalize">
                            {run.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{run.agent_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-secondary h-1.5 w-16 rounded-full">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${run.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {run.progress_percent.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                        {run.current_step || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(run.started_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{duration}s</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRunId(run.id);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed View Modal/Drawer */}
      {selectedRunId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg">
            <div className="bg-background sticky top-0 flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Agent Run Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRunId(null)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <AgentRunMonitor runId={selectedRunId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
