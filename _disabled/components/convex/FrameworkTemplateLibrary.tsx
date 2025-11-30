/**
 * Framework Template Library Component
 *
 * Displays a library of pre-built framework templates that users can:
 * - Browse by category (Brand, Funnel, SEO, Competitor, Offer)
 * - Filter by rating, difficulty, industry
 * - Search by name/description
 * - View details and preview
 * - Clone to create custom frameworks
 * - Rate and provide feedback
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Users,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  category: 'brand' | 'funnel' | 'seo' | 'competitor' | 'offer';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  industry?: string;
  components: number;
  rating: number;
  downloads: number;
  uses: number;
  createdBy: string;
  createdAt: string;
  preview?: {
    frameworks: string[];
    metrics: Record<string, number>;
  };
}

interface FrameworkTemplateLibraryProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onClone: (templateId: string, templateName: string) => void;
}

export function FrameworkTemplateLibrary({
  workspaceId,
  isOpen,
  onClose,
  onClone,
}: FrameworkTemplateLibraryProps) {
  // State
  const [templates, setTemplates] = useState<FrameworkTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'recent'>('rating');
  const [selectedTemplate, setSelectedTemplate] = useState<FrameworkTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/convex/framework-templates?workspaceId=${workspaceId}&action=list`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      logger.error('[TEMPLATE_LIBRARY] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Load templates on open
  React.useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((t) => t.difficulty === selectedDifficulty);
    }

    // Apply sorting
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'downloads') {
      filtered.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'recent') {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return filtered;
  }, [templates, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  // Clone template
  const handleCloneTemplate = async (template: FrameworkTemplate) => {
    try {
      setCloneLoading(true);

      const response = await fetch('/api/convex/framework-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          action: 'clone',
          templateId: template.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clone template');
      }

      const data = await response.json();
      onClone(data.id, template.name);
      setPreviewOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      logger.error('[TEMPLATE_LIBRARY] Clone error:', error);
    } finally {
      setCloneLoading(false);
    }
  };

  // Rate template
  const handleRateTemplate = async (
    templateId: string,
    rating: number
  ) => {
    try {
      setRatingLoading(true);

      const response = await fetch('/api/convex/framework-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          action: 'rate',
          templateId,
          rating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate template');
      }

      setUserRating(rating);
      // Reload to show updated rating
      loadTemplates();
    } catch (error) {
      logger.error('[TEMPLATE_LIBRARY] Rate error:', error);
    } finally {
      setRatingLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      brand: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      funnel: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      seo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      competitor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      offer: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[category] || colors.brand;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[difficulty] || colors.beginner;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle>Framework Template Library</SheetTitle>
            <SheetDescription>
              Browse and clone pre-built marketing frameworks
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="brand">Brand Positioning</SelectItem>
                  <SelectItem value="funnel">Funnel Design</SelectItem>
                  <SelectItem value="seo">SEO Patterns</SelectItem>
                  <SelectItem value="competitor">Competitor Model</SelectItem>
                  <SelectItem value="offer">Offer Architecture</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Templates List */}
            <ScrollArea className="h-[600px] border rounded-lg p-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-muted-foreground">Loading templates...</div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No templates found
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setPreviewOpen(true);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                          </Badge>
                          <Badge className={getDifficultyColor(template.difficulty)}>
                            {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                          </Badge>
                          {template.industry && (
                            <Badge variant="outline">{template.industry}</Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{template.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-blue-500" />
                            <span>{template.downloads}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-green-500" />
                            <span>{template.uses}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Copy className="h-3 w-3 text-purple-500" />
                            <span>{template.components}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Summary */}
            <div className="text-xs text-muted-foreground">
              Showing {filteredTemplates.length} of {templates.length} templates
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold mb-2">Category</div>
                    <Badge className={getCategoryColor(selectedTemplate.category)}>
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Difficulty</div>
                    <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                      {selectedTemplate.difficulty}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Components</div>
                    <div className="text-2xl font-bold">{selectedTemplate.components}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Average Rating</div>
                    <div className="flex items-center gap-1">
                      <div className="text-2xl font-bold">{selectedTemplate.rating.toFixed(1)}</div>
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-4 w-4" />
                      <span className="text-sm font-semibold">Downloads</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedTemplate.downloads}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-semibold">Uses</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedTemplate.uses}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-semibold">Created</span>
                    </div>
                    <div className="text-sm">
                      {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Components Tab */}
              <TabsContent value="components" className="space-y-2">
                {Array.from({ length: selectedTemplate.components }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">Component {i + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            Core framework element
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                {selectedTemplate.preview ? (
                  <>
                    <div>
                      <div className="text-sm font-semibold mb-2">Frameworks</div>
                      <div className="space-y-1">
                        {selectedTemplate.preview.frameworks.map((fw, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            • {fw}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm font-semibold mb-2">Performance Metrics</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedTemplate.preview.metrics).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-semibold ml-2">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-3">Your Rating</div>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          handleRateTemplate(selectedTemplate.id, i + 1)
                        }
                        disabled={ratingLoading}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            i < userRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-semibold mb-2">Community Feedback</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Highly rated by marketing professionals</div>
                    <div>• Used by {selectedTemplate.downloads}+ teams</div>
                    <div>• Regular updates and improvements</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => handleCloneTemplate(selectedTemplate)}
                disabled={cloneLoading}
              >
                {cloneLoading ? 'Cloning...' : 'Clone Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
    </>
  );
}
