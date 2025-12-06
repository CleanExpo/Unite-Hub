/**
 * Synthex AI Workspace
 *
 * Interactive workspace for AI-powered content generation:
 * - Content generation forms with templates
 * - AI chat interface
 * - Task management
 * - Generation history
 *
 * TODO[PHASE_B3]: Wire up content generation API
 * TODO[PHASE_B3]: Implement template system
 * TODO[PHASE_B4]: Add AI assistant integration
 *
 * Backlog: SYNTHEX-002
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  FileText,
  Mail,
  MessageSquare,
  Newspaper,
  Share2,
  PenTool,
  Wand2,
  History,
  Settings2,
} from 'lucide-react';

export default function SynthexWorkspacePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">AI Workspace</h1>
        <p className="text-gray-400 mt-2">
          Generate marketing content powered by AI
        </p>
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="generate" className="data-[state=active]:bg-gray-700">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-gray-700">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Type Selection */}
            <Card className="bg-gray-900 border-gray-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-gray-100">Content Type</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose what to generate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* TODO[PHASE_B3]: Wire up content type selection */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                  disabled
                >
                  <Mail className="h-4 w-4 mr-3" />
                  Email Campaign
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                  disabled
                >
                  <Newspaper className="h-4 w-4 mr-3" />
                  Blog Post
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                  disabled
                >
                  <Share2 className="h-4 w-4 mr-3" />
                  Social Posts
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                  disabled
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  Ad Copy
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                  disabled
                >
                  <PenTool className="h-4 w-4 mr-3" />
                  Custom
                </Button>
              </CardContent>
            </Card>

            {/* Generation Area */}
            <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Generate Content
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Describe what you want to create
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO[PHASE_B3]: Implement content generation form */}
                <div className="text-center py-16">
                  <Sparkles className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    Content Generation Coming Soon
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    AI-powered content generation will be available in a future update.
                    You&apos;ll be able to create emails, blog posts, social content, and more.
                  </p>
                  <Badge variant="secondary" className="mt-4">Phase B3</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Content Templates</CardTitle>
              <CardDescription className="text-gray-400">
                Pre-built templates for common content types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO[PHASE_B3]: Implement template library */}
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Templates Coming Soon
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  A library of industry-specific templates will help you create
                  high-converting content faster.
                </p>
                <Badge variant="secondary" className="mt-4">Phase B3</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Generation History</CardTitle>
              <CardDescription className="text-gray-400">
                Previously generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO[PHASE_B3]: Implement generation history */}
              <div className="text-center py-16">
                <History className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No Generation History
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Content you generate will appear here for easy access and reuse.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Settings Preview */}
      {/* TODO[PHASE_B4]: Implement AI configuration */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-purple-400" />
                AI Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize how AI generates content for your brand
              </CardDescription>
            </div>
            <Button variant="outline" className="border-gray-700" disabled>
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm font-medium text-gray-300">Brand Voice</p>
              <p className="text-xs text-gray-500 mt-1">Not configured</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm font-medium text-gray-300">Target Audience</p>
              <p className="text-xs text-gray-500 mt-1">Not configured</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm font-medium text-gray-300">Industry Context</p>
              <p className="text-xs text-gray-500 mt-1">Not configured</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
