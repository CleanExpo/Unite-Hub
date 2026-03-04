'use client';

/**
 * Client Training Hub
 * Phase 55: On-platform training center for clients
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Award, TrendingUp, Star } from 'lucide-react';
import { TrainingModuleCard } from '@/ui/components/TrainingModuleCard';
import { TrainingProgressBar } from '@/ui/components/TrainingProgressBar';

interface TrainingModule {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  is_required: boolean;
  learning_outcomes: string[];
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percent: number;
    time_spent_seconds: number;
  };
  lesson_count?: number;
}

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  earned_at?: string;
}

export default function ClientTrainingPage() {
  const { user, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({
    modulesCompleted: 0,
    lessonsCompleted: 0,
    totalTimeMinutes: 0,
    badgesEarned: 0,
    progressPercent: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchTrainingData();
    }
  }, [user]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      const [modulesRes, badgesRes, statsRes] = await Promise.all([
        fetch(`/api/training/modules?userId=${user?.id}`),
        fetch(`/api/training/badges?userId=${user?.id}`),
        fetch(`/api/training/stats?userId=${user?.id}`),
      ]);

      const modulesData = await modulesRes.json();
      const badgesData = await badgesRes.json();
      const statsData = await statsRes.json();

      setModules(modulesData.modules || []);
      setBadges(badgesData.badges || []);
      setStats(statsData.stats || stats);
    } catch (err) {
      console.error('Failed to fetch training data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = (moduleSlug: string) => {
    window.location.href = `/client/dashboard/training/${moduleSlug}`;
  };

  const categories = [
    { id: 'all', name: 'All Modules' },
    { id: 'platform_usage', name: 'Platform' },
    { id: 'ai_basics', name: 'AI' },
    { id: 'seo_fundamentals', name: 'SEO' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'best_practices', name: 'Best Practices' },
  ];

  const filteredModules =
    selectedCategory === 'all'
      ? modules
      : modules.filter((m) => m.category === selectedCategory);

  const requiredModules = modules.filter((m) => m.is_required);
  const completedRequired = requiredModules.filter(
    (m) => m.progress?.status === 'completed'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading training...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Training Hub</h1>
        <p className="text-muted-foreground">
          Quick lessons to help you get the most from Unite-Hub
        </p>
      </div>

      {/* Progress Overview */}
      <TrainingProgressBar
        modulesCompleted={stats.modulesCompleted}
        totalModules={modules.length}
        lessonsCompleted={stats.lessonsCompleted}
        totalTimeMinutes={stats.totalTimeMinutes}
        badgesEarned={stats.badgesEarned}
        totalBadges={6}
        requiredModulesComplete={completedRequired === requiredModules.length}
      />

      {/* Required Training Alert */}
      {completedRequired < requiredModules.length && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Required Training</p>
                <p className="text-sm text-muted-foreground">
                  Complete {requiredModules.length - completedRequired} more required{' '}
                  {requiredModules.length - completedRequired === 1 ? 'module' : 'modules'} to
                  finish onboarding
                </p>
              </div>
              <Button
                onClick={() =>
                  handleStartModule(
                    requiredModules.find((m) => m.progress?.status !== 'completed')?.slug || ''
                  )
                }
              >
                Continue Training
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <TrainingModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                description={module.description}
                category={module.category}
                difficulty={module.difficulty}
                estimatedMinutes={module.estimated_minutes}
                isRequired={module.is_required}
                lessonCount={module.lesson_count || 5}
                progress={{
                  status: module.progress?.status || 'not_started',
                  percent: module.progress?.progress_percent || 0,
                  completedLessons: Math.round(
                    ((module.progress?.progress_percent || 0) / 100) *
                      (module.lesson_count || 5)
                  ),
                }}
                onStart={() => handleStartModule(module.slug)}
                onContinue={() => handleStartModule(module.slug)}
                onReview={() => handleStartModule(module.slug)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`text-center p-3 rounded-lg ${
                  badge.earned_at
                    ? 'bg-primary/10'
                    : 'bg-muted opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">
                  {badge.icon === 'rocket' && '🚀'}
                  {badge.icon === 'brain' && '🧠'}
                  {badge.icon === 'search' && '🔍'}
                  {badge.icon === 'chart-bar' && '📊'}
                  {badge.icon === 'check-badge' && '✅'}
                  {badge.icon === 'book-open' && '📚'}
                </div>
                <div className="text-xs font-medium">{badge.name}</div>
                {badge.earned_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(badge.earned_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="bg-muted/30 border rounded-lg p-4 text-center text-sm text-muted-foreground">
        Training content is designed for 5-10 minute micro-lessons. No technical
        background required. All examples use realistic scenarios—no hyped results.
      </div>
    </div>
  );
}
