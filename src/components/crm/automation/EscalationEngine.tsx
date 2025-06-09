"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Bell,
  TrendingUp,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

interface EscalationRule {
  id: string;
  name: string;
  trigger: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  escalationPath: string[];
  automationLevel: number;
  responseTime: number;
  successRate: number;
}

interface ActiveEscalation {
  id: string;
  type: string;
  description: string;
  currentLevel: number;
  assignedTo: string;
  timeRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoActions: string[];
  status: 'pending' | 'in-progress' | 'resolved';
}

// Intelligent Escalation System - 70% Manual Reduction
export default function EscalationEngine() {
  const [escalationRules] = useState<EscalationRule[]>([
    {
      id: 'rule-1',
      name: 'Deal Stagnation Alert',
      trigger: 'Deal inactive >14 days in pipeline',
      priority: 'high',
      escalationPath: ['Account Manager', 'Sales Director', 'VP Sales'],
      automationLevel: 0.85,
      responseTime: 2,
      successRate: 0.78
    },
    {
      id: 'rule-2',
      name: 'Client Health Score Drop',
      trigger: 'Client health score drops >20%',
      priority: 'critical',
      escalationPath: ['Customer Success', 'Account Manager', 'Executive Team'],
      automationLevel: 0.92,
      responseTime: 1,
      successRate: 0.84
    },
    {
      id: 'rule-3',
      name: 'Project Deadline Risk',
      trigger: 'Project completion risk >75%',
      priority: 'high',
      escalationPath: ['Project Manager', 'Operations Director'],
      automationLevel: 0.76,
      responseTime: 4,
      successRate: 0.73
    },
    {
      id: 'rule-4',
      name: 'Payment Overdue',
      trigger: 'Invoice overdue >30 days',
      priority: 'medium',
      escalationPath: ['Finance Team', 'Account Manager', 'Collections'],
      automationLevel: 0.88,
      responseTime: 6,
      successRate: 0.81
    }
  ]);

  const [activeEscalations] = useState<ActiveEscalation[]>([
    {
      id: 'esc-1',
      type: 'Deal Stagnation',
      description: 'Enterprise Corp deal inactive for 16 days in proposal stage',
      currentLevel: 1,
      assignedTo: 'Sarah Johnson (Sales Director)',
      timeRemaining: 18,
      priority: 'high',
      autoActions: ['Sent reminder email', 'Scheduled follow-up call', 'Updated deal priority'],
      status: 'in-progress'
    },
    {
      id: 'esc-2',
      type: 'Client Health Drop',
      description: 'TechStart Inc health score dropped from 85% to 62%',
      currentLevel: 0,
      assignedTo: 'Mike Chen (Customer Success)',
      timeRemaining: 12,
      priority: 'critical',
      autoActions: ['Health score analysis', 'Created intervention plan', 'Prepared executive brief'],
      status: 'pending'
    },
    {
      id: 'esc-3',
      type: 'Payment Overdue',
      description: 'Global Systems invoice 47 days overdue ($45,000)',
      currentLevel: 2,
      assignedTo: 'Collections Team',
      timeRemaining: 6,
      priority: 'medium',
      autoActions: ['Multiple payment reminders', 'Account review completed', 'Legal notice prepared'],
      status: 'in-progress'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in-progress': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const averageAutomation = escalationRules.reduce((sum, rule) => sum + rule.automationLevel, 0) / escalationRules.length;
  const averageSuccessRate = escalationRules.reduce((sum, rule) => sum + rule.successRate, 0) / escalationRules.length;
  const manualReduction = 70;

  return (
    <div className="space-y-6">
      {/* Escalation Engine Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Reduction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{manualReduction}%</div>
            <p className="text-xs text-muted-foreground">Automated escalations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Escalations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEscalations.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Level</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageAutomation * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Average automation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageSuccessRate * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Resolution success</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Escalations */}
      <Card>
        <CardHeader>
          <CardTitle>Active Escalations Monitor</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time escalation tracking with intelligent automation and priority management
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeEscalations.map((escalation) => (
              <div key={escalation.id} className={`border rounded-lg p-4 ${getPriorityColor(escalation.priority)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{escalation.type}</h4>
                    <p className="text-sm text-muted-foreground">{escalation.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(escalation.status)}
                    <Badge className="bg-blue-100 text-blue-800">
                      Level {escalation.currentLevel + 1}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Assigned To</div>
                    <div className="font-medium">{escalation.assignedTo}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Time Remaining</div>
                    <div className="font-medium">{formatTime(escalation.timeRemaining)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">{escalation.status}</div>
                  </div>
                </div>

                <div className="bg-white/50 rounded p-3">
                  <h6 className="font-medium mb-2">Automated Actions Taken</h6>
                  <ul className="text-sm space-y-1">
                    {escalation.autoActions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Intelligent Escalation Rules</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered escalation rules with automated triggers and response optimization
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {escalationRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground">{rule.trigger}</p>
                  </div>
                  <Badge className={getPriorityColor(rule.priority)}>
                    {rule.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Response Time</div>
                    <div className="font-medium">{rule.responseTime}h</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Automation Level</div>
                    <Progress value={rule.automationLevel * 100} className="h-2" />
                    <div className="text-xs">{(rule.automationLevel * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                    <Progress value={rule.successRate * 100} className="h-2" />
                    <div className="text-xs">{(rule.successRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Escalation Path</div>
                    <div className="text-xs">{rule.escalationPath.length} levels</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <h6 className="font-medium mb-2">Escalation Path</h6>
                  <div className="flex items-center gap-2 text-sm">
                    {rule.escalationPath.map((level, index) => (
                      <React.Fragment key={index}>
                        <span className="bg-white px-2 py-1 rounded border">
                          {level}
                        </span>
                        {index < rule.escalationPath.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </React.Fragment>
                    ))}
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
