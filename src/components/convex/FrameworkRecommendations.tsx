/**
 * Framework Recommendations Component
 *
 * Displays AI-generated recommendations for framework optimization:
 * - Quick wins (easy high-impact actions)
 * - Component improvements
 * - Strategy recommendations
 * - Growth opportunities
 * - Priority-based ranking
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  Zap,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronRight,
  Download,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface EstimatedBenefit {
  effectiveness: number;
  adoptionIncrease: number;
  timeToImplement: string;
  estimatedValue: number;
}

interface RecommendationResults {
  actualBenefit: number;
  actualEffort: string;
  successStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
}

interface Recommendation {
  id: string;
  category: 'component' | 'strategy' | 'usage' | 'performance' | 'growth';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  priority: number;
  estimatedBenefit: EstimatedBenefit;
  actionItems: string[];
  successMetrics: string[];
  relatedInsights: string[];
  aiConfidence: number;
  implementedAt?: string;
  results?: RecommendationResults;
  status?: 'pending' | 'in-progress' | 'completed' | 'failed';
}

interface FrameworkRecommendationsProps {
  frameworkId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock recommendations for development
const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec_1',
    category: 'component',
    title: 'Optimize "Value Proposition" Component',
    description:
      'This component has lower usage rates compared to similar frameworks. Simplifying the input fields and adding example templates could increase adoption by 22%.',
    impact: 'high',
    effort: 'easy',
    priority: 95,
    estimatedBenefit: {
      effectiveness: 15,
      adoptionIncrease: 22,
      timeToImplement: '30 minutes',
      estimatedValue: 1250,
    },
    actionItems: [
      'Review current component structure',
      'Simplify user input fields from 5 to 3',
      'Add 3 example templates',
      'Update documentation with use cases',
    ],
    successMetrics: [
      'Usage increase by 20%+',
      'Effectiveness score increase by 10%+',
      'Completion rate improvement',
    ],
    relatedInsights: ['insight_3', 'insight_5'],
    aiConfidence: 92,
    status: 'pending',
  },
  {
    id: 'rec_2',
    category: 'strategy',
    title: 'Expand to Competitive Intelligence Framework',
    description:
      'Your current brand positioning framework is strong. Adding competitor analysis components could open new market segments.',
    impact: 'high',
    effort: 'hard',
    priority: 85,
    estimatedBenefit: {
      effectiveness: 25,
      adoptionIncrease: 40,
      timeToImplement: '2-3 weeks',
      estimatedValue: 5000,
    },
    actionItems: [
      'Research competitor analysis best practices',
      'Design new competitor metrics components',
      'Create example competitive landscapes',
      'Build integration with market data sources',
      'Test with beta users',
    ],
    successMetrics: [
      'Adoption in new market segment',
      'Competitive advantage differentiation',
      'Revenue increase from premium tier',
    ],
    relatedInsights: ['insight_4'],
    aiConfidence: 88,
    status: 'pending',
  },
  {
    id: 'rec_3',
    category: 'usage',
    title: 'Create Quick Start Guide for New Users',
    description:
      'New users are experiencing a learning curve. A 5-minute quick start guide could reduce time-to-value by 60%.',
    impact: 'high',
    effort: 'easy',
    priority: 92,
    estimatedBenefit: {
      effectiveness: 20,
      adoptionIncrease: 18,
      timeToImplement: '2 hours',
      estimatedValue: 2100,
    },
    actionItems: [
      'Identify top 3 use cases',
      'Create interactive tutorial (5 minutes)',
      'Record video walkthrough',
      'Add contextual help tooltips',
      'Publish in help documentation',
    ],
    successMetrics: [
      'New user completion rate 80%+',
      'Onboarding time reduced by 60%',
      'User retention improvement',
    ],
    relatedInsights: ['insight_2'],
    aiConfidence: 94,
    status: 'pending',
  },
  {
    id: 'rec_4',
    category: 'performance',
    title: 'Add Performance Benchmarks',
    description:
      'Include industry benchmarks so users can understand how their performance compares. This builds trust and identifies improvement areas.',
    impact: 'medium',
    effort: 'medium',
    priority: 78,
    estimatedBenefit: {
      effectiveness: 12,
      adoptionIncrease: 15,
      timeToImplement: '1 week',
      estimatedValue: 1650,
    },
    actionItems: [
      'Collect performance data from top 100 frameworks',
      'Calculate industry benchmarks',
      'Design benchmark comparison UI',
      'Integrate with analytics dashboard',
      'Create benchmark report generator',
    ],
    successMetrics: [
      'User engagement increase',
      'Dashboard usage increase',
      'Actionability of metrics',
    ],
    relatedInsights: [],
    aiConfidence: 87,
    status: 'pending',
  },
  {
    id: 'rec_5',
    category: 'growth',
    title: 'Launch Enterprise Tier with Team Collaboration',
    description:
      'Based on usage patterns, 30% of power users need team collaboration features. Launching an enterprise tier could open new revenue stream.',
    impact: 'high',
    effort: 'hard',
    priority: 88,
    estimatedBenefit: {
      effectiveness: 30,
      adoptionIncrease: 50,
      timeToImplement: '3-4 weeks',
      estimatedValue: 8500,
    },
    actionItems: [
      'Define enterprise tier features',
      'Design collaborative editing system',
      'Build permission management',
      'Create team dashboard',
      'Implement usage analytics',
      'Set up billing and licensing',
    ],
    successMetrics: [
      'Enterprise customer acquisition',
      '5x revenue increase from enterprise',
      'Customer satisfaction score 9+/10',
    ],
    relatedInsights: ['insight_1'],
    aiConfidence: 91,
    status: 'pending',
  },
  {
    id: 'rec_6',
    category: 'component',
    title: 'Enhance "Rule Engine" with Visual Builder',
    description:
      'Current rule engine is powerful but requires technical knowledge. Visual builder could expand user base by 35%.',
    impact: 'high',
    effort: 'hard',
    priority: 80,
    estimatedBenefit: {
      effectiveness: 22,
      adoptionIncrease: 35,
      timeToImplement: '2 weeks',
      estimatedValue: 3500,
    },
    actionItems: [
      'Design visual rule builder UI',
      'Implement drag-and-drop interface',
      'Create visual rule preview',
      'Build natural language explanation',
      'Test with non-technical users',
    ],
    successMetrics: [
      'Non-technical user adoption 20%+',
      'Rule creation time reduced by 50%',
      'Error rate decrease',
    ],
    relatedInsights: [],
    aiConfidence: 89,
    status: 'pending',
  },
];

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
    default:
      return 'text-gray-600';
  }
}

function getEffortColor(effort: string): string {
  switch (effort) {
    case 'easy':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'hard':
    default:
      return 'text-red-600';
  }
}

function getMatrixBadgeColor(impact: string, effort: string): string {
  if (impact === 'high' && effort === 'easy') return 'bg-green-100 text-green-800 dark:bg-green-900';
  if (impact === 'high' && effort === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900';
  if (impact === 'high' && effort === 'hard') return 'bg-orange-100 text-orange-800 dark:bg-orange-900';
  if (impact === 'medium' && effort === 'easy') return 'bg-blue-100 text-blue-800 dark:bg-blue-900';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700';
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  expanded?: boolean;
}

function RecommendationCard({ recommendation, expanded = false }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base">{recommendation.title}</CardTitle>
              <Badge
                className={getMatrixBadgeColor(recommendation.impact, recommendation.effort)}
                variant="outline"
              >
                {recommendation.impact === 'high' && recommendation.effort === 'easy'
                  ? 'Quick Win'
                  : recommendation.impact === 'high'
                    ? 'High Impact'
                    : 'Medium Impact'}
              </Badge>
            </div>
            <CardDescription className="text-sm">{recommendation.description}</CardDescription>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-blue-600">{recommendation.priority}</div>
            <div className="text-xs text-muted-foreground">Priority</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className={`text-xl font-bold ${getImpactColor(recommendation.impact)}`}>
              {recommendation.estimatedBenefit.effectiveness}%
            </div>
            <div className="text-xs text-muted-foreground">Effectiveness</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {recommendation.estimatedBenefit.adoptionIncrease}%
            </div>
            <div className="text-xs text-muted-foreground">Adoption Growth</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              ${recommendation.estimatedBenefit.estimatedValue}
            </div>
            <div className="text-xs text-muted-foreground">Est. Value</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {recommendation.estimatedBenefit.timeToImplement}
            </div>
            <div className="text-xs text-muted-foreground">Time Needed</div>
          </div>
        </div>

        {/* AI Confidence */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="text-sm font-semibold">AI Confidence:</div>
          <div className="h-2 bg-gray-300 rounded-full flex-1 max-w-xs">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${recommendation.aiConfidence}%` }}
            />
          </div>
          <span className="text-sm font-semibold">{recommendation.aiConfidence}%</span>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-4 pt-3">
            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Action Items
              </div>
              <ul className="space-y-1 text-sm">
                {recommendation.actionItems.map((item, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground">
                    <span>•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Success Metrics
              </div>
              <ul className="space-y-1 text-sm">
                {recommendation.successMetrics.map((metric, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground">
                    <span>•</span> {metric}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 mr-2" />
              View Details
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FrameworkRecommendations({
  frameworkId,
  workspaceId,
  isOpen,
  onClose,
}: FrameworkRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = React.useState<string | null>(null);

  const filteredRecommendations = useMemo(() => {
    return MOCK_RECOMMENDATIONS.filter((rec) => {
      const matchesCategory = !selectedCategory || rec.category === selectedCategory;
      const matchesPriority =
        !selectedPriority ||
        (selectedPriority === 'high' && rec.priority >= 80) ||
        (selectedPriority === 'medium' && rec.priority >= 60 && rec.priority < 80) ||
        (selectedPriority === 'low' && rec.priority < 60);
      return matchesCategory && matchesPriority;
    }).sort((a, b) => b.priority - a.priority);
  }, [selectedCategory, selectedPriority]);

  const quickWins = MOCK_RECOMMENDATIONS.filter(
    (r) => r.impact === 'high' && r.effort === 'easy'
  );

  const totalValue = filteredRecommendations.reduce((sum, r) => sum + r.estimatedBenefit.estimatedValue, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Framework Recommendations</DialogTitle>
          <DialogDescription>
            AI-powered recommendations for optimizing your framework
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-blue-600">
                  {MOCK_RECOMMENDATIONS.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Recommendations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">{quickWins.length}</div>
                <div className="text-sm text-muted-foreground">Quick Wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-purple-600">${totalValue}</div>
                <div className="text-sm text-muted-foreground">Est. Total Value</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-orange-600">
                  {MOCK_RECOMMENDATIONS.reduce((sum, r) => {
                    const hours = parseInt(r.estimatedBenefit.timeToImplement.split('-')[0]);
                    return sum + hours;
                  }, 0)}{' '}
                  hrs
                </div>
                <div className="text-sm text-muted-foreground">Est. Total Time</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="text-sm font-semibold">Filter by:</div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              <Button
                variant={selectedCategory === 'component' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('component')}
              >
                Components
              </Button>
              <Button
                variant={selectedCategory === 'strategy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('strategy')}
              >
                Strategy
              </Button>
              <Button
                variant={selectedCategory === 'growth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('growth')}
              >
                Growth
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({MOCK_RECOMMENDATIONS.length})</TabsTrigger>
              <TabsTrigger value="quick-wins">Quick Wins ({quickWins.length})</TabsTrigger>
              <TabsTrigger value="high-effort">Complex (High Effort)</TabsTrigger>
            </TabsList>

            {/* All Recommendations */}
            <TabsContent value="all" className="space-y-3">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {filteredRecommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </ScrollArea>
            </TabsContent>

            {/* Quick Wins */}
            <TabsContent value="quick-wins" className="space-y-3">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <div className="font-semibold">Quick Wins</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  High-impact improvements that can be implemented in under 1 hour
                </p>
              </div>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {quickWins.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} expanded={true} />
                ))}
              </ScrollArea>
            </TabsContent>

            {/* Complex Initiatives */}
            <TabsContent value="high-effort" className="space-y-3">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {MOCK_RECOMMENDATIONS.filter((r) => r.effort === 'hard').map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} expanded={true} />
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
