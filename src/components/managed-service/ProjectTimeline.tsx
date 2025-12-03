'use client';

import React from 'react';
import { Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export interface TimelinePhase {
  id: string;
  phase_number: number;
  phase_name: string;
  start_date: string;
  planned_end_date: string;
  actual_end_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  completion_percentage: number;
  description: string;
  key_activities?: string[];
  deliverables?: Array<{
    name: string;
    format: string;
    dueDate: string;
  }>;
}

interface ProjectTimelineProps {
  phases: TimelinePhase[];
  loading?: boolean;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ phases, loading = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'delayed':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const calculateDaysRemaining = (plannedEnd: string) => {
    const today = new Date();
    const endDate = new Date(plannedEnd);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateProgressWidth = (start: string, end: string, completion: number) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const today = new Date().getTime();

    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    const percentageElapsed = Math.min((elapsedDuration / totalDuration) * 100, 100);

    return { elapsedPercentage: percentageElapsed, completionPercentage: completion };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-secondary">Loading timeline...</p>
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No timeline phases yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {phases.map((phase, index) => {
        const daysRemaining = calculateDaysRemaining(phase.planned_end_date);
        const { elapsedPercentage, completionPercentage } = calculateProgressWidth(
          phase.start_date,
          phase.planned_end_date,
          phase.completion_percentage
        );

        return (
          <div key={phase.id} className="relative">
            {/* Timeline Connector */}
            {index < phases.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-16 bg-gradient-to-b from-blue-400 to-gray-300 dark:from-blue-600 dark:to-gray-700" />
            )}

            {/* Phase Card */}
            <div className="relative bg-bg-card rounded-lg border border-border-subtle p-6">
              {/* Phase Indicator Circle */}
              <div className="absolute -left-4 top-6 w-8 h-8 bg-bg-card border-4 border-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              </div>

              <div className="ml-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">
                        Phase {phase.phase_number}: {phase.phase_name}
                      </h3>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(phase.status)}`}>
                        {getStatusIcon(phase.status)}
                        {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{phase.description}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-text-secondary text-xs mb-1">Start Date</p>
                    <p className="font-medium text-text-primary flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(phase.start_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">Planned End</p>
                    <p className="font-medium text-text-primary flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(phase.planned_end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">
                      {daysRemaining > 0 ? 'Days Remaining' : 'Overdue'}
                    </p>
                    <p className={`font-medium flex items-center gap-1 ${daysRemaining > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      <Clock className="w-3 h-3" />
                      {Math.abs(daysRemaining)} days
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-secondary font-medium">Progress</p>
                    <p className="text-xs text-text-primary font-semibold">{phase.completion_percentage}%</p>
                  </div>
                  <div className="w-full bg-bg-hover rounded-full h-2.5 overflow-hidden">
                    {/* Elapsed Time Track */}
                    <div
                      className="bg-gray-400 dark:bg-gray-600 h-full transition-all"
                      style={{ width: `${elapsedPercentage}%` }}
                    />
                    {/* Completion Track (overlaid) */}
                    <div
                      className="bg-green-500 dark:bg-green-600 h-full transition-all -translate-y-2.5"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-text-secondary">
                    <span>Elapsed: {Math.round(elapsedPercentage)}%</span>
                    <span>Completed: {phase.completion_percentage}%</span>
                  </div>
                </div>

                {/* Activities */}
                {phase.key_activities && phase.key_activities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-text-secondary font-medium mb-2">Key Activities</p>
                    <ul className="space-y-1">
                      {phase.key_activities.map((activity, idx) => (
                        <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deliverables */}
                {phase.deliverables && phase.deliverables.length > 0 && (
                  <div>
                    <p className="text-xs text-text-secondary font-medium mb-2">Deliverables</p>
                    <div className="space-y-2">
                      {phase.deliverables.map((deliverable, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded p-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {deliverable.name}
                            </p>
                            <p className="text-xs text-text-secondary">{deliverable.format}</p>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Due: {formatDate(deliverable.dueDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
