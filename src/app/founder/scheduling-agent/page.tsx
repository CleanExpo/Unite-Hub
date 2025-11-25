'use client';

/**
 * Scheduling Agent Demo Dashboard
 * Test the scheduling agent with sample calendar data
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import type { CalendarEvent, AvailabilitySlot } from '@/agents/scheduling/schedulingAgent';

interface SchedulingDemo {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  result?: {
    availableSlots: AvailabilitySlot[];
    conflicts: Array<{ eventA: CalendarEvent; eventB: CalendarEvent; overlap: number }>;
    proposalEmail: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    approvalStatus: string;
  };
}

export default function SchedulingAgentDemo() {
  const { session, currentOrganization } = useAuth();
  const [demo, setDemo] = useState<SchedulingDemo>({ status: 'idle', message: '' });
  const [participantEmail, setParticipantEmail] = useState('sarah@acme.com');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [daysAhead, setDaysAhead] = useState(7);

  const workspaceId = currentOrganization?.org_id || '';

  // Generate sample calendar data
  const generateSampleCalendar = (daysAhead: number): CalendarEvent[] => {
    const today = new Date();
    const events: CalendarEvent[] = [];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Add some sample meetings
      const numMeetings = Math.floor(Math.random() * 3) + 2; // 2-4 meetings per day
      for (let j = 0; j < numMeetings; j++) {
        const startHour = 8 + Math.floor(Math.random() * 8); // 8am-4pm
        const startTime = new Date(date);
        startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + (30 + Math.floor(Math.random() * 90))); // 30-120 min meetings

        events.push({
          id: `meeting-${i}-${j}`,
          title: ['Team Sync', 'Client Call', 'One-on-One', 'Project Review', 'Planning'][
            Math.floor(Math.random() * 5)
          ],
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          organizer: ['alice@acme.com', 'bob@acme.com', 'charlie@acme.com'][
            Math.floor(Math.random() * 3)
          ],
        });
      }
    }

    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  // Run scheduling demo
  const runDemo = async () => {
    if (!workspaceId || !session?.access_token) {
      setDemo({ status: 'error', message: 'Not authenticated' });
      return;
    }

    setDemo({ status: 'loading', message: 'Analyzing availability...' });

    try {
      const today = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const calendarEvents = generateSampleCalendar(daysAhead);

      const response = await fetch('/api/agents/scheduling/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          brand: 'unite_hub',
          participant: participantEmail.split('@')[0],
          participantEmail,
          durationMinutes,
          dateRange: {
            start: today,
            end: endDate.toISOString(),
          },
          calendarEvents,
          timezone: 'America/New_York',
          description: 'Demo scheduling request from founder dashboard',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setDemo({
        status: 'success',
        message: 'Scheduling analysis complete',
        result: {
          availableSlots: data.availableSlots || [],
          conflicts: data.conflicts || [],
          proposalEmail: data.proposalEmail || '',
          riskLevel: data.riskAssessment?.level || 'low',
          approvalStatus: data.approvalStatus || 'pending_review',
        },
      });
    } catch (error) {
      console.error('Demo error:', error);
      setDemo({
        status: 'error',
        message: error instanceof Error ? error.message : 'Demo failed',
      });
    }
  };

  if (!session) {
    return (
      <div className="p-8">
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>Please log in to access the scheduling agent demo.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableSlots = demo.result?.availableSlots || [];
  const conflicts = demo.result?.conflicts || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scheduling Agent</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Autonomous meeting proposal generation with calendar availability analysis
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Configuration</CardTitle>
          <CardDescription>Test the scheduling agent with sample calendar data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Participant Email</label>
              <Input
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="sarah@acme.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Meeting Duration (minutes)</label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                min="30"
                max="480"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Look-ahead Days</label>
              <Input
                type="number"
                value={daysAhead}
                onChange={(e) => setDaysAhead(parseInt(e.target.value) || 7)}
                min="1"
                max="30"
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={runDemo} disabled={demo.status === 'loading'} className="w-full md:w-auto">
            {demo.status === 'loading' ? 'Analyzing...' : 'Run Demo'}
          </Button>
        </CardContent>
      </Card>

      {/* Status Message */}
      {demo.status === 'success' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Analysis Complete</AlertTitle>
          <AlertDescription>{demo.message}</AlertDescription>
        </Alert>
      )}

      {demo.status === 'error' && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{demo.message}</AlertDescription>
        </Alert>
      )}

      {demo.result && (
        <Tabs defaultValue="availability" className="space-y-4">
          <TabsList>
            <TabsTrigger value="availability">Available Slots ({availableSlots.length})</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts ({conflicts.length})</TabsTrigger>
            <TabsTrigger value="proposal">Proposal Email</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Available Slots Tab */}
          <TabsContent value="availability" className="space-y-4">
            {availableSlots.length === 0 ? (
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200">
                <CardContent className="pt-6">
                  <p className="text-yellow-900 dark:text-yellow-200">
                    No available slots found in the requested time range.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSlots.slice(0, 10).map((slot, idx) => {
                  const startDate = new Date(slot.start);
                  const endDate = new Date(slot.end);
                  const confidencePercent = Math.round(slot.confidence * 100);

                  return (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {startDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span>
                              {startDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {endDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {slot.durationMinutes} min
                            </span>
                            <Badge
                              variant={
                                confidencePercent >= 85
                                  ? 'default'
                                  : confidencePercent >= 70
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {confidencePercent}% confidence
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-4">
            {conflicts.length === 0 ? (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                <CardContent className="pt-6">
                  <p className="text-green-900 dark:text-green-200">
                    No conflicts detected in the calendar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {conflicts.map((conflict, idx) => {
                  const eventAStart = new Date(conflict.eventA.start);
                  const eventBStart = new Date(conflict.eventB.start);

                  return (
                    <Card key={idx} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{conflict.eventA.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {eventAStart.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                            overlaps with
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{conflict.eventB.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {eventBStart.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                            <span className="text-xs font-medium">{conflict.overlap} min overlap</span>
                            <Badge variant="outline" className="text-orange-700">
                              Severity: High
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Proposal Email Tab */}
          <TabsContent value="proposal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Generated Proposal Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
                  {demo.result?.proposalEmail || 'No proposal generated'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Risk Level</span>
                    <Badge
                      variant={
                        demo.result?.riskLevel === 'low'
                          ? 'default'
                          : demo.result?.riskLevel === 'medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {demo.result?.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Approval Status</span>
                    <Badge variant="outline">{demo.result?.approvalStatus}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Available Slots:</span>
                    <p className="text-gray-600 dark:text-gray-400">{availableSlots.length} found</p>
                  </div>
                  <div>
                    <span className="font-medium">Calendar Conflicts:</span>
                    <p className="text-gray-600 dark:text-gray-400">{conflicts.length} detected</p>
                  </div>
                  <div>
                    <span className="font-medium">Best Time:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {availableSlots[0]
                        ? new Date(availableSlots[0].start).toLocaleTimeString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'None available'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Documentation */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">How the Scheduling Agent Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">1. Calendar Analysis</p>
            <p className="text-gray-700 dark:text-gray-300">
              The agent scans the target participant's calendar for available time slots within the requested date range.
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">2. Conflict Detection</p>
            <p className="text-gray-700 dark:text-gray-300">
              It identifies overlapping events and back-to-back meetings that could affect schedule quality.
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">3. Confidence Scoring</p>
            <p className="text-gray-700 dark:text-gray-300">
              Available slots are ranked by confidence (0-100%) based on buffer time and business hours preference.
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">4. Proposal Generation</p>
            <p className="text-gray-700 dark:text-gray-300">
              Professional email with up to 5 available slots is generated and formatted for calendar tools.
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">5. Risk Evaluation</p>
            <p className="text-gray-700 dark:text-gray-300">
              The system assesses risks and routes high-risk proposals to founder for review.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
