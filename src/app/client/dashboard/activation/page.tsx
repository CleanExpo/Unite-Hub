'use client';

/**
 * Client Activation Dashboard
 * Phase 53: 90-day activation program view for clients
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  Calendar,
  Target,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { ActivationProgressBar } from '@/ui/components/ActivationProgressBar';
import { ActivationPhaseCard } from '@/ui/components/ActivationPhaseCard';
import { ActivationMilestoneList } from '@/ui/components/ActivationMilestoneList';

interface ActivationProgram {
  id: string;
  start_date: string;
  end_date: string;
  current_phase: number;
  status: string;
  overall_progress: number;
  phase_1_progress: number;
  phase_2_progress: number;
  phase_3_progress: number;
}

interface PhaseInfo {
  phase: number;
  name: string;
  days: string;
  description: string;
  progress: number;
  milestones: any[];
}

export default function ClientActivationPage() {
  const { user, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ActivationProgram | null>(null);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchActivationData();
    }
  }, [currentOrganization]);

  const fetchActivationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/activation/program?organizationId=${currentOrganization?.org_id}`
      );
      const data = await response.json();

      if (data.program) {
        setProgram(data.program);
        setPhases(data.phases || []);
        setEvents(data.events || []);
      }
    } catch (err) {
      setError('Failed to load activation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDay = () => {
    if (!program) {
return 1;
}
    const start = new Date(program.start_date);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading activation program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">90-Day Activation</h1>
          <p className="text-muted-foreground">Your guided activation program</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No activation program found. Your activation will begin once your account setup is complete.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentDay = getCurrentDay();
  const daysRemaining = 90 - currentDay;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">90-Day Activation</h1>
          <p className="text-muted-foreground">Your guided program to real marketing results</p>
        </div>
        <Badge
          variant={program.status === 'active' ? 'default' : 'secondary'}
          className="text-sm"
        >
          {program.status}
        </Badge>
      </div>

      {/* Progress Overview */}
      <ActivationProgressBar
        currentDay={currentDay}
        totalDays={90}
        phase1Progress={program.phase_1_progress}
        phase2Progress={program.phase_2_progress}
        phase3Progress={program.phase_3_progress}
        overallProgress={program.overall_progress}
        status={program.status as any}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Current Day</span>
            </div>
            <div className="text-2xl font-bold mt-1">{currentDay}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Days Left</span>
            </div>
            <div className="text-2xl font-bold mt-1">{Math.max(0, daysRemaining)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Current Phase</span>
            </div>
            <div className="text-2xl font-bold mt-1">{program.current_phase}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Progress</span>
            </div>
            <div className="text-2xl font-bold mt-1">{program.overall_progress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {phases.map((phase) => (
          <ActivationPhaseCard
            key={phase.phase}
            phase={phase.phase}
            name={phase.name}
            days={phase.days}
            description={phase.description}
            progress={phase.progress}
            milestones={phase.milestones}
            isActive={program.current_phase === phase.phase}
          />
        ))}
      </div>

      {/* All Milestones */}
      <ActivationMilestoneList
        milestones={phases.flatMap((p) => p.milestones)}
        currentDay={currentDay}
        showActions={false}
      />

      {/* Recent Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="font-medium">{event.title}</p>
                    {event.description && (
                      <p className="text-muted-foreground">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Honest expectations footer */}
      <div className="bg-muted/30 border rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          This 90-day program builds systems for sustainable growth. Real marketing results require
          consistent effort—there are no shortcuts to genuine visibility and customer trust.
        </p>
      </div>
    </div>
  );
}
