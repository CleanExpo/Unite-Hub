"use client";

import React, { useState } from 'react';
import { TaskListView } from '@/components/orchestrator/TaskListView';
import { TaskDetailView } from '@/components/orchestrator/TaskDetailView';
import { useTaskList, useTaskDetail, useTaskRetry } from '@/hooks/useOrchestratorDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function OrchestratorDashboardPage() {
  const { currentOrganization } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: string;
    sortBy?: string;
    order?: string;
    search?: string;
  }>({});
  const [showEvidence, setShowEvidence] = useState(false);

  const workspaceId = currentOrganization?.org_id;

  // Fetch task list with auto-refresh
  const { tasks, loading: tasksLoading, error: tasksError, refresh: refreshTasks } = useTaskList(
    {
      status: filters.status as any,
      sortBy: filters.sortBy as any,
      order: filters.order as any,
    },
    true // auto-refresh enabled
  );

  // Fetch task detail when selected
  const {
    task,
    steps,
    timeline,
    verificationResults,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useTaskDetail(selectedTaskId, true);

  // Retry functionality
  const { retryTask, retrying, error: retryError } = useTaskRetry();

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowEvidence(false);
  };

  const handleBack = () => {
    setSelectedTaskId(null);
    setShowEvidence(false);
  };

  const handleRetry = async () => {
    if (!selectedTaskId) {
return;
}

    const retryTaskId = await retryTask(selectedTaskId);
    if (retryTaskId) {
      // Show success message
      alert(`Task retry initiated! New task ID: ${retryTaskId}`);
      // Refresh task list
      refreshTasks();
      // Optionally navigate to new task
      setSelectedTaskId(retryTaskId);
    }
  };

  const handleViewEvidence = () => {
    setShowEvidence(true);
  };

  const handleFilterChange = (newFilters: {
    status?: string;
    sortBy?: string;
    order?: string;
    search?: string;
  }) => {
    setFilters(newFilters);
  };

  if (!workspaceId) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No workspace selected. Please select a workspace to view orchestrator tasks.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Orchestrator Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage multi-agent task execution with verification tracking
        </p>
      </div>

      {/* Error Messages */}
      {tasksError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{tasksError}</AlertDescription>
        </Alert>
      )}

      {detailError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      )}

      {retryError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{retryError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task List (Left Side) */}
        <div className={selectedTaskId ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <TaskListView
            tasks={tasks}
            loading={tasksLoading}
            onTaskSelect={handleTaskSelect}
            selectedTaskId={selectedTaskId || undefined}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Task Detail (Right Side) */}
        {selectedTaskId && (
          <div className="lg:col-span-7">
            <TaskDetailView
              task={task}
              steps={steps}
              timeline={timeline}
              verificationResults={verificationResults}
              loading={detailLoading}
              onBack={handleBack}
              onRetry={handleRetry}
              onViewEvidence={handleViewEvidence}
            />

            {/* Retry Status */}
            {retrying && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Retrying task...</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!tasksLoading && tasks.length === 0 && !tasksError && (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold">No tasks found</p>
              <p className="text-muted-foreground">
                Orchestrator tasks will appear here once they are created
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
