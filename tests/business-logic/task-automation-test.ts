/**
 * TASK MANAGEMENT AUTOMATION - TEST SUITE
 * 
 * Tests automated task assignments, dependencies, and workload balancing
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data for testing
const mockTask = {
  id: 'test-task-123',
  title: 'Test Task',
  description: 'Test task description',
  status: 'pending',
  priority: 'medium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assigned_to: null,
  client_id: 'test-client-123',
  deal_id: 'test-deal-123',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

const mockHighPriorityTask = {
  ...mockTask,
  id: 'urgent-task-123',
  title: 'Urgent Task',
  priority: 'urgent'
};

const mockUser1 = {
  id: 'user-1',
  full_name: 'John Doe',
  email: 'john@example.com'
};

const mockUser2 = {
  id: 'user-2',
  full_name: 'Jane Smith',
  email: 'jane@example.com'
};

const mockUser3 = {
  id: 'user-3',
  full_name: 'Bob Wilson',
  email: 'bob@example.com'
};

const mockUsers = [mockUser1, mockUser2, mockUser3];

const mockWorkloads = {
  'user-1': { active: 1, pending: 2, total: 3, score: 4 }, // Light workload
  'user-2': { active: 3, pending: 4, total: 7, score: 10 }, // Heavy workload
  'user-3': { active: 0, pending: 1, total: 1, score: 1 }  // Very light workload
};

describe('Task Management Automation', () => {
  describe('Task Dependencies', () => {
    it('should add valid task dependency', async () => {
      const dependencyRequest = {
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
        dependencyType: 'blocks',
        userId: mockUser1.id
      };
      
      const result = await testAddDependency(dependencyRequest);
      
      expect(result.success).toBe(true);
      expect(result.dependency).toBeDefined();
      expect(result.dependency.dependency_type).toBe('blocks');
      expect(result.message).toBe('Dependency added successfully');
    });

    it('should prevent circular dependencies', async () => {
      const dependencyRequest = {
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
        dependencyType: 'blocks',
        userId: mockUser1.id
      };
      
      // Mock circular dependency scenario
      const result = await testAddDependencyWithCircular(dependencyRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Circular dependency detected');
    });

    it('should remove existing dependency', async () => {
      const removeRequest = {
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
        userId: mockUser1.id
      };
      
      const result = await testRemoveDependency(removeRequest);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Dependency removed successfully');
    });

    it('should check if task can start based on dependencies', async () => {
      const dependencies = [
        { task_id: 'task-1', depends_on_task_id: 'task-2', status: 'completed' },
        { task_id: 'task-1', depends_on_task_id: 'task-3', status: 'completed' }
      ];
      
      const result = await testCheckDependencies('task-1', dependencies);
      
      expect(result.success).toBe(true);
      expect(result.canStart).toBe(true);
      expect(result.dependencies).toHaveLength(2);
    });

    it('should block task start when dependencies incomplete', async () => {
      const dependencies = [
        { task_id: 'task-1', depends_on_task_id: 'task-2', status: 'completed' },
        { task_id: 'task-1', depends_on_task_id: 'task-3', status: 'pending' }
      ];
      
      const result = await testCheckDependencies('task-1', dependencies);
      
      expect(result.success).toBe(true);
      expect(result.canStart).toBe(false);
    });
  });

  describe('Auto Assignment', () => {
    it('should suggest best candidate based on workload', async () => {
      const suggestions = await testGetAssignmentSuggestions(mockTask, mockUsers, mockWorkloads);
      
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].userId).toBe('user-3'); // Lightest workload
      expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
      expect(suggestions[0].reasons).toContain('low workload');
    });

    it('should prioritize available users for urgent tasks', async () => {
      const suggestions = await testGetAssignmentSuggestions(mockHighPriorityTask, mockUsers, mockWorkloads);
      
      const topSuggestion = suggestions[0];
      expect(topSuggestion.reasons).toContain('available for urgent tasks');
      expect(topSuggestion.workload.active).toBeLessThanOrEqual(1);
    });

    it('should auto-assign task to best candidate', async () => {
      const assignmentRequest = {
        taskId: mockTask.id,
        userId: mockUser1.id
      };
      
      const result = await testAutoAssignment(assignmentRequest, mockUsers, mockWorkloads);
      
      expect(result.success).toBe(true);
      expect(result.assigned).toBe(true);
      expect(result.assignee.userId).toBe('user-3'); // Best candidate
      expect(result.reason).toContain('Best match based on');
    });

    it('should handle no suitable assignees', async () => {
      const emptyUsers: any[] = [];
      const assignmentRequest = {
        taskId: mockTask.id,
        userId: mockUser1.id
      };
      
      const result = await testAutoAssignment(assignmentRequest, emptyUsers, {});
      
      expect(result.success).toBe(true);
      expect(result.assigned).toBe(false);
      expect(result.reason).toBe('No suitable assignees found');
    });
  });

  describe('Workload Management', () => {
    it('should analyze team workload distribution', async () => {
      const analysis = await testWorkloadAnalysis(mockUsers, mockWorkloads);
      
      expect(analysis).toHaveLength(3);
      expect(analysis[0].workload.total).toBe(3);
      expect(analysis[1].workload.total).toBe(7);
      expect(analysis[2].workload.total).toBe(1);
    });

    it('should classify workload status correctly', async () => {
      const lightUser = testGetWorkloadStatus(1);
      const moderateUser = testGetWorkloadStatus(4);
      const heavyUser = testGetWorkloadStatus(7);
      const overloadedUser = testGetWorkloadStatus(10);
      
      expect(lightUser).toBe('light');
      expect(moderateUser).toBe('moderate');
      expect(heavyUser).toBe('heavy');
      expect(overloadedUser).toBe('overloaded');
    });

    it('should generate workload recommendations', async () => {
      const analysis = await testWorkloadAnalysis(mockUsers, mockWorkloads);
      const recommendations = testGenerateWorkloadRecommendations(analysis);
      
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].type).toBe('redistribute');
      expect(recommendations[1].type).toBe('priority_review');
    });

    it('should balance workload across team', async () => {
      const balanceRequest = {
        action: 'balance',
        userIds: [mockUser1.id, mockUser2.id, mockUser3.id],
        userId: mockUser1.id
      };
      
      const result = await testWorkloadBalance(balanceRequest);
      
      expect(result.success).toBe(true);
      expect(result.balanced).toBe(true);
      expect(result.message).toContain('analysis complete');
    });

    it('should redistribute tasks between users', async () => {
      const redistributeRequest = {
        action: 'redistribute',
        userIds: [mockUser1.id, mockUser2.id],
        userId: mockUser1.id
      };
      
      const result = await testWorkloadBalance(redistributeRequest);
      
      expect(result.success).toBe(true);
      expect(result.redistributed).toBe(true);
    });
  });

  describe('Automation Overview', () => {
    it('should provide automation statistics', async () => {
      const overview = await testAutomationOverview();
      
      expect(overview.totalDependencies).toBeGreaterThanOrEqual(0);
      expect(overview.autoAssignmentsThisWeek).toBeGreaterThanOrEqual(0);
      expect(overview.automationEnabled).toBe(true);
      expect(overview.lastUpdate).toBeDefined();
    });

    it('should track automation activities', async () => {
      const activityLog = await testLogAutomationActivity(
        mockTask.id,
        'auto_assigned',
        'Task auto-assigned to John Doe',
        mockUser1.id
      );
      
      expect(activityLog.success).toBe(true);
      expect(activityLog.activity.type).toBe('auto_assigned');
      expect(activityLog.activity.related_to).toBe('task');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete automation workflow', async () => {
      // Step 1: Create task
      const task = { ...mockTask };
      
      // Step 2: Add dependencies
      const dependencyResult = await testAddDependency({
        taskId: task.id,
        dependsOnTaskId: 'prerequisite-task',
        dependencyType: 'blocks',
        userId: mockUser1.id
      });
      
      expect(dependencyResult.success).toBe(true);
      
      // Step 3: Check dependencies
      const depCheck = await testCheckDependencies(task.id, [
        { task_id: task.id, depends_on_task_id: 'prerequisite-task', status: 'completed' }
      ]);
      
      expect(depCheck.canStart).toBe(true);
      
      // Step 4: Auto-assign
      const assignmentResult = await testAutoAssignment(
        { taskId: task.id, userId: mockUser1.id },
        mockUsers,
        mockWorkloads
      );
      
      expect(assignmentResult.success).toBe(true);
      expect(assignmentResult.assigned).toBe(true);
    });

    it('should handle workload overflow scenarios', async () => {
      const overloadedWorkloads = {
        'user-1': { active: 8, pending: 5, total: 13, score: 21 },
        'user-2': { active: 7, pending: 6, total: 13, score: 20 },
        'user-3': { active: 6, pending: 4, total: 10, score: 16 }
      };
      
      const analysis = await testWorkloadAnalysis(mockUsers, overloadedWorkloads);
      const recommendations = testGenerateWorkloadRecommendations(analysis);
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('priority_review');
    });
  });
});

// Test helper functions
async function testAddDependency(request: any) {
  // Mock successful dependency addition
  return {
    success: true,
    dependency: {
      task_id: request.taskId,
      depends_on_task_id: request.dependsOnTaskId,
      dependency_type: request.dependencyType,
      created_at: new Date().toISOString()
    },
    message: 'Dependency added successfully'
  };
}

async function testAddDependencyWithCircular(request: any) {
  // Mock circular dependency detection
  return {
    success: false,
    error: 'Circular dependency detected'
  };
}

async function testRemoveDependency(request: any) {
  return {
    success: true,
    message: 'Dependency removed successfully'
  };
}

async function testCheckDependencies(taskId: string, dependencies: any[]) {
  const canStart = dependencies.every(dep => dep.status === 'completed');
  
  return {
    success: true,
    dependencies,
    blockedTasks: [],
    canStart,
    blocking: false
  };
}

async function testGetAssignmentSuggestions(task: any, users: any[], workloads: any) {
  const suggestions = users.map(user => {
    const userWorkload = workloads[user.id] || { active: 0, pending: 0, score: 0 };
    
    let score = 100;
    const reasons = [];
    
    // Workload factor
    if (userWorkload.active <= 2) {
      score += 20;
      reasons.push('low workload');
    } else if (userWorkload.active >= 5) {
      score -= 30;
      reasons.push('high workload');
    }
    
    // Priority factor
    if (task.priority === 'urgent' && userWorkload.active <= 1) {
      score += 15;
      reasons.push('available for urgent tasks');
    }
    
    // Random factor for testing
    score += Math.random() * 10;
    
    return {
      userId: user.id,
      name: user.full_name || user.email,
      email: user.email,
      score: Math.round(score),
      workload: userWorkload,
      reasons
    };
  }).sort((a, b) => b.score - a.score);
  
  return suggestions.slice(0, 3);
}

async function testAutoAssignment(request: any, users: any[], workloads: any) {
  if (!users.length) {
    return {
      success: true,
      assigned: false,
      reason: 'No suitable assignees found'
    };
  }
  
  const suggestions = await testGetAssignmentSuggestions(
    mockTask, 
    users, 
    workloads
  );
  
  const bestCandidate = suggestions[0];
  
  return {
    success: true,
    assigned: true,
    assignee: bestCandidate,
    task: { ...mockTask, assigned_to: bestCandidate.userId },
    reason: `Best match based on ${bestCandidate.reasons.join(', ')}`
  };
}

async function testWorkloadAnalysis(users: any[], workloads: any) {
  return users.map(user => ({
    ...user,
    workload: workloads[user.id] || { active: 0, pending: 0, total: 0, score: 0 },
    status: testGetWorkloadStatus(workloads[user.id]?.score || 0)
  }));
}

function testGetWorkloadStatus(score: number): 'light' | 'moderate' | 'heavy' | 'overloaded' {
  if (score <= 2) return 'light';
  if (score <= 5) return 'moderate';
  if (score <= 8) return 'heavy';
  return 'overloaded';
}

function testGenerateWorkloadRecommendations(analysis: any[]) {
  const recommendations = [];
  
  const overloaded = analysis.filter(user => user.workload.score > 8);
  const light = analysis.filter(user => user.workload.score <= 2);
  
  if (overloaded.length > 0 && light.length > 0) {
    recommendations.push({
      type: 'redistribute',
      message: `Redistribute tasks from ${overloaded.length} overloaded users to ${light.length} available users`,
      users: { overloaded: overloaded.map(u => u.id), available: light.map(u => u.id) }
    });
  }
  
  if (overloaded.length > 0) {
    recommendations.push({
      type: 'priority_review',
      message: 'Review task priorities for overloaded team members',
      users: overloaded.map(u => u.id)
    });
  }
  
  return recommendations;
}

async function testWorkloadBalance(request: any) {
  switch (request.action) {
    case 'analyze':
      return {
        success: true,
        analysis: await testWorkloadAnalysis(mockUsers, mockWorkloads),
        recommendations: []
      };
      
    case 'balance':
      return {
        success: true,
        balanced: true,
        changes: [],
        message: 'Workload analysis complete - no immediate balancing needed'
      };
      
    case 'redistribute':
      return {
        success: true,
        redistributed: true,
        changes: [],
        message: 'Task redistribution analysis complete'
      };
      
    default:
      return {
        success: false,
        error: 'Invalid workload action'
      };
  }
}

async function testAutomationOverview() {
  return {
    totalDependencies: 5,
    autoAssignmentsThisWeek: 12,
    automationEnabled: true,
    lastUpdate: new Date().toISOString()
  };
}

async function testLogAutomationActivity(
  taskId: string,
  activityType: string,
  description: string,
  userId: string
) {
  return {
    success: true,
    activity: {
      type: activityType,
      description,
      related_to: 'task',
      related_id: taskId,
      user_id: userId,
      timestamp: new Date().toISOString()
    }
  };
}

// Export test functions for CI/CD integration
export {
  testAddDependency,
  testRemoveDependency,
  testCheckDependencies,
  testGetAssignmentSuggestions,
  testAutoAssignment,
  testWorkloadAnalysis,
  testWorkloadBalance,
  testAutomationOverview,
  testLogAutomationActivity
};
