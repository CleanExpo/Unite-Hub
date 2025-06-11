'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, BookOpen, Briefcase, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardService } from '@/lib/services/dashboard';
import type { Recommendation } from '@/types/dashboard';
import Link from 'next/link';

interface PersonalizedRecommendationsProps {
  userId: string;
  className?: string;
}

export function PersonalizedRecommendations({ userId, className }: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await DashboardService.getRecommendations(userId);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Briefcase className="h-5 w-5" />;
      case 'resource':
        return <BookOpen className="h-5 w-5" />;
      case 'blog':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'service':
        return 'from-blue-500 to-indigo-600';
      case 'resource':
        return 'from-purple-500 to-pink-600';
      case 'blog':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-teal-500 to-cyan-600';
    }
  };

  return (
    <Card className={cn("bg-slate-800 border-slate-700", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-400" />
          <CardTitle className="text-lg text-white">Recommended for You</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recommendations available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link href={recommendation.action_url}>
                  <div className="relative overflow-hidden rounded-lg bg-slate-700/50 p-4 transition-all hover:bg-slate-700">
                    {/* Background gradient */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r opacity-10 group-hover:opacity-20 transition-opacity",
                      getRecommendationColor(recommendation.recommendation_type)
                    )} />
                    
                    <div className="relative flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-r text-white",
                        getRecommendationColor(recommendation.recommendation_type)
                      )}>
                        {getRecommendationIcon(recommendation.recommendation_type)}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                          {recommendation.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {recommendation.description}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            View All Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
