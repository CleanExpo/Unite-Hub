'use client';

/**
 * Quantum AGI Dashboard
 * Revolutionary interface for Artificial General Intelligence business problem solving
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Shield, 
  Cpu, 
  Activity,
  Lightbulb,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface AGIProblem {
  id: string;
  type: 'strategic' | 'operational' | 'creative' | 'analytical' | 'predictive';
  domain: string;
  context: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  constraints?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  stakeholders?: string[];
}

interface AGISolution {
  problemId: string;
  solution: {
    primary: string;
    alternatives: string[];
    implementation: {
      steps: Array<{
        step: number;
        action: string;
        resources: string[];
        timeline: string;
        risks: string[];
        success_metrics: string[];
      }>;
      timeline: string;
      budget: number;
      probability_success: number;
    };
    reasoning: {
      analysis: string;
      assumptions: string[];
      quantum_advantages: string[];
      ethical_considerations: string[];
    };
  };
  confidence: number;
  quantum_enhancement: {
    speedup_factor: number;
    accuracy_improvement: number;
    solution_space_explored: number;
  };
  learning_insights: string[];
  metadata: {
    processing_time: number;
    quantum_operations: number;
    domains_consulted: string[];
    creativity_score: number;
    innovation_level: number;
  };
}

interface SystemStatus {
  quantum_processor_status: string;
  domain_expertise_count: number;
  memory_utilization: {
    episodic: number;
    semantic: number;
    procedural: number;
    working: number;
  };
  learning_rate: number;
  creativity_level: number;
  safety_status: {
    safety_protocols_active: boolean;
    human_oversight_enabled: boolean;
    ethical_framework: string;
    safety_violations: number;
    last_safety_check: string;
  };
  total_problems_solved: number;
  average_confidence: number;
  quantum_advantage_factor: number;
}

export default function QuantumAGIDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [currentProblem, setCurrentProblem] = useState<AGIProblem>({
    id: '',
    type: 'strategic',
    domain: 'business_strategy',
    context: '',
    priority: 'medium'
  });
  const [solution, setSolution] = useState<AGISolution | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('problem-solver');

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/quantum-agi');
      if (!response.ok) throw new Error('Failed to fetch system status');
      
      const data = await response.json();
      setSystemStatus(data.system_status);
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError('Failed to connect to AGI system');
    }
  };

  const solveProblem = async () => {
    if (!currentProblem.id || !currentProblem.context) {
      setError('Please provide problem ID and context');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSolution(null);

    try {
      const response = await fetch('/api/quantum-agi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'solve_problem',
          problem: currentProblem
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Problem solving failed');
      }

      const data = await response.json();
      setSolution(data.solution);
      
      // Refresh system status
      fetchSystemStatus();
    } catch (err) {
      console.error('Error solving problem:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerAutonomousLearning = async () => {
    setIsLearning(true);
    setError(null);

    try {
      const response = await fetch('/api/quantum-agi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'autonomous_learning'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Learning session failed');
      }

      // Refresh system status after learning
      setTimeout(fetchSystemStatus, 2000);
    } catch (err) {
      console.error('Error during learning:', err);
      setError(err instanceof Error ? err.message : 'Learning session failed');
    } finally {
      setIsLearning(false);
    }
  };

  const resetProblem = () => {
    setCurrentProblem({
      id: '',
      type: 'strategic',
      domain: 'business_strategy',
      context: '',
      priority: 'medium'
    });
    setSolution(null);
    setError(null);
  };

  const renderSystemMetrics = () => {
    if (!systemStatus) return <div>Loading system status...</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quantum Processor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{systemStatus.quantum_processor_status}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.quantum_advantage_factor}x advantage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Domain Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{systemStatus.domain_expertise_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(systemStatus.average_confidence * 100)}% confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{systemStatus.total_problems_solved}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Learning rate: {Math.round(systemStatus.learning_rate * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Safety Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <Badge variant={systemStatus.safety_status.safety_protocols_active ? "default" : "destructive"}>
                {systemStatus.safety_status.safety_protocols_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.safety_status.safety_violations} violations
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProblemSolver = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Define Business Problem
          </CardTitle>
          <CardDescription>
            Describe your business challenge for AGI analysis and solution generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="problem-id">Problem ID</Label>
              <Input
                id="problem-id"
                value={currentProblem.id}
                onChange={(e) => setCurrentProblem({...currentProblem, id: e.target.value})}
                placeholder="e.g., market-expansion-2025"
              />
            </div>
            <div>
              <Label htmlFor="problem-type">Problem Type</Label>
              <Select value={currentProblem.type} onValueChange={(value) => setCurrentProblem({...currentProblem, type: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                  <SelectItem value="predictive">Predictive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Select value={currentProblem.domain} onValueChange={(value) => setCurrentProblem({...currentProblem, domain: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_strategy">Business Strategy</SelectItem>
                  <SelectItem value="financial_analysis">Financial Analysis</SelectItem>
                  <SelectItem value="market_research">Market Research</SelectItem>
                  <SelectItem value="operations_management">Operations Management</SelectItem>
                  <SelectItem value="technology_innovation">Technology Innovation</SelectItem>
                  <SelectItem value="human_resources">Human Resources</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={currentProblem.priority} onValueChange={(value) => setCurrentProblem({...currentProblem, priority: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="context">Problem Context</Label>
            <Textarea
              id="context"
              value={currentProblem.context}
              onChange={(e) => setCurrentProblem({...currentProblem, context: e.target.value})}
              placeholder="Describe the business challenge in detail..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={solveProblem} 
              disabled={isProcessing || !currentProblem.id || !currentProblem.context}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Solve with AGI
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetProblem}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {solution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              AGI Solution
            </CardTitle>
            <CardDescription>
              Quantum-enhanced solution with {Math.round(solution.confidence * 100)}% confidence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {solution.quantum_enhancement.speedup_factor.toFixed(0)}x
                </div>
                <div className="text-sm text-muted-foreground">Quantum Speedup</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {Math.round(solution.metadata.creativity_score * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Creativity Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {Math.round(solution.solution.implementation.probability_success * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Success Probability</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Primary Solution</h4>
              <p className="text-sm text-muted-foreground">{solution.solution.primary}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Implementation Plan</h4>
              <div className="space-y-2">
                {solution.solution.implementation.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{step.action}</h5>
                      <p className="text-sm text-muted-foreground">{step.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Quantum Advantages</h4>
              <div className="flex flex-wrap gap-2">
                {solution.solution.reasoning.quantum_advantages.map((advantage, index) => (
                  <Badge key={index} variant="secondary">{advantage}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSystemDashboard = () => {
    if (!systemStatus) return <div>Loading...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Memory Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Episodic Memory</span>
                  <span>{systemStatus.memory_utilization.episodic}</span>
                </div>
                <Progress value={(systemStatus.memory_utilization.episodic / 1000) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Semantic Memory</span>
                  <span>{systemStatus.memory_utilization.semantic}</span>
                </div>
                <Progress value={(systemStatus.memory_utilization.semantic / 1000) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Procedural Memory</span>
                  <span>{systemStatus.memory_utilization.procedural}</span>
                </div>
                <Progress value={(systemStatus.memory_utilization.procedural / 1000) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Safety & Ethics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Safety Protocols</span>
                <Badge variant={systemStatus.safety_status.safety_protocols_active ? "default" : "destructive"}>
                  {systemStatus.safety_status.safety_protocols_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Human Oversight</span>
                <Badge variant={systemStatus.safety_status.human_oversight_enabled ? "default" : "secondary"}>
                  {systemStatus.safety_status.human_oversight_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Ethical Framework</span>
                <span className="text-sm text-muted-foreground">{systemStatus.safety_status.ethical_framework}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Safety Violations</span>
                <Badge variant={systemStatus.safety_status.safety_violations === 0 ? "default" : "destructive"}>
                  {systemStatus.safety_status.safety_violations}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Learning & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {Math.round(systemStatus.creativity_level * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Creativity Level</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {Math.round(systemStatus.learning_rate * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Learning Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {Math.round(systemStatus.average_confidence * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Average Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Autonomous Learning
            </CardTitle>
            <CardDescription>
              Trigger autonomous learning session to improve AGI capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={triggerAutonomousLearning} 
              disabled={isLearning}
              className="flex items-center gap-2"
            >
              {isLearning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Learning in Progress...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Learning Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quantum AGI Dashboard</h1>
          <p className="text-muted-foreground">
            Revolutionary business problem-solving with Artificial General Intelligence
          </p>
        </div>
        <Button variant="outline" onClick={fetchSystemStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {renderSystemMetrics()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="problem-solver">Problem Solver</TabsTrigger>
          <TabsTrigger value="system-dashboard">System Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="problem-solver" className="space-y-6">
          {renderProblemSolver()}
        </TabsContent>
        
        <TabsContent value="system-dashboard" className="space-y-6">
          {renderSystemDashboard()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
