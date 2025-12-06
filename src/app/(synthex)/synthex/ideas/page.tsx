/**
 * Synthex Ideas
 *
 * Idea capture and planning:
 * - Idea cards with notes
 * - AI-powered idea suggestions
 * - Convert idea to content workflow
 * - Tag and categorize ideas
 *
 * TODO[PHASE_B3]: Wire up ideas API
 * TODO[PHASE_B3]: Implement idea to content conversion
 * TODO[PHASE_B4]: Add AI idea suggestions
 *
 * Backlog: SYNTHEX-008
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Lightbulb,
  Plus,
  Sparkles,
  Tag,
  ArrowRight,
  Search,
  Star,
  Clock,
} from 'lucide-react';

export default function SynthexIdeasPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Ideas</h1>
          <p className="text-gray-400 mt-2">
            Capture and develop your content ideas
          </p>
        </div>
        {/* TODO[PHASE_B3]: Wire up idea creation */}
        <Button disabled className="gap-2">
          <Plus className="h-4 w-4" />
          New Idea
        </Button>
      </div>

      {/* Quick Add and Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Lightbulb className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Quick add an idea..."
            className="pl-10 bg-gray-900 border-gray-700 text-gray-100"
            disabled
          />
        </div>
        <Button variant="outline" className="border-gray-700" disabled>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Idea Categories */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary" className="cursor-not-allowed opacity-50">All Ideas</Badge>
        <Badge variant="outline" className="border-gray-700 text-gray-400 cursor-not-allowed opacity-50">Blog Posts</Badge>
        <Badge variant="outline" className="border-gray-700 text-gray-400 cursor-not-allowed opacity-50">Social Media</Badge>
        <Badge variant="outline" className="border-gray-700 text-gray-400 cursor-not-allowed opacity-50">Emails</Badge>
        <Badge variant="outline" className="border-gray-700 text-gray-400 cursor-not-allowed opacity-50">Videos</Badge>
        <Badge variant="outline" className="border-gray-700 text-gray-400 cursor-not-allowed opacity-50">Campaigns</Badge>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State */}
        <Card className="bg-gray-900 border-gray-800 md:col-span-2 lg:col-span-3">
          <CardContent className="py-16 text-center">
            {/* TODO[PHASE_B3]: Implement ideas grid */}
            <Lightbulb className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Ideas Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Capture your content ideas here. You can tag them, add notes,
              and convert them into actual content when you&apos;re ready.
            </p>
            <Button disabled className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Idea
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI-Powered Suggestions
          </CardTitle>
          <CardDescription className="text-gray-400">
            Get content ideas tailored to your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO[PHASE_B4]: Implement AI idea suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 opacity-50">
              <Star className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-sm text-gray-400">
                "5 Tips for [Your Industry] Success"
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-gray-500" disabled>
                <ArrowRight className="h-4 w-4 mr-1" />
                Use This
              </Button>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 opacity-50">
              <Star className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-sm text-gray-400">
                "How We Helped [Client] Achieve [Result]"
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-gray-500" disabled>
                <ArrowRight className="h-4 w-4 mr-1" />
                Use This
              </Button>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 opacity-50">
              <Star className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-sm text-gray-400">
                "Common [Industry] Mistakes to Avoid"
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-gray-500" disabled>
                <ArrowRight className="h-4 w-4 mr-1" />
                Use This
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            AI suggestions will be personalized to your business in Phase B4
          </p>
        </CardContent>
      </Card>

      {/* Idea to Content Flow */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">From Idea to Content</CardTitle>
          <CardDescription className="text-gray-400">
            Turn your ideas into published content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-gray-400">Capture</span>
            </div>
            <div className="h-px flex-1 bg-gray-700 mx-4" />
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">Organize</span>
            </div>
            <div className="h-px flex-1 bg-gray-700 mx-4" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-gray-400">Generate</span>
            </div>
            <div className="h-px flex-1 bg-gray-700 mx-4" />
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-green-400" />
              <span className="text-gray-400">Publish</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
