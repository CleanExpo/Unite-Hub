/**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" <string> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" <string> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" <string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" </div>
          </div>
        )}
      </CardContent>
    </Card> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" <TaskDefinition, 'id' | 'created_at' | 'updated_at'> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline"> /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => /**
 * Task List Component
 * Displays and manages tasks in the AI agent system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react';

import { TaskDefinition } from '../types';

export interface TaskListProps {
  tasks: TaskDefinition[];
  currentPhase?: string;
  onTaskUpdate?: (task: TaskDefinition) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => void;
  className?: string;
}

export function TaskList({ 
  tasks, 
  currentPhase, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskCreate,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get unique phases from tasks
  const phases = Array.from(new Set(tasks.map(task => task.phase)));

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    const matchesStatus = filterStatus === 'all'; // We don't have status on TaskDefinition, so show all
    
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  const getTaskStatusBadge = (task: TaskDefinition) => {
    // Determine status based on task properties
    const isReady = task.dependencies.length === 0;
    const isBlocked = task.dependencies.length > 0;
    
    if (isReady) {
      return <Badge variant="default">Ready</Badge>;
    } else if (isBlocked) {
      return <Badge variant="secondary">Blocked</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const TaskCard = ({ task }: { task: TaskDefinition }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getTaskStatusBadge(task)}
            <Badge variant="outline" className="text-xs">
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)} {/* Convert timeout to hours */}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeEstimate(task.timeout / 1000 / 60 / 60)}
            </span>
            <span>Command: {task.command}</span>
            {task.dependencies.length > 0 && (
              <span>{task.dependencies.length} dependencies</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onTaskUpdate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onTaskUpdate(task)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onTaskDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => onTaskDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.args.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Args:</span> {task.args.join(' ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      command: '',
      args: '',
      phase: currentPhase || 'foundation',
      timeout: '30000',
      retry_count: '3'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!onTaskCreate) return;

      const taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args: formData.args.split(' ').filter(Boolean),
        dependencies: [],
        phase: formData.phase,
        timeout: parseInt(formData.timeout),
        retry_count: parseInt(formData.retry_count)
      };

      onTaskCreate(taskData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        command: '',
        args: '',
        phase: currentPhase || 'foundation',
        timeout: '30000',
        retry_count: '3'
      });
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="task-name" className="text-xs">Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  Unite Group="Task name"
                  required
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="task-command" className="text-xs">Command</Label>
                <Input
                  id="task-command"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  Unite Group="e.g., init_phase"
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-xs">Description</Label>
              <Input
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                Unite Group="Task description"
                required
                className="h-8"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-phase" className="text-xs">Phase</Label>
                <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-timeout" className="text-xs">Timeout (ms)</Label>
                <Input
                  id="task-timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-retry" className="text-xs">Retry Count</Label>
                <Input
                  id="task-retry"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_count: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-args" className="text-xs">Arguments (space-separated)</Label>
              <Input
                id="task-args"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                Unite Group="arg1 arg2 arg3"
                className="h-8"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm">Create Task</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {currentPhase && ` • Current phase: ${currentPhase}`}
          </p>
        </div>
        
        {onTaskCreate && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && <CreateTaskForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="search"
                  Unite Group="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-phase" className="text-xs">Filter by Phase</Label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-status" className="text-xs">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPhase('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists by Phase */}
      <div className="space-y-4">
        {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{phase} Phase</CardTitle>
                <Badge variant="outline">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Tasks for the {phase} development phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks found for this phase</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks match your current filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPhase('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
.Value -replace "'", "'" </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TaskList;
