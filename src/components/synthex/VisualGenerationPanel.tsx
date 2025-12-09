'use client';

/**
 * Visual Generation Panel
 *
 * Allows Synthex users to:
 * - Create and manage brand kits
 * - Generate website banners with brand context
 * - Generate platform-optimized social graphics
 * - Generate AI videos from scripts
 * - Track visual generation jobs and view results
 *
 * Integrates with synthex-visual-orchestrator.ts for plan-aware
 * model selection and quota management.
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ImageIcon,
  Share2,
  Film,
  Palette,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Plus,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  logo_url?: string;
  guidelines: string;
}

interface VisualJob {
  id: string;
  job_type: 'website_banner' | 'social_graphics' | 'video' | 'brand_kit';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  created_at: string;
  completed_at?: string;
  result?: {
    output_url: string;
    model_used: string;
    cost: number;
  };
  error_message?: string;
}

interface GenerationCapabilities {
  graphicsPerMonth: number;
  graphicsUsed: number;
  videosPerMonth: number;
  videosUsed: number;
  brandKitsPerMonth: number;
  brandKitsUsed: number;
  aiDesignerAccess: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function VisualGenerationPanel({
  tenantId,
  planCode,
}: {
  tenantId: string;
  planCode: string;
}) {
  // State
  const [capabilities, setCapabilities] = useState<GenerationCapabilities | null>(null);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [jobs, setJobs] = useState<VisualJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Brand Kit Creation Form
  const [showBrandKitForm, setShowBrandKitForm] = useState(false);
  const [brandKitForm, setBrandKitForm] = useState({
    name: '',
    primary_color: '#0d2a5c',
    secondary_color: '#347bf7',
    accent_color: '#ff5722',
    font_primary: 'Inter, sans-serif',
    guidelines: '',
  });
  const [creatingBrandKit, setCreatingBrandKit] = useState(false);

  // Visual Generation Form
  const [selectedBrandKit, setSelectedBrandKit] = useState<string>('');
  const [generationType, setGenerationType] = useState<
    'website_banner' | 'social_graphics' | 'video'
  >('social_graphics');
  const [socialPlatform, setSocialPlatform] = useState<string>('instagram_feed');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
throw new Error('Not authenticated');
}

      // Fetch capabilities
      const capRes = await fetch(`/api/synthex/visual/capabilities?tenantId=${tenantId}&planCode=${planCode}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (capRes.ok) {
        const data = await capRes.json();
        setCapabilities(data.capabilities);
      }

      // Fetch brand kits
      const brandRes = await fetch(`/api/synthex/visual/brand-kits?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrandKits(data.brandKits || []);
        if (data.brandKits?.length > 0) {
          setSelectedBrandKit(data.brandKits[0].id);
        }
      }

      // Fetch visual generation jobs
      const jobsRes = await fetch(`/api/synthex/visual/jobs?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visual generation data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrandKit = async () => {
    if (!brandKitForm.name.trim()) {
      setError('Brand kit name is required');
      return;
    }

    try {
      setCreatingBrandKit(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
throw new Error('Not authenticated');
}

      const response = await fetch('/api/synthex/visual/brand-kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId,
          ...brandKitForm,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create brand kit');
      }

      const data = await response.json();
      setBrandKits([...brandKits, data.brandKit]);
      setSelectedBrandKit(data.brandKit.id);
      setBrandKitForm({
        name: '',
        primary_color: '#0d2a5c',
        secondary_color: '#347bf7',
        accent_color: '#ff5722',
        font_primary: 'Inter, sans-serif',
        guidelines: '',
      });
      setShowBrandKitForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brand kit');
    } finally {
      setCreatingBrandKit(false);
    }
  };

  const handleGenerateVisual = async () => {
    if (!selectedBrandKit) {
      setError('Please select or create a brand kit');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt for your visual');
      return;
    }

    if (!capabilities) {
      setError('Failed to load capabilities');
      return;
    }

    // Check quotas
    if (
      generationType === 'social_graphics' &&
      capabilities.graphicsUsed >= capabilities.graphicsPerMonth
    ) {
      setError(`You've reached your monthly graphics quota (${capabilities.graphicsPerMonth})`);
      return;
    }

    if (
      generationType === 'video' &&
      capabilities.videosUsed >= capabilities.videosPerMonth
    ) {
      setError(`You've reached your monthly video quota (${capabilities.videosPerMonth})`);
      return;
    }

    if (generationType === 'video' && !capabilities.aiDesignerAccess) {
      setError('Video generation requires AI Designer access (Growth+ plan)');
      return;
    }

    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
throw new Error('Not authenticated');
}

      const response = await fetch('/api/synthex/visual/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId,
          brandKitId: selectedBrandKit,
          jobType: generationType,
          prompt,
          socialPlatform: generationType === 'social_graphics' ? socialPlatform : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate visual');
      }

      const data = await response.json();
      setJobs([data.job, ...jobs]);
      setPrompt('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate visual');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Capabilities Overview */}
      {capabilities && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visual Generation Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-slate-600">Social Graphics</div>
                <div className="text-2xl font-bold mt-1">
                  {capabilities.graphicsUsed}/{capabilities.graphicsPerMonth}
                </div>
                <div className="w-full bg-slate-200 rounded h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded"
                    style={{
                      width: `${(capabilities.graphicsUsed / capabilities.graphicsPerMonth) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-slate-600">Videos</div>
                <div className="text-2xl font-bold mt-1">
                  {capabilities.videosUsed}/{capabilities.videosPerMonth}
                </div>
                <div className="w-full bg-slate-200 rounded h-2 mt-2">
                  <div
                    className="bg-purple-600 h-2 rounded"
                    style={{
                      width: `${(capabilities.videosUsed / capabilities.videosPerMonth) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-sm text-slate-600">Brand Kits</div>
                <div className="text-2xl font-bold mt-1">
                  {capabilities.brandKitsUsed}/{capabilities.brandKitsPerMonth}
                </div>
                {capabilities.aiDesignerAccess && (
                  <Badge className="mt-2 bg-green-100 text-green-800">AI Designer Access</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="brand-kits" className="space-y-6">
        <TabsList className="bg-slate-200">
          <TabsTrigger value="brand-kits" className="gap-2">
            <Palette size={16} />
            Brand Kits ({brandKits.length})
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <ImageIcon size={16} />
            Generate Visual
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Clock size={16} />
            Generation Jobs ({jobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Brand Kits Tab */}
        <TabsContent value="brand-kits" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Brand Kits</h3>
              <p className="text-sm text-slate-600 mt-1">
                Create and manage brand identities for consistent visual generation
              </p>
            </div>
            {!showBrandKitForm && (
              <Button onClick={() => setShowBrandKitForm(true)} className="gap-2">
                <Plus size={16} />
                New Brand Kit
              </Button>
            )}
          </div>

          {/* Brand Kit Creation Form */}
          {showBrandKitForm && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Create Brand Kit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input
                    id="brand-name"
                    value={brandKitForm.name}
                    onChange={(e) =>
                      setBrandKitForm({ ...brandKitForm, name: e.target.value })
                    }
                    placeholder="e.g., My Business"
                    className="mt-2"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        id="primary-color"
                        type="color"
                        value={brandKitForm.primary_color}
                        onChange={(e) =>
                          setBrandKitForm({
                            ...brandKitForm,
                            primary_color: e.target.value,
                          })
                        }
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKitForm.primary_color}
                        onChange={(e) =>
                          setBrandKitForm({
                            ...brandKitForm,
                            primary_color: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        id="secondary-color"
                        type="color"
                        value={brandKitForm.secondary_color}
                        onChange={(e) =>
                          setBrandKitForm({
                            ...brandKitForm,
                            secondary_color: e.target.value,
                          })
                        }
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKitForm.secondary_color}
                        onChange={(e) =>
                          setBrandKitForm({
                            ...brandKitForm,
                            secondary_color: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        id="accent-color"
                        type="color"
                        value={brandKitForm.accent_color}
                        onChange={(e) =>
                          setBrandKitForm({
                            ...brandKitForm,
                            accent_color: e.target.value,
                          })
                        }
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKitForm.accent_color}
                        onChange={(e) =>
                          setBrandKitForm({
                            ...brandKitForm,
                            accent_color: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="brand-guidelines">Brand Guidelines</Label>
                  <Textarea
                    id="brand-guidelines"
                    value={brandKitForm.guidelines}
                    onChange={(e) =>
                      setBrandKitForm({
                        ...brandKitForm,
                        guidelines: e.target.value,
                      })
                    }
                    placeholder="Describe your brand tone, values, and any specific guidelines..."
                    className="mt-2 h-24"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateBrandKit}
                    disabled={creatingBrandKit}
                    className="flex-1 gap-2"
                  >
                    {creatingBrandKit && <Loader2 size={16} className="animate-spin" />}
                    Create Brand Kit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBrandKitForm(false)}
                    disabled={creatingBrandKit}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Brand Kits List */}
          {brandKits.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {brandKits.map((kit) => (
                <Card key={kit.id} className="hover:border-blue-300 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded border border-slate-300"
                          style={{ backgroundColor: kit.primary_color }}
                        />
                        <div
                          className="w-8 h-8 rounded border border-slate-300"
                          style={{ backgroundColor: kit.secondary_color }}
                        />
                        <div
                          className="w-8 h-8 rounded border border-slate-300"
                          style={{ backgroundColor: kit.accent_color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{kit.name}</h4>
                        <p className="text-xs text-slate-600 mt-1">{kit.guidelines.slice(0, 60)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Palette size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-600 text-center">
                  No brand kits yet. Create one to start generating visuals.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Generate Visual Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Visual Content</CardTitle>
              <CardDescription>
                Create website banners, social graphics, or videos powered by Gemini 3 Pro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Kit Selection */}
              <div>
                <Label htmlFor="select-brand">Select Brand Kit</Label>
                <Select value={selectedBrandKit} onValueChange={setSelectedBrandKit}>
                  <SelectTrigger id="select-brand" className="mt-2">
                    <SelectValue placeholder="Choose a brand kit" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandKits.map((kit) => (
                      <SelectItem key={kit.id} value={kit.id}>
                        {kit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generation Type */}
              <div>
                <Label htmlFor="gen-type">What do you want to create?</Label>
                <Select
                  value={generationType}
                  onValueChange={(value: any) => setGenerationType(value)}
                >
                  <SelectTrigger id="gen-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website_banner">
                      <span className="flex items-center gap-2">
                        <ImageIcon size={14} /> Website Banner
                      </span>
                    </SelectItem>
                    <SelectItem value="social_graphics">
                      <span className="flex items-center gap-2">
                        <Share2 size={14} /> Social Media Graphic
                      </span>
                    </SelectItem>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <Film size={14} /> Video (AI Designer)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Social Platform Selection */}
              {generationType === 'social_graphics' && (
                <div>
                  <Label htmlFor="platform">Social Platform</Label>
                  <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                    <SelectTrigger id="platform" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram_feed">Instagram Feed (1080x1080)</SelectItem>
                      <SelectItem value="instagram_story">Instagram Story (1080x1920)</SelectItem>
                      <SelectItem value="facebook_post">Facebook Post (1200x628)</SelectItem>
                      <SelectItem value="twitter_post">Twitter/X Post (1200x675)</SelectItem>
                      <SelectItem value="linkedin_post">LinkedIn Post (1200x627)</SelectItem>
                      <SelectItem value="tiktok">TikTok (1080x1920)</SelectItem>
                      <SelectItem value="pinterest">Pinterest (1000x1500)</SelectItem>
                      <SelectItem value="youtube_thumbnail">YouTube Thumbnail (1280x720)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Prompt */}
              <div>
                <Label htmlFor="prompt">What would you like to create?</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the visual content you want. Example: 'A professional website banner promoting our new product launch, with a modern gradient background and call-to-action button'"
                  className="mt-2 h-32"
                />
                <p className="text-xs text-slate-600 mt-2">
                  Be specific about layout, style, and any key elements you want included.
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateVisual}
                disabled={generating || !selectedBrandKit || !prompt.trim()}
                size="lg"
                className="w-full gap-2"
              >
                {generating && <Loader2 size={16} className="animate-spin" />}
                {generating ? 'Generating...' : 'Generate Visual'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:border-blue-300 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 capitalize">
                            {job.job_type.replace(/_/g, ' ')}
                          </h4>
                          <Badge
                            className={`${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : job.status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{job.prompt.slice(0, 100)}...</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(job.created_at).toLocaleDateString()} at{' '}
                          {new Date(job.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      {job.status === 'completed' && job.result ? (
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Done</span>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download size={14} />
                            Download
                          </Button>
                        </div>
                      ) : job.status === 'failed' ? (
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle size={16} />
                            <span className="text-sm font-medium">Error</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <Loader2 size={16} className="animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-600 text-center">
                  No visual generation jobs yet. Head to the "Generate Visual" tab to create one.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
