'use client';

/**
 * Visual Intelligence Dashboard
 * Phase 68: Client-facing visual generation and management interface
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Wand2,
  Palette,
  Layers,
  Video,
  Image as ImageIcon,
  Sparkles,
  Clock,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Play,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import VisualMethodCard from '@/ui/components/VisualMethodCard';
import TemplatePreviewCard from '@/ui/components/TemplatePreviewCard';
import VisualEvolutionBoard from '@/ui/components/VisualEvolutionBoard';

export default function VisualIntelligencePage() {
  const [activeTab, setActiveTab] = useState('methods');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Mock data
  const mockMethods = [
    {
      id: 'hero_section_generator',
      name: 'Hero Section Generator',
      category: 'ui_ux',
      description: 'Generate hero section visuals with headline integration',
      complexity: 'moderate' as const,
      providers: ['nano_banana', 'dalle', 'gemini'],
      estimated_time_seconds: 45,
      cost_tier: 'medium' as const,
      requires_approval: true,
      outputs: ['hero_image', 'mobile_variant', 'tablet_variant'],
    },
    {
      id: 'social_ad_creator',
      name: 'Social Ad Creator',
      category: 'advertising',
      description: 'Create platform-optimized social media ads',
      complexity: 'moderate' as const,
      providers: ['nano_banana', 'dalle', 'gemini'],
      estimated_time_seconds: 50,
      cost_tier: 'medium' as const,
      requires_approval: true,
      outputs: ['ad_creative', 'platform_variants'],
    },
    {
      id: 'logo_concept_generator',
      name: 'Logo Concept Generator',
      category: 'brand',
      description: 'Generate logo concepts from brand brief',
      complexity: 'complex' as const,
      providers: ['gemini', 'dalle', 'nano_banana'],
      estimated_time_seconds: 90,
      cost_tier: 'high' as const,
      requires_approval: true,
      outputs: ['logo_concepts', 'color_variations', 'usage_guide'],
    },
    {
      id: 'logo_animation',
      name: 'Logo Animation Creator',
      category: 'motion',
      description: 'Create animated logo reveals',
      complexity: 'moderate' as const,
      providers: ['veo3', 'gemini'],
      estimated_time_seconds: 60,
      cost_tier: 'high' as const,
      requires_approval: true,
      outputs: ['animation_mp4', 'animation_gif', 'lottie_json'],
    },
    {
      id: 'mood_board_generator',
      name: 'Mood Board Generator',
      category: 'conceptual',
      description: 'Generate comprehensive mood boards',
      complexity: 'moderate' as const,
      providers: ['gemini', 'dalle', 'perplexity', 'jina'],
      estimated_time_seconds: 60,
      cost_tier: 'medium' as const,
      requires_approval: false,
      outputs: ['mood_board', 'color_story', 'texture_samples'],
    },
    {
      id: 'icon_set_creator',
      name: 'Icon Set Creator',
      category: 'ui_ux',
      description: 'Generate consistent icon sets for UI',
      complexity: 'simple' as const,
      providers: ['dalle', 'gemini'],
      estimated_time_seconds: 30,
      cost_tier: 'low' as const,
      requires_approval: false,
      outputs: ['icon_set_svg', 'icon_set_png'],
    },
  ];

  const mockTemplates = [
    {
      platform_id: 'instagram',
      platform_name: 'Instagram',
      format_id: 'ig_feed',
      format_name: 'Feed Post',
      type: 'image' as const,
      dimensions: { width: 1080, height: 1080 },
      aspect_ratio: '1:1',
      max_file_size_mb: 8,
    },
    {
      platform_id: 'instagram',
      platform_name: 'Instagram',
      format_id: 'ig_story',
      format_name: 'Story',
      type: 'story' as const,
      dimensions: { width: 1080, height: 1920 },
      aspect_ratio: '9:16',
      max_file_size_mb: 4,
      max_duration_seconds: 15,
    },
    {
      platform_id: 'facebook',
      platform_name: 'Facebook',
      format_id: 'fb_post',
      format_name: 'Feed Post',
      type: 'image' as const,
      dimensions: { width: 1200, height: 630 },
      aspect_ratio: '1.91:1',
      max_file_size_mb: 8,
    },
    {
      platform_id: 'youtube',
      platform_name: 'YouTube',
      format_id: 'yt_thumbnail',
      format_name: 'Thumbnail',
      type: 'image' as const,
      dimensions: { width: 1280, height: 720 },
      aspect_ratio: '16:9',
      max_file_size_mb: 2,
    },
    {
      platform_id: 'tiktok',
      platform_name: 'TikTok',
      format_id: 'tt_video',
      format_name: 'Video',
      type: 'video' as const,
      dimensions: { width: 1080, height: 1920 },
      aspect_ratio: '9:16',
      max_file_size_mb: 287,
      max_duration_seconds: 180,
    },
    {
      platform_id: 'linkedin',
      platform_name: 'LinkedIn',
      format_id: 'li_post',
      format_name: 'Feed Post',
      type: 'image' as const,
      dimensions: { width: 1200, height: 627 },
      aspect_ratio: '1.91:1',
      max_file_size_mb: 8,
    },
  ];

  const mockRecipes = [
    {
      id: 'social_campaign_starter',
      name: 'Social Campaign Starter',
      description: 'Complete social media campaign assets for all major platforms',
      category: 'social_media',
      difficulty: 'intermediate',
      estimated_time: 30,
      estimated_cost: 0.50,
      outputs: 5,
    },
    {
      id: 'brand_launch_kit',
      name: 'Brand Launch Kit',
      description: 'Complete brand identity assets for launch',
      category: 'brand_identity',
      difficulty: 'advanced',
      estimated_time: 60,
      estimated_cost: 2.00,
      outputs: 5,
    },
    {
      id: 'email_campaign_suite',
      name: 'Email Campaign Suite',
      description: 'Complete email marketing visual assets',
      category: 'email_marketing',
      difficulty: 'beginner',
      estimated_time: 20,
      estimated_cost: 0.30,
      outputs: 3,
    },
  ];

  const mockEvolutionSession = {
    session_id: 'evo_123',
    method_name: 'Hero Section Generator',
    status: 'active' as const,
    current_generation: 3,
    max_generations: 10,
    genomes: [
      { id: 'g1', generation: 3, params: {}, fitness_score: 85, parent_ids: ['g0_1', 'g0_2'] },
      { id: 'g2', generation: 3, params: {}, fitness_score: 72, parent_ids: ['g0_1', 'g0_3'] },
      { id: 'g3', generation: 3, params: {}, fitness_score: 68, parent_ids: ['g0_2', 'g0_4'] },
      { id: 'g4', generation: 3, params: {}, fitness_score: 78, parent_ids: ['g0_3', 'g0_4'] },
      { id: 'g5', generation: 3, params: {}, fitness_score: 62, parent_ids: ['g0_1', 'g0_4'] },
      { id: 'g6', generation: 3, params: {}, fitness_score: 70, parent_ids: ['g0_2', 'g0_3'] },
      { id: 'g7', generation: 3, params: {}, fitness_score: 58, parent_ids: ['g0_1', 'g0_2'] },
      { id: 'g8', generation: 3, params: {}, fitness_score: 65, parent_ids: ['g0_3', 'g0_4'] },
    ],
    best_genome: { id: 'g1', generation: 3, params: {}, fitness_score: 85, parent_ids: [] },
    avg_fitness: 69.75,
    diversity_score: 72,
  };

  const mockStats = {
    total_generations: 156,
    this_month: 42,
    pending_approval: 3,
    total_cost: 28.50,
    avg_time: 45,
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'ui_ux', label: 'UI/UX' },
    { id: 'advertising', label: 'Ads' },
    { id: 'brand', label: 'Brand' },
    { id: 'motion', label: 'Motion' },
    { id: 'conceptual', label: 'Conceptual' },
  ];

  const filteredMethods = categoryFilter === 'all'
    ? mockMethods
    : mockMethods.filter(m => m.category === categoryFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Wand2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Visual Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered visual generation and design automation
            </p>
          </div>
        </div>
        <Badge className="bg-purple-500">
          {mockStats.pending_approval} awaiting approval
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Total Generated
            </div>
            <div className="text-2xl font-bold mt-1">{mockStats.total_generations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              This Month
            </div>
            <div className="text-2xl font-bold mt-1">{mockStats.this_month}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Pending
            </div>
            <div className="text-2xl font-bold mt-1">{mockStats.pending_approval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Total Cost
            </div>
            <div className="text-2xl font-bold mt-1">${mockStats.total_cost}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-orange-500" />
              Avg Time
            </div>
            <div className="text-2xl font-bold mt-1">{mockStats.avg_time}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="methods">
            <Wand2 className="h-4 w-4 mr-1" />
            Methods
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Layers className="h-4 w-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="recipes">
            <Sparkles className="h-4 w-4 mr-1" />
            Recipes
          </TabsTrigger>
          <TabsTrigger value="evolution">
            <TrendingUp className="h-4 w-4 mr-1" />
            Evolution
          </TabsTrigger>
        </TabsList>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMethods.map((method) => (
              <VisualMethodCard
                key={method.id}
                {...method}
                onClick={() => console.log('Open method:', method.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTemplates.map((template) => (
              <TemplatePreviewCard
                key={template.format_id}
                {...template}
                onClick={() => console.log('Open template:', template.format_id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{recipe.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        recipe.difficulty === 'beginner'
                          ? 'border-green-500 text-green-500'
                          : recipe.difficulty === 'intermediate'
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-red-500 text-red-500'
                      }
                    >
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {recipe.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold">{recipe.estimated_time}m</div>
                      <div className="text-muted-foreground">Time</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold">${recipe.estimated_cost}</div>
                      <div className="text-muted-foreground">Cost</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold">{recipe.outputs}</div>
                      <div className="text-muted-foreground">Outputs</div>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90">
                    <Play className="h-3 w-3" />
                    Start Recipe
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VisualEvolutionBoard
              {...mockEvolutionSession}
              onRate={(id, rating) => console.log('Rate:', id, rating)}
              onEvolve={() => console.log('Evolve')}
              onPause={() => console.log('Pause')}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Evolution Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Rate genomes consistently to guide evolution</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Higher fitness scores are selected more often</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Best genomes are preserved across generations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Diversity prevents premature convergence</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Safety notice */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        All visual generations follow brand guidelines and require approval for public use.
        Cost estimates are based on current provider rates. Actual costs may vary.
      </div>
    </div>
  );
}
