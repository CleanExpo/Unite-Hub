"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Users, Clock, Target, Zap, TrendingUp } from 'lucide-react';

interface TaskIntelligenceProps {
  projectId?: string;
}

interface PriorityRecommendation {
  taskId: string;
  taskName: string;
  currentPriority: 'low' | 'medium' | 'high' | 'critical';
  recommendedPriority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  confidence: number;
  impactScore: number;
}

interface AutoAssignment {
  taskId: string;
  taskName: string;
  skillsRequired: string[];
  recommendedAssignee: string;
  alternativeAssignees: string[];
  workloadScore: number;
  skillMatchScore: number;
  availabilityScore: number;
}

interface ProductivityAnalytics {
  teamMember: string;
  tasksCompleted: number;
  averageCompletionTime: number;
  qualityScore: number;
  collaborationIndex: number;
  burnoutRisk: number;
  recommendations: string[];
}

interface DeadlinePrediction {
  taskId: string;
  taskName: string;
  originalDeadline: string;
  predictedCompletion: string;
  riskLevel: 'low' | 'medium' | 'high';
  delayProbability: number;
  blockers: string[];
  mitigationSuggestions: string[];
}

interface BottleneckAnalysis {
  area: string;
  severity: number;
  impact: string;
  affectedTasks: number;
  suggestedActions: string[];
  estimatedResolution: string;
}

