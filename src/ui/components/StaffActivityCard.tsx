'use client';

/**
 * Staff Activity Card Component
 * Phase 51: Display staff activity insights
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, TrendingUp, Clock, MessageSquare, FileText, Zap
} from 'lucide-react';

interface StaffInsight {
  staff_id: string;
  staff_name?: string;
  tasks_completed: number;
  tasks_in_progress: number;
  hours_logged: number;
  client_interactions: number;
  content_generated: number;
  productivity_score: number;
  engagement_score: number;
  ai_insights: { insight: string; type: string }[];
}

interface StaffActivityCardProps {
  insights: StaffInsight[];
  overview: {
    totalStaff: number;
    avgProductivity: number;
    avgEngagement: number;
    totalTasks: number;
    totalHours: number;
    topPerformers: { staffId: string; score: number }[];
  };
  onStaffClick?: (staffId: string) => void;
}

export function StaffActivityCard({
  insights,
  overview,
  onStaffClick,
}: StaffActivityCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{overview.totalStaff}</div>
            <div className="text-xs text-muted-foreground">Team Members</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(overview.avgProductivity)}`}>
              {overview.avgProductivity}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Productivity</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(overview.avgEngagement)}`}>
              {overview.avgEngagement}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Engagement</div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            {overview.totalHours.toFixed(1)}h logged
          </span>
          <span className="text-muted-foreground">
            <Zap className="inline h-3 w-3 mr-1" />
            {overview.totalTasks} tasks completed
          </span>
        </div>

        {/* Individual staff */}
        <div className="space-y-3">
          {insights.slice(0, 5).map((staff) => (
            <div
              key={staff.staff_id}
              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onStaffClick?.(staff.staff_id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">
                  {staff.staff_name || `Staff ${staff.staff_id.substring(0, 8)}`}
                </span>
                <div className="flex gap-1">
                  <Badge variant={getScoreVariant(staff.productivity_score)} className="text-xs">
                    P: {staff.productivity_score}%
                  </Badge>
                  <Badge variant={getScoreVariant(staff.engagement_score)} className="text-xs">
                    E: {staff.engagement_score}%
                  </Badge>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20">Productivity</span>
                  <Progress value={staff.productivity_score} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20">Engagement</span>
                  <Progress value={staff.engagement_score} className="h-1.5 flex-1" />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {staff.tasks_completed} tasks
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {staff.hours_logged.toFixed(1)}h
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {staff.client_interactions}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {staff.content_generated}
                </div>
              </div>

              {/* AI Insights */}
              {staff.ai_insights.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  {staff.ai_insights.slice(0, 1).map((insight, i) => (
                    <div
                      key={i}
                      className={`text-xs ${
                        insight.type === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : insight.type === 'attention'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {insight.insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Top performers */}
        {overview.topPerformers.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Top Performers
            </h4>
            <div className="flex gap-2">
              {overview.topPerformers.map((performer, i) => (
                <Badge key={performer.staffId} variant="outline" className="text-xs">
                  #{i + 1}: {performer.score}%
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StaffActivityCard;
