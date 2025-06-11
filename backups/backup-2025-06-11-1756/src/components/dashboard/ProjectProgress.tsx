'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DashboardService } from '@/lib/services/dashboard';
import type { ProjectMilestone } from '@/types/dashboard';

interface ProjectProgressProps {
  projectId: string;
  projectTitle: string;
  className?: string;
}

export function ProjectProgress({ projectId, projectTitle, className }: ProjectProgressProps) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    setIsLoading(true);
    try {
      const data = await DashboardService.getProjectMilestones(projectId);
      setMilestones(data);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-900/20';
      case 'in_progress':
        return 'text-blue-400 bg-blue-900/20';
      case 'delayed':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusBadge = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-800">In Progress</Badge>;
      case 'delayed':
        return <Badge className="bg-red-600/20 text-red-400 border-red-800">Delayed</Badge>;
      default:
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-800">Pending</Badge>;
    }
  };

  const calculateOverallProgress = () => {
    if (milestones.length === 0) return 0;
    const totalWeight = milestones.reduce((sum, m) => sum + (m.completion_percentage || 0), 0);
    return Math.round(totalWeight / milestones.length);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className={cn("bg-slate-800 border-slate-700", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-400" />
            <CardTitle className="text-lg text-white">{projectTitle} Progress</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{calculateOverallProgress()}%</div>
            <div className="text-xs text-slate-400">Overall Progress</div>
          </div>
        </div>
        
        <Progress value={calculateOverallProgress()} className="mt-4" />
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No milestones defined yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      getStatusColor(milestone.status)
                    )}>
                      {getStatusIcon(milestone.status)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-xs text-slate-400 mt-1">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {getStatusBadge(milestone.status)}
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-medium">{milestone.completion_percentage}%</span>
                  </div>
                  
                  <Progress value={milestone.completion_percentage} className="h-2" />
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {formatDate(milestone.due_date)}</span>
                    </div>
                    
                    {milestone.completed_at && (
                      <div className="text-xs text-green-400">
                        Completed: {formatDate(milestone.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