// AI-Powered Task Intelligence (Based on Agent Recommendations)
export default function TaskIntelligence({ projectId }: TaskIntelligenceProps) {
  const [taskMetrics, setTaskMetrics] = useState({
    totalTasks: 147,
    completedTasks: 89,
    inProgress: 32,
    overdue: 8,
    avgCompletionTime: 4.2,
    teamEfficiency: 87
  });

  const [priorityRecommendations, setPriorityRecommendations] = useState<PriorityRecommendation[]>([
    {
      taskId: 'TASK-001',
      taskName: 'Implement API security audit',
      currentPriority: 'medium',
      recommendedPriority: 'critical',
      reasoning: 'Security vulnerability detected affecting 15+ client accounts',
      confidence: 94,
      impactScore: 98
    },
    {
      taskId: 'TASK-002',
      taskName: 'Update user documentation',
      currentPriority: 'high',
      recommendedPriority: 'medium',
      reasoning: 'Client support tickets low, focus on development priorities',
      confidence: 78,
      impactScore: 45
    },
    {
      taskId: 'TASK-003',
      taskName: 'Performance optimization',
      currentPriority: 'low',
      recommendedPriority: 'high',
      reasoning: 'Database queries affecting 3 major clients, revenue impact $25k/month',
      confidence: 91,
      impactScore: 85
    }
  ]);

  const [autoAssignments, setAutoAssignments] = useState<AutoAssignment[]>([
    {
      taskId: 'TASK-004',
      taskName: 'Frontend component refactoring',
      skillsRequired: ['React', 'TypeScript', 'UI/UX'],
      recommendedAssignee: 'Sarah Chen',
      alternativeAssignees: ['Mike Rodriguez', 'Alex Kim'],
      workloadScore: 65,
      skillMatchScore: 96,
      availabilityScore: 78
    },
    {
      taskId: 'TASK-005',
      taskName: 'Database schema migration',
      skillsRequired: ['PostgreSQL', 'Database Design', 'Data Migration'],
      recommendedAssignee: 'David Wilson',
      alternativeAssignees: ['Lisa Park', 'Tom Johnson'],
      workloadScore: 45,
      skillMatchScore: 92,
      availabilityScore: 89
    },
    {
      taskId: 'TASK-006',
      taskName: 'API integration testing',
      skillsRequired: ['API Testing', 'Automation', 'QA'],
      recommendedAssignee: 'Emma Thompson',
      alternativeAssignees: ['Chris Lee', 'Jordan Smith'],
      workloadScore: 72,
      skillMatchScore: 88,
      availabilityScore: 85
    }
  ]);

  const [productivityAnalytics, setProductivityAnalytics] = useState<ProductivityAnalytics[]>([
    {
      teamMember: 'Sarah Chen',
      tasksCompleted: 24,
      averageCompletionTime: 3.8,
      qualityScore: 94,
      collaborationIndex: 87,
      burnoutRisk: 25,
      recommendations: ['Consider code review mentoring', 'Excellent performance, maintain current pace']
    },
    {
      teamMember: 'Mike Rodriguez',
      tasksCompleted: 18,
      averageCompletionTime: 5.2,
      qualityScore: 89,
      collaborationIndex: 92,
      burnoutRisk: 65,
      recommendations: ['Reduce concurrent tasks by 20%', 'Schedule regular check-ins', 'Consider pair programming for complex tasks']
    },
    {
      teamMember: 'David Wilson',
      tasksCompleted: 22,
      averageCompletionTime: 4.1,
      qualityScore: 96,
      collaborationIndex: 78,
      burnoutRisk: 15,
      recommendations: ['Increase collaboration opportunities', 'Consider technical leadership role']
    }
  ]);

  const [deadlinePredictions, setDeadlinePredictions] = useState<DeadlinePrediction[]>([
    {
      taskId: 'TASK-007',
      taskName: 'Mobile app feature rollout',
      originalDeadline: '2024-12-20',
      predictedCompletion: '2024-12-25',
      riskLevel: 'medium',
      delayProbability: 68,
      blockers: ['App store approval pending', 'Final QA testing incomplete'],
      mitigationSuggestions: ['Submit app store review early', 'Parallel QA testing', 'Prepare rollback plan']
    },
    {
      taskId: 'TASK-008',
      taskName: 'Client onboarding automation',
      originalDeadline: '2024-12-15',
      predictedCompletion: '2025-01-05',
      riskLevel: 'high',
      delayProbability: 87,
      blockers: ['Complex client requirements', 'API dependencies not ready', 'Resource conflicts'],
      mitigationSuggestions: ['Scope reduction', 'Additional developer allocation', 'Phased delivery approach']
    },
    {
      taskId: 'TASK-009',
      taskName: 'Security compliance update',
      originalDeadline: '2024-12-30',
      predictedCompletion: '2024-12-28',
      riskLevel: 'low',
      delayProbability: 15,
      blockers: [],
      mitigationSuggestions: ['Maintain current schedule', 'Buffer time for final review']
    }
  ]);

  const [bottleneckAnalysis, setBottleneckAnalysis] = useState<BottleneckAnalysis[]>([
    {
      area: 'Code Review Process',
      severity: 78,
      impact: 'Tasks waiting 2-3 days for review approval',
      affectedTasks: 12,
      suggestedActions: ['Add additional senior reviewers', 'Implement automated code quality checks', 'Establish review SLAs'],
      estimatedResolution: '2-3 weeks'
    },
    {
      area: 'Database Performance',
      severity: 65,
      impact: 'Slow query responses affecting development velocity',
      affectedTasks: 8,
      suggestedActions: ['Index optimization', 'Query refactoring', 'Database scaling'],
      estimatedResolution: '1-2 weeks'
    },
    {
      area: 'Testing Environment',
      severity: 45,
      impact: 'Limited test environment availability',
      affectedTasks: 6,
      suggestedActions: ['Add parallel test environments', 'Improve environment reset automation'],
      estimatedResolution: '3-4 weeks'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[priority as keyof typeof variants]}>{priority.toUpperCase()}</Badge>;
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[risk]}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Task Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskMetrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {taskMetrics.completedTasks} completed, {taskMetrics.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((taskMetrics.completedTasks / taskMetrics.totalTasks) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {taskMetrics.overdue} overdue tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskMetrics.avgCompletionTime} days</div>
            <p className="text-xs text-muted-foreground">
              Per task average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskMetrics.teamEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Overall productivity score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Task Intelligence Tabs */}
      <Tabs defaultValue="priority-recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="priority-recommendations">
            <Brain className="w-4 h-4 mr-2" />
            AI Priorities
          </TabsTrigger>
          <TabsTrigger value="auto-assignment">
            <Users className="w-4 h-4 mr-2" />
            Smart Assignment
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <Clock className="w-4 h-4 mr-2" />
            Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="priority-recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Priority Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Intelligent task prioritization based on impact, urgency, and business value
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorityRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <h4 className="font-medium">{rec.taskName}</h4>
                        <p className="text-sm text-muted-foreground">{rec.taskId}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">{rec.confidence}%</div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Current: </span>
                        {getPriorityBadge(rec.currentPriority)}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Recommended: </span>
                        {getPriorityBadge(rec.recommendedPriority)}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Impact Score: </span>
                        <span className="font-medium">{rec.impactScore}/100</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-1">AI Reasoning</h5>
                      <p className="text-sm text-blue-800">{rec.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-assignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Task Assignment</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered assignment recommendations based on skills, workload, and availability
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {autoAssignments.map((assignment, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{assignment.taskName}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.taskId}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">{assignment.recommendedAssignee}</div>
                        <div className="text-xs text-muted-foreground">Recommended</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Skill Match</div>
                        <Progress value={assignment.skillMatchScore} className="h-2" />
                        <div className="text-sm font-medium">{assignment.skillMatchScore}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Availability</div>
                        <Progress value={assignment.availabilityScore} className="h-2" />
                        <div className="text-sm font-medium">{assignment.availabilityScore}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Workload</div>
                        <Progress value={100 - assignment.workloadScore} className="h-2" />
                        <div className="text-sm font-medium">{assignment.workloadScore}% utilized</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Required Skills: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.skillsRequired.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Alternatives: </span>
                        <span className="text-sm">{assignment.alternativeAssignees.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Productivity Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered insights into team performance and optimization opportunities
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {productivityAnalytics.map((member, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-lg">{member.teamMember}</h4>
                      <div className="text-right">
                        <div className="text-lg font-bold">{member.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Tasks Completed</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Quality Score</div>
                        <Progress value={member.qualityScore} className="h-2" />
                        <div className="text-sm font-medium">{member.qualityScore}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Collaboration</div>
                        <Progress value={member.collaborationIndex} className="h-2" />
                        <div className="text-sm font-medium">{member.collaborationIndex}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Avg Completion</div>
                        <div className="text-sm font-medium">{member.averageCompletionTime} days</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Burnout Risk</div>
                        <Progress value={member.burnoutRisk} className="h-2" />
                        <div className="text-sm font-medium">{member.burnoutRisk}%</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-purple-900">AI Recommendations</h5>
                      <ul className="space-y-1">
                        {member.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-purple-800">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bottleneck Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI identification of workflow bottlenecks and optimization suggestions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bottleneckAnalysis.map((bottleneck, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{bottleneck.area}</h4>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{bottleneck.severity}%</div>
                        <div className="text-xs text-muted-foreground">Severity</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Impact: </span>
                        <span className="text-sm">{bottleneck.impact}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Affected Tasks: </span>
                        <Badge variant="secondary">{bottleneck.affectedTasks} tasks</Badge>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Est. Resolution: </span>
                        <span className="text-sm font-medium">{bottleneck.estimatedResolution}</span>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Suggested Actions:</div>
                        <ul className="space-y-1">
                          {bottleneck.suggestedActions.map((action, idx) => (
                            <li key={idx} className="text-sm">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deadline Prediction & Risk Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered deadline predictions with risk analysis and mitigation strategies
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deadlinePredictions.map((prediction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{prediction.taskName}</h4>
                        <p className="text-sm text-muted-foreground">{prediction.taskId}</p>
                      </div>
                      <div className="text-right space-y-1">
                        {getRiskBadge(prediction.riskLevel)}
                        <div className="text-sm text-muted-foreground">{prediction.delayProbability}% delay risk</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Original Deadline: </span>
                        <span className="font-medium">{prediction.originalDeadline}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Predicted Completion: </span>
                        <span className="font-medium">{prediction.predictedCompletion}</span>
                      </div>
                    </div>
                    
                    {prediction.blockers.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-2">Current Blockers:</div>
                        <ul className="space-y-1">
                          {prediction.blockers.map((blocker, idx) => (
                            <li key={idx} className="text-sm text-red-600">• {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Mitigation Suggestions:</div>
                      <ul className="space-y-1">
                        {prediction.mitigationSuggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-green-600">• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
