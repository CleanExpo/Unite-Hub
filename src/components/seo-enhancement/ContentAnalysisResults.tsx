'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from './ScoreGauge';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Book,
  Search,
  Target,
  MessageSquare,
  Link2,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentAnalysisResultsProps {
  result: ContentAnalysisResult;
  detailed?: boolean;
}

interface ContentAnalysisResult {
  id: string;
  url: string;
  targetKeyword: string;
  overallScore: number;
  status: string;
  createdAt: string;
  analysis?: {
    readability?: ReadabilityMetrics;
    keywords?: KeywordMetrics;
    structure?: StructureMetrics;
    searchIntent?: SearchIntentMetrics;
  };
  recommendations?: ContentRecommendation[];
}

interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  avgSentenceLength: number;
  avgWordLength: number;
  paragraphCount: number;
  wordCount: number;
}

interface KeywordMetrics {
  primaryKeywordDensity: number;
  primaryKeywordCount: number;
  secondaryKeywordDensity: Record<string, number>;
  keywordInTitle: boolean;
  keywordInFirstParagraph: boolean;
  keywordInHeadings: boolean;
  keywordInMeta: boolean;
}

interface StructureMetrics {
  hasH1: boolean;
  h1Count: number;
  headingHierarchy: boolean;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  titleLength: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesWithAlt: number;
}

interface SearchIntentMetrics {
  detectedIntent: string;
  intentMatch: number;
  suggestedIntent: string;
  contentType: string;
}

interface ContentRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string | number;
  recommendedValue?: string | number;
}

export function ContentAnalysisResults({ result, detailed = false }: ContentAnalysisResultsProps) {
  const getReadabilityLabel = (score: number) => {
    if (score >= 80) {
return { label: 'Very Easy', color: 'text-green-600' };
}
    if (score >= 60) {
return { label: 'Easy', color: 'text-green-500' };
}
    if (score >= 50) {
return { label: 'Fairly Easy', color: 'text-yellow-600' };
}
    if (score >= 30) {
return { label: 'Difficult', color: 'text-orange-600' };
}
    return { label: 'Very Difficult', color: 'text-red-600' };
  };

  const getGradeLabel = (grade: number) => {
    if (grade <= 6) {
return 'Elementary';
}
    if (grade <= 8) {
return 'Middle School';
}
    if (grade <= 12) {
return 'High School';
}
    return 'College';
  };

  const getDensityStatus = (density: number): 'good' | 'warning' | 'error' => {
    if (density >= 0.5 && density <= 2.5) {
return 'good';
}
    if (density < 0.5 || density > 3) {
return 'warning';
}
    return 'error';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!detailed) {
    // Compact view
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <ScoreGauge score={result.overallScore} size="sm" />
            <div className="flex-1">
              <h4 className="font-semibold truncate">{result.url}</h4>
              <p className="text-sm text-muted-foreground">
                Target: {result.targetKeyword}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(result.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Analysis
            </CardTitle>
            <CardDescription className="mt-1">
              {result.url}
            </CardDescription>
          </div>
          <ScoreGauge score={result.overallScore} size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Keyword */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Target Keyword:</span>
              <Badge variant="outline">{result.targetKeyword}</Badge>
            </div>
            {result.analysis?.keywords && (
              <div className="text-sm">
                Density: {result.analysis.keywords.primaryKeywordDensity.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Readability */}
        {result.analysis?.readability && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Book className="h-4 w-4" />
              Readability
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Reading Ease</p>
                <p className={cn(
                  'text-2xl font-bold',
                  getReadabilityLabel(result.analysis.readability.fleschReadingEase).color
                )}>
                  {result.analysis.readability.fleschReadingEase.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getReadabilityLabel(result.analysis.readability.fleschReadingEase).label}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Grade Level</p>
                <p className="text-2xl font-bold">
                  {result.analysis.readability.fleschKincaidGrade.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getGradeLabel(result.analysis.readability.fleschKincaidGrade)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Word Count</p>
                <p className="text-2xl font-bold">
                  {result.analysis.readability.wordCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.analysis.readability.paragraphCount} paragraphs
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Sentence</p>
                <p className="text-2xl font-bold">
                  {result.analysis.readability.avgSentenceLength.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">words</p>
              </div>
            </div>
          </div>
        )}

        {/* Keyword Optimization */}
        {result.analysis?.keywords && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Keyword Optimization
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Keyword in Title</span>
                {result.analysis.keywords.keywordInTitle ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Keyword in First Paragraph</span>
                {result.analysis.keywords.keywordInFirstParagraph ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Keyword in Headings</span>
                {result.analysis.keywords.keywordInHeadings ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Keyword in Meta Description</span>
                {result.analysis.keywords.keywordInMeta ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Keyword Density</span>
                  <Badge className={cn(
                    getDensityStatus(result.analysis.keywords.primaryKeywordDensity) === 'good'
                      ? 'bg-green-100 text-green-800'
                      : getDensityStatus(result.analysis.keywords.primaryKeywordDensity) === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  )}>
                    {result.analysis.keywords.primaryKeywordDensity.toFixed(2)}%
                  </Badge>
                </div>
                <Progress
                  value={Math.min(result.analysis.keywords.primaryKeywordDensity * 20, 100)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optimal: 0.5% - 2.5% | Found {result.analysis.keywords.primaryKeywordCount} times
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Structure */}
        {result.analysis?.structure && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Content Structure
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {result.analysis.structure.hasH1 && result.analysis.structure.h1Count === 1 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium">H1 Tag</p>
                  <p className="text-xs text-muted-foreground">
                    {result.analysis.structure.h1Count} found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {result.analysis.structure.headingHierarchy ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Heading Order</p>
                  <p className="text-xs text-muted-foreground">
                    {result.analysis.structure.headingHierarchy ? 'Correct' : 'Issues'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {result.analysis.structure.hasMetaDescription ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Meta Desc</p>
                  <p className="text-xs text-muted-foreground">
                    {result.analysis.structure.metaDescriptionLength} chars
                  </p>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Links</p>
                <p className="text-xs text-muted-foreground">
                  {result.analysis.structure.internalLinks} int / {result.analysis.structure.externalLinks} ext
                </p>
              </div>
            </div>
            {result.analysis.structure.imageCount > 0 && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Images with Alt Text</span>
                  <span className="text-sm font-medium">
                    {result.analysis.structure.imagesWithAlt} / {result.analysis.structure.imageCount}
                  </span>
                </div>
                <Progress
                  value={(result.analysis.structure.imagesWithAlt / result.analysis.structure.imageCount) * 100}
                  className="h-2 mt-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Search Intent */}
        {result.analysis?.searchIntent && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Search Intent
            </h4>
            <div className="p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Detected Intent</p>
                  <Badge variant="outline" className="mt-1">
                    {result.analysis.searchIntent.detectedIntent}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intent Match</p>
                  <p className="text-lg font-bold">
                    {result.analysis.searchIntent.intentMatch}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Content Type</p>
                  <Badge variant="outline" className="mt-1">
                    {result.analysis.searchIntent.contentType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suggested Intent</p>
                  <Badge className="mt-1 bg-blue-100 text-blue-800">
                    {result.analysis.searchIntent.suggestedIntent}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </h4>
            <div className="space-y-3">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{rec.title}</span>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  {(rec.currentValue !== undefined || rec.recommendedValue !== undefined) && (
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {rec.currentValue !== undefined && (
                        <span className="text-red-600">Current: {rec.currentValue}</span>
                      )}
                      {rec.recommendedValue !== undefined && (
                        <span className="text-green-600">Recommended: {rec.recommendedValue}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
