'use client';

/**
 * Video Creation Panel
 *
 * Allows Synthex users to:
 * - Create short-form videos from scripts
 * - Use AI to generate video scripts
 * - Apply video templates
 * - Track video generation jobs
 * - Download and preview completed videos
 * - Customize video editing options
 *
 * Integrates with synthex-video-orchestrator.ts for video creation
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
  Film,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Plus,
  Zap,
  Volume2,
  Captions,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface VideoJob {
  id: string;
  job_type: 'short_form' | 'promotional' | 'educational' | 'testimonial';
  status: 'pending' | 'script_generation' | 'video_creation' | 'editing' | 'completed' | 'failed';
  prompt: string;
  script?: string;
  created_at: string;
  completed_at?: string;
  result?: {
    output_url: string;
    thumbnail_url?: string;
    duration_ms: number;
  };
  error_message?: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  template_type: string;
  description: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function VideoCreationPanel({
  tenantId,
  planCode,
  brandName,
}: {
  tenantId: string;
  planCode: string;
  brandName: string;
}) {
  // State
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video Creation Form
  const [videoType, setVideoType] = useState<'short_form' | 'promotional' | 'educational' | 'testimonial'>('promotional');
  const [description, setDescription] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // Editing Options
  const [editingOptions, setEditingOptions] = useState({
    addMusic: true,
    autoCaptions: true,
    addEffects: true,
    colorGrading: false,
  });

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

      // Fetch video jobs
      const jobsRes = await fetch(`/api/synthex/video/jobs?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setVideoJobs(data.jobs || []);
      }

      // Fetch video templates
      const templateRes = await fetch(`/api/synthex/video/templates?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (templateRes.ok) {
        const data = await templateRes.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!description.trim()) {
      setError('Please enter a description for your video');
      return;
    }

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
throw new Error('Not authenticated');
}

      const response = await fetch('/api/synthex/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId,
          jobType: videoType,
          description,
          brandName,
          options: editingOptions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create video');
      }

      const data = await response.json();
      setVideoJobs([data.job, ...videoJobs]);
      setDescription('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video');
    } finally {
      setCreating(false);
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

      {/* AI Designer Access Check */}
      {(planCode === 'launch') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Video creation requires AI Designer access available in Growth+ plans. <strong>Upgrade your plan to create videos.</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="bg-slate-200">
          <TabsTrigger value="create" className="gap-2">
            <Film size={16} />
            Create Video
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Zap size={16} />
            My Videos ({videoJobs.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Sparkles size={16} />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* Create Video Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create AI Video</CardTitle>
              <CardDescription>
                Describe your video idea and let AI create professional short-form content powered by VEO3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video Type */}
              <div>
                <Label htmlFor="video-type">Video Type</Label>
                <Select value={videoType} onValueChange={(value: any) => setVideoType(value)}>
                  <SelectTrigger id="video-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_form">
                      <span className="flex items-center gap-2">
                        <Film size={14} /> Short-Form (15-60s)
                      </span>
                    </SelectItem>
                    <SelectItem value="promotional">
                      <span className="flex items-center gap-2">
                        <Zap size={14} /> Promotional (30-120s)
                      </span>
                    </SelectItem>
                    <SelectItem value="educational">
                      <span className="flex items-center gap-2">
                        <Zap size={14} /> Educational (2-10m)
                      </span>
                    </SelectItem>
                    <SelectItem value="testimonial">
                      <span className="flex items-center gap-2">
                        <Zap size={14} /> Testimonial (30-90s)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Video Description / Script Ideas</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want your video to be about. Example: 'A short promotional video explaining how our app saves time. Show before/after workflow, emphasize ease of use.'"
                  className="mt-2 h-32"
                />
                <p className="text-xs text-slate-600 mt-2">
                  Be specific about key messages, tone, and any visual elements you want included.
                </p>
              </div>

              {/* Editing Options */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles size={16} /> Video Enhancement Options
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingOptions.addMusic}
                      onChange={(e) =>
                        setEditingOptions({
                          ...editingOptions,
                          addMusic: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="flex items-center gap-2 text-sm">
                      <Volume2 size={14} /> Add background music
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingOptions.autoCaptions}
                      onChange={(e) =>
                        setEditingOptions({
                          ...editingOptions,
                          autoCaptions: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="flex items-center gap-2 text-sm">
                      <Captions size={14} /> Auto-generate captions
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingOptions.addEffects}
                      onChange={(e) =>
                        setEditingOptions({
                          ...editingOptions,
                          addEffects: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="flex items-center gap-2 text-sm">
                      <Zap size={14} /> Add transitions & effects
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingOptions.colorGrading}
                      onChange={(e) =>
                        setEditingOptions({
                          ...editingOptions,
                          colorGrading: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="flex items-center gap-2 text-sm">
                      <Zap size={14} /> Professional color grading
                    </span>
                  </label>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateVideo}
                disabled={creating || !description.trim() || planCode === 'launch'}
                size="lg"
                className="w-full gap-2"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                {creating ? 'Creating Video...' : 'Create Video'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {videoJobs.length > 0 ? (
            <div className="space-y-3">
              {videoJobs.map((job) => (
                <Card key={job.id} className="hover:border-blue-300 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 capitalize">
                            {job.job_type.replace(/_/g, ' ')} Video
                          </h4>
                          <Badge
                            className={`${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {job.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{job.prompt.slice(0, 100)}...</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(job.created_at).toLocaleDateString()} at{' '}
                          {new Date(job.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      {job.status === 'completed' && job.result ? (
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Ready</span>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2 w-full">
                            <Download size={14} />
                            Download
                          </Button>
                          {job.result.thumbnail_url && (
                            <div className="mt-2">
                              <img
                                src={job.result.thumbnail_url}
                                alt="Video thumbnail"
                                className="w-20 h-20 rounded"
                              />
                            </div>
                          )}
                        </div>
                      ) : job.status === 'failed' ? (
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-red-600 mb-2">
                            <AlertCircle size={16} />
                            <span className="text-sm font-medium">Error</span>
                          </div>
                          {job.error_message && (
                            <p className="text-xs text-red-600">{job.error_message}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-right">
                          <Loader2 size={16} className="animate-spin text-blue-600 inline-block" />
                          <p className="text-xs text-slate-600 mt-2">
                            {job.status === 'script_generation' && 'Generating script...'}
                            {job.status === 'video_creation' && 'Creating video...'}
                            {job.status === 'editing' && 'Editing video...'}
                            {job.status === 'pending' && 'Queued...'}
                          </p>
                        </div>
                      )}
                    </div>

                    {job.script && job.status !== 'pending' && (
                      <details className="mt-4 pt-4 border-t border-slate-200">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                          View Generated Script
                        </summary>
                        <pre className="mt-3 p-3 bg-slate-50 rounded text-xs overflow-auto max-h-48">
                          {job.script}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Film size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-600 text-center">
                  No videos created yet. Head to the "Create Video" tab to make your first video.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {templates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-slate-900">{template.name}</h4>
                    <p className="text-sm text-slate-600 mt-2">{template.description}</p>
                    <Badge className="mt-3 bg-blue-100 text-blue-800" variant="outline">
                      {template.template_type.replace(/_/g, ' ')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full gap-2"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setUseTemplate(true);
                      }}
                    >
                      <Sparkles size={14} /> Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-600 text-center">
                  No templates yet. Custom templates coming soon.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
