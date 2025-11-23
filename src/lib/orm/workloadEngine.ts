/**
 * Workload Engine
 * Phase 67: Calculate staff load, AI load, and job queue load
 */

export interface StaffLoadMetrics {
  staff_id: string;
  staff_name: string;
  hours_logged: number;
  tasks_completed: number;
  tasks_pending: number;
  avg_task_time_minutes: number;
  utilization_percent: number;
  capacity_status: 'available' | 'optimal' | 'busy' | 'overloaded';
}

export interface AILoadMetrics {
  total_requests: number;
  total_tokens: number;
  avg_latency_ms: number;
  error_rate: number;
  capacity_percent: number;
  provider_breakdown: {
    provider: string;
    requests: number;
    tokens: number;
    cost: number;
  }[];
}

export interface QueueLoadMetrics {
  queue_name: string;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_wait_time_seconds: number;
  avg_process_time_seconds: number;
  throughput_per_hour: number;
}

export interface WorkloadIndex {
  workspace_id: string;
  period: string;
  staff_load: {
    total_staff: number;
    avg_utilization: number;
    overloaded_count: number;
    available_capacity_hours: number;
    index: number; // 0-100
  };
  ai_load: {
    total_requests: number;
    total_tokens: number;
    avg_latency_ms: number;
    capacity_percent: number;
    index: number; // 0-100
  };
  queue_load: {
    total_pending: number;
    total_processing: number;
    avg_wait_time: number;
    index: number; // 0-100
  };
  combined_index: number; // 0-100
  status: 'healthy' | 'moderate' | 'stressed' | 'critical';
  recommendations: string[];
}

export interface WorkloadTrend {
  period: string;
  staff_index: number;
  ai_index: number;
  queue_index: number;
  combined_index: number;
}

// Thresholds
const THRESHOLDS = {
  staff_utilization_optimal: 75,
  staff_utilization_overloaded: 90,
  ai_capacity_warning: 70,
  ai_capacity_critical: 85,
  queue_wait_warning_seconds: 60,
  queue_wait_critical_seconds: 180,
};

export class WorkloadEngine {
  /**
   * Calculate staff load metrics
   */
  calculateStaffLoad(
    staffId: string,
    staffName: string,
    hoursLogged: number,
    tasksCompleted: number,
    tasksPending: number,
    targetHours: number = 40
  ): StaffLoadMetrics {
    const utilizationPercent = targetHours > 0 ? (hoursLogged / targetHours) * 100 : 0;
    const avgTaskTime = tasksCompleted > 0 ? (hoursLogged * 60) / tasksCompleted : 0;

    let capacityStatus: 'available' | 'optimal' | 'busy' | 'overloaded';
    if (utilizationPercent < 50) capacityStatus = 'available';
    else if (utilizationPercent < THRESHOLDS.staff_utilization_optimal) capacityStatus = 'optimal';
    else if (utilizationPercent < THRESHOLDS.staff_utilization_overloaded) capacityStatus = 'busy';
    else capacityStatus = 'overloaded';

    return {
      staff_id: staffId,
      staff_name: staffName,
      hours_logged: hoursLogged,
      tasks_completed: tasksCompleted,
      tasks_pending: tasksPending,
      avg_task_time_minutes: Math.round(avgTaskTime),
      utilization_percent: Math.round(utilizationPercent),
      capacity_status: capacityStatus,
    };
  }

  /**
   * Calculate AI load metrics
   */
  calculateAILoad(
    providerMetrics: {
      provider: string;
      requests: number;
      tokens: number;
      cost: number;
      latency_ms: number;
      errors: number;
    }[]
  ): AILoadMetrics {
    const totalRequests = providerMetrics.reduce((sum, p) => sum + p.requests, 0);
    const totalTokens = providerMetrics.reduce((sum, p) => sum + p.tokens, 0);
    const totalErrors = providerMetrics.reduce((sum, p) => sum + p.errors, 0);

    const avgLatency = totalRequests > 0
      ? providerMetrics.reduce((sum, p) => sum + (p.latency_ms * p.requests), 0) / totalRequests
      : 0;

    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // Capacity is based on tokens vs budget (assume 1M monthly budget)
    const monthlyBudget = 1000000;
    const capacityPercent = (totalTokens / monthlyBudget) * 100;

    return {
      total_requests: totalRequests,
      total_tokens: totalTokens,
      avg_latency_ms: Math.round(avgLatency),
      error_rate: Math.round(errorRate * 1000) / 1000,
      capacity_percent: Math.round(capacityPercent * 10) / 10,
      provider_breakdown: providerMetrics.map(p => ({
        provider: p.provider,
        requests: p.requests,
        tokens: p.tokens,
        cost: Math.round(p.cost * 100) / 100,
      })),
    };
  }

