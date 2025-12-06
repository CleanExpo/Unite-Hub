'use client';

/**
 * Synthex Audience Intelligence Page
 * Phase: B10 - Audience Intelligence + Segmentation Engine
 *
 * Displays audiences, contacts, and AI-generated segments.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Target,
  Sparkles,
  RefreshCw,
  Loader2,
  Plus,
  ChevronRight,
  Mail,
  Phone,
  Tags,
  Brain,
  Layers,
  BarChart3,
  Activity,
} from 'lucide-react';
import AudienceScores from '@/components/synthex/audience/AudienceScores';
import LeadScoringPanel from '@/components/synthex/audience/LeadScoringPanel';
import LeadRoutingPanel from '@/components/synthex/audience/LeadRoutingPanel';

interface Audience {
  id: string;
  name: string;
  description?: string;
  audienceType: 'static' | 'dynamic' | 'smart';
  contactCount: number;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  segmentType: 'manual' | 'ai_generated' | 'behavioral' | 'demographic';
  contactCount: number;
  aiConfidence?: number;
  audienceId?: string;
}

interface Contact {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  engagementScore: number;
  status: string;
}

export default function AudiencePage() {
  const [tenantId, setTenantId] = useState('');
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [generatingSegments, setGeneratingSegments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load audiences
  const loadAudiences = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/audience?tenantId=${tenantId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load audiences');
      }

      setAudiences(data.audiences || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audiences');
    } finally {
      setLoading(false);
    }
  };

  // Load segments
  const loadSegments = async () => {
    if (!tenantId) return;

    try {
      const res = await fetch(`/api/synthex/segments?tenantId=${tenantId}`);
      const data = await res.json();

      if (res.ok) {
        setSegments(data.segments || []);
      }
    } catch (err) {
      console.error('Failed to load segments:', err);
    }
  };

  // Load contacts for an audience
  const loadContacts = async (audienceId: string) => {
    setLoadingContacts(true);

    try {
      const res = await fetch(`/api/synthex/audience/contacts?audienceId=${audienceId}&limit=100`);
      const data = await res.json();

      if (res.ok) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Generate segments using AI
  const handleGenerateSegments = async () => {
    if (!selectedAudience) return;

    setGeneratingSegments(true);
    setError(null);

    try {
      const res = await fetch('/api/synthex/segments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          audienceId: selectedAudience.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate segments');
      }

      // Reload segments
      await loadSegments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate segments');
    } finally {
      setGeneratingSegments(false);
    }
  };

  // Select an audience
  const selectAudience = (audience: Audience) => {
    setSelectedAudience(audience);
    loadContacts(audience.id);
  };

  // Load data when tenant changes
  useEffect(() => {
    if (tenantId) {
      loadAudiences();
      loadSegments();
    }
  }, [tenantId]);

  // Get audience type badge color
  const getAudienceTypeBadge = (type: string) => {
    switch (type) {
      case 'static':
        return 'bg-gray-500/20 text-gray-400';
      case 'dynamic':
        return 'bg-blue-500/20 text-blue-400';
      case 'smart':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Get segment type badge color
  const getSegmentTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return 'bg-gray-500/20 text-gray-400';
      case 'ai_generated':
        return 'bg-purple-500/20 text-purple-400';
      case 'behavioral':
        return 'bg-green-500/20 text-green-400';
      case 'demographic':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Audience Intelligence</h1>
          <p className="text-gray-400 mt-2">
            Manage your audiences and create AI-powered segments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-700" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Audience
          </Button>
        </div>
      </div>

      {/* Tenant ID Input */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Tenant ID</label>
              <Input
                placeholder="Enter your tenant ID..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button
              onClick={loadAudiences}
              disabled={!tenantId || loading}
              variant="outline"
              className="border-gray-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Load Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="audiences" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="audiences" className="data-[state=active]:bg-gray-700">
            <Users className="h-4 w-4 mr-2" />
            Audiences
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-gray-700">
            <Layers className="h-4 w-4 mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="scores" className="data-[state=active]:bg-gray-700">
            <Activity className="h-4 w-4 mr-2" />
            Scores
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-gray-700">
            <Target className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="routing" className="data-[state=active]:bg-gray-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Routing
          </TabsTrigger>
        </TabsList>

        {/* Audiences Tab */}
        <TabsContent value="audiences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Audience List */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Your Audiences</CardTitle>
                <CardDescription className="text-gray-400">
                  Select an audience to view contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {audiences.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {tenantId ? 'No audiences found' : 'Enter tenant ID to load audiences'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {audiences.map((audience) => (
                      <div
                        key={audience.id}
                        onClick={() => selectAudience(audience)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedAudience?.id === audience.id
                            ? 'bg-purple-900/30 border-purple-700'
                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-100">{audience.name}</h4>
                            <p className="text-sm text-gray-500">{audience.contactCount} contacts</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getAudienceTypeBadge(audience.audienceType)}>
                              {audience.audienceType}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact List */}
            <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-100">
                      {selectedAudience ? selectedAudience.name : 'Contacts'}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {selectedAudience
                        ? `${contacts.length} contacts in this audience`
                        : 'Select an audience to view contacts'}
                    </CardDescription>
                  </div>
                  {selectedAudience && (
                    <Button
                      onClick={handleGenerateSegments}
                      disabled={generatingSegments || contacts.length === 0}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingSegments ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Segments
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingContacts ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
                  </div>
                ) : !selectedAudience ? (
                  <div className="py-12 text-center">
                    <Target className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Select an audience from the left</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="py-12 text-center">
                    <UserPlus className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">No contacts in this audience</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 rounded-lg bg-gray-800 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-100">
                                {contact.firstName || contact.lastName
                                  ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                  : 'Unknown'}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                {contact.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </span>
                                )}
                                {contact.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-100">
                                {contact.engagementScore.toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500">score</p>
                            </div>
                            <Badge
                              className={
                                contact.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }
                            >
                              {contact.status}
                            </Badge>
                          </div>
                        </div>
                        {contact.tags.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <Tags className="h-3 w-3 text-gray-500" />
                            {contact.tags.map((tag, i) => (
                              <Badge key={i} className="bg-gray-700 text-gray-300 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-100">AI-Generated Segments</CardTitle>
                  <CardDescription className="text-gray-400">
                    Smart segments created from your audience data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {segments.length === 0 ? (
                <div className="py-12 text-center">
                  <Layers className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Segments Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    {tenantId
                      ? 'Select an audience and click "Generate Segments" to create AI-powered segments.'
                      : 'Enter your tenant ID to view segments.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="p-4 rounded-lg bg-gray-800 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-100">{segment.name}</h4>
                        <Badge className={getSegmentTypeBadge(segment.segmentType)}>
                          {segment.segmentType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{segment.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {segment.contactCount} contacts
                        </span>
                        {segment.aiConfidence && (
                          <span className="text-purple-400">
                            {Math.round(segment.aiConfidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-100">Engagement Scores</CardTitle>
                  <CardDescription className="text-gray-400">
                    Track contact engagement, personas, and behavioral signals
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AudienceScores tenantId={tenantId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-100">Lead Intelligence</CardTitle>
                  <CardDescription className="text-gray-400">
                    Lead scores, churn predictions, LTV estimates, and journey maps
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LeadScoringPanel tenantId={tenantId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routing Tab */}
        <TabsContent value="routing" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-100">Lead Routing</CardTitle>
                  <CardDescription className="text-gray-400">
                    AI-powered lead assignment recommendations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LeadRoutingPanel tenantId={tenantId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
