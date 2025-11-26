'use client';

/**
 * Environment Console Dashboard
 * Phase 13 Real-World Context Layer UI
 *
 * Display:
 * - Tab 1: Real-time environment snapshot (current context)
 * - Tab 2: Capture events history and statistics
 * - Tab 3: Environment profiles and patterns
 * - Tab 4: Productivity outcomes and learning
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingUp, Camera, Eye, Zap } from 'lucide-react';

interface EnvironmentProfile {
  profileId: string;
  displayName: string;
  placeType: string;
  focusQualityAverage: number;
  sampleSize: number;
  confidenceScore: number;
  deepWorkOptimal: boolean;
  creativeOptimal: boolean;
  communicationOptimal: boolean;
  restOptimal: boolean;
}

interface SituationSnapshot {
  snapshotId: string;
  timestamp: string;
  environmentType: string;
  environmentDescription: string;
  safetyScore: number;
  focusScore: number;
  socialPressureScore: number;
  likelyActivity: string;
  cognitiveLoad: string;
  energyLevel: string;
  emotionalState: string;
  riskFlags: Array<{ type: string; severity: string; description: string }>;
  opportunityFlags: Array<{ type: string; suitability: string; description: string }>;
}

interface CaptureEvent {
  eventId: string;
  timestamp: string;
  triggerMode: string;
  status: string;
  successfulAnalysis: boolean;
  estimatedCost: number;
  batteryPercent: number;
}

export default function EnvironmentConsole() {
  const [activeTab, setActiveTab] = useState('snapshot');
  const [snapshot, setSnapshot] = useState<SituationSnapshot | null>(null);
  const [captureEvents, setCaptureEvents] = useState<CaptureEvent[]>([]);
  const [profiles, setProfiles] = useState<EnvironmentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCaptures: 0,
    successRate: 0,
    spentToday: 0,
    budgetRemaining: 0,
  });

  useEffect(() => {
    // In production: fetch from API endpoints
    // For MVP: load mock data
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock situation snapshot
    const mockSnapshot: SituationSnapshot = {
      snapshotId: 'ss_mock_001',
      timestamp: new Date().toISOString(),
      environmentType: 'office',
      environmentDescription: 'Office at desk during morning. Quiet space with natural light.',
      safetyScore: 85,
      focusScore: 78,
      socialPressureScore: 25,
      likelyActivity: 'working',
      cognitiveLoad: 'moderate',
      energyLevel: 'good',
      emotionalState: 'engaged',
      riskFlags: [],
      opportunityFlags: [
        { type: 'deep_work', suitability: 'ideal', description: 'Excellent focus conditions for deep, concentrated work' },
        { type: 'creative', suitability: 'good', description: 'Good environment for brainstorming and creative thinking' },
      ],
    };

    // Mock capture events
    const mockCaptures: CaptureEvent[] = [
      {
        eventId: 'cap_001',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        triggerMode: 'tap',
        status: 'complete',
        successfulAnalysis: true,
        estimatedCost: 0.01,
        batteryPercent: 85,
      },
      {
        eventId: 'cap_002',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        triggerMode: 'voice',
        status: 'complete',
        successfulAnalysis: true,
        estimatedCost: 0.01,
        batteryPercent: 92,
      },
      {
        eventId: 'cap_003',
        timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        triggerMode: 'scheduled',
        status: 'complete',
        successfulAnalysis: true,
        estimatedCost: 0.01,
        batteryPercent: 78,
      },
    ];

    // Mock environment profiles
    const mockProfiles: EnvironmentProfile[] = [
      {
        profileId: 'env_001',
        displayName: 'Office Desk',
        placeType: 'office',
        focusQualityAverage: 82,
        sampleSize: 12,
        confidenceScore: 0.85,
        deepWorkOptimal: true,
        creativeOptimal: true,
        communicationOptimal: true,
        restOptimal: false,
      },
      {
        profileId: 'env_002',
        displayName: 'Favorite Cafe',
        placeType: 'cafe',
        focusQualityAverage: 68,
        sampleSize: 8,
        confidenceScore: 0.72,
        deepWorkOptimal: false,
        creativeOptimal: true,
        communicationOptimal: true,
        restOptimal: true,
      },
      {
        profileId: 'env_003',
        displayName: 'Home Office',
        placeType: 'home',
        focusQualityAverage: 76,
        sampleSize: 5,
        confidenceScore: 0.58,
        deepWorkOptimal: true,
        creativeOptimal: false,
        communicationOptimal: false,
        restOptimal: true,
      },
    ];

    setSnapshot(mockSnapshot);
    setCaptureEvents(mockCaptures);
    setProfiles(mockProfiles);
    setStats({
      totalCaptures: 45,
      successRate: 0.96,
      spentToday: 0.45,
      budgetRemaining: 0.55,
    });
    setLoading(false);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'high') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Loading environment data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Environment Console</h1>
        <p className="text-gray-600 mt-2">Real-time contextual awareness and environment learning</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Captures Today</div>
            <div className="text-2xl font-bold mt-2">{stats.totalCaptures}</div>
            <div className="text-xs text-gray-500 mt-1">Success rate: {(stats.successRate * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Daily Cost</div>
            <div className="text-2xl font-bold mt-2">${stats.spentToday.toFixed(2)}</div>
            <div className="text-xs text-green-600 mt-1">Budget remaining: ${stats.budgetRemaining.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Environments</div>
            <div className="text-2xl font-bold mt-2">{profiles.length}</div>
            <div className="text-xs text-gray-500 mt-1">Learned profiles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Avg Focus Quality</div>
            <div className="text-2xl font-bold mt-2">
              {Math.round(profiles.reduce((sum, p) => sum + p.focusQualityAverage, 0) / profiles.length)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Across all environments</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="snapshot">Current Snapshot</TabsTrigger>
          <TabsTrigger value="captures">Captures</TabsTrigger>
          <TabsTrigger value="profiles">Environments</TabsTrigger>
          <TabsTrigger value="outcomes">Productivity</TabsTrigger>
        </TabsList>

        {/* Tab 1: Current Situation Snapshot */}
        <TabsContent value="snapshot" className="space-y-4">
          {snapshot && (
            <>
              {/* Environment Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Environment</CardTitle>
                  <CardDescription>Real-time situational awareness</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Type</div>
                      <div className="text-lg font-semibold capitalize mt-1">{snapshot.environmentType}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Activity</div>
                      <div className="text-lg font-semibold capitalize mt-1">{snapshot.likelyActivity}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Cognitive Load</div>
                      <div className="text-lg font-semibold capitalize mt-1">{snapshot.cognitiveLoad}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Energy Level</div>
                      <div className="text-lg font-semibold capitalize mt-1">{snapshot.energyLevel}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{snapshot.environmentDescription}</p>
                </CardContent>
              </Card>

              {/* Scoring */}
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Safety</span>
                      <Badge className={`${getScoreBadgeColor(snapshot.safetyScore)} text-white`}>
                        {snapshot.safetyScore}/100
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getScoreBadgeColor(snapshot.safetyScore)} h-2 rounded-full`}
                        style={{ width: `${snapshot.safetyScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Focus Quality</span>
                      <Badge className={`${getScoreBadgeColor(snapshot.focusScore)} text-white`}>
                        {snapshot.focusScore}/100
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getScoreBadgeColor(snapshot.focusScore)} h-2 rounded-full`}
                        style={{ width: `${snapshot.focusScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Social Pressure</span>
                      <Badge className={`${getScoreBadgeColor(100 - snapshot.socialPressureScore)} text-white`}>
                        {snapshot.socialPressureScore}/100
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getScoreBadgeColor(100 - snapshot.socialPressureScore)} h-2 rounded-full`}
                        style={{ width: `${snapshot.socialPressureScore}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Flags */}
              {snapshot.riskFlags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Flags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.riskFlags.map((flag, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-3 bg-red-50 rounded-lg">
                        {getSeverityIcon(flag.severity)}
                        <div className="flex-1">
                          <div className="font-medium text-sm capitalize">{flag.type}</div>
                          <div className="text-xs text-gray-600 mt-1">{flag.description}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Opportunity Flags */}
              {snapshot.opportunityFlags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.opportunityFlags.map((opp, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <div className="font-medium text-sm capitalize">{opp.type}</div>
                          <div className="text-xs text-gray-600 mt-1">{opp.description}</div>
                          <div className="text-xs font-medium text-green-600 mt-2 capitalize">
                            {opp.suitability} suitability
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab 2: Capture Events */}
        <TabsContent value="captures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Captures</CardTitle>
              <CardDescription>Vision capture events from smart glasses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {captureEvents.map((event) => (
                  <div key={event.eventId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">
                          {event.triggerMode.charAt(0).toUpperCase() + event.triggerMode.slice(1)} Capture
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.successfulAnalysis ? (
                        <Badge className="bg-green-500 text-white">Success</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">Failed</Badge>
                      )}
                      <div className="text-xs text-gray-500">${event.estimatedCost.toFixed(3)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capture Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Capture Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Most Used Trigger</span>
                <span className="font-semibold">Tap (45%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Battery Used</span>
                <span className="font-semibold">~5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Most Active Time</span>
                <span className="font-semibold">9:00 AM - 12:00 PM</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Environment Profiles */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile) => (
              <Card key={profile.profileId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{profile.displayName}</CardTitle>
                      <CardDescription className="capitalize">{profile.placeType}</CardDescription>
                    </div>
                    <Badge variant="outline">{profile.sampleSize} observations</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Focus Quality */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Focus Quality</span>
                      <span className="text-lg font-bold">{profile.focusQualityAverage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getScoreBadgeColor(profile.focusQualityAverage)} h-2 rounded-full`}
                        style={{ width: `${profile.focusQualityAverage}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Confidence</span>
                      <span className="text-sm font-semibold">{(profile.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${profile.confidenceScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Activity Suitability */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Optimal For:</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.deepWorkOptimal && (
                        <Badge className="bg-purple-100 text-purple-800">Deep Work</Badge>
                      )}
                      {profile.creativeOptimal && (
                        <Badge className="bg-pink-100 text-pink-800">Creative</Badge>
                      )}
                      {profile.communicationOptimal && (
                        <Badge className="bg-blue-100 text-blue-800">Communication</Badge>
                      )}
                      {profile.restOptimal && <Badge className="bg-green-100 text-green-800">Rest</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 4: Productivity Outcomes */}
        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Learning</CardTitle>
              <CardDescription>How Phill performs in different environments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div key={profile.profileId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{profile.displayName}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {profile.sampleSize} sessions tracked
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{profile.focusQualityAverage}%</div>
                        <div className="text-xs text-gray-500">Focus quality</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Best Time</div>
                        <div className="font-semibold mt-1">9:00 AM - 11:00 AM</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Avg Duration</div>
                        <div className="font-semibold mt-1">2.5 hours</div>
                      </div>
                    </div>

                    {/* Trend Indicator */}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">Improving trend (+5% last week)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Peak Productivity</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Office desk is your most productive environment for deep work (82% focus quality)
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Energy Pattern</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Best results occur when energy level is "good" or "sharp" (73% success rate)
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Recommendation</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Schedule complex tasks at office during morning hours for best outcomes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
