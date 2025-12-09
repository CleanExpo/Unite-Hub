'use client';

/**
 * Founder Twin Tab
 * Phase D02: Founder Ops Console
 *
 * Manages founder profile, principles, preferences, and playbooks.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  BookMarked,
  Settings2,
  Workflow,
  Plus,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import type {
  FounderProfile,
  FounderPrinciple,
  FounderPlaybook,
  CompanyStage,
  CommunicationStyle,
  DecisionStyle,
} from '@/lib/founder/founderTwinService';

export default function FounderTwinPage() {
  const { currentOrganization } = useAuth();
  const tenantId = currentOrganization?.org_id;

  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [principles, setPrinciples] = useState<FounderPrinciple[]>([]);
  const [playbooks, setPlaybooks] = useState<FounderPlaybook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    company_name: '',
    company_stage: 'seed' as CompanyStage,
    industry: '',
    vision_statement: '',
    mission_statement: '',
    core_values: '',
    communication_style: 'direct' as CommunicationStyle,
    preferred_tone: '',
    decision_style: 'data_driven' as DecisionStyle,
  });

  // New principle form state
  const [newPrinciple, setNewPrinciple] = useState({
    title: '',
    description: '',
    category: 'general',
  });

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    if (!tenantId) {
return;
}

    try {
      setLoading(true);

      const [profileRes, principlesRes, playbooksRes] = await Promise.all([
        fetch(`/api/founder/twin/profile?tenantId=${tenantId}`),
        fetch(`/api/founder/twin/principles?tenantId=${tenantId}`),
        fetch(`/api/founder/twin/playbooks?tenantId=${tenantId}`),
      ]);

      const profileData = await profileRes.json();
      const principlesData = await principlesRes.json();
      const playbooksData = await playbooksRes.json();

      if (profileData.profile) {
        setProfile(profileData.profile);
        setProfileForm({
          name: profileData.profile.name || '',
          title: profileData.profile.title || '',
          company_name: profileData.profile.company_name || '',
          company_stage: profileData.profile.company_stage || 'seed',
          industry: profileData.profile.industry || '',
          vision_statement: profileData.profile.vision_statement || '',
          mission_statement: profileData.profile.mission_statement || '',
          core_values: (profileData.profile.core_values || []).join(', '),
          communication_style: profileData.profile.communication_style || 'direct',
          preferred_tone: profileData.profile.preferred_tone || '',
          decision_style: profileData.profile.decision_style || 'data_driven',
        });
      }

      setPrinciples(principlesData.principles || []);
      setPlaybooks(playbooksData.playbooks || []);
    } catch (error) {
      console.error('Error fetching founder twin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!tenantId) {
return;
}

    try {
      setSaving(true);

      const response = await fetch('/api/founder/twin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          ...profileForm,
          core_values: profileForm.core_values.split(',').map((v) => v.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const addPrinciple = async () => {
    if (!tenantId || !newPrinciple.title) {
return;
}

    try {
      const response = await fetch('/api/founder/twin/principles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          ...newPrinciple,
          normalize: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrinciples([...principles, data.principle]);
        setNewPrinciple({ title: '', description: '', category: 'general' });
      }
    } catch (error) {
      console.error('Error adding principle:', error);
    }
  };

  const deletePrinciple = async (id: string) => {
    if (!tenantId) {
return;
}

    try {
      const response = await fetch(
        `/api/founder/twin/principles/${id}?tenantId=${tenantId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setPrinciples(principles.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting principle:', error);
    }
  };

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please select an organization to continue.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="principles" className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            Principles
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="playbooks" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Playbooks
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Founder Profile</CardTitle>
              <CardDescription>
                Your identity and context for AI personalization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    placeholder="e.g., Founder & CEO"
                  />
                </div>
              </div>

              {/* Company Section */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                    placeholder="Your company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_stage">Stage</Label>
                  <Select
                    value={profileForm.company_stage}
                    onValueChange={(v) => setProfileForm({ ...profileForm, company_stage: v as CompanyStage })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                      <SelectItem value="series_b">Series B</SelectItem>
                      <SelectItem value="series_c">Series C</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="mature">Mature</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={profileForm.industry}
                    onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                    placeholder="e.g., SaaS, E-commerce"
                  />
                </div>
              </div>

              {/* Vision & Mission */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vision_statement">Vision Statement</Label>
                  <Textarea
                    id="vision_statement"
                    value={profileForm.vision_statement}
                    onChange={(e) => setProfileForm({ ...profileForm, vision_statement: e.target.value })}
                    placeholder="What future are you building?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission_statement">Mission Statement</Label>
                  <Textarea
                    id="mission_statement"
                    value={profileForm.mission_statement}
                    onChange={(e) => setProfileForm({ ...profileForm, mission_statement: e.target.value })}
                    placeholder="How do you achieve that vision?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="core_values">Core Values (comma-separated)</Label>
                  <Input
                    id="core_values"
                    value={profileForm.core_values}
                    onChange={(e) => setProfileForm({ ...profileForm, core_values: e.target.value })}
                    placeholder="e.g., Transparency, Customer Focus, Innovation"
                  />
                </div>
              </div>

              {/* Communication Style */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="communication_style">Communication Style</Label>
                  <Select
                    value={profileForm.communication_style}
                    onValueChange={(v) => setProfileForm({ ...profileForm, communication_style: v as CommunicationStyle })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="diplomatic">Diplomatic</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="storytelling">Storytelling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_tone">Preferred Tone</Label>
                  <Input
                    id="preferred_tone"
                    value={profileForm.preferred_tone}
                    onChange={(e) => setProfileForm({ ...profileForm, preferred_tone: e.target.value })}
                    placeholder="e.g., Friendly but professional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decision_style">Decision Style</Label>
                  <Select
                    value={profileForm.decision_style}
                    onValueChange={(v) => setProfileForm({ ...profileForm, decision_style: v as DecisionStyle })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_driven">Data-Driven</SelectItem>
                      <SelectItem value="intuitive">Intuitive</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="autonomous">Autonomous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Principles Tab */}
        <TabsContent value="principles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guiding Principles</CardTitle>
              <CardDescription>
                Core beliefs that guide AI responses and decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Principle */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Add New Principle</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newPrinciple.title}
                      onChange={(e) => setNewPrinciple({ ...newPrinciple, title: e.target.value })}
                      placeholder="e.g., Customer First"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newPrinciple.category}
                      onValueChange={(v) => setNewPrinciple({ ...newPrinciple, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="culture">Culture</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newPrinciple.description}
                      onChange={(e) => setNewPrinciple({ ...newPrinciple, description: e.target.value })}
                      placeholder="What does this mean?"
                    />
                  </div>
                </div>
                <Button onClick={addPrinciple} disabled={!newPrinciple.title}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Principle
                </Button>
              </div>

              {/* Existing Principles */}
              <div className="space-y-2">
                {principles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No principles defined yet. Add your first guiding principle above.
                  </p>
                ) : (
                  principles.map((principle) => (
                    <div
                      key={principle.id}
                      className="flex items-start justify-between border rounded-lg p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{principle.title}</span>
                          <Badge variant="outline">{principle.category}</Badge>
                          {principle.use_in_ai_responses && (
                            <Badge variant="secondary" className="text-xs">AI Active</Badge>
                          )}
                        </div>
                        {principle.description && (
                          <p className="text-sm text-muted-foreground">{principle.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePrinciple(principle.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Key-value settings for system behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Preferences management coming soon. Use the Controls tab for main settings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Playbooks</CardTitle>
              <CardDescription>
                Reusable frameworks for common decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {playbooks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No playbooks created yet. Playbooks help you standardize decision-making.
                </p>
              ) : (
                <div className="space-y-2">
                  {playbooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className="flex items-start justify-between border rounded-lg p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{playbook.name}</span>
                          <Badge variant="outline">{playbook.category}</Badge>
                          {playbook.ai_can_execute && (
                            <Badge variant="secondary" className="text-xs">AI Executable</Badge>
                          )}
                        </div>
                        {playbook.description && (
                          <p className="text-sm text-muted-foreground">{playbook.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {playbook.steps?.length || 0} steps • Used {playbook.times_used} times
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