  /**
   * Calculate queue load metrics
   */
  calculateQueueLoad(
    queueName: string,
    pending: number,
    processing: number,
    completed: number,
    failed: number,
    avgWaitSeconds: number,
    avgProcessSeconds: number,
    periodHours: number = 24
  ): QueueLoadMetrics {
    const throughput = periodHours > 0 ? completed / periodHours : 0;

    return {
      queue_name: queueName,
      pending_jobs: pending,
      processing_jobs: processing,
      completed_jobs: completed,
      failed_jobs: failed,
      avg_wait_time_seconds: Math.round(avgWaitSeconds),
      avg_process_time_seconds: Math.round(avgProcessSeconds),
      throughput_per_hour: Math.round(throughput * 10) / 10,
    };
  }

  /**
   * Calculate workload index
   */
  calculateWorkloadIndex(
    workspaceId: string,
    period: string,
    staffMetrics: StaffLoadMetrics[],
    aiLoad: AILoadMetrics,
    queueMetrics: QueueLoadMetrics[]
  ): WorkloadIndex {
    // Staff load index
    const avgStaffUtilization = staffMetrics.length > 0
      ? staffMetrics.reduce((sum, s) => sum + s.utilization_percent, 0) / staffMetrics.length
      : 0;
    const overloadedCount = staffMetrics.filter(s => s.capacity_status === 'overloaded').length;
    const availableCapacity = staffMetrics
      .filter(s => s.capacity_status === 'available')
      .reduce((sum, s) => sum + (40 - s.hours_logged), 0);

    // Staff index: higher utilization = higher load
    const staffIndex = Math.min(100, avgStaffUtilization);

    // AI load index
    const aiIndex = Math.min(100, aiLoad.capacity_percent + (aiLoad.error_rate * 100));

    // Queue load index
    const totalPending = queueMetrics.reduce((sum, q) => sum + q.pending_jobs, 0);
    const avgWaitTime = queueMetrics.length > 0
      ? queueMetrics.reduce((sum, q) => sum + q.avg_wait_time_seconds, 0) / queueMetrics.length
      : 0;
    // Normalize to 0-100 (300s wait = 100% load)
    const queueIndex = Math.min(100, (avgWaitTime / 300) * 100 + (totalPending / 100) * 50);

    // Combined index (weighted average)
    const combinedIndex = Math.round(
      (staffIndex * 0.4) + (aiIndex * 0.35) + (queueIndex * 0.25)
    );

    // Determine status
    let status: 'healthy' | 'moderate' | 'stressed' | 'critical';
    if (combinedIndex < 50) status = 'healthy';
    else if (combinedIndex < 70) status = 'moderate';
    else if (combinedIndex < 85) status = 'stressed';
    else status = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (overloadedCount > 0) {
      recommendations.push(`${overloadedCount} staff member(s) overloaded - redistribute work`);
    }
    if (aiLoad.capacity_percent > THRESHOLDS.ai_capacity_warning) {
      recommendations.push('AI capacity approaching limits - review token budgets');
    }
    if (avgWaitTime > THRESHOLDS.queue_wait_warning_seconds) {
      recommendations.push(`Queue wait time ${avgWaitTime.toFixed(0)}s - increase worker capacity`);
    }
    if (status === 'stressed' || status === 'critical') {
      recommendations.push('Consider pausing new client onboarding until load reduces');
    }

    return {
      workspace_id: workspaceId,
      period,
      staff_load: {
        total_staff: staffMetrics.length,
        avg_utilization: Math.round(avgStaffUtilization),
        overloaded_count: overloadedCount,
        available_capacity_hours: Math.round(availableCapacity),
        index: Math.round(staffIndex),
      },
      ai_load: {
        total_requests: aiLoad.total_requests,
        total_tokens: aiLoad.total_tokens,
        avg_latency_ms: aiLoad.avg_latency_ms,
        capacity_percent: aiLoad.capacity_percent,
        index: Math.round(aiIndex),
      },
      queue_load: {
        total_pending: totalPending,
        total_processing: queueMetrics.reduce((sum, q) => sum + q.processing_jobs, 0),
        avg_wait_time: Math.round(avgWaitTime),
        index: Math.round(queueIndex),
      },
      combined_index: combinedIndex,
      status,
      recommendations,
    };
  }

  /**
   * Get workload thresholds
   */
  getThresholds() {
    return { ...THRESHOLDS };
  }
}

export default WorkloadEngine;
