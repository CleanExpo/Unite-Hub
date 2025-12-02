"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { TaskForUI } from '@/lib/orchestrator/dashboard-service';

interface TaskListViewProps {
  tasks: TaskForUI[];
  loading: boolean;
  onTaskSelect: (taskId: string) => void;
  selectedTaskId?: string;
  onFilterChange: (filters: {
    status?: string;
    sortBy?: string;
    order?: string;
    search?: string;
  }) => void;
}

export function TaskListView({
  tasks,
  loading,
  onTaskSelect,
  selectedTaskId,
  onFilterChange,
}: TaskListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChange({ search: value, status: statusFilter, sortBy, order: sortOrder });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange({
      search: searchQuery,
      status: value === 'all' ? undefined : value,
      sortBy,
      order: sortOrder,
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onFilterChange({ search: searchQuery, status: statusFilter, sortBy: value, order: sortOrder });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    onFilterChange({ search: searchQuery, status: statusFilter, sortBy, order: newOrder });
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((task) =>
    task.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Task Execution History</CardTitle>
          <CardDescription>
            View and manage orchestrator task execution history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by task ID or objective..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="halted">Halted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={toggleSortOrder}>
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-2" data-testid="task-list">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading tasks...
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No tasks found
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card data-testid="task-card"
              key={task.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTaskId === task.id ? 'border-primary ring-2 ring-primary' : ''
              }`}
              onClick={() => onTaskSelect(task.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Task Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{task.statusIcon}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{task.objective}</h3>
                        <p className="text-xs text-muted-foreground">ID: {task.id}</p>
                      </div>
                    </div>

                    {/* Task Metadata */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant={task.statusColor === 'green' ? 'default' : 'destructive'}>
                        {task.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {task.createdAtRelative}
                      </span>
                      {task.duration && (
                        <span className="text-muted-foreground">
                          Duration: {task.durationFormatted}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Progress: {task.completedSteps}/{task.totalSteps} steps
                        </span>
                        <span>{task.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            task.status === 'completed'
                              ? 'bg-green-500'
                              : task.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${task.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Agent Chain */}
                    {task.agentChain.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.agentChain.slice(0, 3).map((agent, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                        {task.agentChain.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.agentChain.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Risk & Confidence Scores */}
                  <div className="flex flex-col gap-1 text-xs text-right">
                    <div>
                      <span className="text-muted-foreground">Risk:</span>{' '}
                      <span
                        className={
                          task.riskScore > 0.7
                            ? 'text-red-500 font-semibold'
                            : task.riskScore > 0.4
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        }
                      >
                        {Math.round(task.riskScore * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>{' '}
                      <span
                        className={
                          task.confidenceScore > 0.7
                            ? 'text-green-500'
                            : task.confidenceScore > 0.4
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }
                      >
                        {Math.round(task.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
