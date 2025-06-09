"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Users, 
  Target, 
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Zap,
  Settings
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacity: number;
  currentLoad: number;
  skills: string[];
  efficiency: number;
  availability: number;
}

interface AutoAssignment {
  taskId: string;
  taskTitle: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  requiredSkills: string[];
  assignedTo: string;
  confidence: number;
  reasoning: string;
  alternativeAssignees: string[];
  deadline: Date;
}

interface WorkloadOptimization {
  teamMember: string;
  currentUtilization: number;
  recommendedUtilization: number;
  tasksToReassign: number;
  effiencyGain: number;
}

// Autonomous Task Assignment Engine - 60% Manual Reduction
export default function AutonomousTaskEngine() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'tm-001',
      name: 'Sarah Chen',
      role: 'Senior Developer',
      capacity: 40,
      currentLoad: 32,
      skills: ['Frontend', 'React', 'TypeScript', 'UI/UX'],
      efficiency: 0.92,
      availability: 0.80
    },
    {
      id: 'tm-002',
      name: 'Marcus Johnson',
      role: 'Backend Engineer',
      capacity: 40,
      currentLoad: 38,
      skills: ['Backend', 'Node.js', 'Database', 'API'],
      efficiency: 0.89,
      availability: 0.95
    },
    {
      id: 'tm-003',
      name: 'Elena Rodriguez',
      role: 'Full Stack Developer',
      capacity: 40,
      currentLoad: 28,
      skills: ['Frontend', 'Backend', 'React', 'Python'],
      efficiency: 0.87,
      availability: 0.70
    },
    {
      id: 'tm-004',
      name: 'David Kim',
      role: 'DevOps Engineer',
      capacity: 40,
      currentLoad: 35,
      skills: ['DevOps', 'CI/CD', 'AWS', 'Docker'],
      efficiency: 0.94,
      availability: 0.85
    }
  ]);

  const [autoAssignments, setAutoAssignments] = useState<AutoAssignment[]>([
    {
      taskId: 'task-001',
      taskTitle: 'Implement Advanced Search Filters',
      priority: 'high',
      estimatedHours: 12,
      requiredSkills: ['Frontend', 'React', 'TypeScript'],
      assignedTo: 'Sarah Chen',
      confidence: 94,
      reasoning: 'Perfect skill match, optimal capacity, high efficiency rating',
      alternativeAssignees: ['Elena Rodriguez'],
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      taskId: 'task-002',
      taskTitle: 'Optimize Database Queries',
      priority: 'medium',
      estimatedHours: 8,
      requiredSkills: ['Backend', 'Database', 'Performance'],
      assignedTo: 'Marcus Johnson',
      confidence: 91,
      reasoning: 'Strong database expertise, available capacity within deadline',
      alternativeAssignees: ['Elena Rodriguez'],
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      taskId: 'task-003',
      taskTitle: 'Setup Monitoring Dashboard',
      priority: 'critical',
      estimatedHours: 16,
      requiredSkills: ['DevOps', 'Monitoring', 'AWS'],
      assignedTo: 'David Kim',
      confidence: 96,
      reasoning: 'Unique expertise required, high efficiency, critical priority match',
      alternativeAssignees: [],
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      taskId: 'task-004',
      taskTitle: 'Create API Documentation',
      priority: 'low',
      estimatedHours: 6,
      requiredSkills: ['Backend', 'Documentation'],
      assignedTo: 'Elena Rodriguez',
      confidence: 88,
      reasoning: 'Good capacity availability, documentation experience',
      alternativeAssignees: ['Marcus Johnson'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [workloadOptimizations, setWorkloadOptimizations] = useState<WorkloadOptimization[]>([
    {
      teamMember: 'Marcus Johnson',
      currentUtilization: 0.95,
      recommendedUtilization: 0.85,
      tasksToReassign: 1,
      effiencyGain: 0.12
    },
    {
      teamMember: 'Elena Rodriguez',
      currentUtilization: 0.70,
      recommendedUtilization: 0.80,
      tasksToReassign: -1,
      effiencyGain: 0.08
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 0.90) return 'text-red-600';
    if (utilization > 0.80) return 'text-yellow-600';
    if (utilization > 0.60) return 'text-green-600';
    return 'text-blue-600';
  };

  const formatDeadline = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const totalCapacity = teamMembers.reduce((sum, member) => sum + member.capacity, 0);
  const totalLoad = teamMembers.reduce((sum, member) => sum + member.currentLoad, 0);
  const averageEfficiency = teamMembers.reduce((sum, member) => sum + member.efficiency, 0) / teamMembers.length;
  const manualReduction = 60; // 60% reduction in manual assignment

  return (
    <div className="space-y-6">
      {/* Autonomous Task Assignment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{((totalLoad / totalCapacity) * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Optimal balance maintained</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(autoAssignments.reduce((sum, a) => sum + a.confidence, 0) / autoAssignments.length).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">High accuracy matching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Reduction</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{manualReduction}%</div>
            <p className="text-xs text-muted-foreground">Automated assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageEfficiency * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Performance optimization</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Capacity Management */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Team Capacity Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Autonomous workload balancing with skill-based matching and capacity optimization
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getUtilizationColor(member.currentLoad / member.capacity)}`}>
                      {((member.currentLoad / member.capacity) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Utilization</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Capacity</div>
                    <Progress value={(member.currentLoad / member.capacity) * 100} className="h-2" />
                    <div className="text-xs">{member.currentLoad}h / {member.capacity}h</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Efficiency</div>
                    <Progress value={member.efficiency * 100} className="h-2" />
                    <div className="text-xs">{(member.efficiency * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Availability</div>
                    <Progress value={member.availability * 100} className="h-2" />
                    <div className="text-xs">{(member.availability * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 2).map((skill, index) => (
                        <Badge key={index} className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 2 && (
                        <Badge className="text-xs">+{member.skills.length - 2}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Autonomous Task Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Intelligent Task Assignments</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered task assignment with skill matching and workload optimization
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {autoAssignments.map((assignment) => (
              <div key={assignment.taskId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{assignment.taskTitle}</h4>
                    <p className="text-sm text-muted-foreground">Assigned to: {assignment.assignedTo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(assignment.priority)}>
                      {assignment.priority.toUpperCase()}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {assignment.confidence}% confidence
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Estimated Hours</div>
                    <div className="font-medium">{assignment.estimatedHours}h</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Deadline</div>
                    <div className="font-medium">{formatDeadline(assignment.deadline)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Required Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {assignment.requiredSkills.map((skill, index) => (
                        <Badge key={index} className="text-xs bg-gray-100 text-gray-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Alternatives</div>
                    <div className="text-sm">
                      {assignment.alternativeAssignees.length > 0 
                        ? assignment.alternativeAssignees.join(', ')
                        : 'None available'
                      }
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded p-3">
                  <h6 className="font-medium mb-1">AI Reasoning</h6>
                  <p className="text-sm">{assignment.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workload Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Workload Optimization Recommendations</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-driven suggestions for optimal team performance and utilization
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloadOptimizations.map((optimization, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium">{optimization.teamMember}</h4>
                  <Badge className="bg-green-100 text-green-800">
                    +{(optimization.effiencyGain * 100).toFixed(0)}% efficiency
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Current Utilization</div>
                    <Progress value={optimization.currentUtilization * 100} className="h-2" />
                    <div className="text-sm font-medium">{(optimization.currentUtilization * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Recommended Utilization</div>
                    <Progress value={optimization.recommendedUtilization * 100} className="h-2" />
                    <div className="text-sm font-medium">{(optimization.recommendedUtilization * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Task Adjustment</div>
                    <div className="text-sm font-medium">
                      {optimization.tasksToReassign > 0 ? 'Reassign' : 'Assign'} {Math.abs(optimization.tasksToReassign)} task(s)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
