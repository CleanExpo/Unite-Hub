/**
 * Agent Controls Component
 * Provides UI controls for managing the AI agent
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Settings, 
  Terminal, 
  TestTube,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';

import { useAgentState } from '../hooks/use-agent-state';
import { AgentCommand, PhaseStatus } from '../types';

export interface AgentControlsProps {
  className?: string;
}

export function AgentControls({ className }: AgentControlsProps) {
  const {
    state,
    isLoading,
    error,
    isReady,
    initPhase,
    generateTests,
    runDockerTests,
    completePhase,
    getStatusReport,
    executeCommand,
    pauseExecution,
    resumeExecution,
    clearQueue,
    activeExecutions,
    queuedCommands
  } = useAgentState();

  const [selectedPhase, setSelectedPhase] = useState<string>('foundation');
  const [testType, setTestType] = useState<string>('unit');
  const [customCommand, setCustomCommand] = useState<string>('');
  const [customArgs, setCustomArgs] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  const phases = [
    { value: 'foundation', label: 'Foundation', icon: GitBranch },
    { value: 'implementation', label: 'Implementation', icon: Terminal },
    { value: 'integration', label: 'Integration', icon: TestTube },
    { value: 'deployment', label: 'Deployment', icon: Zap }
  ];

  const testTypes = [
    { value: 'unit', label: 'Unit Tests' },
    { value: 'integration', label: 'Integration Tests' },
    { value: 'e2e', label: 'End-to-End Tests' },
    { value: 'performance', label: 'Performance Tests' }
  ];

  const handleInitPhase = async () => {
    try {
      await initPhase(selectedPhase);
      setFeedback(`Successfully initialized ${selectedPhase} phase`);
    } catch (err) {
      setFeedback(`Failed to initialize phase: ${err}`);
    }
  };

  const handleGenerateTests = async () => {
    try {
      await generateTests(testType);
      setFeedback(`Successfully generated ${testType} tests`);
    } catch (err) {
      setFeedback(`Failed to generate tests: ${err}`);
    }
  };

  const handleRunTests = async () => {
    try {
      await runDockerTests();
      setFeedback('Successfully started Docker tests');
    } catch (err) {
      setFeedback(`Failed to run tests: ${err}`);
    }
  };

  const handleCompletePhase = async () => {
    if (!state.current_phase) {
      setFeedback('No active phase to complete');
      return;
    }

    try {
      await completePhase();
      setFeedback(`Successfully completed ${state.current_phase} phase`);
    } catch (err) {
      setFeedback(`Failed to complete phase: ${err}`);
    }
  };

  const handleCustomCommand = async () => {
    if (!customCommand.trim()) {
      setFeedback('Please enter a command');
      return;
    }

    try {
      const args = customArgs.trim() ? customArgs.split(' ') : [];
      const command: AgentCommand = {
        command: customCommand,
        args,
        options: { autoApprove },
        timeout: 60000,
        priority: 3
      };

      await executeCommand(command);
      setFeedback(`Successfully executed command: ${customCommand}`);
      setCustomCommand('');
      setCustomArgs('');
    } catch (err) {
      setFeedback(`Failed to execute command: ${err}`);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await getStatusReport();
      setFeedback('Status refreshed successfully');
    } catch (err) {
      setFeedback(`Failed to refresh status: ${err}`);
    }
  };

  const canInitPhase = (phase: string) => {
    const phaseIndex = phases.findIndex(p => p.value === phase);
    if (phaseIndex === 0) return true; // Foundation can always be started
    
    const previousPhase = phases[phaseIndex - 1];
    return state.completed_phases.includes(previousPhase.value);
  };

  const canCompletePhase = () => {
    return state.current_phase && 
           state.phase_status === PhaseStatus.TESTING &&
           state.test_results.length > 0 &&
           state.test_results.every(t => t.status === 'passed');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Phase Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Phase Management
          </CardTitle>
          <CardDescription>
            Initialize, manage, and complete development phases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phase-select">Select Phase</Label>
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger id="phase-select">
                  <SelectValue placeholder="Choose a phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => {
                    const Icon = phase.icon;
                    const canInit = canInitPhase(phase.value);
                    const isCompleted = state.completed_phases.includes(phase.value);
                    const isCurrent = state.current_phase === phase.value;
                    
                    return (
                      <SelectItem 
                        key={phase.value} 
                        value={phase.value}
                        disabled={!canInit && !isCompleted && !isCurrent}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{phase.label}</span>
                          {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                          {isCurrent && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Current Phase Status</Label>
              <div className="p-2 bg-muted rounded-md">
                <div className="text-sm font-medium">
                  {state.current_phase || 'No active phase'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Status: {state.phase_status}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInitPhase}
              disabled={!isReady || isLoading || !canInitPhase(selectedPhase)}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Initialize Phase
            </Button>

            <Button
              onClick={handleCompletePhase}
              disabled={!canCompletePhase() || isLoading}
              variant="outline"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Phase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Management
          </CardTitle>
          <CardDescription>
            Generate and execute tests for the current phase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-type-select">Test Type</Label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger id="test-type-select">
                  <SelectValue placeholder="Choose test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Test Results</Label>
              <div className="p-2 bg-muted rounded-md">
                <div className="text-sm font-medium">
                  {state.test_results.length} tests executed
                </div>
                <div className="text-xs text-muted-foreground">
                  {state.test_results.filter(t => t.status === 'passed').length} passed, {' '}
                  {state.test_results.filter(t => t.status === 'failed').length} failed
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateTests}
              disabled={!isReady || isLoading || !state.current_phase}
              size="sm"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Generate Tests
            </Button>

            <Button
              onClick={handleRunTests}
              disabled={!isReady || isLoading || !state.current_phase}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Run Docker Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Execution Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Execution Control
          </CardTitle>
          <CardDescription>
            Control agent execution and queue management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Active Executions</Label>
              <div className="text-2xl font-bold">{activeExecutions.length}</div>
            </div>
            
            <div className="space-y-2">
              <Label>Queued Commands</Label>
              <div className="text-2xl font-bold">{queuedCommands}</div>
            </div>

            <div className="space-y-2">
              <Label>Auto Approve</Label>
              <Switch
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              onClick={pauseExecution}
              disabled={activeExecutions.length === 0}
              variant="outline"
              size="sm"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>

            <Button
              onClick={resumeExecution}
              disabled={queuedCommands === 0}
              variant="outline"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>

            <Button
              onClick={() => clearQueue()}
              disabled={queuedCommands === 0}
              variant="destructive"
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>

            <Button
              onClick={handleRefreshStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Custom Commands
          </CardTitle>
          <CardDescription>
            Execute custom agent commands with optional arguments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom-command">Command</Label>
              <Input
                id="custom-command"
                placeholder="e.g., report_status"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-args">Arguments (space-separated)</Label>
              <Input
                id="custom-args"
                placeholder="e.g., --verbose --output json"
                value={customArgs}
                onChange={(e) => setCustomArgs(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleCustomCommand}
            disabled={!isReady || isLoading || !customCommand.trim()}
            className="w-full"
          >
            <Terminal className="h-4 w-4 mr-2" />
            Execute Command
          </Button>
        </CardContent>
      </Card>

      {/* Feedback */}
      {feedback && (
        <Alert variant={feedback.includes('Failed') ? 'destructive' : 'default'}>
          {feedback.includes('Failed') ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default AgentControls;
